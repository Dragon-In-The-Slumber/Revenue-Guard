"use client";

import { use, useState } from "react";
import useSWR from "swr";
import AuditTrailViewer from "@/components/AuditTrailViewer";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function TransactionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: transactionId } = use(params);
  const { data, error, isLoading, mutate } = useSWR(`/api/audit/${transactionId}`, fetcher, { refreshInterval: 3000 });
  const [actionLoading, setActionLoading] = useState("");
  const [actionDone, setActionDone] = useState("");

  const auditData = data?.trail || [];
  const diagEvent = auditData.find((e: any) => e.agent === "Diagnostician" && e.reasoning);
  const latestStatus = auditData[auditData.length - 1];

  const handleAction = async (action: "escalate" | "retry") => {
    setActionLoading(action);
    try {
      await fetch(`/api/audit/${transactionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          action === "escalate"
            ? {
                agent: "Manual Override",
                action: "Escalated to Human",
                details: `Manually escalated by operator. Transaction ${transactionId} flagged for urgent human review.`,
                dotColor: "bg-red-500",
                updateTransaction: { agent: "Manual Override", status: "Escalated to Human", statusColor: "text-red-400", dotColor: "bg-red-500", borderColor: "border-l-red-500" },
              }
            : {
                agent: "Manual Override",
                action: "Payment Retry Initiated",
                details: `Manual payment retry triggered by operator for ${transactionId}. Re-attempting via alternate gateway.`,
                dotColor: "bg-emerald-500",
                updateTransaction: { agent: "Manual Override", status: "Retry Initiated", statusColor: "text-emerald-400", dotColor: "bg-emerald-500", borderColor: "border-l-emerald-500" },
              }
        ),
      });
      setActionDone(action);
      mutate();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading("");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 flex items-center gap-4 px-8 py-4 border-b border-white/5 bg-[#06060F]/80 backdrop-blur-xl">
        <Link href="/" className="text-white/30 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
        </Link>
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-white/30 text-xs font-mono">Transaction</span>
          <span className="text-white/20">/</span>
          <span className="text-white font-mono text-sm font-semibold truncate">{transactionId}</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => handleAction("retry")}
            disabled={actionLoading === "retry" || actionDone === "retry"}
            className="pill-btn text-xs gap-1.5 border-emerald-500/30 hover:border-emerald-500 text-emerald-400 hover:shadow-[0_0_16px_rgba(16,185,129,0.3)]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
            {actionLoading === "retry" ? "Retrying..." : actionDone === "retry" ? "✓ Queued" : "Retry Payment"}
          </button>
          <button
            onClick={() => handleAction("escalate")}
            disabled={actionLoading === "escalate" || actionDone === "escalate"}
            className="pill-btn text-xs gap-1.5 border-red-500/30 hover:border-red-500 text-red-400 hover:shadow-[0_0_16px_rgba(239,68,68,0.3)]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
            {actionLoading === "escalate" ? "Escalating..." : actionDone === "escalate" ? "✓ Escalated" : "Force Escalate"}
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 md:p-8 max-w-4xl mx-auto w-full space-y-6">
        {error ? (
          <div className="glass-panel p-6 text-red-400">Failed to load transaction data.</div>
        ) : isLoading ? (
          <div className="text-dim text-sm py-8 text-center">Loading AI analysis...</div>
        ) : auditData.length === 0 ? (
          <div className="glass-panel p-8 text-center text-white/30 text-sm">No records found for this transaction.</div>
        ) : (
          <>
            {/* AI Reasoning Panel */}
            {diagEvent && (
              <div className="animate-fade-in glass-panel overflow-hidden" style={{ borderLeft: "3px solid #00F0FF" }}>
                <div className="px-6 pt-5 pb-4 border-b border-white/5">
                  <div className="flex items-center gap-2 mb-0.5">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00F0FF" strokeWidth="2"><path d="M12 2a8 8 0 0 0-8 8v4a2 2 0 0 0 2 2h2v-4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4h2a2 2 0 0 0 2-2v-4a8 8 0 0 0-8-8Z"/></svg>
                    <h2 className="text-sm font-bold text-[#00F0FF] tracking-wide">Diagnostician — AI Reasoning</h2>
                  </div>
                  <p className="text-white/35 text-xs font-mono">Claude 3.5 Sonnet analysis</p>
                </div>
                <div className="p-6">
                  <div className="bg-black/50 rounded-xl p-5 font-mono text-[13px] text-white/80 leading-relaxed border border-white/5 whitespace-pre-wrap">
                    {diagEvent.reasoning}
                  </div>
                  <div className="flex flex-wrap gap-3 mt-4">
                    <div className="flex items-center gap-2 bg-white/5 border border-white/8 rounded-full px-4 py-1.5 text-xs">
                      <span className="text-white/40">Primary Cause:</span>
                      <span className="text-emerald-400 font-semibold font-mono">
                        {diagEvent.details?.replace("Cause: ", "").split(" |")[0]}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/5 border border-white/8 rounded-full px-4 py-1.5 text-xs">
                      <span className="text-white/40">Recommended:</span>
                      <span className="text-amber-400 font-semibold font-mono">{diagEvent.recommended_action || "SILENT_RETRY"}</span>
                    </div>
                    {latestStatus && (
                      <div className="flex items-center gap-2 bg-white/5 border border-white/8 rounded-full px-4 py-1.5 text-xs">
                        <span className="text-white/40">Outcome:</span>
                        <span className="text-[#00F0FF] font-semibold font-mono">{latestStatus.action}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Audit Trail */}
            <div className="animate-fade-in stagger-2 glass-panel p-6">
              <AuditTrailViewer transactionId={transactionId} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}

"use client";

import { use } from "react";
import useSWR from "swr";
import Link from "next/link";
import AuditTrailViewer from "@/components/AuditTrailViewer";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function TransactionPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const transactionId = resolvedParams.id;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const { data, error, isLoading } = useSWR(`${apiUrl}/api/audit/${transactionId}`, fetcher, { refreshInterval: 5000 });

  const auditData = data?.trail || [];

  // Find the Diagnostician event to show the reasoning at the top
  const diagEvent = auditData.find((e: any) => e.agent === "Diagnostician" && e.reasoning);

  return (
    <div className="min-h-screen flex flex-col">
      {/* ─── Top Navigation Bar ─── */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-8 py-4 border-b border-subtle bg-[#0E0B08]/90 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Link href="/" className="text-[#F0E7D6] text-lg font-bold tracking-tight hover:text-gold transition-colors">
            RevenueGuard
          </Link>
          <span className="text-gold font-mono text-sm">/tx/{transactionId}</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/" className="text-dim text-sm hover:text-[#F0E7D6] transition-colors">← Back to Dashboard</Link>
        </div>
      </nav>

      <main className="flex-1 p-6 md:p-10 max-w-[1000px] mx-auto w-full flex flex-col gap-8">
        <header className="animate-fade-in">
          <p className="mono-label mb-2">TRANSACTION DEEP DIVE</p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[#F0E7D6]">
            {transactionId}
          </h1>
        </header>

        {error ? (
          <div className="text-red-400">Failed to load transaction data.</div>
        ) : isLoading ? (
          <div className="text-dim">Loading AI reasoning...</div>
        ) : auditData.length === 0 ? (
          <div className="text-dim">No records found for this transaction.</div>
        ) : (
          <div className="space-y-8 animate-slide-up">
            
            {/* AI Reasoning Panel */}
            {diagEvent && (
              <section className="glass-panel p-6 border-l-4 border-l-cyan-500">
                <h3 className="text-lg font-bold text-cyan-400 mb-3 flex items-center gap-2">
                  <span>🧠</span> AI Diagnostician Reasoning
                </h3>
                <div className="bg-[#1A1612] p-4 rounded-md border border-subtle font-mono text-sm text-[#F0E7D6] whitespace-pre-wrap leading-relaxed">
                  {diagEvent.reasoning}
                </div>
                <div className="mt-4 flex gap-4 text-sm">
                  <div className="bg-[#0E0B08] px-3 py-1.5 rounded-full border border-subtle">
                    <span className="text-dim mr-2">Primary Cause:</span> 
                    <span className="text-emerald-400 font-medium">
                      {diagEvent.details?.replace("Cause: ", "").split(" |")[0]}
                    </span>
                  </div>
                  <div className="bg-[#0E0B08] px-3 py-1.5 rounded-full border border-subtle">
                    <span className="text-dim mr-2">Recommended Action:</span> 
                    <span className="text-gold font-medium">{diagEvent.recommended_action || "SILENT_RETRY"}</span>
                  </div>
                </div>
              </section>
            )}

            {/* Audit Trail Timeline */}
            <section className="glass-panel p-6">
              <AuditTrailViewer transactionId={transactionId} />
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

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
      <nav className="sticky top-0 z-50 flex items-center justify-between px-8 py-4 border-b border-white/10 bg-[#05050A]/70 backdrop-blur-xl shadow-lg">
        <div className="flex items-center gap-2">
          <Link href="/" className="text-white text-lg font-bold tracking-tight hover:text-[#00F0FF] transition-colors text-glow">
            RevenueGuard
          </Link>
          <span className="text-[#00F0FF] font-mono text-xs border border-[#00F0FF]/30 px-2 py-0.5 rounded-full bg-[#00F0FF]/10">/tx/{transactionId}</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/" className="text-white/60 text-sm hover:text-white transition-colors">← Back to Dashboard</Link>
        </div>
      </nav>

      <main className="flex-1 p-6 md:p-10 max-w-[1000px] mx-auto w-full flex flex-col gap-8">
        <header className="animate-fade-in stagger-1 flex items-start justify-between">
          <div>
            <p className="mono-label mb-2 text-[#00F0FF]">TRANSACTION DEEP DIVE</p>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white drop-shadow-md">
              {transactionId}
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="pill-btn !py-2 !px-4 !text-xs !font-mono border-[#8B5CF6]/40 hover:border-[#8B5CF6] hover:shadow-[0_0_15px_rgba(139,92,246,0.3)]">
              FORCE ESCALATE
            </button>
            <button className="pill-btn !py-2 !px-4 !text-xs !font-mono border-[#10B981]/40 hover:border-[#10B981] hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              RETRY PAYMENT
            </button>
          </div>
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
              <section className="glass-panel p-6 border-l-4 border-l-[#00F0FF]">
                <h3 className="text-lg font-bold text-[#00F0FF] mb-3 flex items-center gap-2 text-glow">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a8 8 0 0 0-8 8v4a2 2 0 0 0 2 2h2v-4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4h2a2 2 0 0 0 2-2v-4a8 8 0 0 0-8-8Z"/></svg>
                  AI Diagnostician Reasoning
                </h3>
                <div className="bg-black/50 p-5 rounded-lg border border-white/5 font-mono text-sm text-white/90 whitespace-pre-wrap leading-relaxed shadow-inner">
                  {diagEvent.reasoning}
                </div>
                <div className="mt-5 flex gap-4 text-sm flex-wrap">
                  <div className="bg-white/5 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md">
                    <span className="text-white/40 mr-2 uppercase text-xs tracking-wider font-semibold">Primary Cause:</span> 
                    <span className="text-[#10B981] font-semibold tracking-wide">
                      {diagEvent.details?.replace("Cause: ", "").split(" |")[0]}
                    </span>
                  </div>
                  <div className="bg-white/5 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md">
                    <span className="text-white/40 mr-2 uppercase text-xs tracking-wider font-semibold">Recommended Action:</span> 
                    <span className="text-[#F59E0B] font-semibold tracking-wide">{diagEvent.recommended_action || "SILENT_RETRY"}</span>
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

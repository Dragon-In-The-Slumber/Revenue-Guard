"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AuditTrailViewer({ transactionId = "tx_demo_001" }: { transactionId?: string }) {
  const { data, error, isLoading } = useSWR(`/api/audit/${transactionId}`, fetcher, { refreshInterval: 3000 });

  const auditData = data?.trail || [];

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-white tracking-tight">Audit Trail</h2>
          <span className="text-[#8B5CF6] text-xl">/</span>
          <span className="font-mono text-sm text-white/50">{transactionId}</span>
        </div>
        <span className="flex items-center gap-2 bg-[#8B5CF6]/10 text-[#8B5CF6] text-[10px] font-mono uppercase tracking-widest px-3 py-1.5 rounded-full border border-[#8B5CF6]/30 shadow-[0_0_15px_rgba(139,92,246,0.2)]">
          {isLoading ? "SYNCING..." : auditData.length > 0 ? "✓ RECORDED" : "NO LOGS"}
        </span>
      </div>

      {error ? (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl font-mono text-sm">Failed to load audit trail</div>
      ) : auditData.length === 0 && !isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-2xl bg-black/20 p-8">
          <p className="text-white/50 text-sm">No historical audit records found for this transaction.</p>
        </div>
      ) : (
        <div className="relative space-y-0 before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-[#00F0FF] before:via-[#8B5CF6] before:to-transparent">
          {auditData.map((entry: any, i: number) => {
            const isSuccess = entry.dotColor.includes('emerald');
            const isError = entry.dotColor.includes('red');
            const isWarn = entry.dotColor.includes('F0E7D6') || entry.dotColor.includes('amber');
            const dotColorHex = isSuccess ? '#10B981' : isError ? '#EF4444' : isWarn ? '#F59E0B' : '#00F0FF';

            return (
              <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active animate-fade-in pb-8">
                {/* Timeline Icon */}
                <div className="flex items-center justify-center w-6 h-6 rounded-full border-4 border-[#06060F] bg-[#06060F] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-[0_0_0_2px_rgba(255,255,255,0.05)] absolute left-0 md:left-1/2 transform -translate-x-1/2">
                  <div className="w-2 h-2 rounded-full" style={{ background: dotColorHex, boxShadow: `0 0 10px ${dotColorHex}` }} />
                </div>

                {/* Content Card */}
                <div className="w-[calc(100%-2rem)] md:w-[calc(50%-2rem)] p-5 rounded-2xl border border-white/5 bg-black/40 backdrop-blur-md transition-all duration-300 hover:bg-white/5 hover:border-white/10 hover:shadow-2xl hover:scale-[1.02] ml-8 md:ml-0 relative">
                  {/* Subtle inner glow */}
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ background: `radial-gradient(circle at top right, ${dotColorHex}15, transparent 60%)` }} />
                  
                  <div className="relative z-10 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-bold tracking-wide text-sm">{entry.agent}</span>
                      <span className="text-white/30 text-[10px] font-mono">{entry.time}</span>
                    </div>
                    
                    <div className="inline-flex">
                      <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded bg-white/5 text-white/70 border border-white/5">
                        {entry.action}
                      </span>
                    </div>
                    
                    <p className="text-white/50 text-sm leading-relaxed mt-2">
                      {entry.details}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

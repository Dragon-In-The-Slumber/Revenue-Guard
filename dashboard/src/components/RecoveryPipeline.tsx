"use client";

import useSWR from "swr";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function RecoveryPipeline() {
  const { data, error, isLoading } = useSWR(`/api/pipeline`, fetcher, { refreshInterval: 2000 });

  const pipelineItems = data?.pipeline || [];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            Active Processing Queue
          </h2>
          <p className="text-white/40 text-xs font-mono uppercase tracking-widest mt-1">Live Agent Orchestration</p>
        </div>
        <span className="flex items-center gap-2 bg-[#00F0FF]/10 text-[#00F0FF] text-[10px] font-mono uppercase tracking-widest px-3 py-1.5 rounded-full border border-[#00F0FF]/30 shadow-[0_0_15px_rgba(0,240,255,0.2)]">
          <div className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] animate-pulse"></div>
          {isLoading ? "SYNCING..." : `${pipelineItems.length} ACTIVE`}
        </span>
      </div>

      {error ? (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl font-mono text-sm">Error: Failed to connect to pipeline stream.</div>
      ) : pipelineItems.length === 0 && !isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-2xl bg-black/20 p-8">
          <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center mb-4 bg-white/5">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <p className="text-white/50 text-sm">Pipeline is idle. Waiting for webhook triggers.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pipelineItems.map((item: any) => {
            // Determine exact colors based on item properties for the glowing effects
            const isSuccess = item.dotColor.includes('emerald');
            const isError = item.dotColor.includes('red');
            const isWarn = item.dotColor.includes('D9A353');
            
            const accentHex = isSuccess ? '#10B981' : isError ? '#EF4444' : isWarn ? '#F59E0B' : '#00F0FF';
            const bgGlow = isSuccess ? 'rgba(16,185,129,0.05)' : isError ? 'rgba(239,68,68,0.05)' : isWarn ? 'rgba(245,158,11,0.05)' : 'rgba(0,240,255,0.05)';

            return (
              <Link
                href={`/tx/${item.id}`}
                key={item.id}
                className="group relative block overflow-hidden rounded-xl border border-white/5 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
                style={{ 
                  background: `linear-gradient(90deg, rgba(15,15,20,0.8), rgba(20,20,25,0.9))`,
                }}
              >
                {/* Left accent border */}
                <div 
                  className="absolute left-0 top-0 bottom-0 w-1 transition-all duration-300 group-hover:w-2"
                  style={{ background: accentHex, boxShadow: `0 0 15px ${accentHex}` }}
                />

                {/* Subtle background glow */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: `radial-gradient(circle at 0% 50%, ${bgGlow}, transparent 70%)` }}
                />

                <div className="p-5 pl-7 flex items-center justify-between relative z-10">
                  <div className="flex items-start gap-4">
                    <div 
                      className="mt-1 w-2.5 h-2.5 rounded-full shrink-0 animate-pulse" 
                      style={{ background: accentHex, boxShadow: `0 0 10px ${accentHex}` }} 
                    />
                    <div>
                      <h4 className="font-bold text-white tracking-wide text-sm mb-1">{item.id}</h4>
                      <div className="flex items-center gap-3">
                        <p className="text-white/40 text-[10px] font-mono uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded border border-white/5">
                          {item.agent}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-white text-base tracking-tight mb-1">{item.amount}</p>
                    <p 
                      className="text-[10px] font-mono font-bold tracking-widest uppercase"
                      style={{ color: accentHex }}
                    >
                      {item.status}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function LiveEventFeed() {
  const { data, error, isLoading } = useSWR(`/api/events`, fetcher, { refreshInterval: 2000 });

  const liveEvents = data?.events || [];

  return (
    <div className="h-full flex flex-col relative overflow-hidden rounded-xl border border-white/5 bg-black/40" style={{ boxShadow: "inset 0 0 40px rgba(0,0,0,0.8)" }}>
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: "linear-gradient(90deg, #10B981, #00F0FF, #8B5CF6)" }} />
      
      <div className="flex items-center justify-between p-4 border-b border-white/5 bg-black/40 backdrop-blur-sm z-10">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 17l6-6-6-6"/><path d="M12 19h8"/></svg>
          Live Agent Output
        </h2>
        <div className="flex items-center gap-2 bg-[#10B981]/10 px-2.5 py-1 rounded-full border border-[#10B981]/20">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] shadow-[0_0_8px_#10B981] animate-pulse" />
          <span className="text-[#10B981] text-[9px] font-mono uppercase tracking-widest font-semibold">Real-time</span>
        </div>
      </div>

      <div className="p-4 flex-1 overflow-y-auto font-mono text-[11px] relative z-10">
        {error ? (
          <div className="text-red-400">Failed to stream events.</div>
        ) : liveEvents.length === 0 && !isLoading ? (
          <div className="text-white/30 text-center py-8">Waiting for AI telemetry...</div>
        ) : (
          <div className="space-y-3">
            {liveEvents.map((event: any, i: number) => {
              const isSuccess = event.dot.includes('emerald');
              const isError = event.dot.includes('red');
              const isWarn = event.dot.includes('F0E7D6') || event.dot.includes('amber');
              const color = isSuccess ? '#10B981' : isError ? '#EF4444' : isWarn ? '#F59E0B' : '#00F0FF';

              return (
                <div key={i} className="flex gap-3 group animate-fade-in">
                  <span className="text-white/30 shrink-0 select-none">[{event.time}]</span>
                  <div className="flex-1">
                    <span style={{ color }} className="font-semibold">{event.agent}: </span>
                    <span className="text-white/70">{event.details}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function LiveEventFeed() {
  const { data, error, isLoading } = useSWR(`/api/events`, fetcher, { refreshInterval: 2000 });

  const liveEvents = data?.events || [];

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-5 border-b border-white/5 pb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          Live Agent Feed
        </h2>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#10B981] shadow-[0_0_8px_#10B981] animate-pulse" />
          <span className="text-[#10B981] text-xs font-mono uppercase tracking-widest font-semibold">Real-time</span>
        </div>
      </div>

      {error ? (
        <div className="text-red-400">Failed to load events</div>
      ) : liveEvents.length === 0 && !isLoading ? (
        <div className="text-dim text-sm py-4 text-center">No recent events.</div>
      ) : (
        <div className="space-y-4 flex-1 overflow-y-auto no-scrollbar pr-1 relative">
          <div className="absolute left-2.5 top-0 bottom-0 w-px bg-white/5" />
          {liveEvents.map((event: any, i: number) => (
            <div key={i} className="flex items-start gap-4 group relative z-10 hover:bg-white/[0.02] p-2 rounded-lg transition-colors">
              <div className="pt-1.5 shrink-0 pl-1">
                <div className={`w-2.5 h-2.5 rounded-full ${event.dot} shadow-[0_0_8px_currentColor]`} style={{ color: event.dot.includes('emerald') ? '#10B981' : event.dot.includes('red') ? '#EF4444' : event.dot.includes('F0E7D6') ? '#F59E0B' : '#00F0FF' }} />
              </div>
              <div className="flex-1 min-w-0 pb-1">
                <div className="flex items-center gap-2">
                  <span className="text-white text-sm font-semibold tracking-wide">{event.agent}</span>
                  <span className="text-white/20 text-xs">|</span>
                  <span className="text-white/40 text-xs font-mono">{event.time}</span>
                </div>
                <p className="text-white/70 text-xs mt-1.5 leading-relaxed font-light">{event.details}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

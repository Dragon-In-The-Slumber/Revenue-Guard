"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function LiveEventFeed() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const { data, error, isLoading } = useSWR(`${apiUrl}/api/events`, fetcher, { refreshInterval: 5000 });

  const liveEvents = data?.events || [];

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-[#F0E7D6]">Live Agent Feed</h2>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-dim text-xs font-mono uppercase tracking-wider">Real-time</span>
        </div>
      </div>

      {error ? (
        <div className="text-red-400">Failed to load events</div>
      ) : liveEvents.length === 0 && !isLoading ? (
        <div className="text-dim text-sm py-4 text-center">No recent events.</div>
      ) : (
        <div className="space-y-4 flex-1 overflow-y-auto no-scrollbar pr-1">
          {liveEvents.map((event: any, i: number) => (
            <div key={i} className="flex items-start gap-3 group">
              <div className="pt-1.5 shrink-0">
                <div className={`w-2 h-2 rounded-full ${event.dot}`} />
              </div>
              <div className="flex-1 min-w-0 border-b border-subtle pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[#F0E7D6] text-sm font-medium">{event.agent}</span>
                  <span className="text-gold text-xs">/</span>
                  <span className="text-dim text-xs font-mono">{event.time}</span>
                </div>
                <p className="text-muted text-xs mt-1 leading-relaxed">{event.details}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function BackendStatus() {
  const { data, isLoading } = useSWR("/api/health-check", fetcher, {
    refreshInterval: 30000, // check every 30s
    revalidateOnFocus: true,
  });

  const isLive = data?.live === true;

  return (
    <div
      className="rounded-xl p-3 cursor-default"
      style={{
        background: isLive
          ? "rgba(16, 185, 129, 0.06)"
          : "rgba(139, 92, 246, 0.06)",
        border: isLive
          ? "1px solid rgba(16, 185, 129, 0.2)"
          : "1px solid rgba(139, 92, 246, 0.2)",
      }}
      title={data?.message || "Checking backend status..."}
    >
      <div className="flex items-center gap-2.5">
        {isLoading ? (
          <div className="w-2 h-2 rounded-full bg-white/30 animate-pulse-slow shrink-0" />
        ) : isLive ? (
          <div className="relative shrink-0">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-400 animate-ping opacity-60" />
          </div>
        ) : (
          <div className="relative shrink-0">
            <div className="w-2 h-2 rounded-full bg-[#8B5CF6]" />
            <div className="absolute inset-0 w-2 h-2 rounded-full bg-[#8B5CF6] animate-ping opacity-60" />
          </div>
        )}
        <div className="min-w-0">
          <p className={`text-xs font-semibold leading-tight ${isLive ? "text-emerald-400" : "text-[#8B5CF6]"}`}>
            {isLoading ? "Checking..." : isLive ? "Live API" : "Demo Mode"}
          </p>
          <p className="text-[10px] text-white/30 leading-tight mt-0.5 truncate">
            {isLoading
              ? "Connecting..."
              : isLive
                ? "Claude 3.5 Sonnet active"
                : "Mock AI (real API sleeping)"}
          </p>
        </div>
      </div>
    </div>
  );
}

"use client";

import useSWR from "swr";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function RecoveryPipeline() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const { data, error, isLoading } = useSWR(`${apiUrl}/api/pipeline`, fetcher, { refreshInterval: 5000 });

  const pipelineItems = data?.pipeline || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#00F0FF] shadow-[0_0_8px_#00F0FF] animate-pulse-slow"></div>
          Live Recovery Pipeline
        </h2>
        <span className="mono-label bg-[#00F0FF]/10 text-[#00F0FF] px-3 py-1 rounded-full border border-[#00F0FF]/20 shadow-[0_0_10px_rgba(0,240,255,0.1)]">
          {isLoading ? "..." : pipelineItems.length} active
        </span>
      </div>

      {error ? (
        <div className="text-red-400">Failed to load pipeline</div>
      ) : pipelineItems.length === 0 && !isLoading ? (
        <div className="text-dim text-sm py-4 text-center">No active recoveries at the moment.</div>
      ) : (
        <div className="space-y-3">
          {pipelineItems.map((item: any) => (
            <Link
              href={`/tx/${item.id}`}
              key={item.id}
              className={`p-4 rounded-xl bg-black/40 border border-white/5 border-l-2 ${item.borderColor} flex items-center justify-between group hover:bg-white/5 hover:border-white/20 hover:scale-[1.01] transition-all duration-300 cursor-pointer shadow-lg hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${item.dotColor} shrink-0 shadow-[0_0_8px_currentColor]`} style={{ color: item.dotColor.includes('emerald') ? '#10B981' : item.dotColor.includes('red') ? '#EF4444' : item.dotColor.includes('D9A353') ? '#F59E0B' : '#00F0FF' }} />
                <div>
                  <h4 className="font-semibold text-white text-sm font-mono tracking-wide">{item.id}</h4>
                  <p className="text-white/50 text-xs mt-0.5 tracking-wider uppercase">{item.agent}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-white text-sm tracking-wide">{item.amount}</p>
                <p className={`text-xs mt-0.5 font-medium tracking-wider uppercase ${item.statusColor}`}>{item.status}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

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
        <h2 className="text-lg font-bold text-[#F0E7D6]">Live Recovery Pipeline</h2>
        <span className="mono-label bg-[#0E0B08] px-3 py-1 rounded-full border border-subtle">
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
              className={`p-4 rounded-lg bg-[#0E0B08] border border-subtle border-l-2 ${item.borderColor} flex items-center justify-between group hover:bg-[#1a1510] transition-all duration-200 cursor-pointer block`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-2.5 h-2.5 rounded-full ${item.dotColor} shrink-0`} />
                <div>
                  <h4 className="font-medium text-[#F0E7D6] text-sm font-mono">{item.id}</h4>
                  <p className="text-dim text-xs mt-0.5">{item.agent}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-[#F0E7D6] text-sm">{item.amount}</p>
                <p className={`text-xs mt-0.5 ${item.statusColor}`}>{item.status}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

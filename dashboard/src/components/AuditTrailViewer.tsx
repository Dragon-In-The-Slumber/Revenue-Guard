"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AuditTrailViewer({ transactionId = "tx_demo_001" }: { transactionId?: string }) {
  const { data, error, isLoading } = useSWR(`/api/audit/${transactionId}`, fetcher, { refreshInterval: 3000 });

  const auditData = data?.trail || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-[#F0E7D6]">Audit Trail</h2>
          <span className="text-gold text-sm">/</span>
          <span className="font-mono text-sm text-muted">{transactionId}</span>
        </div>
        <span className="mono-label bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20">
          {isLoading ? "Loading..." : auditData.length > 0 ? "✓ Logged" : "No Records"}
        </span>
      </div>

      {error ? (
        <div className="text-red-400">Failed to load audit trail</div>
      ) : auditData.length === 0 && !isLoading ? (
        <div className="text-dim text-sm py-4 text-center">No audit records found for {transactionId}.</div>
      ) : (
        <div className="space-y-0">
          {auditData.map((entry: any, i: number) => (
            <div key={i} className="relative flex gap-4">
              {/* Timeline connector */}
              <div className="flex flex-col items-center">
                <div className={`w-3 h-3 rounded-full ${entry.dotColor} z-10 shrink-0`} />
                {i < auditData.length - 1 && (
                  <div className="w-px flex-1 bg-[rgba(240,231,214,0.1)]" />
                )}
              </div>

              {/* Content */}
              <div className="pb-6 flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-[#F0E7D6] font-semibold text-sm">{entry.agent}</span>
                  <span className="text-gold text-xs">/</span>
                  <span className="text-dim text-xs">{entry.action}</span>
                  <span className="ml-auto text-dim text-xs font-mono">{entry.time}</span>
                </div>
                <p className="text-muted text-xs leading-relaxed">{entry.details}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

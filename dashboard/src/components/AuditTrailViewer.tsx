const auditData = [
  {
    agent: "Orchestrator",
    action: "Ingested Transaction",
    details: "Received tx_98f7 with status failed. Routed to Diagnostician.",
    time: "22:47:02",
    dotColor: "bg-[#D9A353]",
  },
  {
    agent: "Diagnostician",
    action: "Root Cause Diagnosed",
    details: "HDFC UPI failure at 22:47 — classified as issuing bank downtime based on 23 similar failures in the last hour. Confidence: 0.92.",
    time: "22:47:03",
    dotColor: "bg-cyan-500",
  },
  {
    agent: "Silent Recovery",
    action: "Gateway Switch Attempted",
    details: "Switched from HDFC UPI → ICICI UPI via Razorpay Optimizer. Retry successful.",
    time: "22:47:05",
    dotColor: "bg-emerald-500",
  },
  {
    agent: "Compliance",
    action: "Action Approved",
    details: "Silent recovery approved. No customer contact required. Audit entry logged with cryptographic hash.",
    time: "22:47:06",
    dotColor: "bg-[#F0E7D6]",
  },
];

export default function AuditTrailViewer() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-[#F0E7D6]">Audit Trail</h2>
          <span className="text-gold text-sm">/</span>
          <span className="font-mono text-sm text-muted">tx_98f7</span>
        </div>
        <span className="mono-label bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20">
          ✓ Recovery Complete
        </span>
      </div>

      <div className="space-y-0">
        {auditData.map((entry, i) => (
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
    </div>
  );
}

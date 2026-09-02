const auditData = [
  {
    agent: "Orchestrator",
    action: "Ingested Transaction",
    details: "Received tx_98f7 with status failed. Routed to Diagnostician.",
    time: "10:47:02 PM",
    color: "border-blue-500",
  },
  {
    agent: "Diagnostician",
    action: "Root Cause Diagnosed",
    details: "HDFC UPI failure at 22:47 — classified as issuing bank downtime based on 23 similar failures in the last hour. Confidence: 0.92.",
    time: "10:47:03 PM",
    color: "border-cyan-500",
  },
  {
    agent: "Silent Recovery",
    action: "Gateway Switch Attempted",
    details: "Switched from HDFC UPI → ICICI UPI via Razorpay Optimizer. Retry successful.",
    time: "10:47:05 PM",
    color: "border-green-500",
  },
  {
    agent: "Compliance",
    action: "Action Approved",
    details: "Silent recovery approved. No customer contact required. Audit entry logged.",
    time: "10:47:06 PM",
    color: "border-purple-500",
  },
];

export default function AuditTrailViewer() {
  return (
    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Audit Trail — tx_98f7</h2>
        <span className="text-xs text-green-400 bg-green-500/10 px-3 py-1 rounded-full font-medium">
          ✓ Recovery Complete
        </span>
      </div>

      <div className="space-y-0">
        {auditData.map((entry, i) => (
          <div key={i} className="relative flex gap-4">
            {/* Timeline line */}
            <div className="flex flex-col items-center">
              <div className={`w-3 h-3 rounded-full border-2 ${entry.color} bg-[#0e0b08] z-10`} />
              {i < auditData.length - 1 && (
                <div className="w-px flex-1 bg-white/10" />
              )}
            </div>

            {/* Content */}
            <div className="pb-6 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-white font-semibold text-sm">{entry.agent}</span>
                <span className="text-gray-500 text-xs">·</span>
                <span className="text-gray-500 text-xs">{entry.action}</span>
                <span className="ml-auto text-gray-600 text-xs font-mono">{entry.time}</span>
              </div>
              <p className="text-gray-400 text-xs leading-relaxed">{entry.details}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

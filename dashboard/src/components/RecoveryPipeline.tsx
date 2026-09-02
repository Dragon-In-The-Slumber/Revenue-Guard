const pipelineItems = [
  {
    id: "tx_98f7",
    agent: "Silent Recovery Agent",
    amount: "₹14,500",
    status: "Switched Gateway (Success)",
    statusColor: "text-emerald-400",
    dotColor: "bg-emerald-500",
    borderColor: "border-l-emerald-500",
  },
  {
    id: "tx_32a1",
    agent: "Outreach Agent",
    amount: "₹4,200",
    status: "WhatsApp Nudge Sent",
    statusColor: "text-gold",
    dotColor: "bg-[#D9A353]",
    borderColor: "border-l-[#D9A353]",
  },
  {
    id: "tx_55c9",
    agent: "Compliance Agent",
    amount: "₹85,000",
    status: "Escalated (High Value)",
    statusColor: "text-red-400",
    dotColor: "bg-red-500",
    borderColor: "border-l-red-500",
  },
  {
    id: "tx_a4b2",
    agent: "Diagnostician Agent",
    amount: "₹8,750",
    status: "Bank Downtime Detected",
    statusColor: "text-cyan-400",
    dotColor: "bg-cyan-500",
    borderColor: "border-l-cyan-500",
  },
  {
    id: "tx_7dc3",
    agent: "Prediction Agent",
    amount: "₹22,000",
    status: "Pre-Failure Intercepted",
    statusColor: "text-emerald-400",
    dotColor: "bg-emerald-500",
    borderColor: "border-l-emerald-500",
  },
];

export default function RecoveryPipeline() {
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-[#F0E7D6]">Live Recovery Pipeline</h2>
        <span className="mono-label bg-[#0E0B08] px-3 py-1 rounded-full border border-subtle">
          {pipelineItems.length} active
        </span>
      </div>

      <div className="space-y-3">
        {pipelineItems.map((item) => (
          <div
            key={item.id}
            className={`p-4 rounded-lg bg-[#0E0B08] border border-subtle border-l-2 ${item.borderColor} flex items-center justify-between group hover:bg-[#1a1510] transition-all duration-200 cursor-pointer`}
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
          </div>
        ))}
      </div>
    </div>
  );
}

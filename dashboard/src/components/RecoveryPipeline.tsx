const pipelineItems = [
  {
    id: "tx_98f7",
    agent: "Silent Recovery Agent",
    amount: "₹14,500",
    status: "Switched Gateway (Success)",
    statusColor: "text-blue-400",
    iconBg: "bg-blue-500/20",
    iconColor: "text-blue-400",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    id: "tx_32a1",
    agent: "Outreach Agent",
    amount: "₹4,200",
    status: "WhatsApp Nudge Sent",
    statusColor: "text-purple-400",
    iconBg: "bg-purple-500/20",
    iconColor: "text-purple-400",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    id: "tx_55c9",
    agent: "Compliance Agent",
    amount: "₹85,000",
    status: "Escalated (High Value)",
    statusColor: "text-red-400",
    iconBg: "bg-red-500/20",
    iconColor: "text-red-400",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
  {
    id: "tx_a4b2",
    agent: "Diagnostician Agent",
    amount: "₹8,750",
    status: "Bank Downtime Detected",
    statusColor: "text-cyan-400",
    iconBg: "bg-cyan-500/20",
    iconColor: "text-cyan-400",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    id: "tx_7dc3",
    agent: "Prediction Agent",
    amount: "₹22,000",
    status: "Pre-Failure Intercepted",
    statusColor: "text-emerald-400",
    iconBg: "bg-emerald-500/20",
    iconColor: "text-emerald-400",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
  },
];

export default function RecoveryPipeline() {
  return (
    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Live Recovery Pipeline</h2>
        <span className="text-xs text-gray-500 bg-white/5 px-3 py-1 rounded-full">
          {pipelineItems.length} active
        </span>
      </div>

      <div className="space-y-3">
        {pipelineItems.map((item) => (
          <div
            key={item.id}
            className="p-4 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between group hover:bg-white/[0.07] transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full ${item.iconBg} flex items-center justify-center ${item.iconColor}`}>
                {item.icon}
              </div>
              <div>
                <h4 className="font-medium text-white text-sm">{item.id}...</h4>
                <p className="text-xs text-gray-400">{item.agent}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-white text-sm">{item.amount}</p>
              <p className={`text-xs ${item.statusColor}`}>{item.status}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

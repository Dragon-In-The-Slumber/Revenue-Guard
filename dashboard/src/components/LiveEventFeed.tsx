const liveEvents = [
  {
    type: "recovery.silent_success",
    agent: "Silent Recovery",
    details: "tx_98f7 recovered via gateway switch (₹14,500)",
    time: "Just now",
    dot: "bg-green-500",
  },
  {
    type: "recovery.outreach_sent",
    agent: "Outreach",
    details: "WhatsApp nudge sent to tx_32a1 customer",
    time: "30s ago",
    dot: "bg-purple-500",
  },
  {
    type: "recovery.diagnosed",
    agent: "Diagnostician",
    details: "tx_a4b2: SBI Bank Downtime detected (confidence 0.91)",
    time: "1m ago",
    dot: "bg-cyan-500",
  },
  {
    type: "recovery.compliance_approved",
    agent: "Compliance",
    details: "Approved email follow-up for tx_d8f1",
    time: "2m ago",
    dot: "bg-blue-500",
  },
  {
    type: "recovery.escalated",
    agent: "Compliance",
    details: "tx_55c9 escalated — max attempts (3) reached",
    time: "3m ago",
    dot: "bg-red-500",
  },
  {
    type: "recovery.started",
    agent: "Orchestrator",
    details: "Ingested batch of 12 new failed transactions",
    time: "5m ago",
    dot: "bg-amber-500",
  },
];

export default function LiveEventFeed() {
  return (
    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Live Agent Feed</h2>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-gray-400">Real-time</span>
        </div>
      </div>

      <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
        {liveEvents.map((event, i) => (
          <div key={i} className="flex items-start gap-3 group">
            <div className="pt-1.5">
              <div className={`w-2 h-2 rounded-full ${event.dot}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-white text-sm font-medium">{event.agent}</span>
                <span className="text-gray-600 text-xs">{event.time}</span>
              </div>
              <p className="text-gray-400 text-xs mt-0.5 truncate">{event.details}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

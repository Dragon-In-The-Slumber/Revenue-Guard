const liveEvents = [
  {
    type: "recovery.silent_success",
    agent: "Silent Recovery",
    details: "tx_98f7 recovered via gateway switch (₹14,500)",
    time: "Just now",
    dot: "bg-emerald-500",
  },
  {
    type: "recovery.outreach_sent",
    agent: "Outreach",
    details: "WhatsApp nudge sent to tx_32a1 customer",
    time: "30s ago",
    dot: "bg-[#D9A353]",
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
    dot: "bg-[#F0E7D6]",
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
    dot: "bg-[#D9A353]",
  },
];

export default function LiveEventFeed() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-[#F0E7D6]">Live Agent Feed</h2>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-dim text-xs font-mono uppercase tracking-wider">Real-time</span>
        </div>
      </div>

      <div className="space-y-4 flex-1 overflow-y-auto no-scrollbar pr-1">
        {liveEvents.map((event, i) => (
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
    </div>
  );
}

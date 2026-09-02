export default function MetricsPanel() {
  const metrics = [
    {
      label: "Total Recovered",
      value: "₹7,84,200",
      change: "↑ 12%",
      changeColor: "text-emerald-400",
      subtitle: "vs last batch",
    },
    {
      label: "Silent Recoveries",
      value: "42",
      change: "42%",
      changeColor: "text-gold",
      subtitle: "of 100 failed transactions",
    },
    {
      label: "Outreach Conversions",
      value: "18",
      change: "18%",
      changeColor: "text-gold",
      subtitle: "via AI Negotiation",
    },
    {
      label: "Escalated",
      value: "12",
      change: "12%",
      changeColor: "text-red-400",
      subtitle: "to human review",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((m) => (
        <div
          key={m.label}
          className="glass-panel p-5 group hover:border-[#D9A353]/30 transition-all duration-300 cursor-default"
        >
          <h3 className="text-dim text-[11px] font-mono uppercase tracking-[0.15em]">
            {m.label}
          </h3>
          <p className="text-3xl font-bold mt-2 text-[#F0E7D6] group-hover:translate-x-1 transition-transform origin-left">
            {m.value}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <span className={`text-sm font-medium ${m.changeColor}`}>
              {m.change}
            </span>
            <span className="text-dim text-xs">{m.subtitle}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

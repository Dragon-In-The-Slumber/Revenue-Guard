export default function MetricsPanel() {
  const metrics = [
    {
      label: "Total Recovered",
      value: "₹7,84,200",
      change: "↑ 12%",
      changeColor: "text-green-400",
      subtitle: "vs last batch",
    },
    {
      label: "Silent Recoveries",
      value: "42",
      change: "42%",
      changeColor: "text-blue-400",
      subtitle: "of 100 failed transactions",
    },
    {
      label: "Outreach Conversions",
      value: "18",
      change: "18%",
      changeColor: "text-purple-400",
      subtitle: "via AI Negotiation",
    },
    {
      label: "Escalated",
      value: "12",
      change: "12%",
      changeColor: "text-amber-400",
      subtitle: "to human review",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((m) => (
        <div
          key={m.label}
          className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:border-blue-500/40 transition-all duration-300 group"
        >
          <h3 className="text-gray-400 text-xs font-medium uppercase tracking-wider">
            {m.label}
          </h3>
          <p className="text-3xl font-bold mt-2 text-white group-hover:scale-105 transition-transform origin-left">
            {m.value}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <span className={`text-sm font-medium ${m.changeColor}`}>
              {m.change}
            </span>
            <span className="text-xs text-gray-500">{m.subtitle}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

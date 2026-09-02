"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function MetricsPanel() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const { data, error, isLoading } = useSWR(`${apiUrl}/api/metrics`, fetcher, { refreshInterval: 5000 });

  const metrics = data?.metrics || [
    {
      label: "Total Recovered",
      value: "...",
      change: "",
      changeColor: "text-emerald-400",
      subtitle: "Loading...",
    },
    {
      label: "Silent Recoveries",
      value: "...",
      change: "",
      changeColor: "text-gold",
      subtitle: "Loading...",
    },
    {
      label: "Outreach Interventions",
      value: "...",
      change: "",
      changeColor: "text-gold",
      subtitle: "Loading...",
    },
    {
      label: "Escalated",
      value: "...",
      change: "",
      changeColor: "text-red-400",
      subtitle: "Loading...",
    },
  ];

  if (error) return <div className="text-red-400">Failed to load metrics</div>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((m: any, idx: number) => (
        <div
          key={idx}
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

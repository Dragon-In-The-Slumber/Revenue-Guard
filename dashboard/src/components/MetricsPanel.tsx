"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function MetricsPanel() {
  const { data, error, isLoading } = useSWR(`/api/metrics`, fetcher, { refreshInterval: 3000 });

  const metrics = data?.metrics || [
    {
      label: "Total Recovered",
      value: "...",
      change: "",
      changeColor: "text-emerald-400",
      subtitle: "Loading...",
      glowColor: "rgba(16, 185, 129, 0.15)", // emerald
      accentColor: "#10B981"
    },
    {
      label: "Silent Recoveries",
      value: "...",
      change: "",
      changeColor: "text-[#00F0FF]",
      subtitle: "Loading...",
      glowColor: "rgba(0, 240, 255, 0.15)", // cyan
      accentColor: "#00F0FF"
    },
    {
      label: "Outreach Interventions",
      value: "...",
      change: "",
      changeColor: "text-[#8B5CF6]",
      subtitle: "Loading...",
      glowColor: "rgba(139, 92, 246, 0.15)", // purple
      accentColor: "#8B5CF6"
    },
    {
      label: "Escalated",
      value: "...",
      change: "",
      changeColor: "text-rose-400",
      subtitle: "Loading...",
      glowColor: "rgba(244, 63, 94, 0.15)", // rose
      accentColor: "#F43F5E"
    },
  ];

  // If real data comes in without glow colors, we'll assign defaults
  const processedMetrics = metrics.map((m: any, i: number) => {
    if (m.glowColor) return m;
    const defaults = [
      { glow: "rgba(16, 185, 129, 0.15)", accent: "#10B981", changeCol: "text-emerald-400" },
      { glow: "rgba(0, 240, 255, 0.15)", accent: "#00F0FF", changeCol: "text-[#00F0FF]" },
      { glow: "rgba(139, 92, 246, 0.15)", accent: "#8B5CF6", changeCol: "text-[#8B5CF6]" },
      { glow: "rgba(244, 63, 94, 0.15)", accent: "#F43F5E", changeCol: "text-rose-400" },
    ];
    return {
      ...m,
      glowColor: defaults[i % 4].glow,
      accentColor: defaults[i % 4].accent,
      changeColor: m.changeColor || defaults[i % 4].changeCol,
    };
  });

  if (error) return <div className="text-red-400 bg-red-500/10 p-4 rounded-xl border border-red-500/20">Failed to load metrics</div>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {processedMetrics.map((m: any, idx: number) => (
        <div
          key={idx}
          className="relative overflow-hidden p-6 rounded-2xl transition-all duration-500 group cursor-default"
          style={{
            background: "linear-gradient(135deg, rgba(20,20,30,0.7), rgba(10,10,15,0.9))",
            border: "1px solid rgba(255,255,255,0.05)",
            boxShadow: `0 10px 30px rgba(0,0,0,0.5), inset 0 0 20px ${m.glowColor.replace('0.15', '0.02')}`,
          }}
        >
          {/* Top glowing accent line */}
          <div 
            className="absolute top-0 left-0 right-0 h-1 transition-all duration-500 opacity-70 group-hover:opacity-100" 
            style={{ background: m.accentColor, boxShadow: `0 0 10px ${m.accentColor}` }} 
          />
          
          {/* Background glow orb */}
          <div 
            className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-[50px] transition-all duration-700 opacity-30 group-hover:opacity-60 group-hover:scale-150"
            style={{ background: m.accentColor }}
          />

          <div className="relative z-10">
            <h3 className="text-white/50 text-[10px] font-mono uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: m.accentColor, boxShadow: `0 0 5px ${m.accentColor}` }} />
              {m.label}
            </h3>
            
            <div className="flex items-baseline gap-1 mt-2">
              <p className="text-4xl font-bold text-white tracking-tight drop-shadow-md">
                {m.value}
              </p>
            </div>
            
            <div className="mt-4 flex items-center gap-2">
              <span className={`text-xs font-bold px-2 py-1 rounded-md bg-white/5 ${m.changeColor} border border-white/5`}>
                {m.change || 'Live'}
              </span>
              <span className="text-white/30 text-[11px] uppercase tracking-wider">{m.subtitle}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

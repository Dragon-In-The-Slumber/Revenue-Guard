"use client";

import useSWR from "swr";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const NODE_CONFIG = [
  { key: "Orchestrator", label: "Orchestrator", sub: "Webhook Ingestion", color: "#00F0FF" },
  { key: "Diagnostician", label: "Diagnostician", sub: "Claude 3.5 Sonnet", color: "#8B5CF6" },
  { key: "Silent", label: "Silent Recovery", sub: "Gateway Switch", color: "#10B981", branch: true },
  { key: "Outreach", label: "Outreach Agent", sub: "Customer Comms", color: "#F59E0B", branch: true },
  { key: "Compliance", label: "Compliance", sub: "Rules & Escalation", color: "#D9A353" },
];

export default function PipelineGraphPage() {
  const { data } = useSWR(`/api/pipeline`, fetcher, { refreshInterval: 2000 });
  const activeTx = data?.pipeline?.[0];

  const isActive = (key: string) => {
    if (!activeTx) return false;
    return activeTx.agent.toLowerCase().includes(key.toLowerCase()) ||
      (key === "Compliance" && activeTx.status?.includes("Escalate"));
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-8 py-4 border-b border-white/5 bg-[#06060F]/80 backdrop-blur-xl">
        <div>
          <h1 className="text-base font-bold text-white tracking-tight">AI Agent Graph</h1>
          <p className="text-white/35 text-xs font-mono mt-0.5">LangGraph state machine · live tracking</p>
        </div>
        {activeTx && (
          <Link href={`/tx/${activeTx.id}`} className="pill-btn text-xs gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Tracking: {activeTx.id}
          </Link>
        )}
      </header>

      <main className="flex-1 p-8 flex flex-col items-center justify-center">
        <div className="w-full max-w-3xl">
          {/* Graph */}
          <div className="flex flex-col items-center gap-0 font-mono text-sm">

            {/* Node: Orchestrator */}
            <GraphNode label="1. Orchestrator" sub="Webhook Ingestion" active={isActive("Orchestrator")} color="#00F0FF" />
            <Arrow />

            {/* Node: Diagnostician */}
            <GraphNode label="2. Diagnostician" sub="Claude 3.5 Sonnet" active={isActive("Diagnostician")} color="#8B5CF6" />

            {/* Fork */}
            <div className="flex items-start gap-12 mt-0">
              <div className="flex flex-col items-center">
                <div className="w-px h-8 bg-white/10" />
                <GraphNode label="3a. Silent Recovery" sub="Gateway Switch" active={isActive("Silent")} color="#10B981" compact />
              </div>
              <div className="w-px h-16 bg-white/10 mt-0 self-start" />
              <div className="flex flex-col items-center">
                <div className="w-px h-8 bg-white/10" />
                <GraphNode label="3b. Outreach Agent" sub="Customer Comms" active={isActive("Outreach")} color="#F59E0B" compact />
              </div>
            </div>

            {/* Rejoin */}
            <Arrow />
            <GraphNode label="4. Compliance" sub="Rules & Escalation" active={isActive("Compliance")} color="#D9A353" />
          </div>

          {/* Active transaction list */}
          {data?.pipeline?.length > 0 && (
            <div className="mt-12 glass-panel p-5">
              <p className="mono-label mb-4">Active Transactions</p>
              <div className="space-y-2">
                {data.pipeline.slice(0, 5).map((tx: any) => (
                  <Link key={tx.id} href={`/tx/${tx.id}`}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/5 hover:border-white/15 hover:bg-white/6 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${tx.dotColor}`} />
                      <span className="text-white font-mono text-xs">{tx.id}</span>
                      <span className="text-white/30 text-xs">{tx.agent}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-white font-semibold text-xs">{tx.amount}</span>
                      <span className={`text-xs ${tx.statusColor}`}>{tx.status}</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/20 group-hover:text-white/50 transition-colors"><path d="m9 18 6-6-6-6"/></svg>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function GraphNode({ label, sub, active, color, compact }: { label: string; sub: string; active: boolean; color: string; compact?: boolean }) {
  return (
    <div
      className={`${compact ? "w-44" : "w-64"} p-4 rounded-2xl border-2 text-center transition-all duration-500`}
      style={active
        ? { borderColor: color, background: `${color}12`, boxShadow: `0 0 20px ${color}30` }
        : { borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }
      }
    >
      <p className={`font-bold text-sm mb-1 ${active ? "text-white" : "text-white/40"}`}>{label}</p>
      <p className={`text-xs ${active ? "opacity-70" : "opacity-30"}`} style={active ? { color } : {}}>{sub}</p>
      {active && <div className="w-1.5 h-1.5 rounded-full mx-auto mt-2" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />}
    </div>
  );
}

function Arrow() {
  return <div className="w-px h-8 bg-white/10" />;
}

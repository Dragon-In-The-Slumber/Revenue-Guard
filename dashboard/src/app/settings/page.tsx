"use client";

import { useState } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type Tab = "policies" | "status";

export default function SettingsPage() {
  const { data, error, isLoading, mutate } = useSWR(`/api/policies`, fetcher, { refreshInterval: 5000 });
  const { data: healthData } = useSWR(`/api/health-check`, fetcher, { refreshInterval: 30000 });

  const [newPolicy, setNewPolicy] = useState("");
  const [agentName, setAgentName] = useState("Compliance");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("policies");

  const policies = data?.policies || [];
  const isLive = healthData?.live === true;

  const handleAddPolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPolicy.trim()) return;
    setIsSubmitting(true);
    try {
      await fetch(`/api/policies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent_name: agentName, policy_text: newPolicy }),
      });
      setNewPolicy("");
      mutate();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePolicy = async (id: number) => {
    try {
      await fetch(`/api/policies/${id}`, { method: "DELETE" });
      mutate();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-8 py-4 border-b border-white/5 bg-[#06060F]/80 backdrop-blur-xl">
        <div>
          <h1 className="text-base font-bold text-white tracking-tight">Agent Configuration</h1>
          <p className="text-white/35 text-xs font-mono mt-0.5">natural language policies · system status</p>
        </div>
      </header>

      <main className="flex-1 p-6 md:p-8 max-w-5xl mx-auto w-full flex flex-col gap-6">
        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl border border-white/8 bg-white/3 w-fit">
          {([["policies", "AI Policies"], ["status", "System Status"]] as [Tab, string][]).map(([id, label]) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === id ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"}`}>
              {label}
            </button>
          ))}
        </div>

        {/* ── Policies Tab ── */}
        {activeTab === "policies" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
            {/* Form */}
            <div className="md:col-span-1">
              <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-3">New Policy</h2>
              <form onSubmit={handleAddPolicy} className="glass-panel p-5 flex flex-col gap-4">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-white/40 mb-1.5">Target Agent</label>
                  <select value={agentName} onChange={(e) => setAgentName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-[#00F0FF]/50 transition-all">
                    <option value="Compliance">Compliance</option>
                    <option value="Orchestrator">Orchestrator</option>
                    <option value="Diagnostician">Diagnostician</option>
                    <option value="Outreach">Outreach</option>
                    <option value="Prediction">Prediction</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-white/40 mb-1.5">Rule (Natural Language)</label>
                  <textarea value={newPolicy} onChange={(e) => setNewPolicy(e.target.value)}
                    placeholder="e.g. Do not send SMS if transaction is over ₹50,000."
                    className="w-full h-28 bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-[#00F0FF]/50 transition-all resize-none"
                    required />
                </div>
                <button type="submit" disabled={isSubmitting} className="pill-btn primary w-full justify-center">
                  {isSubmitting ? "Adding..." : "Add Policy"}
                </button>
              </form>
            </div>

            {/* Policy List */}
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider">Active Policies</h2>
                <span className="text-xs text-white/30 font-mono">{policies.length} rules</span>
              </div>
              {error ? (
                <div className="glass-panel p-4 text-red-400 text-sm">Failed to load policies.</div>
              ) : policies.length === 0 && !isLoading ? (
                <div className="glass-panel p-8 text-white/30 text-sm text-center italic">No policies yet. Add one to guide the AI agents.</div>
              ) : (
                <div className="space-y-3">
                  {policies.map((p: any) => (
                    <div key={p.id} className="glass-panel p-4 group flex items-start justify-between gap-4 border-l-2 border-l-[#8B5CF6] hover:border-l-[#00F0FF] transition-colors">
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-mono bg-white/8 text-white/60 px-2 py-0.5 rounded-full inline-block mb-2">
                          → {p.agent_name}
                        </span>
                        <p className="text-white/85 text-sm leading-relaxed">{p.policy_text}</p>
                      </div>
                      <button onClick={() => handleDeletePolicy(p.id)}
                        className="text-white/15 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/10 shrink-0">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── System Status Tab ── */}
        {activeTab === "status" && (
          <div className="animate-fade-in space-y-4">
            <div className="glass-panel p-6">
              <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4">Backend Connectivity</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-4 rounded-xl border ${isLive ? "border-emerald-500/30 bg-emerald-500/5" : "border-[#8B5CF6]/30 bg-[#8B5CF6]/5"}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${isLive ? "bg-emerald-400" : "bg-[#8B5CF6]"}`} />
                    <span className={`text-sm font-semibold ${isLive ? "text-emerald-400" : "text-[#8B5CF6]"}`}>
                      {isLive ? "Live API Connected" : "Demo Mode (Mock AI)"}
                    </span>
                  </div>
                  <p className="text-white/40 text-xs leading-relaxed">
                    {isLive
                      ? "Your Render API is reachable. Webhook simulations will invoke Claude 3.5 Sonnet via LangGraph."
                      : "The Render API is sleeping or unreachable. Webhooks are processed by an in-memory simulated pipeline. Real AI activates automatically when the API wakes up."}
                  </p>
                  {!isLive && (
                    <p className="text-white/30 text-[10px] font-mono mt-2 break-all">
                      Target: https://revenueguard-api-qbkp.onrender.com
                    </p>
                  )}
                </div>

                <div className="p-4 rounded-xl border border-white/8 bg-white/3">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                    <span className="text-sm font-semibold text-cyan-400">AI Stack</span>
                  </div>
                  <ul className="space-y-1.5 text-white/40 text-xs">
                    <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Claude 3.5 Sonnet (Diagnostician)</li>
                    <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> LangGraph multi-agent workflow</li>
                    <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Razorpay payment.failed webhook</li>
                    <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> PostgreSQL audit persistence</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

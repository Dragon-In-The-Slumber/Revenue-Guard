"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function SettingsPage() {
  const { data, error, isLoading, mutate } = useSWR(`/api/policies`, fetcher, { refreshInterval: 5000 });
  
  const [newPolicy, setNewPolicy] = useState("");
  const [agentName, setAgentName] = useState("Compliance");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const policies = data?.policies || [];

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
      {/* ─── Top Navigation Bar ─── */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-8 py-4 border-b border-white/10 bg-[#05050A]/70 backdrop-blur-xl shadow-lg">
        <div className="flex items-center gap-2">
          <Link href="/" className="text-white text-lg font-bold tracking-tight hover:text-[#00F0FF] transition-colors text-glow">
            RevenueGuard
          </Link>
          <span className="text-[#00F0FF] font-mono text-xs border border-[#00F0FF]/30 px-2 py-0.5 rounded-full bg-[#00F0FF]/10">/settings</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/" className="text-white/60 text-sm hover:text-white transition-colors">← Back to Dashboard</Link>
        </div>
      </nav>

      <main className="flex-1 p-6 md:p-10 max-w-[1000px] mx-auto w-full flex flex-col gap-8">
        <header className="animate-fade-in stagger-1">
          <p className="mono-label mb-2 text-[#00F0FF]">AGENTIC WORKFLOW STUDIO</p>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white drop-shadow-md">
            Natural Language Policies
          </h1>
          <p className="text-white/60 mt-4 max-w-2xl">
            Configure the guardrails, behaviors, and routing logic for the AI Agents. 
            These rules are dynamically fetched by the LLMs during runtime.
          </p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Add Policy Form */}
          <div className="md:col-span-1 flex flex-col gap-4">
            <h2 className="text-xl font-bold text-white mb-2">New Policy</h2>
            <form onSubmit={handleAddPolicy} className="glass-panel p-5 flex flex-col gap-4 sticky top-24">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#00F0FF]/80 mb-2">Target Agent</label>
                <select 
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-[#00F0FF]/50 focus:shadow-[0_0_10px_rgba(0,240,255,0.2)] transition-all"
                >
                  <option value="Compliance">Compliance</option>
                  <option value="Orchestrator">Orchestrator</option>
                  <option value="Diagnostician">Diagnostician</option>
                  <option value="Outreach">Outreach</option>
                  <option value="Prediction">Prediction</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#00F0FF]/80 mb-2">Rule (Natural Language)</label>
                <textarea 
                  value={newPolicy}
                  onChange={(e) => setNewPolicy(e.target.value)}
                  placeholder="e.g. Do not send SMS if transaction is over ₹50,000."
                  className="w-full h-32 bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-[#00F0FF]/50 focus:shadow-[0_0_10px_rgba(0,240,255,0.2)] transition-all resize-none"
                  required
                />
              </div>
              
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full pill-btn primary mt-2"
              >
                {isSubmitting ? "Adding..." : "Add Policy"}
              </button>
            </form>
          </div>

          {/* Active Policies List */}
          <div className="md:col-span-2 flex flex-col gap-4">
            <h2 className="text-xl font-bold text-white mb-2 flex justify-between items-center">
              <span>Active Policies</span>
              {isLoading && <span className="text-xs text-white/40 font-mono">Loading...</span>}
            </h2>
            
            {error ? (
              <div className="text-red-400 p-4 border border-red-500/20 rounded-lg bg-red-500/10">Failed to load policies. Is the API running?</div>
            ) : policies.length === 0 && !isLoading ? (
              <div className="text-white/40 italic p-8 text-center glass-panel">No active policies found.</div>
            ) : (
              <div className="space-y-4">
                {policies.map((p: any) => (
                  <div key={p.id} className="glass-panel p-5 relative group overflow-hidden border-l-4 border-l-[#8B5CF6] hover:border-l-[#00F0FF] transition-colors">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/10 text-white/80 inline-block mb-3">
                          Target: <strong className="text-white">{p.agent_name}</strong>
                        </span>
                        <p className="text-white/90 text-sm leading-relaxed font-medium">
                          {p.policy_text}
                        </p>
                      </div>
                      <button 
                        onClick={() => handleDeletePolicy(p.id)}
                        className="text-white/20 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 p-2"
                        title="Delete Policy"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

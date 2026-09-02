"use client";

import useSWR from "swr";
import Link from "next/link";
import { useMemo } from "react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function PipelineGraphPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const { data } = useSWR(`${apiUrl}/api/pipeline`, fetcher, { refreshInterval: 5000 });

  const activeTx = data?.pipeline?.[0]; // Get the most recent transaction

  // Helper to determine if a node is currently active
  const isActive = (nodeName: string) => {
    if (!activeTx) return false;
    const currentAgent = activeTx.agent.toLowerCase();
    return currentAgent.includes(nodeName.toLowerCase()) || 
           (nodeName === "Compliance" && activeTx.status.includes("Escalate"));
  };

  const getStyle = (nodeName: string) => {
    if (isActive(nodeName)) {
      return "border-gold bg-gold/10 text-[#F0E7D6] shadow-[0_0_15px_rgba(217,163,83,0.3)]";
    }
    return "border-subtle bg-[#1A1612] text-dim hover:border-gold/50 transition-colors";
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0806]">
      {/* ─── Top Navigation Bar ─── */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-8 py-4 border-b border-subtle bg-[#0E0B08]/90 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Link href="/" className="text-[#F0E7D6] text-lg font-bold tracking-tight hover:text-gold transition-colors">
            RevenueGuard
          </Link>
          <span className="text-gold font-mono text-sm">/pipeline</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/" className="text-dim text-sm hover:text-[#F0E7D6] transition-colors">← Back to Dashboard</Link>
        </div>
      </nav>

      <main className="flex-1 p-6 md:p-10 flex flex-col items-center justify-center animate-fade-in relative">
        <header className="mb-12 text-center">
          <p className="mono-label mb-2">STATE MACHINE</p>
          <h1 className="text-3xl font-bold tracking-tight text-[#F0E7D6]">
            LangGraph AI Architecture
          </h1>
          {activeTx && (
            <p className="text-emerald-400 font-mono text-sm mt-4">
              Tracking Active Transaction: {activeTx.id}
            </p>
          )}
        </header>

        {/* Graph Container */}
        <div className="relative flex flex-col items-center gap-12 w-full max-w-4xl font-mono text-sm">
          
          {/* Node: Orchestrator */}
          <div className={`p-4 rounded-md border-2 w-64 text-center z-10 ${getStyle("Orchestrator")}`}>
            <span className="block font-bold mb-1">1. Orchestrator</span>
            <span className="text-xs opacity-70">Ingests Webhook</span>
          </div>

          <div className="w-0.5 h-12 bg-subtle absolute top-[70px]"></div>

          {/* Node: Diagnostician */}
          <div className={`p-4 rounded-md border-2 w-64 text-center z-10 ${getStyle("Diagnostician")}`}>
            <span className="block font-bold mb-1">2. Diagnostician</span>
            <span className="text-xs opacity-70">Claude 3.5 Sonnet</span>
          </div>

          {/* Fork Lines */}
          <div className="flex w-[300px] justify-between relative mt-12 mb-12">
            <div className="w-[150px] h-0.5 bg-subtle absolute top-0 right-1/2"></div>
            <div className="w-[150px] h-0.5 bg-subtle absolute top-0 left-1/2"></div>
            <div className="w-0.5 h-12 bg-subtle absolute top-0 left-0"></div>
            <div className="w-0.5 h-12 bg-subtle absolute top-0 right-0"></div>
          </div>

          <div className="flex w-full max-w-md justify-between -mt-24 z-10">
            {/* Node: Silent Recovery */}
            <div className={`p-4 rounded-md border-2 w-48 text-center ${getStyle("Silent")}`}>
              <span className="block font-bold mb-1">3a. Silent Recovery</span>
              <span className="text-xs opacity-70">API Gateway Switch</span>
            </div>

            {/* Node: Outreach */}
            <div className={`p-4 rounded-md border-2 w-48 text-center ${getStyle("Outreach")}`}>
              <span className="block font-bold mb-1">3b. Outreach</span>
              <span className="text-xs opacity-70">Customer Comms</span>
            </div>
          </div>

          {/* Join Lines */}
          <div className="flex w-[300px] justify-between relative mt-12">
            <div className="w-0.5 h-12 bg-subtle absolute bottom-0 left-0"></div>
            <div className="w-0.5 h-12 bg-subtle absolute bottom-0 right-0"></div>
            <div className="w-[150px] h-0.5 bg-subtle absolute bottom-0 right-1/2"></div>
            <div className="w-[150px] h-0.5 bg-subtle absolute bottom-0 left-1/2"></div>
          </div>
          
          <div className="w-0.5 h-12 bg-subtle absolute bottom-[70px]"></div>

          {/* Node: Compliance */}
          <div className={`p-4 rounded-md border-2 w-64 text-center z-10 -mt-12 ${getStyle("Compliance")}`}>
            <span className="block font-bold mb-1">4. Compliance</span>
            <span className="text-xs opacity-70">Rules & Escalation</span>
          </div>
        </div>
      </main>
    </div>
  );
}

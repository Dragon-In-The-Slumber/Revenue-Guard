import MetricsPanel from "../components/MetricsPanel";
import RecoveryPipeline from "../components/RecoveryPipeline";
import LiveEventFeed from "../components/LiveEventFeed";
import AuditTrailViewer from "../components/AuditTrailViewer";
import TriggerTestButton from "../components/TriggerTestButton";
import BatchSimulatorButton from "../components/BatchSimulatorButton";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* ─── Top Navigation Bar ─── */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-8 py-4 border-b border-white/10 bg-[#05050A]/70 backdrop-blur-xl shadow-lg">
        <div className="flex items-center gap-2">
          <span className="text-white text-xl font-bold tracking-tight text-glow">RevenueGuard</span>
          <span className="text-[#00F0FF] font-mono text-xs border border-[#00F0FF]/30 px-2 py-0.5 rounded-full bg-[#00F0FF]/10">/ai</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="#metrics" className="text-white/60 text-sm hover:text-white transition-colors">Metrics</a>
          <a href="#pipeline" className="text-white/60 text-sm hover:text-white transition-colors">Live Feed</a>
          <a href="#audit" className="text-white/60 text-sm hover:text-white transition-colors">Audit Trail</a>
          <Link href="/settings" className="text-white/60 text-sm hover:text-[#00F0FF] transition-colors flex items-center gap-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
            Agent Settings
          </Link>
          <Link href="/pipeline" className="text-[#00F0FF] text-sm hover:text-white transition-colors font-mono">Graph View ↗</Link>
          {/* Demo Mode Badge */}
          <div className="flex items-center gap-2 bg-[#8B5CF6]/10 border border-[#8B5CF6]/30 px-3 py-1.5 rounded-full">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8B5CF6] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#8B5CF6]"></span>
            </div>
            <span className="text-[#8B5CF6] text-xs font-medium uppercase tracking-wider">Demo Mode</span>
          </div>
          <div className="flex items-center gap-2 bg-[#00F0FF]/10 border border-[#00F0FF]/30 px-3 py-1.5 rounded-full shadow-[0_0_10px_rgba(0,240,255,0.2)]">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00F0FF] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00F0FF]"></span>
            </div>
            <span className="text-[#00F0FF] text-xs font-medium uppercase tracking-wider">Live Agents</span>
          </div>
        </div>
      </nav>

      {/* ─── Main Content ─── */}
      <main className="flex-1 p-6 md:p-10 max-w-[1440px] mx-auto w-full flex flex-col gap-10">

        {/* ─── Hero Header ─── */}
        <header className="pt-10 pb-6 animate-fade-in stagger-1">
          <p className="mono-label mb-4 text-[#00F0FF]">AI REVENUE RECOVERY</p>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1]">
            Recover revenue.<br />
            <span className="text-gradient">Autonomously.</span>
          </h1>
          <p className="text-white/60 text-lg md:text-xl mt-6 max-w-2xl font-light">
            Multi-agent AI system that diagnoses payment failures, switches gateways silently,
            and reaches out to customers — all without human intervention.
          </p>
        </header>

        {/* ─── Metrics Section ─── */}
        <section id="metrics">
          <p className="mono-label mb-4">01 / METRICS</p>
          <MetricsPanel />
        </section>

        {/* ─── Pipeline + Live Feed (Split Layout) ─── */}
        <section id="pipeline" className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: Pipeline (60%) */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="mono-label">02 / ACTIVE PIPELINE</p>
              <div className="flex items-center gap-3">
                <BatchSimulatorButton />
                <TriggerTestButton />
              </div>
            </div>
            <div className="glass-panel p-6 flex-1">
              <RecoveryPipeline />
            </div>
          </div>

          {/* Right: Live Feed (40%) */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <p className="mono-label">03 / LIVE FEED</p>
            <div className="glass-panel p-6 flex-1 max-h-[560px] overflow-hidden">
              <LiveEventFeed />
            </div>
          </div>
        </section>

        {/* ─── Audit Trail ─── */}
        <section id="audit">
          <p className="mono-label mb-4">04 / AUDIT TRAIL</p>
          <div className="glass-panel p-6">
            <AuditTrailViewer />
          </div>
        </section>
      </main>

      {/* ─── Footer ─── */}
      <footer className="border-t border-white/10 bg-black/40 backdrop-blur-md px-8 py-6 flex items-center justify-between mt-auto">
        <div className="flex items-center gap-2">
          <span className="text-white/50 text-sm font-semibold">RevenueGuard</span>
          <span className="text-[#00F0FF] text-sm">/</span>
          <span className="text-white/50 text-sm">buildathon</span>
        </div>
        <span className="text-white/40 text-xs font-mono tracking-wider">Built for the Razorpay AI Buildathon 2026</span>
      </footer>
    </div>
  );
}

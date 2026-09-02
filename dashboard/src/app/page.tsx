import MetricsPanel from "../components/MetricsPanel";
import RecoveryPipeline from "../components/RecoveryPipeline";
import LiveEventFeed from "../components/LiveEventFeed";
import AuditTrailViewer from "../components/AuditTrailViewer";
import TriggerTestButton from "../components/TriggerTestButton";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* ─── Top Navigation Bar ─── */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-8 py-4 border-b border-subtle bg-[#0E0B08]/90 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="text-[#F0E7D6] text-lg font-bold tracking-tight">RevenueGuard</span>
          <span className="text-gold font-mono text-sm">/ai</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="#metrics" className="text-dim text-sm hover:text-[#F0E7D6] transition-colors">Metrics</a>
          <a href="#pipeline" className="text-dim text-sm hover:text-[#F0E7D6] transition-colors">Live Feed</a>
          <a href="#audit" className="text-dim text-sm hover:text-[#F0E7D6] transition-colors">Audit Trail</a>
          <Link href="/pipeline" className="text-dim text-sm hover:text-gold transition-colors font-mono">Graph View ↗</Link>
          <div className="flex items-center gap-2 bg-[#14100B] border border-subtle px-3 py-1.5 rounded-full">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </div>
            <span className="text-emerald-400 text-xs font-medium uppercase tracking-wider">Live</span>
          </div>
        </div>
      </nav>

      {/* ─── Main Content ─── */}
      <main className="flex-1 p-6 md:p-10 max-w-[1440px] mx-auto w-full flex flex-col gap-10">

        {/* ─── Hero Header ─── */}
        <header className="pt-6 pb-2 animate-fade-in">
          <p className="mono-label mb-4">AI REVENUE RECOVERY</p>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.1]">
            Recover revenue.<br />
            <span className="text-gold">Autonomously.</span>
          </h1>
          <p className="text-muted text-lg mt-4 max-w-2xl">
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
              <TriggerTestButton />
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
      <footer className="border-t border-subtle px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-dim text-sm">RevenueGuard</span>
          <span className="text-gold text-sm">/</span>
          <span className="text-dim text-sm">buildathon</span>
        </div>
        <span className="text-dim text-xs font-mono">Built for the Razorpay AI Buildathon 2026</span>
      </footer>
    </div>
  );
}

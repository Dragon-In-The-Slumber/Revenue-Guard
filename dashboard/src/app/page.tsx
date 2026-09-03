import MetricsPanel from "../components/MetricsPanel";
import RecoveryPipeline from "../components/RecoveryPipeline";
import LiveEventFeed from "../components/LiveEventFeed";
import AuditTrailViewer from "../components/AuditTrailViewer";
import TriggerTestButton from "../components/TriggerTestButton";
import BatchSimulatorButton from "../components/BatchSimulatorButton";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* ─── Top Bar ─── */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-8 py-4 border-b border-white/5 bg-[#06060F]/80 backdrop-blur-xl">
        <div>
          <h1 className="text-base font-bold text-white tracking-tight">AI Command Center</h1>
          <p className="text-white/35 text-xs font-mono mt-0.5">revenue recovery · payment diagnostics · agent orchestration</p>
        </div>
        <div className="flex items-center gap-3">
          <BatchSimulatorButton />
          <TriggerTestButton />
        </div>
      </header>

      {/* ─── Main Content ─── */}
      <main className="flex-1 p-6 md:p-8 flex flex-col gap-8">

        {/* ─── Metrics Row ─── */}
        <section className="animate-fade-in stagger-1">
          <div className="section-header">
            <p className="mono-label">Metrics</p>
          </div>
          <MetricsPanel />
        </section>

        {/* ─── Pipeline + Live Feed ─── */}
        <section className="grid grid-cols-1 xl:grid-cols-5 gap-6 animate-fade-in stagger-2">
          {/* Pipeline (wider) */}
          <div className="xl:col-span-3 glass-panel p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="mono-label mb-1">Active Pipeline</p>
                <h2 className="text-base font-bold text-white">Recovery Queue</h2>
              </div>
              <div className="flex items-center gap-2 text-xs text-white/30 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] animate-pulse inline-block" />
                live
              </div>
            </div>
            <RecoveryPipeline />
          </div>

          {/* Live Feed (narrower) */}
          <div className="xl:col-span-2 glass-panel p-6 max-h-[500px] overflow-hidden flex flex-col">
            <LiveEventFeed />
          </div>
        </section>

        {/* ─── Audit Trail ─── */}
        <section className="animate-fade-in stagger-3">
          <div className="section-header">
            <p className="mono-label">Sample Audit Trail</p>
          </div>
          <div className="glass-panel p-6">
            <AuditTrailViewer />
          </div>
        </section>
      </main>
    </div>
  );
}

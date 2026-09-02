import MetricsPanel from "../components/MetricsPanel";
import RecoveryPipeline from "../components/RecoveryPipeline";
import LiveEventFeed from "../components/LiveEventFeed";
import AuditTrailViewer from "../components/AuditTrailViewer";

export default function Home() {
  return (
    <main className="min-h-screen p-6 md:p-10 max-w-[1600px] mx-auto w-full flex flex-col gap-8">
      {/* Premium Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            RevenueGuard <span className="text-gradient">AI Command Center</span>
          </h1>
          <p className="text-slate-400 mt-2 text-lg">
            Autonomous revenue recovery & intelligent payment routing
          </p>
        </div>
        
        {/* Status Indicator */}
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-full backdrop-blur-sm">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </div>
          <span className="text-emerald-400 text-sm font-semibold uppercase tracking-wider">System Live</span>
        </div>
      </header>

      {/* Top Level Metrics (100% width) */}
      <section>
        <MetricsPanel />
      </section>

      {/* Middle Grid (60/40 Split) */}
      <section className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-[500px]">
        {/* Left Side: Pipeline Workflow (Span 3) */}
        <div className="lg:col-span-3 glass-panel p-6 flex flex-col h-full">
          <h2 className="text-xl font-bold mb-4 text-white">Active Recovery Pipeline</h2>
          <div className="flex-1 overflow-y-auto no-scrollbar relative rounded-xl border border-white/5 bg-black/20 p-4">
             <RecoveryPipeline />
          </div>
        </div>

        {/* Right Side: Live Feed (Span 2) */}
        <div className="lg:col-span-2 glass-panel p-6 flex flex-col h-full">
          <h2 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
            Live Intelligence Feed
            <span className="bg-blue-500/20 text-blue-400 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-widest animate-pulse">Streaming</span>
          </h2>
          <div className="flex-1 overflow-hidden relative">
            <LiveEventFeed />
          </div>
        </div>
      </section>

      {/* Bottom Section: Audit Trail */}
      <section className="glass-panel p-6">
        <h2 className="text-xl font-bold mb-4 text-white">Cryptographic Audit Trail</h2>
        <div className="overflow-x-auto">
          <AuditTrailViewer />
        </div>
      </section>
    </main>
  );
}

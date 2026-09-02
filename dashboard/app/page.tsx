import MetricsPanel from "@/components/MetricsPanel";
import RecoveryPipeline from "@/components/RecoveryPipeline";
import AuditTrailViewer from "@/components/AuditTrailViewer";
import LiveEventFeed from "@/components/LiveEventFeed";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-[#0e0b08] text-white p-8 font-sans">
      {/* Header */}
      <header className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
            RevenueGuard
          </h1>
          <p className="text-gray-400 mt-2">Autonomous AI Revenue Recovery OS</p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/audit"
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-gray-300 text-sm hover:bg-white/10 transition-colors"
          >
            View Audit Trail →
          </Link>
          <div className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-sm font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            System Active
          </div>
        </div>
      </header>

      {/* Metrics Row */}
      <section className="mb-8">
        <MetricsPanel />
      </section>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <RecoveryPipeline />
        </div>
        <div>
          <LiveEventFeed />
        </div>
      </div>

      {/* Audit Trail */}
      <section>
        <AuditTrailViewer />
      </section>
    </main>
  );
}

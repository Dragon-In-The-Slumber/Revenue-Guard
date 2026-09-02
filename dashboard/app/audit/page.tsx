import AuditTrailViewer from "@/components/AuditTrailViewer";
import Link from "next/link";

export default function AuditPage() {
  return (
    <main className="min-h-screen bg-[#0e0b08] text-white p-8 font-sans">
      <header className="flex justify-between items-center mb-10">
        <div>
          <Link href="/" className="text-gray-500 hover:text-gray-300 text-sm transition-colors mb-2 block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
            Audit Trail
          </h1>
          <p className="text-gray-400 mt-1">Full deterministic trace of every agent decision</p>
        </div>
      </header>

      <AuditTrailViewer />
    </main>
  );
}

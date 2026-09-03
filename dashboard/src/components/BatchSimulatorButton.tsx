"use client";

import { useState } from "react";
import { useToast } from "./ToastProvider";

export default function BatchSimulatorButton() {
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const handleBatch = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/batch-simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: 5 }),
      });

      if (!response.ok) throw new Error("Failed to trigger batch");

      const data = await response.json();
      addToast(`Batch of ${data.count} transactions fired! Watch the pipeline...`, "success");
    } catch (err) {
      addToast("Batch simulation failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleBatch}
      disabled={loading}
      className="pill-btn text-xs uppercase tracking-widest shadow-[0_0_15px_rgba(139,92,246,0.3)] border-[#8B5CF6]/40 hover:border-[#8B5CF6]"
    >
      <span className="relative z-10 flex items-center gap-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 3h5v5"/><path d="M8 3H3v5"/><path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3"/><path d="m15 9 6-6"/>
        </svg>
        {loading ? "Firing..." : "Batch (×5)"}
      </span>
    </button>
  );
}

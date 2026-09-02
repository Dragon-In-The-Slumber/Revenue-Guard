"use client";

import { useState } from "react";
import WebhookSimulatorModal from "./WebhookSimulatorModal";

export default function TriggerTestButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="pill-btn primary text-xs uppercase tracking-widest shadow-[0_0_15px_rgba(0,240,255,0.4)]"
      >
        <span className="relative z-10 flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="m10 13-2 2 2 2"/><path d="m14 17 2-2-2-2"/></svg>
          Simulator
        </span>
      </button>
      <WebhookSimulatorModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}

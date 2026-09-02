"use client";

import { useEffect } from "react";
import AuditTrailViewer from "./AuditTrailViewer";

interface TransactionModalProps {
  transactionId: string | null;
  onClose: () => void;
}

export default function TransactionModal({ transactionId, onClose }: TransactionModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!transactionId) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
      <div 
        className="glass-panel w-full max-w-2xl max-h-[85vh] overflow-y-auto relative animate-slide-up bg-[#0E0B08]/95"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-dim hover:text-white transition-colors p-2"
        >
          ✕
        </button>
        <div className="p-6 md:p-8">
          <h2 className="text-xl font-bold text-[#F0E7D6] mb-1">Transaction Deep Dive</h2>
          <p className="text-muted text-sm mb-6 pb-4 border-b border-subtle">
            View the AI agent's step-by-step reasoning for {transactionId}.
          </p>
          <AuditTrailViewer transactionId={transactionId} />
        </div>
      </div>
      {/* Click outside to close */}
      <div className="absolute inset-0 -z-10" onClick={onClose} />
    </div>
  );
}

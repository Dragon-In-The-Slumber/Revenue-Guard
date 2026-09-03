"use client";

import { useState } from "react";

export default function WebhookSimulatorModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [mode, setMode] = useState<"live" | "demo" | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [formData, setFormData] = useState({
    amount: "2500",
    error_reason: "ISSUING_BANK_DOWNTIME",
    bank: "HDFC",
    method: "card",
    email: "gaurav.kumar@example.com",
    contact: "+919876543210",
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccess(false);
    setMode(null);

    try {
      const txId = `pay_${Math.random().toString(36).substring(2, 16)}`;
      const orderId = `order_${Math.random().toString(36).substring(2, 16)}`;
      const now = Math.floor(Date.now() / 1000);
      const amountPaise = parseInt(formData.amount, 10) * 100; // INR → paise

      // ─── Real Razorpay payment.failed webhook format ──────────────────
      const payload = {
        entity: "event",
        account_id: "acc_BFQ7uEA5nqdEdf",
        event: "payment.failed",
        contains: ["payment"],
        payload: {
          payment: {
            entity: {
              id: txId,
              entity: "payment",
              amount: amountPaise,
              currency: "INR",
              status: "failed",
              order_id: orderId,
              invoice_id: null,
              international: false,
              method: formData.method,
              amount_refunded: 0,
              refund_status: null,
              captured: false,
              description: "Payment via RevenueGuard Simulator",
              card_id: `card_${Math.random().toString(36).substring(2, 16)}`,
              bank: formData.bank,
              wallet: null,
              vpa: formData.method === "upi" ? `${formData.email.split("@")[0]}@upi` : null,
              email: formData.email,
              contact: formData.contact,
              notes: [],
              fee: null,
              tax: null,
              error_code: "BAD_REQUEST_ERROR",
              error_description: "Payment processing failed due to error at bank or wallet gateway",
              error_source: "bank",
              error_step: "payment_authentication",
              error_reason: formData.error_reason,
              created_at: now,
            },
          },
        },
        created_at: now,
      };

      const response = await fetch(`/api/trigger-test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to trigger webhook");

      const data = await response.json();
      setMode(data.mode || "demo");
      setSuccess(true);
      setLoading(false);

      setTimeout(() => {
        setSuccess(false);
        setMode(null);
        onClose();
      }, 3000);
    } catch (error: any) {
      setErrorMsg(error.message || "An error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg relative rounded-2xl max-h-[90vh] flex flex-col" style={{ background: "linear-gradient(135deg, rgba(15,15,25,0.98), rgba(10,10,20,0.98))", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 25px 60px rgba(0,0,0,0.6), 0 0 60px rgba(0,240,255,0.05)" }}>
        {/* Top glow bar */}
        <div className="h-0.5 w-full shrink-0" style={{ background: "linear-gradient(90deg, #8B5CF6, #00F0FF, #10B981)" }} />

        {/* Glow blobs */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#00F0FF] rounded-full blur-[100px] opacity-10 pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-[#8B5CF6] rounded-full blur-[100px] opacity-10 pointer-events-none" />

        <div className="relative p-7 overflow-y-auto">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-[#00F0FF] shadow-[0_0_8px_#00F0FF] animate-pulse" />
                <span className="text-[#00F0FF] text-xs font-mono uppercase tracking-[0.2em]">Webhook Simulator</span>
              </div>
              <h3 className="text-xl font-bold text-white">Inject payment.failed</h3>
              <p className="text-white/40 text-xs mt-1">Sends real Razorpay webhook format</p>
            </div>
            <button onClick={onClose} className="text-white/30 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Status messages */}
            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-sm flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
                {errorMsg}
              </div>
            )}
            {success && (
              <div className={`border p-3 rounded-xl text-sm flex items-center gap-2 ${mode === 'live' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-[#00F0FF]/10 border-[#00F0FF]/30 text-[#00F0FF]'}`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6 9 17l-5-5"/></svg>
                {mode === 'live' 
                  ? '✓ Live API accepted — Claude 3.5 Sonnet is diagnosing...' 
                  : '✓ Webhook injected — Mock AI agents processing...'}
              </div>
            )}

            {/* Two-column grid for form fields */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-[0.15em] text-white/50 mb-1.5">Amount (₹ INR)</label>
                <input
                  type="number" value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#00F0FF]/50 transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-[0.15em] text-white/50 mb-1.5">Bank</label>
                <select value={formData.bank} onChange={(e) => setFormData({ ...formData, bank: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#00F0FF]/50 transition-all">
                  <option value="HDFC">HDFC</option>
                  <option value="ICICI">ICICI</option>
                  <option value="SBI">SBI</option>
                  <option value="Axis">Axis</option>
                  <option value="Kotak">Kotak</option>
                  <option value="Yes Bank">Yes Bank</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-[0.15em] text-white/50 mb-1.5">Error Reason</label>
              <select value={formData.error_reason} onChange={(e) => setFormData({ ...formData, error_reason: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#00F0FF]/50 transition-all">
                <option value="ISSUING_BANK_DOWNTIME">ISSUING_BANK_DOWNTIME — triggers silent retry</option>
                <option value="INSUFFICIENT_FUNDS">INSUFFICIENT_FUNDS — triggers customer outreach</option>
                <option value="RISK_DECLINE">RISK_DECLINE — triggers compliance escalation</option>
                <option value="UPI_APP_TIMEOUT">UPI_APP_TIMEOUT — triggers silent retry</option>
                <option value="EXPIRED_CARD">EXPIRED_CARD — triggers customer outreach</option>
                <option value="INCORRECT_PIN">INCORRECT_PIN — triggers customer outreach</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-[0.15em] text-white/50 mb-1.5">Payment Method</label>
                <select value={formData.method} onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#00F0FF]/50 transition-all">
                  <option value="card">Card</option>
                  <option value="upi">UPI</option>
                  <option value="netbanking">Netbanking</option>
                  <option value="wallet">Wallet</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-[0.15em] text-white/50 mb-1.5">Customer Email</label>
                <input type="email" value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#00F0FF]/50 transition-all"
                  required
                />
              </div>
            </div>

            {/* Payload preview */}
            <div className="bg-black/40 rounded-xl p-3 border border-white/5">
              <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-1.5">Payload Preview</p>
              <code className="text-[10px] font-mono text-white/50 leading-relaxed">
                event: payment.failed<br/>
                amount: {parseInt(formData.amount || "0") * 100} paise (₹{formData.amount})<br/>
                error_reason: {formData.error_reason}<br/>
                bank: {formData.bank} | method: {formData.method}
              </code>
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-300 mt-2"
              style={{
                background: loading || success
                  ? "rgba(255,255,255,0.05)"
                  : "linear-gradient(135deg, #00F0FF, #8B5CF6)",
                color: loading || success ? "rgba(255,255,255,0.4)" : "#000",
                boxShadow: loading || success ? "none" : "0 0 20px rgba(0,240,255,0.3)",
              }}
            >
              {loading ? "Sending to AI agents..." : success ? "✓ Webhook Accepted" : "Inject Webhook →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

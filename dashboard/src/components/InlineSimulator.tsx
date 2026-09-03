"use client";

import { useState } from "react";

export default function InlineSimulator() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [mode, setMode] = useState<"live" | "demo" | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  
  const [formData, setFormData] = useState({
    amount: "75000",
    error_reason: "INSUFFICIENT_FUNDS",
    bank: "HDFC",
    method: "upi",
    email: "gaurav.kumar@example.com",
    contact: "+919876543210",
  });

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
      const amountPaise = parseInt(formData.amount, 10) * 100;

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
      }, 5000);
    } catch (error: any) {
      setErrorMsg(error.message || "An error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel relative overflow-hidden mb-8" style={{ border: "1px solid rgba(0, 240, 255, 0.2)", boxShadow: "0 10px 40px rgba(0, 240, 255, 0.05)" }}>
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-1" style={{ background: "linear-gradient(90deg, #00F0FF, #8B5CF6, #10B981)" }} />
      
      {/* Glow background */}
      <div className="absolute -top-32 -right-32 w-64 h-64 bg-[#00F0FF] rounded-full blur-[120px] opacity-10 pointer-events-none" />

      <div className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          
          {/* Left Side: Header & Info */}
          <div className="w-full md:w-1/3 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-[#00F0FF] shadow-[0_0_8px_#00F0FF] animate-pulse" />
                <span className="text-[#00F0FF] text-[10px] font-mono uppercase tracking-[0.2em]">Live Simulation Mode</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Inject Webhook</h2>
              <p className="text-white/40 text-sm leading-relaxed mb-6">
                Fire a realistic Razorpay <code className="text-[#00F0FF]/70 bg-[#00F0FF]/10 px-1.5 py-0.5 rounded text-xs">payment.failed</code> event directly into the AI agent pipeline. Watch the agents intercept, diagnose, and resolve the failure in real-time below.
              </p>
            </div>
            
            {/* Status Feedback */}
            <div className="mt-auto">
              {errorMsg && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-sm flex items-center gap-2 animate-fade-in">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
                  {errorMsg}
                </div>
              )}
              {success && (
                <div className={`border p-3 rounded-xl text-sm flex items-center gap-2 animate-fade-in ${mode === 'live' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-[#00F0FF]/10 border-[#00F0FF]/30 text-[#00F0FF]'}`}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6 9 17l-5-5"/></svg>
                  {mode === 'live' ? 'Webhook accepted — AI pipeline triggered!' : 'Webhook injected in Demo mode.'}
                </div>
              )}
            </div>
          </div>

          {/* Right Side: Form */}
          <div className="w-full md:w-2/3 bg-black/40 rounded-2xl p-6 border border-white/5">
            <form onSubmit={handleSubmit} className="space-y-5">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-[0.15em] text-white/50 mb-2">Error Reason (Triggers Policy)</label>
                  <select value={formData.error_reason} onChange={(e) => setFormData({ ...formData, error_reason: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#00F0FF]/50 transition-all hover:bg-white/10 cursor-pointer">
                    <option value="INSUFFICIENT_FUNDS">INSUFFICIENT_FUNDS (WhatsApp Outreach)</option>
                    <option value="ISSUING_BANK_DOWNTIME">ISSUING_BANK_DOWNTIME (Silent Retry)</option>
                    <option value="RISK_DECLINE">RISK_DECLINE (Compliance Escalation)</option>
                    <option value="UPI_APP_TIMEOUT">UPI_APP_TIMEOUT (Silent Retry)</option>
                    <option value="EXPIRED_CARD">EXPIRED_CARD (WhatsApp Outreach)</option>
                    <option value="INCORRECT_PIN">INCORRECT_PIN (WhatsApp Outreach)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-[0.15em] text-white/50 mb-2">Amount (₹ INR)</label>
                  <input
                    type="number" value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#00F0FF]/50 transition-all hover:bg-white/10"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-[0.15em] text-white/50 mb-2">Payment Method</label>
                  <select value={formData.method} onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#00F0FF]/50 transition-all hover:bg-white/10 cursor-pointer">
                    <option value="upi">UPI</option>
                    <option value="card">Card</option>
                    <option value="netbanking">Netbanking</option>
                    <option value="wallet">Wallet</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-[0.15em] text-white/50 mb-2">Bank</label>
                  <select value={formData.bank} onChange={(e) => setFormData({ ...formData, bank: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#00F0FF]/50 transition-all hover:bg-white/10 cursor-pointer">
                    <option value="HDFC">HDFC</option>
                    <option value="ICICI">ICICI</option>
                    <option value="SBI">SBI</option>
                    <option value="Axis">Axis</option>
                    <option value="Kotak">Kotak</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-[0.15em] text-white/50 mb-2">Customer Email</label>
                  <input type="email" value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#00F0FF]/50 transition-all hover:bg-white/10"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || success}
                className="w-full py-4 rounded-xl font-bold text-sm tracking-wide uppercase transition-all duration-300 mt-2 flex items-center justify-center gap-2 group"
                style={{
                  background: loading || success
                    ? "rgba(255,255,255,0.05)"
                    : "linear-gradient(135deg, #00F0FF, #8B5CF6)",
                  color: loading || success ? "rgba(255,255,255,0.4)" : "#000",
                  boxShadow: loading || success ? "none" : "0 0 30px rgba(0,240,255,0.4)",
                }}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Processing via AI Agents...
                  </>
                ) : success ? (
                  "✓ Webhook Accepted"
                ) : (
                  <>
                    Inject Failed Webhook
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:translate-x-1 transition-transform"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                  </>
                )}
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}

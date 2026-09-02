"use client";

import { useState } from "react";

export default function WebhookSimulatorModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: "5000",
    error_code: "ISSUING_BANK_DOWNTIME",
    bank: "HDFC",
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const payload = {
        transaction_id: `tx_manual_${Math.floor(Math.random() * 100000)}`,
        customer: { name: "Manual Tester", email: "tester@example.com", phone: "+919999999999", type: "B2C" },
        payment: {
          amount: parseInt(formData.amount, 10),
          currency: "INR",
          method: "UPI",
          bank: formData.bank,
          timestamp: new Date().toISOString(),
          status: "failed",
          error_code: formData.error_code,
        },
        merchant: { id: "mer_test", name: "Test Merchant" },
      };

      await fetch(`/api/trigger-test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      setTimeout(() => {
        setLoading(false);
        onClose();
      }, 1000);
    } catch (error) {
      console.error("Failed to trigger test:", error);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel w-full max-w-md p-6 relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#00F0FF] rounded-full blur-[80px] opacity-20"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[#8B5CF6] rounded-full blur-[80px] opacity-20"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white tracking-tight text-glow">Manual Simulator</h3>
            <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#00F0FF]/80 mb-2">Amount (₹)</label>
              <input 
                type="number" 
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-[#00F0FF]/50 focus:shadow-[0_0_10px_rgba(0,240,255,0.2)] transition-all"
                required
              />
            </div>
            
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#00F0FF]/80 mb-2">Error Code</label>
              <select 
                value={formData.error_code}
                onChange={(e) => setFormData({...formData, error_code: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-[#00F0FF]/50 focus:shadow-[0_0_10px_rgba(0,240,255,0.2)] transition-all"
              >
                <option value="ISSUING_BANK_DOWNTIME">ISSUING_BANK_DOWNTIME (Triggers Retry)</option>
                <option value="INSUFFICIENT_FUNDS">INSUFFICIENT_FUNDS (Triggers Outreach)</option>
                <option value="SUSPECTED_FRAUD">SUSPECTED_FRAUD (Triggers Escalation)</option>
                <option value="UNKNOWN_ERROR">UNKNOWN_ERROR</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#00F0FF]/80 mb-2">Bank</label>
              <input 
                type="text" 
                value={formData.bank}
                onChange={(e) => setFormData({...formData, bank: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-[#00F0FF]/50 focus:shadow-[0_0_10px_rgba(0,240,255,0.2)] transition-all"
                required
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full pill-btn primary mt-6"
            >
              {loading ? "Simulating AI Response..." : "Inject Webhook"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

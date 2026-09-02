"use client";

import { useState } from "react";

export default function TriggerTestButton() {
  const [loading, setLoading] = useState(false);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const triggerWebhook = async () => {
    setLoading(true);
    try {
      const payload = {
        transaction_id: `tx_test_${Math.floor(Math.random() * 100000)}`,
        customer: { name: "Test User", email: "test@example.com", phone: "+919999999999", type: "B2C" },
        payment: {
          amount: 5000,
          currency: "INR",
          method: "UPI",
          bank: "HDFC",
          timestamp: new Date().toISOString(),
          status: "failed",
          error_code: "ISSUING_BANK_DOWNTIME",
        },
        merchant: { id: "mer_test", name: "Test Merchant" },
      };

      await fetch(`${apiUrl}/webhooks/razorpay/payment.failed`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error("Failed to trigger test:", error);
    } finally {
      setTimeout(() => setLoading(false), 1000); // small delay to prevent spam
    }
  };

  return (
    <button
      onClick={triggerWebhook}
      disabled={loading}
      className={`px-4 py-2 rounded-md font-mono text-xs tracking-wider uppercase transition-all duration-300 ${
        loading
          ? "bg-[#1A1612] text-dim border border-subtle cursor-not-allowed"
          : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500/50"
      }`}
    >
      {loading ? "Triggering..." : "Trigger Test Failure"}
    </button>
  );
}

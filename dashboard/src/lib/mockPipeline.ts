// Simulates the AI agent pipeline with realistic delays
// Each step writes to the mock store so all dashboard panels update in real-time

import { mockStore } from "./mockStore";

const BANKS_FOR_SWITCH = ["Axis Bank", "Kotak", "SBI", "Yes Bank", "IDFC First"];

interface SimulatorPayload {
  transaction_id: string;
  customer: { name: string; email: string; phone: string; type: string };
  payment: {
    amount: number;
    currency: string;
    method: string;
    bank: string;
    timestamp: string;
    status: string;
    error_code: string;
  };
  merchant: { id: string; name: string };
}

function classifyError(errorCode: string): "retry" | "outreach" | "escalate" {
  const retryable = [
    "ISSUING_BANK_DOWNTIME",
    "BAD_REQUEST_ERROR",
    "UPI_APP_TIMEOUT",
    "BANK_UNAVAILABLE",
    "VPA_INVALID",
  ];
  const escalatable = ["SUSPECTED_FRAUD", "RISK_DECLINE", "ACCOUNT_LOCKED"];

  if (retryable.includes(errorCode)) return "retry";
  if (escalatable.includes(errorCode)) return "escalate";
  return "outreach";
}

export async function simulatePipeline(payload: SimulatorPayload) {
  const txId = payload.transaction_id;
  const amount = payload.payment.amount;
  const bank = payload.payment.bank;
  const errorCode = payload.payment.error_code;
  const classification = classifyError(errorCode);

  // Step 1: Orchestrator ingests webhook (instant)
  mockStore.addTransaction({
    id: txId,
    agent: "Orchestrator",
    amount: `₹${amount.toLocaleString("en-IN")}`,
    status: "Ingesting...",
    statusColor: "text-cyan-400",
    dotColor: "bg-cyan-500",
    borderColor: "border-l-cyan-500",
    createdAt: new Date(),
  });

  mockStore.addAuditEntry(txId, {
    agent: "Orchestrator",
    action: "Webhook Ingested",
    details: `Received payment.failed for ${txId}. Amount: ₹${amount}. Bank: ${bank}. Error: ${errorCode}. Customer: ${payload.customer.name} (${payload.customer.type})`,
    timestamp: new Date(),
    dotColor: "bg-cyan-500",
  });

  // Step 2: Diagnostician analyzes (1s delay)
  await sleep(1000);

  const recommendedAction =
    classification === "retry"
      ? "SILENT_RETRY"
      : classification === "escalate"
        ? "ESCALATE_TO_HUMAN"
        : "CUSTOMER_OUTREACH";

  const reasoning =
    classification === "retry"
      ? `The error code ${errorCode} indicates a temporary infrastructure issue at ${bank}. Historical data shows 94% of these resolve within 15 minutes. The transaction amount of ₹${amount} is within auto-retry limits. Recommending silent gateway switch to maximize recovery probability without customer friction.`
      : classification === "escalate"
        ? `The error code ${errorCode} is a high-risk indicator. This transaction of ₹${amount} has been flagged for potential fraud. Per compliance policy, all ${errorCode} cases must be reviewed by a human agent before any recovery action is taken.`
        : `The error code ${errorCode} indicates a customer-side issue (${errorCode}). The customer ${payload.customer.name} needs to take action. Amount: ₹${amount}. WhatsApp outreach recommended with a personalized payment retry link and empathetic messaging.`;

  mockStore.updateTransactionStatus(txId, {
    agent: "Diagnostician",
    status: "Diagnosing...",
    statusColor: "text-cyan-400",
  });

  mockStore.addAuditEntry(txId, {
    agent: "Diagnostician",
    action: "Failure Diagnosed",
    details: `Cause: ${errorCode} | Bank: ${bank} | Recommended Action: ${recommendedAction}`,
    reasoning,
    recommended_action: recommendedAction,
    timestamp: new Date(),
    dotColor: "bg-cyan-500",
  });

  // Step 3: Action agent (1.5s delay)
  await sleep(1500);

  if (classification === "retry") {
    const switchBank = BANKS_FOR_SWITCH.find((b) => b !== bank) || "Axis Bank";
    mockStore.updateTransactionStatus(txId, {
      agent: "Silent Recovery",
      status: "Gateway Switch Attempted",
      statusColor: "text-emerald-400",
      dotColor: "bg-emerald-500",
      borderColor: "border-l-emerald-500",
    });

    mockStore.addAuditEntry(txId, {
      agent: "Silent Recovery",
      action: "Gateway Switch Attempted",
      details: `Switched from ${bank} to ${switchBank} gateway. Retry initiated for ₹${amount}. No customer notification sent — silent recovery in progress.`,
      timestamp: new Date(),
      dotColor: "bg-emerald-500",
    });
  } else if (classification === "escalate") {
    mockStore.updateTransactionStatus(txId, {
      agent: "Compliance",
      status: "Escalated to Human",
      statusColor: "text-red-400",
      dotColor: "bg-red-500",
      borderColor: "border-l-red-500",
    });

    mockStore.addAuditEntry(txId, {
      agent: "Compliance",
      action: "Escalated to Human",
      details: `High-risk transaction flagged. Error: ${errorCode}. Amount: ₹${amount}. Escalated to human review queue. Auto-recovery blocked per compliance policy.`,
      timestamp: new Date(),
      dotColor: "bg-red-500",
    });
    // Early return for escalated — no compliance step needed after
    return { status: "completed", classification, txId };
  } else {
    mockStore.updateTransactionStatus(txId, {
      agent: "Outreach",
      status: "WhatsApp Message Sent",
      statusColor: "text-gold",
      dotColor: "bg-[#D9A353]",
      borderColor: "border-l-[#D9A353]",
    });

    mockStore.addAuditEntry(txId, {
      agent: "Outreach",
      action: "WhatsApp Message Sent",
      details: `Sent personalized WhatsApp message to ${payload.customer.name} (${payload.customer.phone}) with payment retry link for ₹${amount}. Template: empathetic_retry_v2.`,
      timestamp: new Date(),
      dotColor: "bg-emerald-500",
    });
  }

  // Step 4: Compliance check (1s delay)
  await sleep(1000);

  const policyCount = mockStore.getPolicies().length;
  mockStore.addAuditEntry(txId, {
    agent: "Compliance",
    action: "Approved",
    details: `Action verified against ${policyCount} active policies. No violations detected. Recovery flow completed for ${txId}.`,
    timestamp: new Date(),
    dotColor: "bg-[#F0E7D6]",
  });

  return { status: "completed", classification, txId };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Generate random transaction data for batch simulation
const NAMES = ["Aditya Sharma", "Priya Patel", "Rahul Gupta", "Sneha Iyer", "Vikram Singh", "Neha Reddy", "Arjun Nair", "Kavita Joshi"];
const BANKS = ["HDFC", "ICICI", "SBI", "Axis", "Kotak"];
const ERROR_CODES = [
  "ISSUING_BANK_DOWNTIME",
  "INSUFFICIENT_FUNDS",
  "SUSPECTED_FRAUD",
  "UPI_APP_TIMEOUT",
  "EXPIRED_CARD",
  "RISK_DECLINE",
  "BANK_UNAVAILABLE",
  "BALANCE_INSUFFICIENT",
];
const METHODS = ["UPI", "Credit Card", "Debit Card", "Netbanking"];

export function generateRandomPayload(): SimulatorPayload {
  const name = NAMES[Math.floor(Math.random() * NAMES.length)];
  const bank = BANKS[Math.floor(Math.random() * BANKS.length)];
  const errorCode = ERROR_CODES[Math.floor(Math.random() * ERROR_CODES.length)];
  const method = METHODS[Math.floor(Math.random() * METHODS.length)];
  const amount = Math.round((Math.random() * 49500 + 500) * 100) / 100;

  return {
    transaction_id: `tx_${Math.random().toString(36).substring(2, 10)}`,
    customer: {
      name,
      email: `${name.toLowerCase().replace(" ", ".")}@example.com`,
      phone: `+91${Math.floor(9000000000 + Math.random() * 999999999)}`,
      type: amount > 10000 ? "B2B" : "B2C",
    },
    payment: {
      amount,
      currency: "INR",
      method,
      bank,
      timestamp: new Date().toISOString(),
      status: "failed",
      error_code: errorCode,
    },
    merchant: {
      id: `mer_${Math.random().toString(36).substring(2, 8)}`,
      name: "Test Merchant",
    },
  };
}

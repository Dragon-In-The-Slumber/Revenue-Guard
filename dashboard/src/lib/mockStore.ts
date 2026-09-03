// In-memory mock data store for self-contained demo mode
// This replaces the need for PostgreSQL + FastAPI backend

export interface AuditEntry {
  agent: string;
  action: string;
  details: string;
  reasoning?: string;
  recommended_action?: string;
  confidence?: string;
  timestamp: Date;
  dotColor: string;
}

export interface TransactionRecord {
  id: string;
  agent: string;
  amount: string;
  status: string;
  statusColor: string;
  dotColor: string;
  borderColor: string;
  createdAt: Date;
}

export interface PolicyRecord {
  id: number;
  agent_name: string;
  policy_text: string;
  created_at: Date;
}

export interface EventRecord {
  agent: string;
  details: string;
  reasoning?: string;
  time: string;
  dot: string;
}

// ─── Singleton Store ───
class MockStore {
  private transactions: TransactionRecord[] = [];
  private auditTrails: Map<string, AuditEntry[]> = new Map();
  private policies: PolicyRecord[] = [];
  private nextPolicyId = 1;

  constructor() {
    this.seed();
  }

  private seed() {
    // Pre-seed with demo policies
    this.policies = [
      {
        id: this.nextPolicyId++,
        agent_name: "Compliance",
        policy_text: "Do not auto-retry transactions above ₹50,000 without human approval.",
        created_at: new Date(Date.now() - 86400000),
      },
      {
        id: this.nextPolicyId++,
        agent_name: "Outreach",
        policy_text: "Always prefer WhatsApp over SMS for customer communication.",
        created_at: new Date(Date.now() - 43200000),
      },
      {
        id: this.nextPolicyId++,
        agent_name: "Diagnostician",
        policy_text: "Flag repeated failures from the same bank within 1 hour as a potential outage.",
        created_at: new Date(Date.now() - 3600000),
      },
    ];

    // Pre-seed with a couple of demo transactions so the dashboard isn't empty
    const demoTxns = [
      {
        id: "tx_demo_001",
        errorCode: "ISSUING_BANK_DOWNTIME",
        amount: 2500,
        bank: "HDFC",
      },
      {
        id: "tx_demo_002",
        errorCode: "INSUFFICIENT_FUNDS",
        amount: 8750,
        bank: "ICICI",
      },
    ];

    for (const tx of demoTxns) {
      const idx = demoTxns.indexOf(tx);
      const isRetryable = ["ISSUING_BANK_DOWNTIME", "BAD_REQUEST_ERROR", "UPI_APP_TIMEOUT"].includes(tx.errorCode);
      const isFraud = tx.errorCode === "SUSPECTED_FRAUD";

      this.transactions.push({
        id: tx.id,
        agent: isRetryable ? "Silent Recovery" : isFraud ? "Compliance" : "Outreach",
        amount: `₹${tx.amount.toLocaleString("en-IN")}`,
        status: isRetryable ? "Gateway Switch Attempted" : isFraud ? "Escalated to Human" : "WhatsApp Message Sent",
        statusColor: isRetryable ? "text-emerald-400" : isFraud ? "text-red-400" : "text-gold",
        dotColor: isRetryable ? "bg-emerald-500" : isFraud ? "bg-red-500" : "bg-[#D9A353]",
        borderColor: isRetryable ? "border-l-emerald-500" : isFraud ? "border-l-red-500" : "border-l-[#D9A353]",
        createdAt: new Date(Date.now() - 60000 * (idx + 1)),
      });

      // Seed audit trails
      const trail: AuditEntry[] = [
        {
          agent: "Orchestrator",
          action: "Webhook Ingested",
          details: `Received payment.failed for ${tx.id}. Amount: ₹${tx.amount}. Bank: ${tx.bank}. Error: ${tx.errorCode}`,
          timestamp: new Date(Date.now() - 65000 * (idx + 1)),
          dotColor: "bg-cyan-500",
        },
        {
          agent: "Diagnostician",
          action: "Failure Diagnosed",
          details: `Cause: ${tx.errorCode} | Bank: ${tx.bank} | Recommended Action: ${isRetryable ? "SILENT_RETRY" : "CUSTOMER_OUTREACH"}`,
          reasoning: isRetryable
            ? `The error code ${tx.errorCode} indicates a temporary infrastructure issue at ${tx.bank}. Historical data shows 94% of these resolve within 15 minutes. Recommending silent gateway switch to maximize recovery probability.`
            : `The error code ${tx.errorCode} indicates a customer-side issue. This requires direct customer engagement to resolve. WhatsApp outreach recommended with a payment retry link.`,
          recommended_action: isRetryable ? "SILENT_RETRY" : "CUSTOMER_OUTREACH",
          timestamp: new Date(Date.now() - 63000 * (idx + 1)),
          dotColor: "bg-cyan-500",
        },
        {
          agent: isRetryable ? "Silent Recovery" : "Outreach",
          action: isRetryable ? "Gateway Switch Attempted" : "WhatsApp Message Sent",
          details: isRetryable
            ? `Switched from ${tx.bank} to Axis Bank gateway. Retry initiated for ₹${tx.amount}.`
            : `Sent personalized WhatsApp message to customer with payment retry link for ₹${tx.amount}.`,
          timestamp: new Date(Date.now() - 61000 * (idx + 1)),
          dotColor: "bg-emerald-500",
        },
        {
          agent: "Compliance",
          action: "Approved",
          details: `Action verified against 3 active policies. No violations detected. Recovery flow completed.`,
          timestamp: new Date(Date.now() - 60000 * (idx + 1)),
          dotColor: "bg-[#F0E7D6]",
        },
      ];
      this.auditTrails.set(tx.id, trail);
    }
  }

  // ─── Transactions / Pipeline ───
  addTransaction(tx: TransactionRecord) {
    this.transactions.unshift(tx);
    if (this.transactions.length > 50) this.transactions.pop();
  }

  getTransactions(limit = 10): TransactionRecord[] {
    return this.transactions.slice(0, limit);
  }

  updateTransactionStatus(txId: string, update: Partial<TransactionRecord>) {
    const tx = this.transactions.find((t) => t.id === txId);
    if (tx) Object.assign(tx, update);
  }

  // ─── Audit Trail ───
  addAuditEntry(txId: string, entry: AuditEntry) {
    if (!this.auditTrails.has(txId)) {
      this.auditTrails.set(txId, []);
    }
    this.auditTrails.get(txId)!.push(entry);
  }

  getAuditTrail(txId: string): AuditEntry[] {
    return this.auditTrails.get(txId) || [];
  }

  // ─── Events (derived from all audit trails) ───
  getRecentEvents(limit = 20): EventRecord[] {
    const allEntries: { txId: string; entry: AuditEntry }[] = [];

    this.auditTrails.forEach((entries, txId) => {
      entries.forEach((entry) => allEntries.push({ txId, entry }));
    });

    allEntries.sort((a, b) => b.entry.timestamp.getTime() - a.entry.timestamp.getTime());

    return allEntries.slice(0, limit).map(({ entry }) => {
      let dot = "bg-emerald-500";
      if (entry.action.includes("Escalated")) dot = "bg-red-500";
      else if (entry.action.includes("Diagnosed")) dot = "bg-cyan-500";
      else if (entry.action.includes("Approved")) dot = "bg-[#F0E7D6]";
      else if (entry.action.includes("Ingested")) dot = "bg-cyan-500";

      return {
        agent: entry.agent,
        details: entry.details.split("\n")[0],
        reasoning: entry.reasoning || undefined,
        time: entry.timestamp.toLocaleTimeString("en-IN", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        dot,
      };
    });
  }

  // ─── Metrics (derived from audit trails) ───
  getMetrics() {
    let silentRecoveries = 0;
    let outreachConversions = 0;
    let escalated = 0;
    let totalRecovered = 0;

    this.auditTrails.forEach((entries) => {
      for (const entry of entries) {
        if (entry.action === "Gateway Switch Attempted") {
          silentRecoveries++;
          totalRecovered += 14500;
        } else if (entry.action === "WhatsApp Message Sent") {
          outreachConversions++;
        } else if (entry.action === "Escalated to Human") {
          escalated++;
        }
      }
    });

    return {
      metrics: [
        {
          label: "Total Recovered",
          value: `₹${totalRecovered.toLocaleString("en-IN")}`,
          change: "Live",
          changeColor: "text-emerald-400",
          subtitle: "based on recent activity",
        },
        {
          label: "Silent Recoveries",
          value: String(silentRecoveries),
          change: "",
          changeColor: "text-gold",
          subtitle: "resolved by agent",
        },
        {
          label: "Outreach Interventions",
          value: String(outreachConversions),
          change: "",
          changeColor: "text-gold",
          subtitle: "initiated via WhatsApp",
        },
        {
          label: "Escalated",
          value: String(escalated),
          change: "",
          changeColor: "text-red-400",
          subtitle: "requires human review",
        },
      ],
    };
  }

  // ─── Policies ───
  getPolicies(agentName?: string): PolicyRecord[] {
    if (agentName) return this.policies.filter((p) => p.agent_name === agentName);
    return [...this.policies];
  }

  addPolicy(agentName: string, policyText: string) {
    this.policies.push({
      id: this.nextPolicyId++,
      agent_name: agentName,
      policy_text: policyText,
      created_at: new Date(),
    });
  }

  deletePolicy(id: number) {
    this.policies = this.policies.filter((p) => p.id !== id);
  }
}

// Global singleton — survives across API route invocations within the same Next.js process
const globalForStore = globalThis as unknown as { mockStore: MockStore };
export const mockStore = globalForStore.mockStore || new MockStore();
globalForStore.mockStore = mockStore;

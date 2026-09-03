import { NextResponse } from 'next/server';
import { mockStore } from '@/lib/mockStore';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ transactionId: string }> }
) {
  const { transactionId } = await params;
  const trail = mockStore.getAuditTrail(transactionId);

  const formattedTrail = trail.map((entry) => {
    let reasoning: string | null = null;
    let recommended_action: string | null = null;
    let details = entry.details;

    if (entry.reasoning) {
      reasoning = entry.reasoning;
    }

    if (entry.recommended_action) {
      recommended_action = entry.recommended_action;
    }

    return {
      agent: entry.agent,
      action: entry.action,
      details,
      reasoning,
      confidence: entry.confidence || null,
      recommended_action,
      time: entry.timestamp.toLocaleTimeString("en-IN", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      dotColor: entry.dotColor,
    };
  });

  return NextResponse.json({ trail: formattedTrail });
}

// POST to add manual audit entries (for Force Escalate / Retry buttons)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ transactionId: string }> }
) {
  const { transactionId } = await params;
  const body = await request.json();

  mockStore.addAuditEntry(transactionId, {
    agent: body.agent || "Manual",
    action: body.action || "Manual Action",
    details: body.details || "",
    timestamp: new Date(),
    dotColor: body.dotColor || "bg-cyan-500",
  });

  if (body.updateTransaction) {
    mockStore.updateTransactionStatus(transactionId, body.updateTransaction);
  }

  return NextResponse.json({ status: "ok" });
}

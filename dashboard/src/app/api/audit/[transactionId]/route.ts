import { NextResponse } from 'next/server';
import { mockStore } from '@/lib/mockStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ transactionId: string }> }
) {
  const resolvedParams = await params;
  const transactionId = resolvedParams.transactionId;

  if (API_URL) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(`${API_URL}/api/audit/${transactionId}`, {
        signal: controller.signal,
        cache: 'no-store',
      });
      clearTimeout(timeout);
      
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch (e) {
      console.warn(`[api/audit] Real API unreachable for ${transactionId}, falling back to mockStore`, e);
    }
  }

  // Fallback
  const trail = mockStore.getAuditTrail(transactionId);
  return NextResponse.json({ trail });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ transactionId: string }> }
) {
  const resolvedParams = await params;
  const transactionId = resolvedParams.transactionId;
  const data = await request.json();

  if (API_URL) {
    try {
      // In a real app, this would hit a POST /api/audit or similar endpoint
      // We'll just pass it through if supported, but for now we'll do both
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      // Let's assume the real API doesn't have a POST /api/audit yet, 
      // so we might just log it or we can add it to the real API later.
      // For now, we'll try it.
      await fetch(`${API_URL}/api/audit/${transactionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        signal: controller.signal,
      });
      clearTimeout(timeout);
    } catch (e) {
      console.warn(`[api/audit] POST Real API unreachable for ${transactionId}`);
    }
  }

  // Always update mockStore as fallback
  mockStore.addAuditEvent(transactionId, data);
  if (data.updateTransaction) {
    mockStore.updateTransaction(transactionId, data.updateTransaction);
  }

  return NextResponse.json({ status: "success" });
}

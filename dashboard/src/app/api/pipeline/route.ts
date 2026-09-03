export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { mockStore } from '@/lib/mockStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export async function GET() {
  if (API_URL) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(`${API_URL}/api/pipeline`, {
        signal: controller.signal,
        cache: 'no-store',
      });
      clearTimeout(timeout);
      
      if (res.ok) {
        const data = await res.json();
        // ALWAYS return real data if API is reachable, even if empty!
        return NextResponse.json(data);
      }
    } catch (e) {
      console.warn('[api/pipeline] Real API unreachable, falling back to mockStore', e);
    }
  }

  // Fallback
  const transactions = mockStore.getTransactions(10);
  return NextResponse.json({ pipeline: transactions });
}

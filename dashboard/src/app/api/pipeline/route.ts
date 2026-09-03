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
        if (data.pipeline && data.pipeline.length > 0) {
          return NextResponse.json(data);
        } else {
          console.warn('[api/pipeline] Real API returned empty pipeline, falling back to mockStore');
        }
      }
    } catch (e) {
      console.warn('[api/pipeline] Real API unreachable, falling back to mockStore', e);
    }
  }

  // Fallback
  const transactions = mockStore.getTransactions(10);
  return NextResponse.json({ pipeline: transactions });
}

import { NextResponse } from 'next/server';
import { mockStore } from '@/lib/mockStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export async function GET() {
  if (API_URL) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(`${API_URL}/api/events`, {
        signal: controller.signal,
        cache: 'no-store',
      });
      clearTimeout(timeout);
      
      if (res.ok) {
        const data = await res.json();
        if (data.events && data.events.length > 0) {
          return NextResponse.json(data);
        } else {
          console.warn('[api/events] Real API returned empty events, falling back to mockStore');
        }
      }
    } catch (e) {
      console.warn('[api/events] Real API unreachable, falling back to mockStore', e);
    }
  }

  // Fallback
  const events = mockStore.getRecentEvents(20);
  return NextResponse.json({ events });
}

import { NextResponse } from 'next/server';
import { mockStore } from '@/lib/mockStore';

export async function GET() {
  const events = mockStore.getRecentEvents(20);
  return NextResponse.json({ events });
}

import { NextResponse } from 'next/server';
import { mockStore } from '@/lib/mockStore';

export async function GET() {
  const transactions = mockStore.getTransactions(10);
  return NextResponse.json({ pipeline: transactions });
}

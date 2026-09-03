import { NextResponse } from 'next/server';
import { mockStore } from '@/lib/mockStore';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const agentName = searchParams.get('agent_name') || undefined;
  const policies = mockStore.getPolicies(agentName);
  return NextResponse.json({ policies });
}

export async function POST(request: Request) {
  const body = await request.json();
  mockStore.addPolicy(body.agent_name, body.policy_text);
  return NextResponse.json({ status: "success", message: "Policy added" });
}

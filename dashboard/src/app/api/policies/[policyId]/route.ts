import { NextResponse } from 'next/server';
import { mockStore } from '@/lib/mockStore';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ policyId: string }> }
) {
  const { policyId } = await params;
  mockStore.deletePolicy(parseInt(policyId, 10));
  return NextResponse.json({ status: "success", message: "Policy deleted" });
}

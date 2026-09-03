import { NextResponse } from 'next/server';
import { simulatePipeline, generateRandomPayload } from '@/lib/mockPipeline';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const count = Math.min(body.count || 5, 10); // max 10 at a time

    const txIds: string[] = [];

    // Fire them with staggered timing
    for (let i = 0; i < count; i++) {
      const payload = generateRandomPayload();
      txIds.push(payload.transaction_id);

      // Stagger each by 800ms
      setTimeout(() => {
        simulatePipeline(payload).catch((err) =>
          console.error("Batch pipeline error:", err)
        );
      }, i * 800);
    }

    return NextResponse.json({
      status: "accepted",
      count,
      transaction_ids: txIds,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    );
  }
}

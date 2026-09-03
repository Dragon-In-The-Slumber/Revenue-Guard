import { NextResponse } from 'next/server';
import { simulatePipeline } from '@/lib/mockPipeline';

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    // Run the simulated pipeline (non-blocking — runs in background via promise)
    // We don't await it so the response returns immediately like the real API
    simulatePipeline(payload).catch((err) =>
      console.error("Pipeline simulation error:", err)
    );

    return NextResponse.json({
      status: "accepted",
      task_id: `sync-${Math.random().toString(36).substring(2, 10)}`,
      transaction_id: payload.transaction_id,
    });
  } catch (error: any) {
    console.error('Trigger Test API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    );
  }
}

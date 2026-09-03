import { NextResponse } from 'next/server';
import { simulatePipeline } from '@/lib/mockPipeline';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    // ─── Try Real Render API First ───────────────────────────────────────
    if (API_URL) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000); // 8s for cold start

        const response = await fetch(`${API_URL}/webhooks/razorpay/payment.failed`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (response.ok) {
          const data = await response.json();
          console.log('[trigger-test] ✅ Real API accepted webhook, Claude is processing...');
          return NextResponse.json({ 
            ...data, 
            mode: 'live',
            message: 'Claude 3.5 Sonnet is now diagnosing this failure'
          });
        }
      } catch (err) {
        console.warn('[trigger-test] ⚠️  Real API unreachable, falling back to mock pipeline:', err);
      }
    }

    // ─── Fallback: In-memory mock pipeline ───────────────────────────────
    console.log('[trigger-test] 🔁 Using mock pipeline (demo mode)');
    
    // Extract transaction_id from either real Razorpay format or synthetic format
    let txId = payload.transaction_id;
    if (!txId && payload?.payload?.payment?.entity?.id) {
      txId = payload.payload.payment.entity.id;
    }
    if (!txId) txId = `tx_mock_${Math.random().toString(36).substring(2, 10)}`;

    // Normalise real Razorpay format into our internal format if needed
    let normalisedPayload = payload;
    if (!payload.customer && payload?.payload?.payment?.entity) {
      const entity = payload.payload.payment.entity;
      normalisedPayload = {
        transaction_id: entity.id,
        customer: {
          name: entity.email?.split('@')[0] || 'Unknown',
          email: entity.email || 'unknown@example.com',
          phone: entity.contact || '+910000000000',
          type: 'B2C',
        },
        payment: {
          amount: entity.amount / 100, // paise → rupees
          currency: entity.currency || 'INR',
          method: entity.method || 'card',
          bank: entity.bank || entity.error_reason?.includes('BANK') ? entity.bank : 'Unknown',
          timestamp: new Date(entity.created_at * 1000).toISOString(),
          status: 'failed',
          error_code: entity.error_reason || entity.error_code || 'UNKNOWN_ERROR',
        },
        merchant: {
          id: payload.account_id || 'mer_unknown',
          name: 'Razorpay Merchant',
        },
      };
    }

    simulatePipeline(normalisedPayload).catch((err) =>
      console.error('[trigger-test] Pipeline error:', err)
    );

    return NextResponse.json({
      status: 'accepted',
      task_id: `mock-${Math.random().toString(36).substring(2, 10)}`,
      transaction_id: txId,
      mode: 'demo',
      message: 'Running simulated AI pipeline (real API unavailable)',
    });

  } catch (error: any) {
    console.error('[trigger-test] Fatal error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    );
  }
}

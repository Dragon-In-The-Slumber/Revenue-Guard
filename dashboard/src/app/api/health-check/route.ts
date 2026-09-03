import { NextResponse } from 'next/server';

export async function GET() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  
  if (!apiUrl) {
    return NextResponse.json({ live: false, mode: 'demo', message: 'No API URL configured' });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${apiUrl}/health`, { 
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeout);

    if (response.ok) {
      return NextResponse.json({ live: true, mode: 'live', url: apiUrl, message: 'Claude 3.5 Sonnet active' });
    }
    return NextResponse.json({ live: false, mode: 'demo', message: 'API returned error' });
  } catch {
    return NextResponse.json({ live: false, mode: 'demo', message: 'API unreachable (cold start or down)' });
  }
}

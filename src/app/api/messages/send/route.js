import { NextResponse } from 'next/server';

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_BASE_URL
  ? `${process.env.N8N_WEBHOOK_BASE_URL}/web-panel-send`
  : 'https://n8n-msg48g4owocwsk8g8cwsgg8k.motomotomasyon.com/webhook/web-panel-send';

export async function POST(request) {
  try {
    const body = await request.json();
    const { contact_id, message, type = 'text' } = body;

    if (!contact_id || !message) {
      return NextResponse.json({ success: false, error: 'contact_id and message are required' }, { status: 400 });
    }

    const userId = request.headers.get('x-user-id') || 1;

    // Route through n8n WF-22 for centralized message handling
    const n8nRes = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contact_id, message, user_id: userId, type }),
    });

    const n8nData = await n8nRes.json();
    return NextResponse.json(n8nData, { status: n8nRes.status });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

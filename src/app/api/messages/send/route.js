import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

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

    // Fire-and-forget to n8n WF-22 — handles WhatsApp send + DB save
    fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contact_id, message, user_id: userId, type }),
    }).catch(err => console.error('n8n webhook error:', err.message));

    // Wait briefly for n8n to process and save to DB
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Read the saved message from DB (n8n saves it)
    const result = await query(`
      SELECT id, message_id, direction, type, content, status, source, timestamp
      FROM messages
      WHERE contact_id = $1 AND direction = 'outgoing' AND source = 'operator'
      ORDER BY timestamp DESC
      LIMIT 1
    `, [contact_id]);

    const savedMessage = result.rows[0];

    if (savedMessage) {
      return NextResponse.json({
        success: true,
        data: savedMessage,
      });
    }

    // n8n might still be processing — return optimistic response
    return NextResponse.json({
      success: true,
      data: {
        id: null,
        message_id: null,
        direction: 'outgoing',
        type,
        content: message,
        status: 'sending',
        source: 'operator',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const userId = request.headers.get('x-user-id') || 1;
    const body = await request.json();
    const { segment, message, template_name } = body;

    if (!segment || (!message && !template_name)) {
      return NextResponse.json({ success: false, error: 'Eksik parametreler.' }, { status: 400 });
    }

    const n8nHost = process.env.N8N_HOST || 'http://localhost:5678';
    const webhookUrl = `${n8nHost}/webhook/broadcast`;

    const n8nResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 'Authorization': `Bearer ${process.env.N8N_API_KEY}` // Header Auth
      },
      body: JSON.stringify({
        user_id: userId,
        segment,
        message,
        template_name
      })
    });

    if (!n8nResponse.ok) {
      throw new Error(`n8n webhook failed with status ${n8nResponse.status}`);
    }

    const data = await n8nResponse.json().catch(() => ({}));

    return NextResponse.json({ success: true, message: 'Kampanya n8n tarafına başarıyla iletildi.', data });
  } catch (error) {
    console.error('Campaigns API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { query, getOne } from '@/lib/db';

export async function POST(request) {
  try {
    const body = await request.json();
    const { contact_id, message, type = 'text' } = body;

    if (!contact_id || !message) {
      return NextResponse.json({ success: false, error: 'contact_id and message are required' }, { status: 400 });
    }

    // Get contact phone
    const contact = await getOne('SELECT phone, name FROM contacts WHERE id = $1', [contact_id]);
    if (!contact) {
      return NextResponse.json({ success: false, error: 'Contact not found' }, { status: 404 });
    }

    // Send via WhatsApp Cloud API (through n8n webhook or directly)
    const waPhoneNumberId = process.env.WA_PHONE_NUMBER_ID;
    const waToken = process.env.WA_ACCESS_TOKEN;

    let waResponse = null;
    let phone = contact.phone.replace(/[^0-9]/g, '');

    if (waPhoneNumberId && waToken) {
      try {
        const res = await fetch(`https://graph.facebook.com/v21.0/${waPhoneNumberId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${waToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: phone,
            type: 'text',
            text: { body: message },
          }),
        });
        waResponse = await res.json();
      } catch (waErr) {
        console.error('WhatsApp API error:', waErr);
      }
    }

    // Save message to DB
    const waMessageId = waResponse?.messages?.[0]?.id || null;
    const status = waResponse?.messages ? 'sent' : 'failed';
    const errorMsg = waResponse?.error?.message || null;
    const userId = request.headers.get('x-user-id') || 1;

    const result = await query(`
      INSERT INTO messages (message_id, user_id, contact_id, direction, type, content, status, source, timestamp, error_message)
      VALUES ($1, $7, $2, 'outgoing', $3, $4, $5, 'operator', NOW(), $6)
      RETURNING id, message_id, direction, type, content, status, source, timestamp
    `, [waMessageId, contact_id, type, message, status, errorMsg, userId]);

    const savedMessage = result.rows[0];

    return NextResponse.json({
      success: true,
      data: savedMessage,
      wa_response: waResponse,
    });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

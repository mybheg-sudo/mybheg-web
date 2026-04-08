import { NextResponse } from 'next/server';
import { getMany, getOne, query } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 100;
    const offset = (page - 1) * limit;

    // Get contact info with Shopify customer data
    const contact = await getOne(`
      SELECT c.*, 
        sc.total_spent, sc.orders_count, sc.email, sc.first_name, sc.last_name,
        sc.verified_email, sc.accepts_marketing,
        CASE WHEN mrl.id IS NOT NULL THEN true ELSE false END AS is_manual_mode
      FROM contacts c
      LEFT JOIN shopify_customers sc ON sc.id = c.shopify_customer_id
      LEFT JOIN manual_response_list mrl ON mrl.contact_id = c.id AND mrl.is_active = TRUE
      WHERE c.id = $1
    `, [id]);

    if (!contact) {
      return NextResponse.json({ success: false, error: 'Contact not found' }, { status: 404 });
    }

    // Get messages with attachments
    const messages = await getMany(`
      SELECT m.id, m.message_id, m.direction, m.type, m.content, m.status, m.source,
        m.template_name, m.button_text, m.button_payload, m.reaction,
        m.reply_to_message_id, m.timestamp, m.error_code, m.error_message,
        m.interactive_type, m.interactive_data,
        ma.id AS attachment_id, ma.type AS attachment_type, ma.url AS attachment_url,
        ma.filename AS attachment_filename, ma.caption AS attachment_caption,
        ma.mime_type AS attachment_mime, ma.thumbnail_url AS attachment_thumbnail
      FROM messages m
      LEFT JOIN message_attachments ma ON ma.message_id = m.id
      WHERE m.contact_id = $1
      ORDER BY m.timestamp ASC
      LIMIT $2 OFFSET $3
    `, [id, limit, offset]);

    // Get recent orders for this contact
    const orders = await getMany(`
      SELECT id, order_name, status, total_price, currency, financial_status,
        fulfillment_status, created_at_shopify
      FROM orders 
      WHERE phone_number = $1
      ORDER BY created_at_shopify DESC
      LIMIT 5
    `, [contact.phone]);

    // Get conversation notes
    const notes = await getMany(`
      SELECT cn.*, u.display_name AS author
      FROM conversation_notes cn
      LEFT JOIN users u ON u.id = cn.user_id
      WHERE cn.contact_id = $1
      ORDER BY cn.created_at DESC
      LIMIT 10
    `, [id]);

    // Mark incoming messages as read
    await query(`
      UPDATE messages SET status = 'read' 
      WHERE contact_id = $1 AND direction = 'incoming' AND status = 'sent'
    `, [id]);

    return NextResponse.json({
      success: true,
      data: { contact, messages, orders, notes }
    });
  } catch (error) {
    console.error('Conversation detail error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

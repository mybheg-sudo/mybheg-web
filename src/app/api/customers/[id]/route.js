import { NextResponse } from 'next/server';
import { getOne, getMany } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    // Contact + Shopify customer data
    const contact = await getOne(`
      SELECT c.*, 
        sc.email, sc.first_name, sc.last_name, sc.total_spent, sc.orders_count,
        sc.accepts_marketing, sc.verified_email, sc.shopify_id,
        (SELECT COUNT(*)::int FROM messages m WHERE m.contact_id = c.id) AS message_count,
        (SELECT MAX(m.timestamp) FROM messages m WHERE m.contact_id = c.id) AS last_message_at
      FROM contacts c
      LEFT JOIN shopify_customers sc ON sc.phone = c.phone
      WHERE c.id = $1
    `, [id]);

    if (!contact) {
      return NextResponse.json({ success: false, error: 'Müşteri bulunamadı' }, { status: 404 });
    }

    // Orders for this customer
    const orders = await getMany(`
      SELECT id, order_name, status, total_price, currency, financial_status,
        fulfillment_status, created_at_shopify,
        COALESCE(
          NULLIF((SELECT COUNT(*)::int FROM order_line_items li WHERE li.order_id = o.id), 0),
          CASE WHEN o.line_items IS NOT NULL THEN jsonb_array_length(o.line_items) ELSE 0 END
        ) AS item_count
      FROM orders o
      WHERE o.phone_number = $1
      ORDER BY o.created_at_shopify DESC
    `, [contact.phone]);

    // Recent messages (last 20)
    const messages = await getMany(`
      SELECT id, direction, type, content, source, status, timestamp, template_name
      FROM messages 
      WHERE contact_id = $1 
      ORDER BY timestamp DESC 
      LIMIT 20
    `, [id]);

    // Tags
    const tags = contact.tags || [];

    return NextResponse.json({
      success: true,
      data: { contact, orders, messages, tags },
    });
  } catch (error) {
    console.error('Customer detail error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Update customer tags
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updates = [];
    const values = [];
    let idx = 1;

    if (body.tags !== undefined) {
      updates.push(`tags = $${idx}::text[]`);
      values.push(body.tags);
      idx++;
    }
    if (body.name !== undefined) {
      updates.push(`name = $${idx}`);
      values.push(body.name);
      idx++;
    }
    if (body.metadata !== undefined) {
      updates.push(`metadata = $${idx}::jsonb`);
      values.push(JSON.stringify(body.metadata));
      idx++;
    }

    if (updates.length === 0) {
      return NextResponse.json({ success: false, error: 'No updates provided' }, { status: 400 });
    }

    values.push(id);
    const { query } = await import('@/lib/db');
    await query(
      `UPDATE contacts SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${idx}`,
      values
    );

    return NextResponse.json({ success: true, message: 'Müşteri güncellendi' });
  } catch (error) {
    console.error('Customer update error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

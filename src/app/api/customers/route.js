import { NextResponse } from 'next/server';
import { getMany, getOne } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const segment = searchParams.get('segment') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 30;
    const offset = (page - 1) * limit;

    const userId = request.headers.get('x-user-id') || 1;
    const params = [limit, offset, userId];
    let whereClause = 'WHERE c.user_id = $3';

    if (search) {
      whereClause += ` AND (c.name ILIKE $${params.length + 1} OR c.phone ILIKE $${params.length + 1} OR sc.email ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }

    // ── Segment filters (unified with n8n WF-18 Journey Tracker) ──
    // VIP: ≥5 orders AND ≥5000 TL | Loyal: ≥3 orders | Returning: ≥1 order
    if (segment === 'vip') {
      whereClause += ` AND sc.orders_count >= 5 AND sc.total_spent >= 5000`;
    } else if (segment === 'loyal') {
      whereClause += ` AND sc.orders_count >= 3 AND NOT (sc.orders_count >= 5 AND sc.total_spent >= 5000)`;
    } else if (segment === 'returning') {
      whereClause += ` AND sc.orders_count >= 1 AND sc.orders_count < 3`;
    } else if (segment === 'new') {
      whereClause += ` AND (sc.orders_count IS NULL OR sc.orders_count < 1)`;
    }

    const customers = await getMany(`
      SELECT 
        c.id, c.name, c.phone, c.tags, c.metadata, c.created_at, c.updated_at,
        sc.email, sc.first_name, sc.last_name, sc.total_spent, sc.orders_count,
        sc.accepts_marketing, sc.verified_email,
        (SELECT COUNT(*)::int FROM messages m WHERE m.contact_id = c.id) AS message_count,
        (SELECT MAX(m.timestamp) FROM messages m WHERE m.contact_id = c.id) AS message_timestamp,
        CASE 
          WHEN sc.orders_count >= 5 AND sc.total_spent >= 5000 THEN 'vip'
          WHEN sc.orders_count >= 3 THEN 'loyal'
          WHEN sc.orders_count >= 1 THEN 'returning'
          ELSE 'new'
        END AS segment
      FROM contacts c
      LEFT JOIN shopify_customers sc ON sc.phone = c.phone
      ${whereClause}
      ORDER BY c.updated_at DESC
      LIMIT $1 OFFSET $2
    `, params);

    const countParams = [userId];
    let countWhere = 'WHERE c.user_id = $1';
    if (search) {
      countParams.push(`%${search}%`);
      countWhere += ` AND (c.name ILIKE $${countParams.length} OR c.phone ILIKE $${countParams.length} OR sc.email ILIKE $${countParams.length})`;
    }
    if (segment === 'vip') countWhere += ` AND sc.orders_count >= 5 AND sc.total_spent >= 5000`;
    else if (segment === 'loyal') countWhere += ` AND sc.orders_count >= 3 AND NOT (sc.orders_count >= 5 AND sc.total_spent >= 5000)`;
    else if (segment === 'returning') countWhere += ` AND sc.orders_count >= 1 AND sc.orders_count < 3`;
    else if (segment === 'new') countWhere += ` AND (sc.orders_count IS NULL OR sc.orders_count < 1)`;
    
    const total = await getOne(`SELECT COUNT(*)::int as count FROM contacts c LEFT JOIN shopify_customers sc ON sc.phone = c.phone ${countWhere}`, countParams);

    return NextResponse.json({
      success: true,
      data: customers,
      pagination: { page, limit, total: parseInt(total?.count || 0) },
    });
  } catch (error) {
    console.error('Customers API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

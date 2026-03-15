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

    const params = [limit, offset];
    let whereClause = 'WHERE 1=1';

    if (search) {
      whereClause += ` AND (c.name ILIKE $${params.length + 1} OR c.phone ILIKE $${params.length + 1} OR sc.email ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }

    if (segment === 'vip') {
      whereClause += ` AND sc.total_spent > 5000`;
    } else if (segment === 'returning') {
      whereClause += ` AND sc.orders_count > 1`;
    } else if (segment === 'new') {
      whereClause += ` AND (sc.orders_count IS NULL OR sc.orders_count <= 1)`;
    }

    const customers = await getMany(`
      SELECT 
        c.id, c.name, c.phone, c.tags, c.metadata, c.created_at, c.updated_at,
        sc.email, sc.first_name, sc.last_name, sc.total_spent, sc.orders_count,
        sc.accepts_marketing, sc.verified_email,
        (SELECT COUNT(*)::int FROM messages m WHERE m.contact_id = c.id) AS message_count,
        (SELECT MAX(m.timestamp) FROM messages m WHERE m.contact_id = c.id) AS last_message_at,
        CASE 
          WHEN sc.total_spent > 5000 THEN 'vip'
          WHEN sc.orders_count > 3 THEN 'loyal'
          WHEN sc.orders_count > 1 THEN 'returning'
          ELSE 'new'
        END AS segment
      FROM contacts c
      LEFT JOIN shopify_customers sc ON sc.phone = c.phone
      ${whereClause}
      ORDER BY c.updated_at DESC
      LIMIT $1 OFFSET $2
    `, params);

    const total = await getOne(`SELECT COUNT(*)::int as count FROM contacts c LEFT JOIN shopify_customers sc ON sc.phone = c.phone ${whereClause.replace(/\$\d+/g, (m) => { const idx = parseInt(m.slice(1)) - 1; return params[idx] ? `'${params[idx]}'` : m; })}`);

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

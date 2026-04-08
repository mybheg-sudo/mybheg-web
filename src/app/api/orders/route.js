import { NextResponse } from 'next/server';
import { getMany, getOne } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'ALL';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 30;
    const offset = (page - 1) * limit;

    const allowedSorts = ['order_name', 'customer_name', 'total_price', 'status', 'created_at_shopify'];
    const sort = searchParams.get('sort') || 'created_at_shopify';
    const dir = searchParams.get('dir') || 'desc';

    // orders tablosunda user_id kolonu yok — tüm siparişleri listele
    const params = [limit, offset];
    
    let statusClause = '';
    if (status !== 'ALL') {
      statusClause = `AND o.status = $${params.length + 1}`;
      params.push(status);
    }

    let searchClause = '';
    if (search) {
      searchClause = `AND (o.order_name ILIKE $${params.length + 1} OR o.customer_name ILIKE $${params.length + 1} OR o.phone_number ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }

    let dateClause = '';
    const dateFrom = searchParams.get('from');
    const dateTo = searchParams.get('to');
    if (dateFrom) {
      dateClause += ` AND o.created_at_shopify >= $${params.length + 1}`;
      params.push(dateFrom);
    }
    if (dateTo) {
      dateClause += ` AND o.created_at_shopify < ($${params.length + 1}::date + INTERVAL '1 day')`;
      params.push(dateTo);
    }

    const orders = await getMany(`
      SELECT o.id, o.order_name, o.customer_name, o.phone_number, o.email,
        o.total_price, o.currency, o.status, o.financial_status, o.fulfillment_status,
        o.first_message_sent, o.reminder_sent, o.shopify_tags, o.created_at_shopify,
        COALESCE(
          NULLIF((SELECT COUNT(*)::int FROM order_line_items li WHERE li.order_id = o.id), 0),
          CASE WHEN o.line_items IS NOT NULL THEN jsonb_array_length(o.line_items) ELSE 0 END
        ) AS item_count
      FROM orders o
      WHERE 1=1 ${statusClause} ${searchClause} ${dateClause}
      ORDER BY o.${allowedSorts.includes(sort) ? sort : 'created_at_shopify'} ${dir === 'asc' ? 'ASC' : 'DESC'} NULLS LAST
      LIMIT $1 OFFSET $2
    `, params);

    // Count total for pagination — must include ALL active filters
    let countQuery = `SELECT COUNT(*)::int as count FROM orders o WHERE 1=1`;
    let countParams = [];
    if (status !== 'ALL') {
      countParams.push(status);
      countQuery += ` AND o.status = $${countParams.length}`;
    }
    if (search) {
      countParams.push(`%${search}%`);
      countQuery += ` AND (o.order_name ILIKE $${countParams.length} OR o.customer_name ILIKE $${countParams.length} OR o.phone_number ILIKE $${countParams.length})`;
    }
    const dateFrom = searchParams.get('from');
    const dateTo = searchParams.get('to');
    if (dateFrom) {
      countParams.push(dateFrom);
      countQuery += ` AND o.created_at_shopify >= $${countParams.length}`;
    }
    if (dateTo) {
      countParams.push(dateTo);
      countQuery += ` AND o.created_at_shopify < ($${countParams.length}::date + INTERVAL '1 day')`;
    }
    const total = await getOne(countQuery, countParams);

    return NextResponse.json({
      success: true,
      data: orders,
      pagination: { page, limit, total: total?.count || 0 },
    });
  } catch (error) {
    console.error('Orders API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getMany, getOne } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 30;
    const offset = (page - 1) * limit;

    const params = [limit, offset];
    let whereClause = 'WHERE 1=1';

    if (status !== 'all') {
      whereClause += ` AND p.status = $${params.length + 1}`;
      params.push(status);
    }

    if (search) {
      whereClause += ` AND (p.title ILIKE $${params.length + 1} OR p.vendor ILIKE $${params.length + 1} OR p.product_type ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }

    const products = await getMany(`
      SELECT p.id, p.shopify_product_id, p.title, p.vendor, p.product_type, p.status,
        p.tags, p.published_at, p.updated_at,
        (SELECT COUNT(*)::int FROM shopify_product_variants v WHERE v.product_id = p.id) AS variant_count,
        (SELECT MIN(price)::numeric FROM shopify_product_variants v WHERE v.product_id = p.id) AS min_price,
        (SELECT MAX(price)::numeric FROM shopify_product_variants v WHERE v.product_id = p.id) AS max_price,
        (SELECT SUM(inventory_quantity)::int FROM shopify_product_variants v WHERE v.product_id = p.id) AS total_stock,
        (SELECT src FROM shopify_product_images si WHERE si.product_id = p.id AND si.position = 1 LIMIT 1) AS image_url
      FROM shopify_products p
      ${whereClause}
      ORDER BY p.updated_at DESC NULLS LAST
      LIMIT $1 OFFSET $2
    `, params);

    const total = await getOne(`SELECT COUNT(*)::int as count FROM shopify_products p ${whereClause.replace(/\$\d+/g, (m) => params[parseInt(m.slice(1)) - 1] ? `'${params[parseInt(m.slice(1)) - 1]}'` : m)}`);

    return NextResponse.json({
      success: true,
      data: products,
      pagination: { page, limit, total: parseInt(total?.count || 0) },
    });
  } catch (error) {
    console.error('Products API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

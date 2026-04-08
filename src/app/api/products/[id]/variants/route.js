import { NextResponse } from 'next/server';
import { getMany } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const variants = await getMany(`
      SELECT id, title, price, compare_at_price, sku, inventory_quantity,
        option1, option2, option3, weight, weight_unit
      FROM shopify_product_variants
      WHERE product_id = $1
      ORDER BY position ASC
    `, [id]);

    return NextResponse.json({ success: true, data: variants });
  } catch (error) {
    console.error('Variants API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

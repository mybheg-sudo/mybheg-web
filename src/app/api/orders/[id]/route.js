import { NextResponse } from 'next/server';
import { getOne, getMany, query } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const order = await getOne(`
      SELECT o.*, 
        c.name as contact_name
      FROM orders o
      LEFT JOIN contacts c ON c.phone = o.phone_number
      WHERE o.id = $1
    `, [id]);

    if (!order) {
      return NextResponse.json({ success: false, error: 'Sipariş bulunamadı' }, { status: 404 });
    }

    const [lineItems, fulfillments, statusLogs] = await Promise.all([
      getMany(`
        SELECT * FROM order_line_items WHERE order_id = $1 ORDER BY id
      `, [id]),
      getMany(`
        SELECT * FROM order_fulfillments WHERE order_id = $1 ORDER BY created_at DESC
      `, [id]),
      getMany(`
        SELECT * FROM order_status_logs WHERE order_id = $1 ORDER BY created_at DESC LIMIT 20
      `, [id]),
    ]);

    return NextResponse.json({
      success: true,
      data: { ...order, line_items: lineItems, fulfillments, status_logs: statusLogs },
    });
  } catch (error) {
    console.error('Order detail error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Update order status
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const { status } = await request.json();

    // Get old status BEFORE updating
    const old = await getOne(`SELECT status FROM orders WHERE id = $1`, [id]);

    await query(`
      INSERT INTO order_status_logs (order_id, old_status, new_status, changed_by, source)
      VALUES ($1, $2, $3, 'operator', 'web_panel')
    `, [id, old?.status || 'UNKNOWN', status]);

    await query(`
      UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2
    `, [status, id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Order status update error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

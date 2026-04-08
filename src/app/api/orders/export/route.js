import { NextResponse } from 'next/server';
import { getMany } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'ALL';
    const dateFrom = searchParams.get('from');
    const dateTo = searchParams.get('to');

    const params = [];
    let where = 'WHERE 1=1';

    if (status !== 'ALL') {
      where += ` AND o.status = $${params.length + 1}`;
      params.push(status);
    }
    if (dateFrom) {
      where += ` AND o.created_at_shopify >= $${params.length + 1}`;
      params.push(dateFrom);
    }
    if (dateTo) {
      where += ` AND o.created_at_shopify < ($${params.length + 1}::date + INTERVAL '1 day')`;
      params.push(dateTo);
    }

    const orders = await getMany(`
      SELECT o.order_name, o.customer_name, o.phone_number, o.email,
        o.total_price, o.currency, o.status, o.financial_status, o.fulfillment_status,
        o.created_at_shopify, o.shipping_address
      FROM orders o
      ${where}
      ORDER BY o.created_at_shopify DESC
      LIMIT 5000
    `, params);

    // Build CSV
    const headers = ['Sipariş No', 'Müşteri', 'Telefon', 'E-posta', 'Tutar', 'Para Birimi', 'Durum', 'Ödeme', 'Kargo', 'Tarih', 'Adres'];
    const rows = orders.map(o => {
      let addr = '';
      if (o.shipping_address) {
        try {
          const a = typeof o.shipping_address === 'string' ? JSON.parse(o.shipping_address) : o.shipping_address;
          addr = [a.city, a.province, a.country].filter(Boolean).join(', ');
        } catch(e) {}
      }
      return [
        o.order_name || '',
        (o.customer_name || '').replace(/"/g, '""'),
        o.phone_number || '',
        o.email || '',
        o.total_price || '',
        o.currency || 'TRY',
        o.status || '',
        o.financial_status || '',
        o.fulfillment_status || '',
        o.created_at_shopify ? new Date(o.created_at_shopify).toLocaleString('tr-TR') : '',
        addr,
      ];
    });

    // BOM for Turkish chars in Excel
    const bom = '\uFEFF';
    const csv = bom + [headers.join(';'), ...rows.map(r => r.map(c => `"${c}"`).join(';'))].join('\n');

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="siparisler_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

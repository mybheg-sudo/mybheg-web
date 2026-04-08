import { NextResponse } from 'next/server';
import { getMany } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = request.headers.get('x-user-id') || 1;

    const customers = await getMany(`
      SELECT c.name, c.phone_number, c.email, c.city, c.tags,
        c.created_at, c.last_message_at,
        COALESCE(ss.orders_count, 0) as orders_count,
        COALESCE(ss.total_spent, 0) as total_spent
      FROM contacts c
      LEFT JOIN shopify_customers sc ON sc.phone = c.phone_number
      LEFT JOIN shopify_customer_stats ss ON ss.customer_id = sc.id
      WHERE c.user_id = $1
      ORDER BY c.last_message_at DESC NULLS LAST
      LIMIT 5000
    `, [userId]);

    const headers = ['Ad Soyad', 'Telefon', 'E-posta', 'Şehir', 'Etiketler', 'Kayıt Tarihi', 'Son Mesaj', 'Sipariş Sayısı', 'Toplam Harcama'];
    const rows = customers.map(c => [
      (c.name || '').replace(/"/g, '""'),
      c.phone_number || '',
      c.email || '',
      c.city || '',
      (Array.isArray(c.tags) ? c.tags.join(', ') : c.tags || ''),
      c.created_at ? new Date(c.created_at).toLocaleDateString('tr-TR') : '',
      c.last_message_at ? new Date(c.last_message_at).toLocaleDateString('tr-TR') : '',
      c.orders_count || 0,
      c.total_spent || 0,
    ]);

    const bom = '\uFEFF';
    const csv = bom + [headers.join(';'), ...rows.map(r => r.map(c => `"${c}"`).join(';'))].join('\n');

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="musteriler_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Customer export error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

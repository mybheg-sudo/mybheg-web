import { NextResponse } from 'next/server';
import { getMany } from '@/lib/db';

export async function GET(request) {
  try {
    const userId = request.headers.get('x-user-id') || 1;

    const customers = await getMany(`
      SELECT c.name, c.phone, c.tags, c.created_at,
        sc.email, sc.first_name, sc.last_name,
        COALESCE(sc.orders_count, 0) as orders_count,
        COALESCE(sc.total_spent, 0) as total_spent,
        sc.accepts_marketing,
        sc.default_address
      FROM contacts c
      LEFT JOIN shopify_customers sc ON sc.phone = c.phone
      WHERE c.user_id = $1
      ORDER BY c.updated_at DESC NULLS LAST
      LIMIT 5000
    `, [userId]);

    const headers = ['Ad Soyad', 'Telefon', 'E-posta', 'Etiketler', 'Kayıt Tarihi', 'Sipariş Sayısı', 'Toplam Harcama', 'Şehir', 'Pazarlama'];
    const rows = customers.map(c => {
      let city = '';
      if (c.default_address) {
        try {
          const a = typeof c.default_address === 'string' ? JSON.parse(c.default_address) : c.default_address;
          city = a.city || a.province || '';
        } catch(e) {}
      }
      return [
        (c.name || `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'İsimsiz').replace(/"/g, '""'),
        c.phone || '',
        c.email || '',
        (Array.isArray(c.tags) ? c.tags.join(', ') : c.tags || ''),
        c.created_at ? new Date(c.created_at).toLocaleDateString('tr-TR') : '',
        c.orders_count || 0,
        c.total_spent || 0,
        city,
        c.accepts_marketing ? 'Evet' : 'Hayır',
      ];
    });

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

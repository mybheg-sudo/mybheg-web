import { NextResponse } from 'next/server';
import { getMany, getOne, query } from '@/lib/db';

// GET /api/settings — Tüm ayarları getir
export async function GET(request) {
  try {
    const userId = request.headers.get('x-user-id') || 1;
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    if (category) {
      const row = await getOne(
        'SELECT settings FROM app_settings WHERE user_id = $1 AND category = $2',
        [userId, category]
      );
      return NextResponse.json({
        success: true,
        data: row?.settings || {},
      });
    }

    const rows = await getMany(
      'SELECT category, settings, updated_at FROM app_settings WHERE user_id = $1',
      [userId]
    );

    const settings = {};
    rows.forEach(row => {
      settings[row.category] = row.settings;
    });

    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error('Settings GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT /api/settings — Kategori bazlı ayar güncelle
export async function PUT(request) {
  try {
    const userId = request.headers.get('x-user-id') || 1;
    const body = await request.json();
    const { category, settings } = body;

    if (!category || !settings) {
      return NextResponse.json(
        { success: false, error: 'category and settings are required' },
        { status: 400 }
      );
    }

    const validCategories = ['general', 'whatsapp', 'notifications', 'integrations', 'ai'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { success: false, error: `Invalid category. Valid: ${validCategories.join(', ')}` },
        { status: 400 }
      );
    }

    await query(`
      INSERT INTO app_settings (user_id, category, settings, updated_at)
      VALUES ($1, $2, $3::jsonb, NOW())
      ON CONFLICT (user_id, category)
      DO UPDATE SET settings = $3::jsonb, updated_at = NOW()
    `, [userId, category, JSON.stringify(settings)]);

    return NextResponse.json({ success: true, message: 'Ayarlar kaydedildi' });
  } catch (error) {
    console.error('Settings PUT error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

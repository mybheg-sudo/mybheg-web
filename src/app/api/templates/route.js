import { NextResponse } from 'next/server';
import { getMany } from '@/lib/db';

export async function GET() {
  try {
    const templates = await getMany(`
      SELECT id, name, language, category, status, components,
        created_at, updated_at
      FROM message_templates
      WHERE is_active = TRUE
      ORDER BY updated_at DESC
    `);

    return NextResponse.json({ success: true, data: templates });
  } catch (error) {
    console.error('Templates API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

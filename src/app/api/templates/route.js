import { NextResponse } from 'next/server';
import { getMany } from '@/lib/db';

export async function GET() {
  try {
    const templates = await getMany(`
      SELECT id, name, language, category, status,
        header_type, header_content, body_text, footer_text, buttons,
        variables, meta_template_id, created_at, updated_at
      FROM message_templates
      ORDER BY updated_at DESC
    `);

    return NextResponse.json({ success: true, data: templates });
  } catch (error) {
    console.error('Templates API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

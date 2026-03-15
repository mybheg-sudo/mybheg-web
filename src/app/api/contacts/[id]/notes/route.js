import { NextResponse } from 'next/server';
import { query, getOne } from '@/lib/db';

// Add note
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const { note, operator_name } = await request.json();

    if (!note) {
      return NextResponse.json({ success: false, error: 'Not içeriği gerekli' }, { status: 400 });
    }

    await query(`
      INSERT INTO conversation_notes (contact_id, operator_name, note)
      VALUES ($1, $2, $3)
    `, [id, operator_name || 'Operator', note]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Note error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Update contact tags
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const { tags } = await request.json();

    await query(`UPDATE contacts SET tags = $1, updated_at = NOW() WHERE id = $2`, [tags, id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Tags error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

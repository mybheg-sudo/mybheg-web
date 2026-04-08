import { NextResponse } from 'next/server';
import { getOne } from '@/lib/db';

export async function GET(request) {
  try {
    const userId = request.headers.get('x-user-id') || 1;

    const result = await getOne(`
      SELECT COUNT(DISTINCT m.contact_id)::int as count
      FROM messages m
      JOIN contacts c ON c.id = m.contact_id
      WHERE c.user_id = $1 AND m.direction = 'incoming' AND m.status = 'sent'
    `, [userId]);

    return NextResponse.json({ success: true, count: result?.count || 0 });
  } catch (error) {
    console.error('Unread count error:', error);
    return NextResponse.json({ success: true, count: 0 });
  }
}

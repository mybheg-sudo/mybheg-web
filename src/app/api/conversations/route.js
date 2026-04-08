import { NextResponse } from 'next/server';
import { getMany } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const filter = searchParams.get('filter') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 50;
    const offset = (page - 1) * limit;
    const userId = request.headers.get('x-user-id') || 1;

    let filterClause = '';
    if (filter === 'unread') {
      filterClause = `AND EXISTS (
        SELECT 1 FROM messages m2 
        WHERE m2.contact_id = c.id AND m2.direction = 'incoming' AND m2.status = 'sent'
      )`;
    } else if (filter === 'ai') {
      filterClause = `AND EXISTS (
        SELECT 1 FROM messages m2 
        WHERE m2.contact_id = c.id AND m2.source = 'ai'
      )`;
    } else if (filter === 'pending') {
      filterClause = `AND EXISTS (
        SELECT 1 FROM orders o 
        WHERE o.phone_number = c.phone AND o.status = 'PENDING'
      )`;
    } else if (filter === 'manual') {
      filterClause = `AND EXISTS (
        SELECT 1 FROM manual_response_list mrl 
        WHERE mrl.contact_id = c.id AND mrl.is_active = TRUE
      )`;
    }

    let searchClause = '';
    const params = [limit, offset, userId];
    if (search) {
      searchClause = `AND (c.name ILIKE $4 OR c.phone ILIKE $4)`;
      params.push(`%${search}%`);
    }

    const conversations = await getMany(`
      SELECT 
        c.id, c.name, c.phone, c.tags, c.metadata, c.updated_at,
        last_msg.content AS last_message,
        last_msg.direction AS last_direction,
        last_msg.timestamp AS message_timestamp,
        last_msg.type AS last_msg_type,
        last_msg.source AS last_msg_source,
        last_msg.template_name AS last_template,
        last_msg.button_text AS last_button_text,
        COALESCE(unread.count, 0)::int AS unread_count,
        CASE WHEN mrl.id IS NOT NULL THEN true ELSE false END AS is_manual_mode
      FROM contacts c
      LEFT JOIN LATERAL (
        SELECT content, direction, timestamp, type, source, template_name, button_text
        FROM messages 
        WHERE contact_id = c.id 
        ORDER BY timestamp DESC LIMIT 1
      ) last_msg ON TRUE
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS count 
        FROM messages 
        WHERE contact_id = c.id AND direction = 'incoming' AND status = 'sent'
      ) unread ON TRUE
      LEFT JOIN manual_response_list mrl ON mrl.contact_id = c.id AND mrl.is_active = TRUE
      WHERE c.user_id = $3 ${filterClause} ${searchClause}
      ORDER BY last_msg.timestamp DESC NULLS LAST
      LIMIT $1 OFFSET $2
    `, params);

    return NextResponse.json({ success: true, data: conversations });
  } catch (error) {
    console.error('Conversations API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

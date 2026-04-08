import { NextResponse } from 'next/server';
import { getMany, getOne, query } from '@/lib/db';
import bcrypt from 'bcryptjs';

// GET — List all users
export async function GET() {
  try {
    const users = await getMany(`
      SELECT id, username, display_name, system_phone, role, is_active, created_at, updated_at
      FROM users ORDER BY id ASC
    `);
    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    console.error('Users list error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST — Create new user
export async function POST(request) {
  try {
    const { username, password, display_name, system_phone, role } = await request.json();

    if (!username || !password || !display_name) {
      return NextResponse.json({ success: false, error: 'Zorunlu alanlar eksik' }, { status: 400 });
    }

    const existing = await getOne(`SELECT id FROM users WHERE username = $1`, [username]);
    if (existing) {
      return NextResponse.json({ success: false, error: 'Bu kullanıcı adı zaten mevcut' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await getOne(`
      INSERT INTO users (username, password, display_name, system_phone, role, is_active)
      VALUES ($1, $2, $3, $4, $5, TRUE)
      RETURNING id, username, display_name, role
    `, [username, hashedPassword, display_name, system_phone || '', role || 'operator']);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('User create error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

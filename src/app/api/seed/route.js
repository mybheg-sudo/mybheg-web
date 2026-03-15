import { NextResponse } from 'next/server';
import { query, getOne } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  // Simple protection
  if (secret !== 'mybheg-seed-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const hash = await bcrypt.hash('developer2026', 10);
    
    const result = await query(`
      INSERT INTO users (username, password, display_name, system_phone, role, is_active)
      VALUES ($1, $2, $3, $4, $5, TRUE)
      ON CONFLICT (username) DO UPDATE SET 
        password = $2, display_name = $3, role = $5, is_active = TRUE
      RETURNING id, username, display_name, role, is_active
    `, ['developer', hash, 'Developer', '+905551234567', 'admin']);

    return NextResponse.json({
      success: true,
      user: result.rows[0],
      login: { username: 'developer', password: 'developer2026' },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

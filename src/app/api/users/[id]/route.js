import { NextResponse } from 'next/server';
import { getOne, query } from '@/lib/db';
import bcrypt from 'bcryptjs';

// PUT — Update user (role, active status, password)
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const user = await getOne(`SELECT id FROM users WHERE id = $1`, [id]);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Kullanıcı bulunamadı' }, { status: 404 });
    }

    // Update role
    if (body.role) {
      await query(`UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2`, [body.role, id]);
    }

    // Update active status
    if (body.is_active !== undefined) {
      await query(`UPDATE users SET is_active = $1, updated_at = NOW() WHERE id = $2`, [body.is_active, id]);
    }

    // Update display name
    if (body.display_name) {
      await query(`UPDATE users SET display_name = $1, updated_at = NOW() WHERE id = $2`, [body.display_name, id]);
    }

    // Update password
    if (body.password) {
      const hashed = await bcrypt.hash(body.password, 10);
      await query(`UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2`, [hashed, id]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('User update error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE — Delete user
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    // Prevent deleting the last admin
    const adminCount = await getOne(`SELECT COUNT(*) as count FROM users WHERE role = 'admin' AND is_active = TRUE`);
    const user = await getOne(`SELECT role FROM users WHERE id = $1`, [id]);

    if (user?.role === 'admin' && parseInt(adminCount.count) <= 1) {
      return NextResponse.json({ success: false, error: 'Son admin kullanıcı silinemez' }, { status: 400 });
    }

    await query(`DELETE FROM users WHERE id = $1`, [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('User delete error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

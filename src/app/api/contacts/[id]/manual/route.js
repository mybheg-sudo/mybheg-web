import { NextResponse } from 'next/server';
import { query, getOne } from '@/lib/db';

// Toggle manual mode (add/remove from manual_response_list)
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const { manual } = await request.json();

    const contact = await getOne(`SELECT phone FROM contacts WHERE id = $1`, [id]);
    if (!contact) {
      return NextResponse.json({ success: false, error: 'Contact not found' }, { status: 404 });
    }

    if (manual) {
      // Add to manual response list (or reactivate if previously deactivated)
      await query(`
        INSERT INTO manual_response_list (contact_id, added_by, reason, is_active, updated_at)
        VALUES ($1, 'web_panel', 'Operatör tarafından manuel moda alındı', TRUE, NOW())
        ON CONFLICT (contact_id) DO UPDATE SET is_active = TRUE, updated_at = NOW(), added_by = 'web_panel'
      `, [id]);
    } else {
      // Deactivate from manual response list
      await query(`
        UPDATE manual_response_list SET is_active = FALSE, updated_at = NOW() WHERE contact_id = $1
      `, [id]);
    }

    return NextResponse.json({ success: true, manual });
  } catch (error) {
    console.error('Manual mode error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

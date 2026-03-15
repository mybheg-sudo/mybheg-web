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
      // Add to manual response list
      await query(`
        INSERT INTO manual_response_list (phone_number, added_by, reason)
        VALUES ($1, 'web_panel', 'Operatör tarafından manuel moda alındı')
        ON CONFLICT (phone_number) DO NOTHING
      `, [contact.phone]);
    } else {
      // Remove from manual response list
      await query(`
        DELETE FROM manual_response_list WHERE phone_number = $1
      `, [contact.phone]);
    }

    return NextResponse.json({ success: true, manual });
  } catch (error) {
    console.error('Manual mode error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

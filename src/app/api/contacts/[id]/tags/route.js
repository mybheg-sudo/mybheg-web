import { NextResponse } from 'next/server';
import { query, getOne } from '@/lib/db';

// System tags managed by n8n WF-18 (Journey Tracker) — these are preserved during operator edits
const SYSTEM_TAGS = [
  'shopify_customer', 'vip', 'loyal', 'returning', 'engaged', 'new_customer',
  'high_value', 'churning', 'active', 'inactive', 'first_order', 'repeat_buyer'
];

// Update contact tags (merge strategy: preserve system tags + apply custom tags)
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const { tags } = await request.json();

    // Get current tags to preserve system ones
    const contact = await getOne('SELECT tags FROM contacts WHERE id = $1', [id]);
    const currentTags = contact?.tags || [];

    // Keep system tags that already exist on the contact
    const preservedSystemTags = currentTags.filter(t => SYSTEM_TAGS.includes(t));

    // Merge: system tags (preserved) + operator's custom tags (no duplicates)
    const customTags = (tags || []).filter(t => !SYSTEM_TAGS.includes(t));
    const mergedTags = [...new Set([...preservedSystemTags, ...customTags])];

    await query('UPDATE contacts SET tags = $1, updated_at = NOW() WHERE id = $2', [mergedTags, id]);

    return NextResponse.json({ success: true, data: { tags: mergedTags, preserved_system_tags: preservedSystemTags } });
  } catch (error) {
    console.error('Tags error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { query, getOne } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const contactId = formData.get('contact_id');
    const caption = formData.get('caption') || '';

    if (!file || !contactId) {
      return NextResponse.json({ success: false, error: 'Dosya ve contact_id gerekli' }, { status: 400 });
    }

    // Verify contact exists
    const contact = await getOne(`SELECT phone FROM contacts WHERE id = $1`, [contactId]);
    if (!contact) {
      return NextResponse.json({ success: false, error: 'Kişi bulunamadı' }, { status: 404 });
    }

    // Determine attachment type
    const mimeType = file.type || '';
    let attachmentType = 'document';
    if (mimeType.startsWith('image/')) attachmentType = 'image';
    else if (mimeType.startsWith('video/')) attachmentType = 'video';
    else if (mimeType.startsWith('audio/')) attachmentType = 'audio';

    // Save file to uploads directory
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadsDir, { recursive: true });

    const ext = path.extname(file.name) || '.bin';
    const filename = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
    const filePath = path.join(uploadsDir, filename);

    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    const fileUrl = `/uploads/${filename}`;

    // 1. Insert message record
    const msgResult = await query(`
      INSERT INTO messages (contact_id, direction, type, content, source, status, timestamp)
      VALUES ($1, 'outgoing', $2, $3, 'operator', 'sent', NOW())
      RETURNING id
    `, [contactId, attachmentType, caption || file.name]);

    const messageId = msgResult.rows?.[0]?.id;

    // 2. Insert into message_attachments (proper schema)
    if (messageId) {
      await query(`
        INSERT INTO message_attachments (message_id, type, mime_type, url, filename, file_size, caption)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [messageId, attachmentType, mimeType, fileUrl, file.name, file.size, caption || null]);
    }

    return NextResponse.json({
      success: true,
      data: {
        id: messageId,
        type: attachmentType,
        url: fileUrl,
        filename: file.name,
      },
    });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

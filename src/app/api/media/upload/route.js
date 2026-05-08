import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const MEDIA_DIR = process.env.MEDIA_STORAGE_PATH || '/app/uploads/media';

export async function POST(request) {
  try {
    const body = await request.json();
    const { data, filename, mime_type, message_id } = body;

    if (!data || !filename) {
      return NextResponse.json({ success: false, error: 'data and filename required' }, { status: 400 });
    }

    // Ensure directory exists
    if (!existsSync(MEDIA_DIR)) {
      await mkdir(MEDIA_DIR, { recursive: true });
    }

    // Sanitize filename
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = path.join(MEDIA_DIR, safeName);

    // Decode base64 and write
    const buffer = Buffer.from(data, 'base64');
    await writeFile(filePath, buffer);

    const mediaUrl = `/api/media/${safeName}`;

    return NextResponse.json({
      success: true,
      url: mediaUrl,
      filename: safeName,
      size: buffer.length,
    });
  } catch (error) {
    console.error('Media upload error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

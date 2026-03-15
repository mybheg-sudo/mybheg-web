import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }
    return NextResponse.json({ success: true, user: session });
  } catch {
    return NextResponse.json({ success: false, error: 'Auth check failed' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { authenticateUser, generateToken } from '@/lib/auth';
import { checkRateLimit, recordFailedAttempt, resetAttempts } from '@/lib/rateLimit';

export async function POST(request) {
  try {
    // Rate limiting — IP bazlı
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown';

    const rateCheck = checkRateLimit(ip);
    if (!rateCheck.allowed) {
      return NextResponse.json({
        success: false,
        error: `Çok fazla başarısız deneme. ${rateCheck.remainingMin} dakika sonra tekrar deneyin.`,
      }, { status: 429 });
    }

    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ success: false, error: 'Kullanıcı adı ve şifre gerekli' }, { status: 400 });
    }

    const user = await authenticateUser(username, password);
    if (!user) {
      recordFailedAttempt(ip);
      return NextResponse.json({ success: false, error: 'Geçersiz kullanıcı adı veya şifre' }, { status: 401 });
    }

    // Başarılı giriş — sayaç sıfırla
    resetAttempts(ip);

    const token = generateToken(user);

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, username: user.username, role: user.role, display_name: user.display_name },
    });

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ success: false, error: 'Giriş başarısız' }, { status: 500 });
  }
}

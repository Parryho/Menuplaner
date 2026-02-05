export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    const correctPassword = process.env.AUTH_PASSWORD;

    if (!correctPassword) {
      console.error('AUTH_PASSWORD not set in environment');
      return NextResponse.json(
        { error: 'Server nicht konfiguriert' },
        { status: 500 }
      );
    }

    if (password !== correctPassword) {
      return NextResponse.json(
        { error: 'Falsches Passwort' },
        { status: 401 }
      );
    }

    const authSecret = process.env.AUTH_SECRET || 'menuplaner-default-secret';
    const isProduction = process.env.NODE_ENV === 'production';

    const response = NextResponse.json({ ok: true });
    response.cookies.set('auth-token', authSecret, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: 'Ungültige Anfrage' },
      { status: 400 }
    );
  }
}

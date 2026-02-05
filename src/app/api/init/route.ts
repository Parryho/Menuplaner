export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { seedDatabase, reseedDatabase } from '@/lib/seed';

let initialized = false;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reseed = searchParams.get('reseed');

    // Reseed requires INIT_SECRET in production
    if (reseed === '1') {
      if (process.env.NODE_ENV === 'production') {
        const secret = searchParams.get('secret');
        if (!secret || secret !== process.env.INIT_SECRET) {
          return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 });
        }
      }
      reseedDatabase();
      initialized = true;
      return NextResponse.json({ ok: true, action: 'reseeded' });
    }

    if (!initialized) {
      seedDatabase();
      initialized = true;
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('GET /api/init error:', err);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

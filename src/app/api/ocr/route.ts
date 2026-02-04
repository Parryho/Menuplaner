export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';

function ensureDb() {
  seedDatabase();
}

// Save OCR-extracted guest counts
export async function POST(request: NextRequest) {
  try {
    ensureDb();
    const db = getDb();
    const body = await request.json();
    const { date, location, meal_type, count } = body;

    if (!date || !location || !meal_type || count === undefined) {
      return NextResponse.json({ error: 'Alle Felder erforderlich' }, { status: 400 });
    }

    const result = db.prepare(
      'INSERT INTO guest_counts (date, location, meal_type, count, source) VALUES (?, ?, ?, ?, ?)'
    ).run(date, location, meal_type, count, 'ocr');

    return NextResponse.json({ id: result.lastInsertRowid });
  } catch (err) {
    console.error('POST /api/ocr error:', err);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    ensureDb();
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    const from = searchParams.get('from');
    const to = searchParams.get('to');

    let counts;
    if (from && to) {
      counts = db.prepare('SELECT * FROM guest_counts WHERE date >= ? AND date <= ? ORDER BY date, location, meal_type').all(from, to);
    } else if (date) {
      counts = db.prepare('SELECT * FROM guest_counts WHERE date = ? ORDER BY location, meal_type').all(date);
    } else {
      counts = db.prepare('SELECT * FROM guest_counts ORDER BY date DESC LIMIT 100').all();
    }
    return NextResponse.json(counts);
  } catch (err) {
    console.error('GET /api/ocr error:', err);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

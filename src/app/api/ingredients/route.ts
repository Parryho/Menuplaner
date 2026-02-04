export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';

function ensureDb() {
  seedDatabase();
}

export async function GET(request: NextRequest) {
  try {
    ensureDb();
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    let sql = 'SELECT * FROM ingredients WHERE 1=1';
    const params: string[] = [];

    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }
    if (search) {
      sql += ' AND name LIKE ?';
      params.push(`%${search}%`);
    }

    sql += ' ORDER BY category, name';
    const ingredients = db.prepare(sql).all(...params);
    return NextResponse.json(ingredients);
  } catch (err) {
    console.error('GET /api/ingredients error:', err);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  ensureDb();
  const db = getDb();
  const body = await request.json();
  const { name, category, unit, price_per_unit, price_unit, supplier } = body;

  if (!name || !category || !unit) {
    return NextResponse.json({ error: 'Name, Kategorie und Einheit erforderlich' }, { status: 400 });
  }

  try {
    const result = db.prepare(
      'INSERT INTO ingredients (name, category, unit, price_per_unit, price_unit, supplier) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(name, category, unit, price_per_unit || 0, price_unit || 'kg', supplier || '');

    return NextResponse.json({ id: result.lastInsertRowid, name, category, unit, price_per_unit, price_unit, supplier });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unbekannter Fehler';
    if (msg.includes('UNIQUE')) {
      return NextResponse.json({ error: 'Zutat existiert bereits' }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    ensureDb();
    const db = getDb();
    const body = await request.json();
    const { id, name, category, unit, price_per_unit, price_unit, supplier } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID erforderlich' }, { status: 400 });
    }

    db.prepare(
      'UPDATE ingredients SET name = ?, category = ?, unit = ?, price_per_unit = ?, price_unit = ?, supplier = ? WHERE id = ?'
    ).run(name, category, unit, price_per_unit || 0, price_unit || 'kg', supplier || '', id);

    return NextResponse.json({ id, name, category, unit, price_per_unit, price_unit, supplier });
  } catch (err) {
    console.error('PUT /api/ingredients error:', err);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    ensureDb();
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID erforderlich' }, { status: 400 });
    }

    db.prepare('DELETE FROM ingredients WHERE id = ?').run(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/ingredients error:', err);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

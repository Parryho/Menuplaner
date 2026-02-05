export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    let dishes;
    if (category) {
      dishes = db.prepare('SELECT * FROM dishes WHERE category = ? ORDER BY name').all(category);
    } else {
      dishes = db.prepare('SELECT * FROM dishes ORDER BY category, name').all();
    }
    return NextResponse.json(dishes);
  } catch (err) {
    console.error('GET /api/dishes error:', err);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    const { name, category, allergens, season } = body;

    if (!name || !category) {
      return NextResponse.json({ error: 'Name und Kategorie erforderlich' }, { status: 400 });
    }

    const result = db.prepare(
      'INSERT INTO dishes (name, category, allergens, season) VALUES (?, ?, ?, ?)'
    ).run(name, category, allergens || '', season || 'all');

    return NextResponse.json({ id: result.lastInsertRowid, name, category, allergens, season });
  } catch (err) {
    console.error('POST /api/dishes error:', err);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    const { id, name, category, allergens, season } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID erforderlich' }, { status: 400 });
    }

    db.prepare(
      'UPDATE dishes SET name = ?, category = ?, allergens = ?, season = ? WHERE id = ?'
    ).run(name, category, allergens || '', season || 'all', id);

    return NextResponse.json({ id, name, category, allergens, season });
  } catch (err) {
    console.error('PUT /api/dishes error:', err);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID erforderlich' }, { status: 400 });
    }

    db.prepare('DELETE FROM dishes WHERE id = ?').run(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/dishes error:', err);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';

function ensureDb() {
  seedDatabase();
}

export async function GET(request: NextRequest) {
  ensureDb();
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
}

export async function POST(request: NextRequest) {
  ensureDb();
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
}

export async function PUT(request: NextRequest) {
  ensureDb();
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
}

export async function DELETE(request: NextRequest) {
  ensureDb();
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID erforderlich' }, { status: 400 });
  }

  db.prepare('DELETE FROM dishes WHERE id = ?').run(id);
  return NextResponse.json({ ok: true });
}

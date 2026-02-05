export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const dishId = searchParams.get('dishId');

    if (!dishId) {
      return NextResponse.json({ error: 'dishId erforderlich' }, { status: 400 });
    }

    const items = db.prepare(`
      SELECT ri.id, ri.dish_id, ri.ingredient_id, ri.quantity, ri.unit, ri.preparation_note, ri.sort_order,
             i.name as ingredient_name, i.category as ingredient_category,
             i.price_per_unit, i.price_unit
      FROM recipe_items ri
      JOIN ingredients i ON ri.ingredient_id = i.id
      WHERE ri.dish_id = ?
      ORDER BY ri.sort_order
    `).all(dishId);

    const dish = db.prepare(
      'SELECT id, name, prep_instructions, prep_time_minutes FROM dishes WHERE id = ?'
    ).get(dishId) as { id: number; name: string; prep_instructions: string; prep_time_minutes: number } | undefined;

    return NextResponse.json({ dish, items });
  } catch (err) {
    console.error('GET /api/recipes error:', err);
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
    const { dish_id, ingredient_id, quantity, unit, preparation_note } = body;

    if (!dish_id || !ingredient_id || !quantity || !unit) {
      return NextResponse.json({ error: 'dish_id, ingredient_id, quantity und unit erforderlich' }, { status: 400 });
    }

    // Get max sort_order for this dish
    const maxOrder = db.prepare(
      'SELECT COALESCE(MAX(sort_order), -1) as max_order FROM recipe_items WHERE dish_id = ?'
    ).get(dish_id) as { max_order: number };

    const result = db.prepare(
      'INSERT INTO recipe_items (dish_id, ingredient_id, quantity, unit, preparation_note, sort_order) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(dish_id, ingredient_id, quantity, unit, preparation_note || '', maxOrder.max_order + 1);

    return NextResponse.json({ id: result.lastInsertRowid });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unbekannter Fehler';
    if (msg.includes('UNIQUE')) {
      return NextResponse.json({ error: 'Zutat bereits im Rezept' }, { status: 409 });
    }
    console.error('POST /api/recipes error:', e);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();

    // Update recipe item
    if (body.id) {
      const { id, quantity, unit, preparation_note } = body;
      db.prepare(
        'UPDATE recipe_items SET quantity = ?, unit = ?, preparation_note = ? WHERE id = ?'
      ).run(quantity, unit, preparation_note || '', id);
      return NextResponse.json({ ok: true });
    }

    // Update dish prep instructions
    if (body.dish_id && body.prep_instructions !== undefined) {
      const { dish_id, prep_instructions, prep_time_minutes } = body;
      db.prepare(
        'UPDATE dishes SET prep_instructions = ?, prep_time_minutes = ? WHERE id = ?'
      ).run(prep_instructions || '', prep_time_minutes || 0, dish_id);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Ungültige Anfrage' }, { status: 400 });
  } catch (err) {
    console.error('PUT /api/recipes error:', err);
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

    db.prepare('DELETE FROM recipe_items WHERE id = ?').run(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/recipes error:', err);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

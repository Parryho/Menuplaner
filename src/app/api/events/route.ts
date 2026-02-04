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
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const id = searchParams.get('id');

    // Single event with menu items
    if (id) {
      const event = db.prepare('SELECT * FROM ak_events WHERE id = ?').get(id);
      if (!event) return NextResponse.json({ error: 'Event nicht gefunden' }, { status: 404 });

      const menuItems = db.prepare(`
        SELECT mi.*, d.name as dish_name, d.allergens as dish_allergens, d.category as dish_category
        FROM ak_event_menu_items mi
        LEFT JOIN dishes d ON mi.dish_id = d.id
        WHERE mi.event_id = ?
        ORDER BY mi.category, mi.sort_order
      `).all(id);

      return NextResponse.json({ ...(event as Record<string, unknown>), menu_items: menuItems });
    }

    let events;
    if (from && to) {
      events = db.prepare('SELECT * FROM ak_events WHERE date BETWEEN ? AND ? ORDER BY date, time_start').all(from, to);
    } else {
      events = db.prepare('SELECT * FROM ak_events ORDER BY date ASC, time_start ASC').all();
    }
    return NextResponse.json(events);
  } catch (err) {
    console.error('GET /api/events error:', err);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    ensureDb();
    const db = getDb();
    const body = await request.json();
    const { date, event_type, pax, time_start, time_end, contact_person, room, description, menu_notes, status } = body;

    if (!date || !event_type) {
      return NextResponse.json({ error: 'Datum und Eventtyp erforderlich' }, { status: 400 });
    }

    const VALID_TYPES = ['brunch', 'ball', 'buffet', 'bankett', 'empfang', 'seminar', 'sonstiges'];
    if (!VALID_TYPES.includes(event_type)) {
      return NextResponse.json({ error: 'Ungültiger Eventtyp' }, { status: 400 });
    }

    const result = db.prepare(
      'INSERT INTO ak_events (date, event_type, pax, time_start, time_end, contact_person, room, description, menu_notes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(date, event_type, pax || 0, time_start || '', time_end || '', contact_person || '', room || '', description || '', menu_notes || '', status || 'geplant');

    return NextResponse.json({ id: result.lastInsertRowid });
  } catch (err) {
    console.error('POST /api/events error:', err);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    ensureDb();
    const db = getDb();
    const body = await request.json();
    const { id, date, event_type, pax, time_start, time_end, contact_person, room, description, menu_notes, status } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID erforderlich' }, { status: 400 });
    }

    db.prepare(
      'UPDATE ak_events SET date = ?, event_type = ?, pax = ?, time_start = ?, time_end = ?, contact_person = ?, room = ?, description = ?, menu_notes = ?, status = ? WHERE id = ?'
    ).run(date, event_type, pax || 0, time_start || '', time_end || '', contact_person || '', room || '', description || '', menu_notes || '', status || 'geplant', id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('PUT /api/events error:', err);
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

    db.prepare('DELETE FROM ak_events WHERE id = ?').run(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/events error:', err);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

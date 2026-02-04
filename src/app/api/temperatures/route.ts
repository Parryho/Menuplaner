export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';

function ensureDb() {
  seedDatabase();
}

// GET temperatures for a specific weekly plan
export async function GET(request: NextRequest) {
  try {
    ensureDb();
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const week = searchParams.get('week');
    const location = searchParams.get('location');
    const meal = searchParams.get('meal');
    const dayOfWeek = searchParams.get('day');

    if (!year || !week) {
      return NextResponse.json({ error: 'year und week erforderlich' }, { status: 400 });
    }

    let query = `
      SELECT tl.*, wp.day_of_week, wp.meal, wp.location
      FROM temperature_logs tl
      JOIN weekly_plans wp ON tl.plan_id = wp.id
      WHERE wp.year = ? AND wp.calendar_week = ?
    `;
    const params: (string | number)[] = [parseInt(year), parseInt(week)];

    if (location) {
      query += ' AND wp.location = ?';
      params.push(location);
    }
    if (meal) {
      query += ' AND wp.meal = ?';
      params.push(meal);
    }
    if (dayOfWeek !== null && dayOfWeek !== undefined) {
      query += ' AND wp.day_of_week = ?';
      params.push(parseInt(dayOfWeek));
    }

    const rows = db.prepare(query).all(...params);
    return NextResponse.json(rows);
  } catch (err) {
    console.error('GET /api/temperatures error:', err);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

// POST (save/update) a temperature reading
export async function POST(request: NextRequest) {
  try {
    ensureDb();
    const db = getDb();
    const body = await request.json();
    const { year, calendarWeek, dayOfWeek, meal, location, dishSlot, tempCore, tempServing } = body;

    if (!year || !calendarWeek || dayOfWeek === undefined || !meal || !location || !dishSlot) {
      return NextResponse.json({ error: 'Alle Felder erforderlich' }, { status: 400 });
    }

    // Validate dishSlot
    const VALID_SLOTS = ['soup', 'main1', 'side1a', 'side1b', 'main2', 'side2a', 'side2b', 'dessert'];
    if (!VALID_SLOTS.includes(dishSlot)) {
      return NextResponse.json({ error: 'Ungültiger Slot' }, { status: 400 });
    }

    // Find the plan_id
    const plan = db.prepare(
      'SELECT id FROM weekly_plans WHERE year = ? AND calendar_week = ? AND day_of_week = ? AND meal = ? AND location = ?'
    ).get(year, calendarWeek, dayOfWeek, meal, location) as { id: number } | undefined;

    if (!plan) {
      return NextResponse.json({ error: 'Kein Plan gefunden' }, { status: 404 });
    }

    // Upsert: check if entry exists
    const existing = db.prepare(
      'SELECT id FROM temperature_logs WHERE plan_id = ? AND dish_slot = ?'
    ).get(plan.id, dishSlot) as { id: number } | undefined;

    if (existing) {
      db.prepare(
        'UPDATE temperature_logs SET temp_core = ?, temp_serving = ?, recorded_at = datetime(\'now\') WHERE id = ?'
      ).run(tempCore || '', tempServing || '', existing.id);
    } else {
      db.prepare(
        'INSERT INTO temperature_logs (plan_id, dish_slot, temp_core, temp_serving) VALUES (?, ?, ?, ?)'
      ).run(plan.id, dishSlot, tempCore || '', tempServing || '');
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('POST /api/temperatures error:', err);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

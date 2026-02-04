export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';
import { getRotationWeek, getWeeklyPlan, generateWeekFromRotation } from '@/lib/rotation';

function ensureDb() {
  seedDatabase();
}

export async function GET(request: NextRequest) {
  try {
    ensureDb();
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const week = parseInt(searchParams.get('week') || '1');
    const rotationWeek = searchParams.get('rotation');

    // If requesting rotation template
    if (rotationWeek) {
      const plan = getRotationWeek(parseInt(rotationWeek));
      return NextResponse.json(plan);
    }

    // Try to get existing weekly plan
    let plan = getWeeklyPlan(year, week);

    // If no plan exists, determine rotation week and generate
    if (!plan) {
      const rotWeekNr = ((week - 1) % 6) + 1;
      generateWeekFromRotation(year, week, rotWeekNr);
      plan = getWeeklyPlan(year, week);
    }

    return NextResponse.json(plan);
  } catch (err) {
    console.error('GET /api/plans error:', err);
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
    const { year, calendarWeek, dayOfWeek, meal, location, slot, dishId } = body;

    if (!year || !calendarWeek || dayOfWeek === undefined || !meal || !location || !slot) {
      return NextResponse.json({ error: 'Alle Felder erforderlich' }, { status: 400 });
    }

    // Ensure plan exists
    const plan = getWeeklyPlan(year, calendarWeek);
    if (!plan) {
      const rotWeekNr = ((calendarWeek - 1) % 6) + 1;
      generateWeekFromRotation(year, calendarWeek, rotWeekNr);
    }

    // Whitelist slot names to prevent SQL injection
    const VALID_SLOTS = ['soup', 'main1', 'side1a', 'side1b', 'main2', 'side2a', 'side2b', 'dessert'];
    if (!VALID_SLOTS.includes(slot)) {
      return NextResponse.json({ error: 'Ungültiger Slot' }, { status: 400 });
    }
    const column = `${slot}_id`;
    db.prepare(
      `UPDATE weekly_plans SET ${column} = ? WHERE year = ? AND calendar_week = ? AND day_of_week = ? AND meal = ? AND location = ?`
    ).run(dishId || null, year, calendarWeek, dayOfWeek, meal, location);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('PUT /api/plans error:', err);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    ensureDb();
    const body = await request.json();
    const { year, calendarWeek, rotationWeekNr } = body;

    if (!year || !calendarWeek || !rotationWeekNr) {
      return NextResponse.json({ error: 'year, calendarWeek und rotationWeekNr erforderlich' }, { status: 400 });
    }

    generateWeekFromRotation(year, calendarWeek, rotationWeekNr);
    const plan = getWeeklyPlan(year, calendarWeek);
    return NextResponse.json(plan);
  } catch (err) {
    console.error('POST /api/plans error:', err);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

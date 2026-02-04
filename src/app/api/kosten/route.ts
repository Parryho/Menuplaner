export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';
import { calculateCost } from '@/lib/units';

type Unit = 'g' | 'kg' | 'ml' | 'l' | 'stueck';

function ensureDb() {
  seedDatabase();
}

interface PlanRow {
  day_of_week: number;
  meal: string;
  location: string;
  soup_id: number | null;
  main1_id: number | null;
  side1a_id: number | null;
  side1b_id: number | null;
  main2_id: number | null;
  side2a_id: number | null;
  side2b_id: number | null;
  dessert_id: number | null;
}

const SLOT_NAMES = ['soup', 'main1', 'side1a', 'side1b', 'main2', 'side2a', 'side2b', 'dessert'] as const;
const DEFAULT_PAX: Record<string, number> = { city: 60, sued: 45 };

export async function GET(request: NextRequest) {
  try {
    ensureDb();
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const dishId = searchParams.get('dishId');

    // Single dish cost calculation
    if (dishId) {
    const items = db.prepare(`
      SELECT ri.quantity, ri.unit, i.name, i.price_per_unit, i.price_unit
      FROM recipe_items ri
      JOIN ingredients i ON ri.ingredient_id = i.id
      WHERE ri.dish_id = ?
      ORDER BY ri.sort_order
    `).all(parseInt(dishId)) as Array<{
      quantity: number; unit: string; name: string; price_per_unit: number; price_unit: string;
    }>;

    const ingredients = items.map(item => ({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      cost: calculateCost(item.quantity, item.unit as Unit, item.price_per_unit, item.price_unit as Unit),
    }));

    const totalPerPortion = ingredients.reduce((sum, i) => sum + i.cost, 0);

    return NextResponse.json({
      dish_id: parseInt(dishId),
      cost_per_portion: Math.round(totalPerPortion * 100) / 100,
      ingredients,
    });
  }

  // Weekly cost overview
  const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));
  const week = parseInt(searchParams.get('week') || '1');

  const plans = db.prepare(
    'SELECT * FROM weekly_plans WHERE year = ? AND calendar_week = ?'
  ).all(year, week) as PlanRow[];

  // Guest counts
  const guestCounts = db.prepare(
    'SELECT date, location, meal_type, count FROM guest_counts WHERE date LIKE ?'
  ).all(`${year}-%`) as Array<{ date: string; location: string; meal_type: string; count: number }>;

  const guestLookup: Record<string, number> = {};
  for (const gc of guestCounts) {
    const d = new Date(gc.date);
    const dow = d.getDay();
    guestLookup[`${dow}-${gc.location}-${gc.meal_type}`] = gc.count;
  }

  // Collect all dish IDs
  const allDishIds = new Set<number>();
  for (const plan of plans) {
    for (const slot of SLOT_NAMES) {
      const id = plan[`${slot}_id` as keyof PlanRow] as number | null;
      if (id) allDishIds.add(id);
    }
  }

  // Recipe costs per dish (per portion)
  const dishCosts: Record<number, number> = {};
  const dishNames: Record<number, string> = {};

  if (allDishIds.size > 0) {
    const ids = [...allDishIds];
    const placeholders = ids.map(() => '?').join(',');
    const rows = db.prepare(`
      SELECT ri.dish_id, ri.quantity, ri.unit, i.price_per_unit, i.price_unit
      FROM recipe_items ri
      JOIN ingredients i ON ri.ingredient_id = i.id
      WHERE ri.dish_id IN (${placeholders})
    `).all(...ids) as Array<{
      dish_id: number; quantity: number; unit: string; price_per_unit: number; price_unit: string;
    }>;

    for (const r of rows) {
      const cost = calculateCost(r.quantity, r.unit as Unit, r.price_per_unit, r.price_unit as Unit);
      dishCosts[r.dish_id] = (dishCosts[r.dish_id] || 0) + cost;
    }

    const nameRows = db.prepare(`SELECT id, name FROM dishes WHERE id IN (${placeholders})`).all(...ids) as Array<{ id: number; name: string }>;
    for (const n of nameRows) dishNames[n.id] = n.name;
  }

  // Build day-by-day breakdown
  const days: Array<{
    day_of_week: number;
    meals: Array<{
      meal: string;
      location: string;
      pax: number;
      dishes: Array<{ name: string; cost_per_portion: number; total_cost: number }>;
      total_cost: number;
      cost_per_guest: number;
    }>;
    day_total: number;
    day_pax: number;
  }> = [];

  // Group plans by day
  const dayMap: Record<number, PlanRow[]> = {};
  for (const plan of plans) {
    if (!dayMap[plan.day_of_week]) dayMap[plan.day_of_week] = [];
    dayMap[plan.day_of_week].push(plan);
  }

  let weekTotal = 0;
  let weekPax = 0;

  for (const [dow, dayPlans] of Object.entries(dayMap)) {
    const meals: typeof days[0]['meals'] = [];
    let dayTotal = 0;
    let dayPax = 0;

    for (const plan of dayPlans) {
      const pax = guestLookup[`${plan.day_of_week}-${plan.location}-${plan.meal}`]
        || DEFAULT_PAX[plan.location] || 50;

      const dishes: Array<{ name: string; cost_per_portion: number; total_cost: number }> = [];
      let mealTotal = 0;

      for (const slot of SLOT_NAMES) {
        const did = plan[`${slot}_id` as keyof PlanRow] as number | null;
        if (!did) continue;
        const costPP = dishCosts[did] || 0;
        const totalCost = costPP * pax;
        dishes.push({
          name: dishNames[did] || `#${did}`,
          cost_per_portion: Math.round(costPP * 100) / 100,
          total_cost: Math.round(totalCost * 100) / 100,
        });
        mealTotal += totalCost;
      }

      meals.push({
        meal: plan.meal,
        location: plan.location,
        pax,
        dishes,
        total_cost: Math.round(mealTotal * 100) / 100,
        cost_per_guest: pax > 0 ? Math.round((mealTotal / pax) * 100) / 100 : 0,
      });

      dayTotal += mealTotal;
      dayPax += pax;
    }

    days.push({
      day_of_week: parseInt(dow),
      meals: meals.sort((a, b) => a.meal.localeCompare(b.meal) || a.location.localeCompare(b.location)),
      day_total: Math.round(dayTotal * 100) / 100,
      day_pax: dayPax,
    });

    weekTotal += dayTotal;
    weekPax += dayPax;
  }

  days.sort((a, b) => a.day_of_week - b.day_of_week);

  const activeDays = days.filter(d => d.day_total > 0).length || 1;

  return NextResponse.json({
    year,
    week,
    summary: {
      week_total: Math.round(weekTotal * 100) / 100,
      avg_per_day: Math.round((weekTotal / activeDays) * 100) / 100,
      avg_per_guest: weekPax > 0 ? Math.round((weekTotal / weekPax) * 100) / 100 : 0,
      total_pax: weekPax,
    },
    days,
  });
  } catch (err) {
    console.error('GET /api/kosten error:', err);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

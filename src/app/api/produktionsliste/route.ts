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

interface RecipeItemRow {
  ingredient_name: string;
  ingredient_category: string;
  quantity: number;
  unit: string;
  preparation_note: string;
  price_per_unit: number;
  price_unit: string;
}

const SLOT_NAMES = ['soup', 'main1', 'side1a', 'side1b', 'main2', 'side2a', 'side2b', 'dessert'] as const;
const DEFAULT_PAX: Record<string, number> = { city: 60, sued: 45 };

export async function GET(request: NextRequest) {
  try {
    ensureDb();
    const db = getDb();
  const { searchParams } = new URL(request.url);
  const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));
  const week = parseInt(searchParams.get('week') || '1');
  const dayParam = searchParams.get('day');

  // Get plans for this week
  let planSql = `SELECT * FROM weekly_plans WHERE year = ? AND calendar_week = ?`;
  const planParams: (number | string)[] = [year, week];
  if (dayParam !== null) {
    planSql += ' AND day_of_week = ?';
    planParams.push(parseInt(dayParam));
  }
  const plans = db.prepare(planSql).all(...planParams) as PlanRow[];

  // Get guest counts for this week
  const guestCounts = db.prepare(`
    SELECT date, location, meal_type, count FROM guest_counts
    WHERE date LIKE ?
  `).all(`${year}-%`) as Array<{ date: string; location: string; meal_type: string; count: number }>;

  // Build guest count lookup by day_of_week + location + meal
  const guestLookup: Record<string, number> = {};
  for (const gc of guestCounts) {
    const d = new Date(gc.date);
    const dow = d.getDay();
    guestLookup[`${dow}-${gc.location}-${gc.meal_type}`] = gc.count;
  }

  // Get recipe items for all dishes referenced in plans
  const dishIds = new Set<number>();
  for (const plan of plans) {
    for (const slot of SLOT_NAMES) {
      const id = plan[`${slot}_id` as keyof PlanRow] as number | null;
      if (id) dishIds.add(id);
    }
  }

  // Dish name + recipe items lookup
  const dishLookup: Record<number, string> = {};
  const recipeLookup: Record<number, RecipeItemRow[]> = {};
  if (dishIds.size > 0) {
    const dishIdArr = [...dishIds];
    const dishPlaceholders = dishIdArr.map(() => '?').join(',');
    const dishRows = db.prepare(
      `SELECT id, name FROM dishes WHERE id IN (${dishPlaceholders})`
    ).all(...dishIdArr) as Array<{ id: number; name: string }>;
    for (const d of dishRows) dishLookup[d.id] = d.name;

    const recipeRows = db.prepare(`
      SELECT ri.dish_id, i.name as ingredient_name, i.category as ingredient_category,
             ri.quantity, ri.unit, ri.preparation_note,
             i.price_per_unit, i.price_unit
      FROM recipe_items ri
      JOIN ingredients i ON ri.ingredient_id = i.id
      WHERE ri.dish_id IN (${dishPlaceholders})
      ORDER BY ri.sort_order
    `).all(...dishIdArr) as (RecipeItemRow & { dish_id: number })[];
    for (const r of recipeRows) {
      if (!recipeLookup[r.dish_id]) recipeLookup[r.dish_id] = [];
      recipeLookup[r.dish_id].push(r);
    }
  }

  // Build production list
  const result: Array<{
    day_of_week: number;
    meal: string;
    location: string;
    pax: number;
    dishes: Array<{
      slot: string;
      dish_name: string;
      dish_id: number;
      ingredients: Array<{
        name: string;
        quantity_per_portion: number;
        total_quantity: number;
        unit: string;
        preparation_note: string;
        cost: number;
      }>;
    }>;
  }> = [];

  for (const plan of plans) {
    const pax = guestLookup[`${plan.day_of_week}-${plan.location}-${plan.meal}`]
      || DEFAULT_PAX[plan.location] || 50;

    const dishes: typeof result[0]['dishes'] = [];

    for (const slot of SLOT_NAMES) {
      const dishId = plan[`${slot}_id` as keyof PlanRow] as number | null;
      if (!dishId) continue;

      const items = recipeLookup[dishId] || [];
      dishes.push({
        slot,
        dish_name: dishLookup[dishId] || `Gericht #${dishId}`,
        dish_id: dishId,
        ingredients: items.map(item => ({
          name: item.ingredient_name,
          quantity_per_portion: item.quantity,
          total_quantity: item.quantity * pax,
          unit: item.unit,
          preparation_note: item.preparation_note,
          cost: calculateCost(item.quantity * pax, item.unit as Unit, item.price_per_unit, item.price_unit as Unit),
        })),
      });
    }

    result.push({
      day_of_week: plan.day_of_week,
      meal: plan.meal,
      location: plan.location,
      pax,
      dishes,
    });
  }

  // Sort by day, meal, location
  result.sort((a, b) => a.day_of_week - b.day_of_week || a.meal.localeCompare(b.meal) || a.location.localeCompare(b.location));

    return NextResponse.json({ year, week, production: result });
  } catch (err) {
    console.error('GET /api/produktionsliste error:', err);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

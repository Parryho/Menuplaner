export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { calculateCost, convertUnit } from '@/lib/units';

type Unit = 'g' | 'kg' | 'ml' | 'l' | 'stueck';

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
    const db = getDb();
  const { searchParams } = new URL(request.url);
  const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));
  const week = parseInt(searchParams.get('week') || '1');

  // Get all plans for this week
  const plans = db.prepare(
    'SELECT * FROM weekly_plans WHERE year = ? AND calendar_week = ?'
  ).all(year, week) as PlanRow[];

  // Guest counts (simplified lookup)
  const guestCounts = db.prepare(`
    SELECT date, location, meal_type, count FROM guest_counts WHERE date LIKE ?
  `).all(`${year}-%`) as Array<{ date: string; location: string; meal_type: string; count: number }>;

  const guestLookup: Record<string, number> = {};
  for (const gc of guestCounts) {
    const d = new Date(gc.date);
    const dow = d.getDay();
    guestLookup[`${dow}-${gc.location}-${gc.meal_type}`] = gc.count;
  }

  // Collect all dish IDs with their PAX
  const dishPax: Array<{ dish_id: number; pax: number }> = [];
  for (const plan of plans) {
    const pax = guestLookup[`${plan.day_of_week}-${plan.location}-${plan.meal}`]
      || DEFAULT_PAX[plan.location] || 50;
    for (const slot of SLOT_NAMES) {
      const dishId = plan[`${slot}_id` as keyof PlanRow] as number | null;
      if (dishId) dishPax.push({ dish_id: dishId, pax });
    }
  }

  // Get recipe items for all dishes
  const uniqueDishIds = [...new Set(dishPax.map(d => d.dish_id))];
  if (uniqueDishIds.length === 0) {
    return NextResponse.json({ year, week, categories: [], grandTotal: 0 });
  }

  const recipeRows = db.prepare(`
    SELECT ri.dish_id, ri.ingredient_id, ri.quantity, ri.unit,
           i.name, i.category, i.price_per_unit, i.price_unit, i.supplier
    FROM recipe_items ri
    JOIN ingredients i ON ri.ingredient_id = i.id
    WHERE ri.dish_id IN (${uniqueDishIds.map(() => '?').join(',')})
  `).all(...uniqueDishIds) as Array<{
    dish_id: number; ingredient_id: number; quantity: number; unit: string;
    name: string; category: string; price_per_unit: number; price_unit: string; supplier: string;
  }>;

  // Build recipe lookup: dish_id -> items
  const recipeLookup: Record<number, typeof recipeRows> = {};
  for (const r of recipeRows) {
    if (!recipeLookup[r.dish_id]) recipeLookup[r.dish_id] = [];
    recipeLookup[r.dish_id].push(r);
  }

  // Aggregate ingredients across the whole week
  const aggregated: Record<number, {
    name: string;
    category: string;
    total_quantity: number;
    unit: string;
    price_per_unit: number;
    price_unit: string;
    supplier: string;
    total_cost: number;
  }> = {};

  for (const dp of dishPax) {
    const items = recipeLookup[dp.dish_id] || [];
    for (const item of items) {
      if (!aggregated[item.ingredient_id]) {
        aggregated[item.ingredient_id] = {
          name: item.name,
          category: item.category,
          total_quantity: 0,
          unit: item.unit,
          price_per_unit: item.price_per_unit,
          price_unit: item.price_unit,
          supplier: item.supplier,
          total_cost: 0,
        };
      }
      const agg = aggregated[item.ingredient_id];
      // Convert to same unit if needed
      const converted = convertUnit(item.quantity * dp.pax, item.unit as Unit, agg.unit as Unit);
      agg.total_quantity += converted;
      agg.total_cost += calculateCost(item.quantity * dp.pax, item.unit as Unit, item.price_per_unit, item.price_unit as Unit);
    }
  }

  // Group by category
  const categoryMap: Record<string, Array<{
    ingredient_id: number;
    name: string;
    total_quantity: number;
    unit: string;
    estimated_cost: number;
    supplier: string;
  }>> = {};

  let grandTotal = 0;

  for (const [id, agg] of Object.entries(aggregated)) {
    if (!categoryMap[agg.category]) categoryMap[agg.category] = [];
    categoryMap[agg.category].push({
      ingredient_id: parseInt(id),
      name: agg.name,
      total_quantity: Math.round(agg.total_quantity * 100) / 100,
      unit: agg.unit,
      estimated_cost: Math.round(agg.total_cost * 100) / 100,
      supplier: agg.supplier,
    });
    grandTotal += agg.total_cost;
  }

  // Sort items within categories
  const categories = Object.entries(categoryMap).map(([category, items]) => ({
    category,
    items: items.sort((a, b) => a.name.localeCompare(b.name)),
    subtotal: Math.round(items.reduce((sum, i) => sum + i.estimated_cost, 0) * 100) / 100,
  })).sort((a, b) => a.category.localeCompare(b.category));

    return NextResponse.json({
      year,
      week,
      categories,
      grandTotal: Math.round(grandTotal * 100) / 100,
    });
  } catch (err) {
    console.error('GET /api/einkaufsliste error:', err);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

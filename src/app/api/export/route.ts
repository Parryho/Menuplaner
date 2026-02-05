export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getWeeklyPlan, generateWeekFromRotation, DAY_NAMES_SHORT, type MealSlot } from '@/lib/rotation';
import { getDb } from '@/lib/db';
import ExcelJS from 'exceljs';

// Temperature lookup: returns map of "dayOfWeek-meal-location-slot" → { core, serving }
type TempMap = Record<string, { core: string; serving: string }>;

function getTemperaturesForWeek(year: number, week: number): TempMap {
  const db = getDb();
  const rows = db.prepare(`
    SELECT wp.day_of_week, wp.meal, wp.location, tl.dish_slot, tl.temp_core, tl.temp_serving
    FROM temperature_logs tl
    JOIN weekly_plans wp ON tl.plan_id = wp.id
    WHERE wp.year = ? AND wp.calendar_week = ?
  `).all(year, week) as Array<{
    day_of_week: number; meal: string; location: string;
    dish_slot: string; temp_core: string; temp_serving: string;
  }>;

  const map: TempMap = {};
  for (const r of rows) {
    const key = `${r.day_of_week}-${r.meal}-${r.location}-${r.dish_slot}`;
    map[key] = { core: r.temp_core || '', serving: r.temp_serving || '' };
  }
  return map;
}

function formatTemp(tempMap: TempMap, dayOfWeek: number, meal: string, location: string, slotIdx: number): string {
  const slotFields = ['soup', 'main1', 'side1a', 'side1b', 'main2', 'side2a', 'side2b', 'dessert'];
  const key = `${dayOfWeek}-${meal}-${location}-${slotFields[slotIdx]}`;
  const t = tempMap[key];
  if (t && (t.core || t.serving)) {
    return `${t.core || '__'}/${t.serving || '__'}`;
  }
  return '__/__';
}

// Slot labels for each row
const SLOT_LABELS = ['Suppe', 'Haupt 1', 'Beilage', 'Beilage', 'Haupt 2', 'Beilage', 'Beilage', 'Dessert'];

function getDishForSlot(slot: MealSlot, idx: number): { name: string; allergens: string } {
  const fields: (keyof MealSlot)[] = ['soup', 'main1', 'side1a', 'side1b', 'main2', 'side2a', 'side2b', 'dessert'];
  const dish = slot[fields[idx]];
  if (dish && typeof dish === 'object' && 'name' in dish) {
    return { name: dish.name, allergens: dish.allergens };
  }
  return { name: '', allergens: '' };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const week = parseInt(searchParams.get('week') || '1');
    const format = searchParams.get('format') || 'xlsx';
    const paxCity = searchParams.get('paxCity') || '60';
    const paxSued = searchParams.get('paxSued') || '45';

    // Get plan data
    let plan = getWeeklyPlan(year, week);
    if (!plan) {
      const rotWeekNr = ((week - 1) % 6) + 1;
      generateWeekFromRotation(year, week, rotWeekNr);
      plan = getWeeklyPlan(year, week);
    }
    if (!plan) {
      return NextResponse.json({ error: 'Kein Plan gefunden' }, { status: 404 });
    }

    const tempMap = getTemperaturesForWeek(year, week);

    if (format === 'csv') {
      return generateCSV(plan, week, tempMap);
    }

    return generateXLSX(plan, year, week, paxCity, paxSued, tempMap);
  } catch (err) {
    console.error('GET /api/export error:', err);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

function generateCSV(plan: NonNullable<ReturnType<typeof getWeeklyPlan>>, week: number, tempMap: TempMap): NextResponse {
  const rows: string[][] = [];

  // Header
  rows.push(['', '', `KW ${week} - City Mittag`, 'Allerg.', 'Temp.', '', '', '', `City Abend`, 'Allerg.', 'Temp.', '', '', '', `SÜD Mittag`, 'Allerg.', 'Temp.', '', '', '', `SÜD Abend`, 'Allerg.', 'Temp.']);

  for (const day of plan.days) {
    const dayName = DAY_NAMES_SHORT[day.dayOfWeek];
    // 8 rows per day
    for (let i = 0; i < 8; i++) {
      const row: string[] = [];
      // City Mittag block
      if (i === 0) row.push(dayName);
      else row.push('');
      row.push(SLOT_LABELS[i]);
      const cm = getDishForSlot(day.mittag.city, i);
      row.push(cm.name, cm.allergens, formatTemp(tempMap, day.dayOfWeek, 'mittag', 'city', i));
      row.push(''); // spacer

      // City Abend block
      if (i === 0) row.push(dayName);
      else row.push('');
      row.push(SLOT_LABELS[i]);
      const ca = getDishForSlot(day.abend.city, i);
      row.push(ca.name, ca.allergens, formatTemp(tempMap, day.dayOfWeek, 'abend', 'city', i));
      row.push(''); // spacer

      // SÜD Mittag block
      if (i === 0) row.push(dayName);
      else row.push('');
      row.push(SLOT_LABELS[i]);
      const sm = getDishForSlot(day.mittag.sued, i);
      row.push(sm.name, sm.allergens, formatTemp(tempMap, day.dayOfWeek, 'mittag', 'sued', i));
      row.push(''); // spacer

      // SÜD Abend block
      if (i === 0) row.push(dayName);
      else row.push('');
      row.push(SLOT_LABELS[i]);
      const sa = getDishForSlot(day.abend.sued, i);
      row.push(sa.name, sa.allergens, formatTemp(tempMap, day.dayOfWeek, 'abend', 'sued', i));

      rows.push(row);
    }
  }

  const csv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="menuplan_kw${week}.csv"`,
    },
  });
}

async function generateXLSX(plan: NonNullable<ReturnType<typeof getWeeklyPlan>>, year: number, week: number, paxCity: string, paxSued: string, tempMap: TempMap): Promise<NextResponse> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(`KW ${week}`, {
    pageSetup: {
      paperSize: 9, // A4
      orientation: 'portrait',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 1,
      margins: { left: 0.3, right: 0.3, top: 0.3, bottom: 0.3, header: 0.1, footer: 0.1 },
    },
  });

  // Column widths - 4 blocks of 5 cols each with spacer cols
  // Block: Date(6) | Label(8) | Dish(22) | Allerg(6) | Temp(6) | Spacer(1)
  const colWidths = [
    6, 8, 22, 6, 6,  // City Mittag (A-E)
    1,                 // Spacer (F)
    6, 8, 22, 6, 6,  // City Abend (G-K)
    1,                 // Spacer (L)
    6, 8, 22, 6, 6,  // SÜD Mittag (M-Q)
    1,                 // Spacer (R)
    6, 8, 22, 6, 6,  // SÜD Abend (S-W)
  ];
  colWidths.forEach((w, i) => { sheet.getColumn(i + 1).width = w; });

  const headerFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
  const headerFont: Partial<ExcelJS.Font> = { bold: true, color: { argb: 'FFFFFFFF' }, size: 8 };
  const dayFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E2F3' } };
  const normalFont: Partial<ExcelJS.Font> = { size: 7 };
  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin' }, bottom: { style: 'thin' },
    left: { style: 'thin' }, right: { style: 'thin' },
  };

  // Block start columns (1-indexed)
  const blocks = [
    { col: 1, title: `KW ${week} City Mittag`, pax: `${paxCity} PAX`, mealKey: 'mittag' as const, locKey: 'city' as const },
    { col: 7, title: `City Abend`, pax: `${paxCity} PAX`, mealKey: 'abend' as const, locKey: 'city' as const },
    { col: 13, title: `KW ${week} SÜD Mittag`, pax: `${paxSued} PAX`, mealKey: 'mittag' as const, locKey: 'sued' as const },
    { col: 19, title: `SÜD Abend`, pax: `${paxSued} PAX`, mealKey: 'abend' as const, locKey: 'sued' as const },
  ];

  // Row 1: Block titles
  for (const block of blocks) {
    const c = block.col;
    sheet.mergeCells(1, c, 1, c + 4);
    const cell = sheet.getCell(1, c);
    cell.value = block.title;
    cell.fill = headerFill;
    cell.font = { ...headerFont, size: 9 };
    cell.alignment = { horizontal: 'center' };
    for (let i = 0; i < 5; i++) {
      sheet.getCell(1, c + i).fill = headerFill;
      sheet.getCell(1, c + i).border = thinBorder;
    }
  }

  // Row 2: Sub-headers
  for (const block of blocks) {
    const c = block.col;
    const labels = ['', '', '', 'Allerg.', 'Temp.'];
    labels.forEach((label, i) => {
      const cell = sheet.getCell(2, c + i);
      cell.value = label;
      cell.font = { ...normalFont, bold: true };
      cell.border = thinBorder;
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2EFDA' } };
    });
  }

  // Data rows: 7 days * 8 rows = 56 rows starting at row 3
  let currentRow = 3;
  for (const day of plan.days) {
    const dayName = DAY_NAMES_SHORT[day.dayOfWeek];

    for (let slotIdx = 0; slotIdx < 8; slotIdx++) {
      for (const block of blocks) {
        const c = block.col;
        const mealSlot = day[block.mealKey][block.locKey];
        const dish = getDishForSlot(mealSlot, slotIdx);

        // Date column (only first row of day)
        const dateCell = sheet.getCell(currentRow, c);
        if (slotIdx === 0) {
          dateCell.value = dayName;
          dateCell.font = { ...normalFont, bold: true };
          dateCell.fill = dayFill;
        }
        if (slotIdx === 1) {
          dateCell.value = block.mealKey === 'mittag' ? 'Mittag' : 'Abend';
          dateCell.font = normalFont;
        }
        if (slotIdx === 2) {
          dateCell.value = block.pax;
          dateCell.font = { ...normalFont, italic: true };
        }
        dateCell.border = thinBorder;

        // Label column
        const labelCell = sheet.getCell(currentRow, c + 1);
        labelCell.value = SLOT_LABELS[slotIdx];
        labelCell.font = { ...normalFont, bold: true };
        labelCell.border = thinBorder;

        // Dish name
        const dishCell = sheet.getCell(currentRow, c + 2);
        dishCell.value = dish.name;
        dishCell.font = normalFont;
        dishCell.border = thinBorder;

        // Allergens
        const allergCell = sheet.getCell(currentRow, c + 3);
        allergCell.value = dish.allergens;
        allergCell.font = { ...normalFont, color: { argb: 'FFFF0000' } };
        allergCell.alignment = { horizontal: 'center' };
        allergCell.border = thinBorder;

        // Temperature field for every row
        const tempCell = sheet.getCell(currentRow, c + 4);
        tempCell.value = formatTemp(tempMap, day.dayOfWeek, block.mealKey, block.locKey, slotIdx);
        tempCell.font = normalFont;
        tempCell.alignment = { horizontal: 'center' };
        tempCell.border = thinBorder;
      }

      currentRow++;
    }
  }

  // Set row heights
  for (let r = 1; r <= currentRow; r++) {
    sheet.getRow(r).height = 11;
  }
  sheet.getRow(1).height = 16;

  const buffer = await workbook.xlsx.writeBuffer();
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="menuplan_kw${week}_${year}.xlsx"`,
    },
  });
}

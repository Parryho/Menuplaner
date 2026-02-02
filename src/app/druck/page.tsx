'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';


interface Dish { id: number; name: string; allergens: string; }
interface MealSlot {
  soup: Dish | null; main1: Dish | null; side1a: Dish | null; side1b: Dish | null;
  main2: Dish | null; side2a: Dish | null; side2b: Dish | null; dessert: Dish | null;
}
interface DayPlan {
  dayOfWeek: number;
  mittag: { city: MealSlot; sued: MealSlot };
  abend: { city: MealSlot; sued: MealSlot };
}
interface WeekPlan { weekNr: number; days: DayPlan[]; }

const DAY_NAMES_SHORT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const SLOT_LABELS = ['Suppe', 'Haupt 1', 'Beilage', 'Beilage', 'Haupt 2', 'Beilage', 'Beilage', 'Dessert'];
const SLOT_KEYS: (keyof MealSlot)[] = ['soup', 'main1', 'side1a', 'side1b', 'main2', 'side2a', 'side2b', 'dessert'];

function getDish(slot: MealSlot, idx: number): Dish | null {
  const d = slot[SLOT_KEYS[idx]];
  return d && typeof d === 'object' && 'name' in d ? d as Dish : null;
}

export default function DruckPageWrapper() {
  return <Suspense fallback={<div className="text-center py-8">Lade...</div>}><DruckPage /></Suspense>;
}

function getISOWeek(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function DruckPage() {
  const searchParams = useSearchParams();
  const [plan, setPlan] = useState<WeekPlan | null>(null);
  const now = new Date();
  const [year, setYear] = useState(parseInt(searchParams.get('year') || now.getFullYear().toString()));
  const [week, setWeek] = useState(parseInt(searchParams.get('week') || String(getISOWeek(now))));

  useEffect(() => {
    fetch(`/api/plans?year=${year}&week=${week}`).then(r => r.json()).then(setPlan);
  }, [year, week]);

  const goToCurrentWeek = () => {
    const d = new Date();
    setYear(d.getFullYear());
    setWeek(getISOWeek(d));
  };

  if (!plan) return <div className="text-center py-8">Lade...</div>;

  return (
    <div className="print:m-0 print:p-0">
      {/* Print controls - hidden when printing */}
      <div className="print:hidden mb-4 flex items-center gap-4">
        <h1 className="text-2xl font-bold">Druckansicht</h1>

        <button
          onClick={goToCurrentWeek}
          className="px-3 py-2 text-sm bg-accent-500 text-primary-900 rounded-lg hover:bg-accent-400 font-semibold transition-colors shadow-sm"
        >
          Heute
        </button>

        <div className="flex items-center bg-primary-50 rounded-lg border border-primary-200">
          <button
            onClick={() => setWeek(w => { if (w <= 1) { setYear(y => y - 1); return 52; } return w - 1; })}
            className="px-3 py-2 hover:bg-primary-100 rounded-l-lg transition-colors text-primary-700 font-bold"
          >
            ←
          </button>
          <div className="flex items-center gap-2 px-3 border-x border-primary-200">
            <label className="text-xs text-primary-500 font-medium">Jahr</label>
            <input type="number" value={year} onChange={e => setYear(parseInt(e.target.value) || year)}
              className="w-16 border border-primary-200 rounded px-2 py-1 text-sm text-center focus:border-accent-500 focus:ring-1 focus:ring-accent-200 outline-none" />
            <label className="text-xs text-primary-500 font-medium">KW</label>
            <input type="number" value={week} min={1} max={53} onChange={e => setWeek(parseInt(e.target.value) || week)}
              className="w-14 border border-primary-200 rounded px-2 py-1 text-sm text-center focus:border-accent-500 focus:ring-1 focus:ring-accent-200 outline-none" />
          </div>
          <button
            onClick={() => setWeek(w => { if (w >= 52) { setYear(y => y + 1); return 1; } return w + 1; })}
            className="px-3 py-2 hover:bg-primary-100 rounded-r-lg transition-colors text-primary-700 font-bold"
          >
            →
          </button>
        </div>

        <button onClick={() => window.print()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-sm transition-colors shadow-sm">
          Drucken
        </button>
      </div>

      {/* Print layout - A4 portrait, 4 blocks side by side */}
      <div className="print:block" style={{ fontSize: '6.5pt' }}>
        <style jsx>{`
          @media print {
            @page { size: A4 portrait; margin: 5mm; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        `}</style>

        <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            {/* City Mittag */}
            <col style={{ width: '4%' }} />
            <col style={{ width: '5.5%' }} />
            <col style={{ width: '13%' }} />
            <col style={{ width: '3.5%' }} />
            <col style={{ width: '3.5%' }} />
            {/* spacer */}
            <col style={{ width: '0.5%' }} />
            {/* City Abend */}
            <col style={{ width: '4%' }} />
            <col style={{ width: '5.5%' }} />
            <col style={{ width: '13%' }} />
            <col style={{ width: '3.5%' }} />
            <col style={{ width: '3.5%' }} />
            {/* spacer */}
            <col style={{ width: '0.5%' }} />
            {/* SÜD Mittag */}
            <col style={{ width: '4%' }} />
            <col style={{ width: '5.5%' }} />
            <col style={{ width: '13%' }} />
            <col style={{ width: '3.5%' }} />
            <col style={{ width: '3.5%' }} />
            {/* spacer */}
            <col style={{ width: '0.5%' }} />
            {/* SÜD Abend */}
            <col style={{ width: '4%' }} />
            <col style={{ width: '5.5%' }} />
            <col style={{ width: '13%' }} />
            <col style={{ width: '3.5%' }} />
            <col style={{ width: '3.5%' }} />
          </colgroup>

          {/* Header */}
          <thead>
            <tr>
              <th colSpan={5} className="bg-blue-700 text-white px-1 py-0.5 text-center border">KW {week} City Mittag</th>
              <th className="border-0"></th>
              <th colSpan={5} className="bg-blue-700 text-white px-1 py-0.5 text-center border">City Abend</th>
              <th className="border-0"></th>
              <th colSpan={5} className="bg-blue-700 text-white px-1 py-0.5 text-center border">KW {week} SÜD Mittag</th>
              <th className="border-0"></th>
              <th colSpan={5} className="bg-blue-700 text-white px-1 py-0.5 text-center border">SÜD Abend</th>
            </tr>
            <tr className="bg-green-50">
              {[0, 1, 2, 3].map((blockIdx) => (
                <>
                  {blockIdx > 0 && <td key={`s${blockIdx}`} className="border-0"></td>}
                  <th key={`h1_${blockIdx}`} className="px-1 py-0 border text-left"></th>
                  <th key={`h2_${blockIdx}`} className="px-1 py-0 border text-left"></th>
                  <th key={`h3_${blockIdx}`} className="px-1 py-0 border text-left"></th>
                  <th key={`h4_${blockIdx}`} className="px-1 py-0 border text-center">Allerg.</th>
                  <th key={`h5_${blockIdx}`} className="px-1 py-0 border text-center">Temp.</th>
                </>
              ))}
            </tr>
          </thead>

          <tbody>
            {[...plan.days].sort((a, b) => ((a.dayOfWeek || 7) - (b.dayOfWeek || 7))).map((day) => {
              const blocks: { meal: 'mittag' | 'abend'; loc: 'city' | 'sued'; pax: string; mealLabel: string }[] = [
                { meal: 'mittag', loc: 'city', pax: '60 PAX', mealLabel: 'Mittag' },
                { meal: 'abend', loc: 'city', pax: '60 PAX', mealLabel: 'Abend' },
                { meal: 'mittag', loc: 'sued', pax: '45 PAX', mealLabel: 'Mittag' },
                { meal: 'abend', loc: 'sued', pax: '45 PAX', mealLabel: 'Abend' },
              ];

              return Array.from({ length: 8 }, (_, slotIdx) => (
                <tr key={`${day.dayOfWeek}-${slotIdx}`} className={slotIdx === 0 ? 'border-t-2 border-gray-400' : ''}>
                  {blocks.map((block, blockIdx) => {
                    const slot = day[block.meal][block.loc];
                    const dish = getDish(slot, slotIdx);
                    return (
                      <>
                        {blockIdx > 0 && <td key={`sp_${blockIdx}_${slotIdx}`} className="border-0"></td>}
                        <td key={`d_${blockIdx}_${slotIdx}`} className="px-0.5 py-0 border" style={{ lineHeight: '1.1' }}>
                          {slotIdx === 0 && <span className="font-bold">{DAY_NAMES_SHORT[day.dayOfWeek]}</span>}
                          {slotIdx === 1 && <span className="text-gray-600">{block.mealLabel}</span>}
                          {slotIdx === 2 && <span className="text-gray-400 italic">{block.pax}</span>}
                        </td>
                        <td key={`l_${blockIdx}_${slotIdx}`} className="px-0.5 py-0 border font-semibold text-gray-600" style={{ lineHeight: '1.1' }}>
                          {SLOT_LABELS[slotIdx]}
                        </td>
                        <td key={`n_${blockIdx}_${slotIdx}`} className="px-0.5 py-0 border" style={{ lineHeight: '1.1' }}>
                          {dish?.name || ''}
                        </td>
                        <td key={`a_${blockIdx}_${slotIdx}`} className="px-0.5 py-0 border text-center text-red-600" style={{ lineHeight: '1.1' }}>
                          {dish?.allergens || ''}
                        </td>
                        <td key={`t_${blockIdx}_${slotIdx}`} className="px-0.5 py-0 border text-center" style={{ lineHeight: '1.1' }}>
                          {'__/__'}
                        </td>
                      </>
                    );
                  })}
                </tr>
              ));
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

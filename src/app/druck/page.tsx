'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { DAY_NAMES_SHORT, getISOWeek } from '@/lib/constants';
import type { Dish, MealSlot, WeekPlan, SlotKey } from '@/lib/types';
import { api } from '@/lib/api-client';

const SLOT_LABELS = ['Su', 'H1', 'B', 'B', 'H2', 'B', 'B', 'De'];
const SLOT_KEYS: SlotKey[] = ['soup', 'main1', 'side1a', 'side1b', 'main2', 'side2a', 'side2b', 'dessert'];

function getDish(slot: MealSlot, idx: number): Dish | null {
  const d = slot[SLOT_KEYS[idx]];
  return d && typeof d === 'object' && 'name' in d ? d as Dish : null;
}

export default function DruckPageWrapper() {
  return <Suspense fallback={<div className="text-center py-8">Lade...</div>}><DruckPage /></Suspense>;
}

function DruckPage() {
  const searchParams = useSearchParams();
  const [plan, setPlan] = useState<WeekPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const now = new Date();
  const [year, setYear] = useState(parseInt(searchParams.get('year') || now.getFullYear().toString()));
  const [week, setWeek] = useState(parseInt(searchParams.get('week') || String(getISOWeek(now))));

  useEffect(() => {
    setError(null);
    api.get<WeekPlan>(`/api/plans?year=${year}&week=${week}`)
      .then(setPlan)
      .catch(err => setError(err.message || 'Fehler beim Laden des Plans'));
  }, [year, week]);

  const goToCurrentWeek = () => {
    const d = new Date();
    setYear(d.getFullYear());
    setWeek(getISOWeek(d));
  };

  if (!plan) return <div className="text-center py-8">Lade...</div>;

  return (
    <div className="print:m-0 print:p-0">
      {error && (
        <div className="print:hidden bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4">
          <strong>Fehler:</strong> {error}
        </div>
      )}

      {/* Print controls */}
      <div className="print:hidden mb-4 flex items-center gap-4">
        <h1 className="text-2xl font-bold">Druckansicht</h1>
        <button onClick={goToCurrentWeek}
          className="px-3 py-2 text-sm bg-accent-500 text-primary-900 rounded-lg hover:bg-accent-400 font-semibold transition-colors shadow-sm">
          Heute
        </button>
        <div className="flex items-center bg-primary-50 rounded-lg border border-primary-200">
          <button onClick={() => setWeek(w => { if (w <= 1) { setYear(y => y - 1); return 52; } return w - 1; })}
            className="px-3 py-2 hover:bg-primary-100 rounded-l-lg transition-colors text-primary-700 font-bold">←</button>
          <div className="flex items-center gap-2 px-3 border-x border-primary-200">
            <label className="text-xs text-primary-500 font-medium">Jahr</label>
            <input type="number" value={year} onChange={e => setYear(parseInt(e.target.value) || year)}
              className="w-16 border border-primary-200 rounded px-2 py-1 text-sm text-center focus:border-accent-500 focus:ring-1 focus:ring-accent-200 outline-none" />
            <label className="text-xs text-primary-500 font-medium">KW</label>
            <input type="number" value={week} min={1} max={53} onChange={e => setWeek(parseInt(e.target.value) || week)}
              className="w-14 border border-primary-200 rounded px-2 py-1 text-sm text-center focus:border-accent-500 focus:ring-1 focus:ring-accent-200 outline-none" />
          </div>
          <button onClick={() => setWeek(w => { if (w >= 52) { setYear(y => y + 1); return 1; } return w + 1; })}
            className="px-3 py-2 hover:bg-primary-100 rounded-r-lg transition-colors text-primary-700 font-bold">→</button>
        </div>
        <button onClick={() => window.print()} className="px-4 py-2 bg-primary-800 text-white rounded-lg hover:bg-primary-700 font-semibold text-sm transition-colors shadow-sm">
          Drucken
        </button>
      </div>

      {/* Print layout - A4 portrait, 4 blocks tight */}
      <div className="print:block" style={{ fontSize: '5.5pt' }}>
        <style jsx>{`
          @media print {
            @page { size: A4 portrait; margin: 3mm; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        `}</style>

        <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            {[0, 1, 2, 3].map(blockIdx => (
              <React.Fragment key={blockIdx}>
                {blockIdx > 0 && <col style={{ width: '0.3%' }} />}
                <col style={{ width: '2.8%' }} />
                <col style={{ width: '2.8%' }} />
                <col style={{ width: '16.5%' }} />
                <col style={{ width: '2.5%' }} />
                <col style={{ width: '2.5%' }} />
              </React.Fragment>
            ))}
          </colgroup>

          <thead>
            <tr>
              <th colSpan={5} className="bg-gray-800 text-white px-0.5 py-0.5 text-center border border-gray-400 font-bold">KW{week} City Mittag</th>
              <th className="border-0 w-[0.3%]"></th>
              <th colSpan={5} className="bg-gray-800 text-white px-0.5 py-0.5 text-center border border-gray-400 font-bold">City Abend</th>
              <th className="border-0 w-[0.3%]"></th>
              <th colSpan={5} className="bg-gray-600 text-white px-0.5 py-0.5 text-center border border-gray-400 font-bold">KW{week} SÜD Mittag</th>
              <th className="border-0 w-[0.3%]"></th>
              <th colSpan={5} className="bg-gray-600 text-white px-0.5 py-0.5 text-center border border-gray-400 font-bold">SÜD Abend</th>
            </tr>
          </thead>

          <tbody>
            {[...plan.days].sort((a, b) => ((a.dayOfWeek || 7) - (b.dayOfWeek || 7))).map((day) => {
              const blocks: { meal: 'mittag' | 'abend'; loc: 'city' | 'sued'; mealLabel: string }[] = [
                { meal: 'mittag', loc: 'city', mealLabel: 'Mi' },
                { meal: 'abend', loc: 'city', mealLabel: 'Ab' },
                { meal: 'mittag', loc: 'sued', mealLabel: 'Mi' },
                { meal: 'abend', loc: 'sued', mealLabel: 'Ab' },
              ];

              return Array.from({ length: 8 }, (_, slotIdx) => (
                <tr key={`${day.dayOfWeek}-${slotIdx}`} className={slotIdx === 0 ? 'border-t-2 border-gray-500' : ''}>
                  {blocks.map((block, blockIdx) => {
                    const slot = day[block.meal][block.loc];
                    const dish = getDish(slot, slotIdx);
                    return (
                      <React.Fragment key={`${blockIdx}-${slotIdx}`}>
                        {blockIdx > 0 && <td className="border-0"></td>}
                        <td className="px-0.5 py-0 border border-gray-300" style={{ lineHeight: '1.05' }}>
                          {slotIdx === 0 && <span className="font-bold">{DAY_NAMES_SHORT[day.dayOfWeek]}</span>}
                          {slotIdx === 1 && <span className="text-gray-500">{block.mealLabel}</span>}
                        </td>
                        <td className="px-0.5 py-0 border border-gray-300 font-semibold text-gray-500" style={{ lineHeight: '1.05' }}>
                          {SLOT_LABELS[slotIdx]}
                        </td>
                        <td className="px-0.5 py-0 border border-gray-300 truncate overflow-hidden" style={{ lineHeight: '1.05', maxWidth: 0 }}>
                          {dish?.name || ''}
                        </td>
                        <td className="px-0.5 py-0 border border-gray-300 text-center text-gray-500" style={{ lineHeight: '1.05', fontSize: '5pt' }}>
                          {dish?.allergens || ''}
                        </td>
                        <td className="px-0.5 py-0 border border-gray-300 text-center" style={{ lineHeight: '1.05' }}>
                          __
                        </td>
                      </React.Fragment>
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

import React from 'react';

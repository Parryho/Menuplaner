'use client';

import { useEffect, useState, useCallback } from 'react';
import { DAY_NAMES, getISOWeek } from '@/lib/constants';
import { api } from '@/lib/api-client';

interface ProductionIngredient {
  name: string;
  quantity_per_portion: number;
  total_quantity: number;
  unit: string;
  preparation_note: string;
  cost: number;
}

interface ProductionDish {
  slot: string;
  dish_name: string;
  dish_id: number;
  ingredients: ProductionIngredient[];
}

interface ProductionEntry {
  day_of_week: number;
  meal: string;
  location: string;
  pax: number;
  dishes: ProductionDish[];
}

const SLOT_LABELS: Record<string, string> = {
  soup: 'Suppe', main1: 'Haupt 1', side1a: 'Beilage 1a', side1b: 'Beilage 1b',
  main2: 'Haupt 2', side2a: 'Beilage 2a', side2b: 'Beilage 2b', dessert: 'Dessert',
};

function formatQuantity(qty: number, unit: string): string {
  if (unit === 'g' && qty >= 1000) return `${(qty / 1000).toFixed(2)} kg`;
  if (unit === 'ml' && qty >= 1000) return `${(qty / 1000).toFixed(2)} l`;
  if (unit === 'stueck') return `${Math.round(qty)} Stk`;
  return `${qty % 1 === 0 ? qty : qty.toFixed(1)} ${unit}`;
}

export default function ProduktionslistePage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [week, setWeek] = useState(getISOWeek(now));
  const [data, setData] = useState<ProductionEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const loadData = useCallback(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ year: String(year), week: String(week) });
    if (selectedDay !== null) params.set('day', String(selectedDay));
    api.get<{ production: ProductionEntry[] }>(`/api/produktionsliste?${params}`)
      .then(d => {
        setData(d.production || []);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || 'Fehler beim Laden der Produktionsliste');
        setLoading(false);
      });
  }, [year, week, selectedDay]);

  useEffect(() => { loadData(); }, [loadData]);

  // Group by day
  const dayGroups: Record<number, ProductionEntry[]> = {};
  for (const entry of data) {
    if (!dayGroups[entry.day_of_week]) dayGroups[entry.day_of_week] = [];
    dayGroups[entry.day_of_week].push(entry);
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          <strong>Fehler:</strong> {error}
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-900">Produktionsliste</h1>
          <p className="text-sm text-primary-500 mt-1">Mengen pro Gericht &times; PAX</p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-primary-700 text-white px-5 py-2.5 rounded-lg hover:bg-primary-600 font-semibold transition-colors shadow-sm print:hidden"
        >
          Drucken
        </button>
      </div>

      {/* Week selector */}
      <div className="flex items-center gap-4 print:hidden">
        <button onClick={() => setWeek(w => Math.max(1, w - 1))} className="px-3 py-2 bg-white border border-primary-200 rounded-lg hover:bg-primary-50 font-bold">&larr;</button>
        <div className="flex items-center gap-2">
          <input type="number" value={year} onChange={e => setYear(parseInt(e.target.value) || year)} className="w-20 border border-primary-200 rounded-lg px-3 py-2 text-center" />
          <span className="text-primary-500">/</span>
          <span className="font-bold text-primary-900">KW {week}</span>
        </div>
        <button onClick={() => setWeek(w => Math.min(53, w + 1))} className="px-3 py-2 bg-white border border-primary-200 rounded-lg hover:bg-primary-50 font-bold">&rarr;</button>

        {/* Day filter */}
        <div className="flex gap-1 ml-4">
          <button
            onClick={() => setSelectedDay(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${selectedDay === null ? 'bg-accent-500 text-primary-900' : 'bg-white border border-primary-200 text-primary-600'}`}
          >
            Alle
          </button>
          {[1, 2, 3, 4, 5, 0].map(d => (
            <button
              key={d}
              onClick={() => setSelectedDay(selectedDay === d ? null : d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${selectedDay === d ? 'bg-accent-500 text-primary-900' : 'bg-white border border-primary-200 text-primary-600'}`}
            >
              {DAY_NAMES[d].substring(0, 2)}
            </button>
          ))}
        </div>
      </div>

      {loading && <div className="text-center py-8 text-primary-400">Lade Daten...</div>}

      {!loading && data.length === 0 && (
        <div className="text-center py-12 text-primary-400 bg-white rounded-card shadow-card border border-primary-100">
          Keine Plandaten f&uuml;r KW {week}/{year}
        </div>
      )}

      {/* Production data grouped by day */}
      {Object.entries(dayGroups).sort(([a], [b]) => parseInt(a) - parseInt(b)).map(([dow, entries]) => (
        <div key={dow} className="bg-white rounded-card shadow-card border border-primary-100 overflow-hidden">
          <div className="bg-primary-800 text-white px-5 py-3 font-bold text-lg">
            {DAY_NAMES[parseInt(dow)]}
          </div>
          {entries.map((entry, ei) => (
            <div key={ei} className="border-b border-primary-100 last:border-0">
              <div className="flex items-center gap-3 px-5 py-2 bg-primary-50">
                <span className="font-semibold text-primary-800 capitalize">{entry.meal}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-primary-200 text-primary-700 uppercase">{entry.location}</span>
                <span className="text-xs text-primary-500 ml-auto">{entry.pax} PAX</span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-primary-500 border-b border-primary-100">
                    <th className="px-5 py-1.5 text-left w-24">Slot</th>
                    <th className="px-3 py-1.5 text-left">Gericht</th>
                    <th className="px-3 py-1.5 text-left">Zutat</th>
                    <th className="px-3 py-1.5 text-right w-28">Menge/Portion</th>
                    <th className="px-3 py-1.5 text-right w-28">Gesamt</th>
                  </tr>
                </thead>
                <tbody>
                  {entry.dishes.map((dish, di) =>
                    dish.ingredients.length > 0 ? (
                      dish.ingredients.map((ing, ii) => (
                        <tr key={`${di}-${ii}`} className="border-b border-primary-50 hover:bg-accent-50/20">
                          {ii === 0 && (
                            <>
                              <td rowSpan={dish.ingredients.length} className="px-5 py-1.5 text-xs text-primary-500 align-top border-r border-primary-50">
                                {SLOT_LABELS[dish.slot] || dish.slot}
                              </td>
                              <td rowSpan={dish.ingredients.length} className="px-3 py-1.5 font-medium text-primary-900 align-top border-r border-primary-50">
                                {dish.dish_name}
                              </td>
                            </>
                          )}
                          <td className="px-3 py-1.5 text-primary-700">
                            {ing.name}
                            {ing.preparation_note && (
                              <span className="text-xs text-primary-400 ml-1">({ing.preparation_note})</span>
                            )}
                          </td>
                          <td className="px-3 py-1.5 text-right font-mono text-primary-500 text-xs">
                            {formatQuantity(ing.quantity_per_portion, ing.unit)}
                          </td>
                          <td className="px-3 py-1.5 text-right font-mono font-semibold text-primary-900">
                            {formatQuantity(ing.total_quantity, ing.unit)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr key={di} className="border-b border-primary-50">
                        <td className="px-5 py-1.5 text-xs text-primary-500">{SLOT_LABELS[dish.slot]}</td>
                        <td className="px-3 py-1.5 font-medium text-primary-900">{dish.dish_name}</td>
                        <td colSpan={3} className="px-3 py-1.5 text-primary-400 italic text-xs">Kein Rezept hinterlegt</td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

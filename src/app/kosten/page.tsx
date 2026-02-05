'use client';

import { useEffect, useState, useCallback } from 'react';
import { DAY_NAMES, getISOWeek } from '@/lib/constants';
import { api } from '@/lib/api-client';

interface CostDish {
  name: string;
  cost_per_portion: number;
  total_cost: number;
}

interface CostMeal {
  meal: string;
  location: string;
  pax: number;
  dishes: CostDish[];
  total_cost: number;
  cost_per_guest: number;
}

interface CostDay {
  day_of_week: number;
  meals: CostMeal[];
  day_total: number;
  day_pax: number;
}

interface CostSummary {
  week_total: number;
  avg_per_day: number;
  avg_per_guest: number;
  total_pax: number;
}

function formatEuro(val: number): string {
  return new Intl.NumberFormat('de-AT', { style: 'currency', currency: 'EUR' }).format(val);
}

export default function KostenPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [week, setWeek] = useState(getISOWeek(now));
  const [summary, setSummary] = useState<CostSummary | null>(null);
  const [days, setDays] = useState<CostDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);

  const loadData = useCallback(() => {
    setLoading(true);
    setError(null);
    api.get<{ summary: CostSummary | null; days: CostDay[] }>(`/api/kosten?year=${year}&week=${week}`)
      .then(d => {
        setSummary(d.summary || null);
        setDays(d.days || []);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || 'Fehler beim Laden der Kostenübersicht');
        setLoading(false);
      });
  }, [year, week]);

  useEffect(() => { loadData(); }, [loadData]);

  return (
    <div className="space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          <strong>Fehler:</strong> {error}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-primary-900">Kosten&uuml;bersicht</h1>
        <p className="text-sm text-primary-500 mt-1">Wareneinsatz pro Woche</p>
      </div>

      {/* Week selector */}
      <div className="flex items-center gap-4">
        <button onClick={() => setWeek(w => Math.max(1, w - 1))} className="px-3 py-2 bg-white border border-primary-200 rounded-lg hover:bg-primary-50 font-bold">&larr;</button>
        <div className="flex items-center gap-2">
          <input type="number" value={year} onChange={e => setYear(parseInt(e.target.value) || year)} className="w-20 border border-primary-200 rounded-lg px-3 py-2 text-center" />
          <span className="text-primary-500">/</span>
          <span className="font-bold text-primary-900">KW {week}</span>
        </div>
        <button onClick={() => setWeek(w => Math.min(53, w + 1))} className="px-3 py-2 bg-white border border-primary-200 rounded-lg hover:bg-primary-50 font-bold">&rarr;</button>
      </div>

      {loading && <div className="text-center py-8 text-primary-400">Lade Daten...</div>}

      {/* Summary Cards */}
      {summary && !loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-card shadow-card border border-primary-100 p-5">
            <div className="text-xs text-primary-500 font-medium uppercase tracking-wider">Woche Gesamt</div>
            <div className="text-2xl font-bold text-primary-900 mt-1">{formatEuro(summary.week_total)}</div>
          </div>
          <div className="bg-white rounded-card shadow-card border border-primary-100 p-5">
            <div className="text-xs text-primary-500 font-medium uppercase tracking-wider">&Oslash; pro Tag</div>
            <div className="text-2xl font-bold text-primary-900 mt-1">{formatEuro(summary.avg_per_day)}</div>
          </div>
          <div className="bg-white rounded-card shadow-card border border-primary-100 p-5">
            <div className="text-xs text-primary-500 font-medium uppercase tracking-wider">&Oslash; pro Gast</div>
            <div className="text-2xl font-bold text-accent-600 mt-1">{formatEuro(summary.avg_per_guest)}</div>
          </div>
          <div className="bg-white rounded-card shadow-card border border-primary-100 p-5">
            <div className="text-xs text-primary-500 font-medium uppercase tracking-wider">PAX Gesamt</div>
            <div className="text-2xl font-bold text-primary-900 mt-1">{summary.total_pax}</div>
          </div>
        </div>
      )}

      {!loading && days.length === 0 && (
        <div className="text-center py-12 text-primary-400 bg-white rounded-card shadow-card border border-primary-100">
          Keine Plandaten f&uuml;r KW {week}/{year}
        </div>
      )}

      {/* Day-by-day breakdown */}
      <div className="bg-white rounded-card shadow-card border border-primary-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-primary-50 border-b border-primary-200">
              <th className="px-5 py-3 text-left font-semibold text-primary-700">Tag</th>
              <th className="px-3 py-3 text-left font-semibold text-primary-700">Mahlzeit</th>
              <th className="px-3 py-3 text-left font-semibold text-primary-700">Standort</th>
              <th className="px-3 py-3 text-right font-semibold text-primary-700 w-20">PAX</th>
              <th className="px-3 py-3 text-right font-semibold text-primary-700 w-28">Wareneinsatz</th>
              <th className="px-3 py-3 text-right font-semibold text-primary-700 w-24">&euro;/Gast</th>
              <th className="px-3 py-3 text-center font-semibold text-primary-700 w-12"></th>
            </tr>
          </thead>
          <tbody>
            {days.map(day => (
              <>
                {day.meals.map((meal, mi) => (
                  <tr key={`${day.day_of_week}-${mi}`} className="border-b border-primary-50 hover:bg-accent-50/20">
                    {mi === 0 && (
                      <td rowSpan={day.meals.length} className="px-5 py-2.5 font-bold text-primary-900 align-top border-r border-primary-100">
                        {DAY_NAMES[day.day_of_week]}
                        <div className="text-xs font-normal text-primary-500 mt-0.5">{formatEuro(day.day_total)}</div>
                      </td>
                    )}
                    <td className="px-3 py-2.5 capitalize text-primary-700">{meal.meal}</td>
                    <td className="px-3 py-2.5">
                      <span className="text-xs px-2 py-0.5 rounded bg-primary-100 text-primary-700 uppercase font-medium">{meal.location}</span>
                    </td>
                    <td className="px-3 py-2.5 text-right text-primary-700">{meal.pax}</td>
                    <td className="px-3 py-2.5 text-right font-mono font-semibold text-primary-900">
                      {formatEuro(meal.total_cost)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-primary-600">
                      {formatEuro(meal.cost_per_guest)}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <button
                        onClick={() => setExpandedDay(expandedDay === day.day_of_week ? null : day.day_of_week)}
                        className="text-primary-400 hover:text-primary-700"
                      >
                        {expandedDay === day.day_of_week ? '\u25B2' : '\u25BC'}
                      </button>
                    </td>
                  </tr>
                ))}
                {/* Drill-down: dish details */}
                {expandedDay === day.day_of_week && day.meals.map((meal, mi) =>
                  meal.dishes.map((dish, di) => (
                    <tr key={`detail-${day.day_of_week}-${mi}-${di}`} className="bg-accent-50/30 border-b border-primary-50">
                      <td className="px-5 py-1.5"></td>
                      <td colSpan={2} className="px-3 py-1.5 text-primary-600 text-xs">
                        <span className="capitalize">{meal.meal}</span> / {meal.location} &rarr; {dish.name}
                      </td>
                      <td className="px-3 py-1.5 text-right text-xs text-primary-500">{meal.pax}</td>
                      <td className="px-3 py-1.5 text-right font-mono text-xs text-primary-600">{formatEuro(dish.total_cost)}</td>
                      <td className="px-3 py-1.5 text-right font-mono text-xs text-primary-400">{formatEuro(dish.cost_per_portion)}/P</td>
                      <td></td>
                    </tr>
                  ))
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

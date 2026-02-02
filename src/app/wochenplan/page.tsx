'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import WeekGrid from '@/components/WeekGrid';

interface WeekPlan {
  weekNr: number;
  calendarWeek?: number;
  year?: number;
  days: DayPlan[];
}

interface DayPlan {
  dayOfWeek: number;
  mittag: { city: MealSlot; sued: MealSlot };
  abend: { city: MealSlot; sued: MealSlot };
}

interface MealSlot {
  soup: Dish | null;
  main1: Dish | null;
  side1a: Dish | null;
  side1b: Dish | null;
  main2: Dish | null;
  side2a: Dish | null;
  side2b: Dish | null;
  dessert: Dish | null;
}

interface Dish {
  id: number;
  name: string;
  allergens: string;
}

export default function WochenplanPageWrapper() {
  return <Suspense fallback={<div className="text-center py-8 text-primary-500">Lade...</div>}><WochenplanPage /></Suspense>;
}

interface GuestCount {
  date: string;
  location: string;
  meal_type: string;
  count: number;
}

interface DayPax {
  cityMittag: number;
  cityAbend: number;
  suedMittag: number;
  suedAbend: number;
}

// Get ISO dates (YYYY-MM-DD) for each day of a given ISO week
function getWeekDates(year: number, week: number): Record<number, string> {
  // ISO week: week 1 contains the first Thursday of the year
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = jan4.getDay() || 7; // Mon=1..Sun=7
  const monday = new Date(jan4);
  monday.setDate(jan4.getDate() - dayOfWeek + 1 + (week - 1) * 7);

  const dates: Record<number, string> = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dow = i === 6 ? 0 : i + 1; // 0=So, 1=Mo, ..., 6=Sa
    dates[dow] = d.toISOString().split('T')[0];
  }
  return dates;
}

function WochenplanPage() {
  const searchParams = useSearchParams();
  const [plan, setPlan] = useState<WeekPlan | null>(null);
  const [paxData, setPaxData] = useState<Record<number, DayPax>>({});
  const [year, setYear] = useState(parseInt(searchParams.get('year') || new Date().getFullYear().toString()));
  const [week, setWeek] = useState(parseInt(searchParams.get('week') || '1'));
  const [loading, setLoading] = useState(true);

  const weekDates = getWeekDates(year, week);

  useEffect(() => {
    setLoading(true);

    // Fetch plan and guest counts in parallel
    const dateValues = Object.values(weekDates).sort();
    const from = dateValues[0];
    const to = dateValues[dateValues.length - 1];

    Promise.all([
      fetch(`/api/plans?year=${year}&week=${week}`).then(r => r.json()),
      fetch(`/api/ocr?from=${from}&to=${to}`).then(r => r.json()),
    ]).then(([planData, counts]) => {
      setPlan(planData);

      // Build paxData: dayOfWeek → {cityMittag, cityAbend, suedMittag, suedAbend}
      const pax: Record<number, DayPax> = {};
      // Map ISO date → dayOfWeek
      const dateToDay: Record<string, number> = {};
      for (const [dow, date] of Object.entries(weekDates)) {
        dateToDay[date] = parseInt(dow);
      }

      for (const c of (counts as GuestCount[])) {
        const dow = dateToDay[c.date];
        if (dow === undefined) continue;
        if (!pax[dow]) pax[dow] = { cityMittag: 0, cityAbend: 0, suedMittag: 0, suedAbend: 0 };
        if (c.location === 'city' && c.meal_type === 'mittag') pax[dow].cityMittag = c.count;
        else if (c.location === 'city' && c.meal_type === 'abend') pax[dow].cityAbend = c.count;
        else if (c.location === 'sued' && c.meal_type === 'mittag') pax[dow].suedMittag = c.count;
        else if (c.location === 'sued' && c.meal_type === 'abend') pax[dow].suedAbend = c.count;
      }
      setPaxData(pax);
      setLoading(false);
    });
  }, [year, week]);

  const rotationWeek = ((week - 1) % 6) + 1;

  // Navigate to current week
  const goToCurrentWeek = () => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor((now.getTime() - startOfYear.getTime()) / 86400000);
    const kw = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    setYear(now.getFullYear());
    setWeek(kw);
  };

  const handleDishChange = useCallback((dayOfWeek: number, meal: string, location: string, slotKey: string, dish: Dish | null) => {
    // Optimistic UI update
    setPlan(prev => {
      if (!prev) return prev;
      const days = prev.days.map(day => {
        if (day.dayOfWeek !== dayOfWeek) return day;
        const mealKey = meal as 'mittag' | 'abend';
        const locKey = location as 'city' | 'sued';
        return {
          ...day,
          [mealKey]: {
            ...day[mealKey],
            [locKey]: {
              ...day[mealKey][locKey],
              [slotKey]: dish,
            },
          },
        };
      });
      return { ...prev, days };
    });

    // Persist to API
    fetch('/api/plans', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        year,
        calendarWeek: week,
        dayOfWeek,
        meal,
        location,
        slot: slotKey,
        dishId: dish?.id || null,
      }),
    });
  }, [year, week]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-card shadow-card border border-primary-100 p-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-primary-900">Wochenplan</h1>
            <p className="text-sm text-primary-500 mt-1">
              Kalenderwoche {week} / {year} - Rotation Woche {rotationWeek}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Current week button */}
            <button
              onClick={goToCurrentWeek}
              className="px-3 py-2 text-sm bg-accent-500 text-primary-900 rounded-lg hover:bg-accent-400 font-semibold transition-colors shadow-sm"
            >
              Heute
            </button>

            {/* Navigation */}
            <div className="flex items-center bg-primary-50 rounded-lg border border-primary-200">
              <button
                onClick={() => setWeek(w => Math.max(1, w - 1))}
                className="px-3 py-2 hover:bg-primary-100 rounded-l-lg transition-colors text-primary-700 font-bold"
              >
                ←
              </button>

              <div className="flex items-center gap-2 px-3 border-x border-primary-200">
                <label className="text-xs text-primary-500 font-medium">Jahr</label>
                <input
                  type="number"
                  value={year}
                  onChange={e => setYear(parseInt(e.target.value))}
                  className="w-16 border border-primary-200 rounded px-2 py-1 text-sm text-center focus:border-accent-500 focus:ring-1 focus:ring-accent-200 outline-none"
                />
                <label className="text-xs text-primary-500 font-medium">KW</label>
                <input
                  type="number"
                  value={week}
                  min={1}
                  max={53}
                  onChange={e => setWeek(parseInt(e.target.value))}
                  className="w-14 border border-primary-200 rounded px-2 py-1 text-sm text-center focus:border-accent-500 focus:ring-1 focus:ring-accent-200 outline-none"
                />
              </div>

              <button
                onClick={() => setWeek(w => Math.min(53, w + 1))}
                className="px-3 py-2 hover:bg-primary-100 rounded-r-lg transition-colors text-primary-700 font-bold"
              >
                →
              </button>
            </div>

            {/* Rotation indicator */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-2 bg-primary-800 text-white rounded-lg">
              <span className="text-xs">Rotation</span>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5, 6].map(w => (
                  <div
                    key={w}
                    className={`w-4 h-4 rounded text-[10px] flex items-center justify-center font-bold ${
                      w === rotationWeek
                        ? 'bg-accent-500 text-primary-900'
                        : 'bg-primary-600 text-primary-300'
                    }`}
                  >
                    {w}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Week Grid */}
      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block w-8 h-8 border-4 border-primary-200 border-t-accent-500 rounded-full animate-spin mb-3" />
          <div className="text-primary-500 text-sm">Lade Wochenplan...</div>
        </div>
      ) : plan ? (
        <WeekGrid days={plan.days} paxData={paxData} year={year} calendarWeek={week} dates={weekDates} onDishChange={handleDishChange} />
      ) : (
        <div className="text-center py-16 bg-white rounded-card shadow-card border border-primary-100">
          <div className="text-primary-400 text-lg mb-2">Kein Plan gefunden</div>
          <div className="text-primary-500 text-sm">Wochenplan wird aus der Rotation generiert.</div>
        </div>
      )}
    </div>
  );
}

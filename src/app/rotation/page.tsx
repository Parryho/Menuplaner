'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import WeekGrid from '@/components/WeekGrid';

interface WeekPlan {
  weekNr: number;
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

export default function RotationPageWrapper() {
  return <Suspense fallback={<div className="text-center py-8">Lade...</div>}><RotationPage /></Suspense>;
}

/** Get ISO week number for a date */
function getISOWeek(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/** Get Monday of an ISO week */
function getMondayOfISOWeek(week: number, year: number): Date {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dayOfWeek = jan4.getUTCDay() || 7;
  const mondayW1 = new Date(jan4);
  mondayW1.setUTCDate(jan4.getUTCDate() - dayOfWeek + 1);
  const result = new Date(mondayW1);
  result.setUTCDate(mondayW1.getUTCDate() + (week - 1) * 7);
  return result;
}

/** Calculate dates for each dayOfWeek in a rotation week */
function getDatesForWeek(rotationWeek: number, currentRotationWeek: number): Record<number, string> {
  const now = new Date();
  const currentISOWeek = getISOWeek(now);
  const year = now.getFullYear();
  const weekOffset = rotationWeek - currentRotationWeek;
  const targetISOWeek = currentISOWeek + weekOffset;
  const monday = getMondayOfISOWeek(targetISOWeek, year);

  const dates: Record<number, string> = {};
  // dayOfWeek: 0=So, 1=Mo, ..., 6=Sa
  // Week runs Mo-So, so: Mo=+0, Di=+1, ..., Sa=+5, So=+6
  for (let dow = 0; dow <= 6; dow++) {
    const d = new Date(monday);
    const offset = dow === 0 ? 6 : dow - 1;
    d.setUTCDate(monday.getUTCDate() + offset);
    const dd = String(d.getUTCDate()).padStart(2, '0');
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    dates[dow] = `${dd}.${mm}.`;
  }
  return dates;
}

function RotationPage() {
  const searchParams = useSearchParams();
  const currentRotationWeek = ((getISOWeek(new Date()) - 1) % 6) + 1;
  const [selectedWeek, setSelectedWeek] = useState(parseInt(searchParams.get('week') || String(currentRotationWeek)));
  const [plan, setPlan] = useState<WeekPlan | null>(null);
  const [loading, setLoading] = useState(true);

  const dates = getDatesForWeek(selectedWeek, currentRotationWeek);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/plans?rotation=${selectedWeek}`)
      .then(r => r.json())
      .then(data => {
        setPlan(data);
        setLoading(false);
      });
  }, [selectedWeek]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">6-Wochen-Rotation</h1>
        <span className="text-sm text-primary-500">KW {getISOWeek(new Date()) + (selectedWeek - currentRotationWeek)}</span>
      </div>

      <div className="flex gap-2">
        {[1, 2, 3, 4, 5, 6].map((w) => (
          <button
            key={w}
            onClick={() => setSelectedWeek(w)}
            className={`px-4 py-2 rounded font-semibold transition-colors ${
              w === selectedWeek
                ? 'bg-blue-600 text-white'
                : w === currentRotationWeek
                  ? 'bg-accent-100 text-accent-800 hover:bg-accent-200 ring-1 ring-accent-400'
                  : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Woche {w}
            {w === currentRotationWeek && <span className="ml-1 text-xs opacity-70">●</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Lade Rotationsvorlage...</div>
      ) : plan ? (
        <WeekGrid days={plan.days} dates={dates} />
      ) : (
        <div className="text-center py-8 text-gray-500">Keine Vorlage gefunden</div>
      )}
    </div>
  );
}

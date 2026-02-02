'use client';

import MealCard from './MealCard';
import { DAY_NAMES } from '@/lib/constants';

interface Dish {
  id: number;
  name: string;
  allergens: string;
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

interface DayPlan {
  dayOfWeek: number;
  mittag: { city: MealSlot; sued: MealSlot };
  abend: { city: MealSlot; sued: MealSlot };
}

interface WeekGridProps {
  days: DayPlan[];
  paxCity?: string;
  paxSued?: string;
  compact?: boolean;
  year?: number;
  calendarWeek?: number;
  dates?: Record<number, string>;
}

export default function WeekGrid({ days, paxCity = '60', paxSued = '45', compact, year, calendarWeek, dates }: WeekGridProps) {
  return (
    <div className="space-y-4">
      {[...days].sort((a, b) => ((a.dayOfWeek || 7) - (b.dayOfWeek || 7))).map((day) => (
        <div key={day.dayOfWeek} className="border border-primary-200 rounded-card overflow-hidden shadow-card">
          {/* Day Header */}
          <div className="bg-gradient-to-r from-primary-800 to-primary-700 px-4 py-2 flex items-center justify-between">
            <span className="font-bold text-white text-sm tracking-wide">
              {DAY_NAMES[day.dayOfWeek]}
              {dates?.[day.dayOfWeek] && (
                <span className="ml-2 font-normal text-primary-300">{dates[day.dayOfWeek]}</span>
              )}
            </span>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-primary-300 bg-primary-900/30 px-2 py-0.5 rounded">
                City: {paxCity} PAX
              </span>
              <span className="text-[10px] text-primary-300 bg-primary-900/30 px-2 py-0.5 rounded">
                SÜD: {paxSued} PAX
              </span>
            </div>
          </div>

          {/* 4 MealCards */}
          <div className="grid grid-cols-4 gap-px bg-primary-100 p-px">
            <MealCard
              slot={day.mittag.city}
              title="City Mittag"
              pax={`${paxCity} PAX`}
              compact={compact}
              year={year}
              calendarWeek={calendarWeek}
              dayOfWeek={day.dayOfWeek}
              meal="mittag"
              location="city"
            />
            <MealCard
              slot={day.abend.city}
              title="City Abend"
              pax={`${paxCity} PAX`}
              compact={compact}
              year={year}
              calendarWeek={calendarWeek}
              dayOfWeek={day.dayOfWeek}
              meal="abend"
              location="city"
            />
            <MealCard
              slot={day.mittag.sued}
              title="SÜD Mittag"
              pax={`${paxSued} PAX`}
              compact={compact}
              year={year}
              calendarWeek={calendarWeek}
              dayOfWeek={day.dayOfWeek}
              meal="mittag"
              location="sued"
            />
            <MealCard
              slot={day.abend.sued}
              title="SÜD Abend"
              pax={`${paxSued} PAX`}
              compact={compact}
              year={year}
              calendarWeek={calendarWeek}
              dayOfWeek={day.dayOfWeek}
              meal="abend"
              location="sued"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

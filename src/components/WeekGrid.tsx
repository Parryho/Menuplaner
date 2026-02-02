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

interface DayPax {
  cityMittag: number;
  cityAbend: number;
  suedMittag: number;
  suedAbend: number;
}

interface WeekGridProps {
  days: DayPlan[];
  paxData?: Record<number, DayPax>;
  compact?: boolean;
  year?: number;
  calendarWeek?: number;
  dates?: Record<number, string>;
  onDishChange?: (dayOfWeek: number, meal: string, location: string, slotKey: string, dish: Dish | null) => void;
}

function paxLabel(count: number): string {
  return count > 0 ? `${count} PAX` : '-';
}

export default function WeekGrid({ days, paxData, compact, year, calendarWeek, dates, onDishChange }: WeekGridProps) {
  return (
    <div className="space-y-4">
      {[...days].sort((a, b) => ((a.dayOfWeek || 7) - (b.dayOfWeek || 7))).map((day) => {
        const pax = paxData?.[day.dayOfWeek];
        const cityTotal = (pax?.cityMittag || 0) + (pax?.cityAbend || 0);
        const suedTotal = (pax?.suedMittag || 0) + (pax?.suedAbend || 0);

        return (
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
                <span className={`text-[10px] px-2 py-0.5 rounded ${cityTotal > 0 ? 'text-accent-300 bg-accent-900/30' : 'text-primary-300 bg-primary-900/30'}`}>
                  City: {cityTotal > 0 ? `${cityTotal} PAX` : 'keine Daten'}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded ${suedTotal > 0 ? 'text-accent-300 bg-accent-900/30' : 'text-primary-300 bg-primary-900/30'}`}>
                  SÜD: {suedTotal > 0 ? `${suedTotal} PAX` : 'keine Daten'}
                </span>
              </div>
            </div>

            {/* 4 MealCards */}
            <div className="grid grid-cols-4 gap-px bg-primary-100 p-px">
              <MealCard
                slot={day.mittag.city}
                title="City Mittag"
                pax={paxLabel(pax?.cityMittag || 0)}
                compact={compact}
                year={year}
                calendarWeek={calendarWeek}
                dayOfWeek={day.dayOfWeek}
                meal="mittag"
                location="city"
                onDishChange={onDishChange && ((slotKey, dish) => onDishChange(day.dayOfWeek, 'mittag', 'city', slotKey, dish))}
              />
              <MealCard
                slot={day.abend.city}
                title="City Abend"
                pax={paxLabel(pax?.cityAbend || 0)}
                compact={compact}
                year={year}
                calendarWeek={calendarWeek}
                dayOfWeek={day.dayOfWeek}
                meal="abend"
                location="city"
                onDishChange={onDishChange && ((slotKey, dish) => onDishChange(day.dayOfWeek, 'abend', 'city', slotKey, dish))}
              />
              <MealCard
                slot={day.mittag.sued}
                title="SÜD Mittag"
                pax={paxLabel(pax?.suedMittag || 0)}
                compact={compact}
                year={year}
                calendarWeek={calendarWeek}
                dayOfWeek={day.dayOfWeek}
                meal="mittag"
                location="sued"
                onDishChange={onDishChange && ((slotKey, dish) => onDishChange(day.dayOfWeek, 'mittag', 'sued', slotKey, dish))}
              />
              <MealCard
                slot={day.abend.sued}
                title="SÜD Abend"
                pax={paxLabel(pax?.suedAbend || 0)}
                compact={compact}
                year={year}
                calendarWeek={calendarWeek}
                dayOfWeek={day.dayOfWeek}
                meal="abend"
                location="sued"
                onDishChange={onDishChange && ((slotKey, dish) => onDishChange(day.dayOfWeek, 'abend', 'sued', slotKey, dish))}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

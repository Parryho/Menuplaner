'use client';

import MealCard from './MealCard';
import { DAY_NAMES } from '@/lib/constants';
import type { Dish, DayPlan } from '@/lib/types';

interface WeekGridProps {
  days: DayPlan[];
  compact?: boolean;
  year?: number;
  calendarWeek?: number;
  dates?: Record<number, string>;
  onDishChange?: (dayOfWeek: number, meal: string, location: string, slotKey: string, dish: Dish | null) => void;
  activeDragCategory?: string | null;
}

export default function WeekGrid({ days, compact, year, calendarWeek, dates, onDishChange, activeDragCategory }: WeekGridProps) {
  return (
    <div className="space-y-4">
      {[...days].sort((a, b) => ((a.dayOfWeek || 7) - (b.dayOfWeek || 7))).map((day) => {
        return (
          <div key={day.dayOfWeek} className="border border-primary-200 rounded-card overflow-hidden shadow-card">
            {/* Day Header */}
            <div className="bg-gradient-to-r from-primary-800 to-primary-700 px-4 py-2">
              <span className="font-bold text-white text-sm tracking-wide">
                {DAY_NAMES[day.dayOfWeek]}
                {dates?.[day.dayOfWeek] && (
                  <span className="ml-2 font-normal text-primary-300">{dates[day.dayOfWeek]}</span>
                )}
              </span>
            </div>

            {/* 4 MealCards */}
            <div className="grid grid-cols-4 gap-px bg-primary-100 p-px">
              <MealCard
                slot={day.mittag.city}
                title="City Mittag"
                compact={compact}
                year={year}
                calendarWeek={calendarWeek}
                dayOfWeek={day.dayOfWeek}
                meal="mittag"
                location="city"
                activeDragCategory={activeDragCategory}
                onDishChange={onDishChange && ((slotKey, dish) => onDishChange(day.dayOfWeek, 'mittag', 'city', slotKey, dish))}
              />
              <MealCard
                slot={day.abend.city}
                title="City Abend"
                compact={compact}
                year={year}
                calendarWeek={calendarWeek}
                dayOfWeek={day.dayOfWeek}
                meal="abend"
                location="city"
                activeDragCategory={activeDragCategory}
                onDishChange={onDishChange && ((slotKey, dish) => onDishChange(day.dayOfWeek, 'abend', 'city', slotKey, dish))}
              />
              <MealCard
                slot={day.mittag.sued}
                title="SÜD Mittag"
                compact={compact}
                year={year}
                calendarWeek={calendarWeek}
                dayOfWeek={day.dayOfWeek}
                meal="mittag"
                location="sued"
                activeDragCategory={activeDragCategory}
                onDishChange={onDishChange && ((slotKey, dish) => onDishChange(day.dayOfWeek, 'mittag', 'sued', slotKey, dish))}
              />
              <MealCard
                slot={day.abend.sued}
                title="SÜD Abend"
                compact={compact}
                year={year}
                calendarWeek={calendarWeek}
                dayOfWeek={day.dayOfWeek}
                meal="abend"
                location="sued"
                activeDragCategory={activeDragCategory}
                onDishChange={onDishChange && ((slotKey, dish) => onDishChange(day.dayOfWeek, 'abend', 'sued', slotKey, dish))}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { DndContext, DragOverlay, MouseSensor, TouchSensor, useSensor, useSensors, type DragStartEvent, type DragEndEvent } from '@dnd-kit/core';
import WeekGrid from '@/components/WeekGrid';
import { getISOWeek, getSlotCategory } from '@/lib/constants';
import { api } from '@/lib/api-client';
import type { Dish, WeekPlan, DragData } from '@/lib/types';

export default function WochenplanPageWrapper() {
  return <Suspense fallback={<div className="text-center py-8 text-primary-500">Lade...</div>}><WochenplanPage /></Suspense>;
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
  const now = new Date();
  const [year, setYear] = useState(parseInt(searchParams.get('year') || now.getFullYear().toString()));
  const [week, setWeek] = useState(parseInt(searchParams.get('week') || String(getISOWeek(now))));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDrag, setActiveDrag] = useState<DragData | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { distance: 5 } }),
  );

  const weekDates = getWeekDates(year, week);

  useEffect(() => {
    setLoading(true);
    setError(null);

    api.get<WeekPlan>(`/api/plans?year=${year}&week=${week}`)
      .then(planData => {
        setPlan(planData);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load week plan:', err);
        setError(err instanceof Error ? err.message : 'Fehler beim Laden des Wochenplans');
        setLoading(false);
      });
  }, [year, week]);

  const rotationWeek = ((week - 1) % 6) + 1;

  // Navigate to current week
  const goToCurrentWeek = () => {
    const now = new Date();
    setYear(now.getFullYear());
    setWeek(getISOWeek(now));
  };

  const handleDishChange = useCallback((dayOfWeek: number, meal: string, location: string, slotKey: string, dish: Dish | null) => {
    // Store previous state for rollback
    const prevPlan = plan;

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
    api.put('/api/plans', {
      year,
      calendarWeek: week,
      dayOfWeek,
      meal,
      location,
      slot: slotKey,
      dishId: dish?.id || null,
    }).catch(err => {
      console.error('Failed to update dish:', err);
      // Revert optimistic update on error
      setPlan(prevPlan);
      setError(err instanceof Error ? err.message : 'Fehler beim Speichern');
    });
  }, [year, week, plan]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const data = event.active.data.current as DragData | undefined;
    if (data) setActiveDrag(data);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveDrag(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const src = active.data.current as DragData | undefined;
    const dst = over.data.current as DragData | undefined;
    if (!src || !dst) return;

    // Only allow swapping same category
    if (getSlotCategory(src.slotKey) !== getSlotCategory(dst.slotKey)) return;

    // Store previous state for rollback
    const prevPlan = plan;

    // Optimistic UI: swap both dishes
    setPlan(prev => {
      if (!prev) return prev;
      const days = prev.days.map(day => {
        let d = day;
        // Apply src dish → dst position
        if (day.dayOfWeek === dst.dayOfWeek) {
          const mealKey = dst.meal as 'mittag' | 'abend';
          const locKey = dst.location as 'city' | 'sued';
          d = {
            ...d,
            [mealKey]: {
              ...d[mealKey],
              [locKey]: { ...d[mealKey][locKey], [dst.slotKey]: src.dish },
            },
          };
        }
        // Apply dst dish → src position
        if (d.dayOfWeek === src.dayOfWeek) {
          const mealKey = src.meal as 'mittag' | 'abend';
          const locKey = src.location as 'city' | 'sued';
          d = {
            ...d,
            [mealKey]: {
              ...d[mealKey],
              [locKey]: { ...d[mealKey][locKey], [src.slotKey]: dst.dish },
            },
          };
        }
        return d;
      });
      return { ...prev, days };
    });

    // Persist both changes to API
    Promise.all([
      api.put('/api/plans', {
        year, calendarWeek: week,
        dayOfWeek: dst.dayOfWeek, meal: dst.meal, location: dst.location,
        slot: dst.slotKey, dishId: src.dish?.id || null,
      }),
      api.put('/api/plans', {
        year, calendarWeek: week,
        dayOfWeek: src.dayOfWeek, meal: src.meal, location: src.location,
        slot: src.slotKey, dishId: dst.dish?.id || null,
      })
    ]).catch(err => {
      console.error('Failed to swap dishes:', err);
      // Revert optimistic update on error
      setPlan(prevPlan);
      setError(err instanceof Error ? err.message : 'Fehler beim Tauschen der Gerichte');
    });
  }, [year, week, plan]);

  return (
    <div className="space-y-5">
      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-red-900">Fehler</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-600 transition-colors"
            aria-label="Schließen"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

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
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <WeekGrid days={plan.days} year={year} calendarWeek={week} dates={weekDates} onDishChange={handleDishChange} activeDragCategory={activeDrag ? getSlotCategory(activeDrag.slotKey) : null} />
          <DragOverlay dropAnimation={null}>
            {activeDrag?.dish ? (
              <div className="bg-white border border-accent-400 rounded px-2 py-1 text-xs shadow-lg font-medium text-primary-900 max-w-48 truncate">
                {activeDrag.dish.name}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <div className="text-center py-16 bg-white rounded-card shadow-card border border-primary-100">
          <div className="text-primary-400 text-lg mb-2">Kein Plan gefunden</div>
          <div className="text-primary-500 text-sm">Wochenplan wird aus der Rotation generiert.</div>
        </div>
      )}
    </div>
  );
}

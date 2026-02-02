'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import AllergenBadge from './AllergenBadge';

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

interface TempData {
  [slot: string]: { core: string; serving: string };
}

interface MealCardProps {
  slot: MealSlot;
  title: string;
  pax?: string;
  compact?: boolean;
  year?: number;
  calendarWeek?: number;
  dayOfWeek?: number;
  meal?: string;
  location?: string;
  temperatures?: TempData;
  onTempChange?: (slot: string, core: string, serving: string) => void;
  onDishChange?: (slotKey: string, dish: Dish | null) => void;
}

// Map slot keys to dish categories for filtering
function getCategoriesForSlot(slotKey: string): string[] {
  switch (slotKey) {
    case 'soup': return ['suppe'];
    case 'main1': case 'main2': return ['fleisch', 'fisch', 'vegetarisch'];
    case 'side1a': case 'side1b': case 'side2a': case 'side2b': return ['beilage'];
    case 'dessert': return ['dessert'];
    default: return [];
  }
}

// Dish cache per category combo to avoid refetching
const dishCache: Record<string, Dish[]> = {};

async function fetchDishesForSlot(slotKey: string): Promise<Dish[]> {
  const categories = getCategoriesForSlot(slotKey);
  const cacheKey = categories.join(',');
  if (dishCache[cacheKey]) return dishCache[cacheKey];

  const results = await Promise.all(
    categories.map(cat => fetch(`/api/dishes?category=${cat}`).then(r => r.json()))
  );
  const dishes: Dish[] = results.flat();
  dishes.sort((a, b) => a.name.localeCompare(b.name));
  dishCache[cacheKey] = dishes;
  return dishes;
}

function DishDropdown({ slotKey, currentDish, onSelect, onClose }: {
  slotKey: string;
  currentDish: Dish | null;
  onSelect: (dish: Dish | null) => void;
  onClose: () => void;
}) {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchDishesForSlot(slotKey).then(d => { setDishes(d); setLoading(false); });
  }, [slotKey]);

  useEffect(() => {
    if (!loading && inputRef.current) inputRef.current.focus();
  }, [loading]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  const filtered = dishes.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={ref} className="absolute z-50 left-0 top-full mt-0.5 w-64 bg-white border border-primary-200 rounded-lg shadow-lg max-h-60 flex flex-col">
      <div className="p-1.5 border-b border-primary-100">
        <input
          ref={inputRef}
          type="text"
          placeholder="Suchen..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full text-xs border border-primary-200 rounded px-2 py-1 focus:border-accent-500 focus:ring-1 focus:ring-accent-200 outline-none"
          onClick={e => e.stopPropagation()}
        />
      </div>
      <div className="overflow-y-auto flex-1">
        {loading ? (
          <div className="px-2 py-3 text-xs text-primary-400 text-center">Lade...</div>
        ) : (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); onSelect(null); }}
              className={`w-full text-left px-2 py-1 text-xs hover:bg-primary-50 transition-colors ${
                !currentDish ? 'text-accent-600 font-medium' : 'text-primary-400 italic'
              }`}
            >
              — Leer —
            </button>
            {filtered.map(d => (
              <button
                key={d.id}
                onClick={(e) => { e.stopPropagation(); onSelect(d); }}
                className={`w-full text-left px-2 py-1 text-xs hover:bg-accent-50 transition-colors flex items-center justify-between gap-1 ${
                  currentDish?.id === d.id ? 'bg-accent-50 text-accent-700 font-medium' : 'text-primary-800'
                }`}
              >
                <span className="truncate">{d.name}</span>
                {d.allergens && <span className="text-[9px] text-primary-400 flex-shrink-0">{d.allergens}</span>}
              </button>
            ))}
            {filtered.length === 0 && !loading && (
              <div className="px-2 py-3 text-xs text-primary-400 text-center">Keine Gerichte gefunden</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const ROWS: { key: keyof MealSlot; label: string; isMain: boolean }[] = [
  { key: 'soup', label: 'Suppe', isMain: false },
  { key: 'main1', label: 'Haupt 1', isMain: true },
  { key: 'side1a', label: 'Beilage', isMain: false },
  { key: 'side1b', label: 'Beilage', isMain: false },
  { key: 'main2', label: 'Haupt 2', isMain: true },
  { key: 'side2a', label: 'Beilage', isMain: false },
  { key: 'side2b', label: 'Beilage', isMain: false },
  { key: 'dessert', label: 'Dessert', isMain: false },
];

function InlineTempInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <input
      type="text"
      className="w-10 text-[10px] border border-primary-200 rounded px-0.5 py-0 text-center bg-white focus:border-accent-500 focus:ring-1 focus:ring-accent-200 outline-none transition-colors"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export default function MealCard({ slot, title, pax, compact, year, calendarWeek, dayOfWeek, meal, location, temperatures = {}, onTempChange, onDishChange }: MealCardProps) {
  const [temps, setTemps] = useState<TempData>(temperatures);
  const [saveTimer, setSaveTimer] = useState<Record<string, NodeJS.Timeout>>({});
  const [editingSlot, setEditingSlot] = useState<string | null>(null);

  const handleTempChange = useCallback((slotKey: string, field: 'core' | 'serving', value: string) => {
    setTemps(prev => {
      const current = prev[slotKey] || { core: '', serving: '' };
      const updated = { ...current, [field]: value };
      const newTemps = { ...prev, [slotKey]: updated };

      // Debounced save
      if (year && calendarWeek && dayOfWeek !== undefined && meal && location) {
        if (saveTimer[slotKey]) clearTimeout(saveTimer[slotKey]);
        const timer = setTimeout(() => {
          fetch('/api/temperatures', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              year,
              calendarWeek,
              dayOfWeek,
              meal,
              location,
              dishSlot: slotKey,
              tempCore: updated.core,
              tempServing: updated.serving,
            }),
          });
        }, 800);
        setSaveTimer(prev => ({ ...prev, [slotKey]: timer }));
      }

      onTempChange?.(slotKey, updated.core, updated.serving);
      return newTemps;
    });
  }, [year, calendarWeek, dayOfWeek, meal, location, saveTimer, onTempChange]);

  // Determine header color based on location
  const isCity = title.includes('City');
  const isMittag = title.includes('Mittag');

  return (
    <div className={`border border-primary-200 rounded-lg overflow-hidden ${compact ? 'text-[10px]' : 'text-xs'}`}>
      {/* Header */}
      <div className={`px-2 py-1.5 font-semibold text-center text-xs flex items-center justify-between ${
        isCity
          ? 'bg-primary-800 text-white'
          : 'bg-primary-600 text-white'
      }`}>
        <span className={`w-2 h-2 rounded-full ${isMittag ? 'bg-accent-400' : 'bg-primary-300'}`} />
        <span>{title}</span>
        {pax && <span className="font-normal text-primary-300 text-[10px]">{pax}</span>}
      </div>

      {/* Table */}
      <table className="w-full">
        <thead>
          <tr className="bg-primary-50 border-b border-primary-100">
            <th className="px-1.5 py-1 text-left font-semibold w-14 text-primary-600">Typ</th>
            <th className="px-1.5 py-1 text-left font-semibold text-primary-600">Gericht</th>
            <th className="px-1 py-1 text-center font-semibold w-10 text-primary-600">All.</th>
            <th className="px-1 py-1 text-center font-semibold w-[88px] text-primary-600">Temp.</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row, i) => {
            const dish = slot[row.key];
            const temp = temps[row.key] || { core: '', serving: '' };
            const isMainRow = row.isMain;

            return (
              <tr
                key={i}
                className={`border-b border-primary-50 transition-colors ${
                  isMainRow
                    ? 'bg-accent-50/40 hover:bg-accent-50'
                    : i % 2 === 0
                    ? 'bg-white hover:bg-primary-50/50'
                    : 'bg-primary-50/30 hover:bg-primary-50'
                }`}
              >
                <td className={`px-1.5 py-0.5 font-semibold ${isMainRow ? 'text-accent-700' : 'text-primary-500'}`}>
                  {row.label}
                </td>
                <td className={`px-1.5 py-0.5 relative ${isMainRow ? 'font-medium text-primary-900' : 'text-primary-700'}`}>
                  {onDishChange ? (
                    <span
                      className="cursor-pointer hover:text-accent-600 hover:underline decoration-accent-300 underline-offset-2 transition-colors"
                      onClick={() => setEditingSlot(editingSlot === row.key ? null : row.key)}
                    >
                      {dish?.name || <span className="text-primary-300 italic">— leer —</span>}
                    </span>
                  ) : (
                    dish?.name || <span className="text-primary-300">-</span>
                  )}
                  {editingSlot === row.key && onDishChange && (
                    <DishDropdown
                      slotKey={row.key}
                      currentDish={dish}
                      onSelect={(d) => {
                        onDishChange(row.key, d);
                        setEditingSlot(null);
                      }}
                      onClose={() => setEditingSlot(null)}
                    />
                  )}
                </td>
                <td className="px-1 py-0.5 text-center">
                  {dish?.allergens && <AllergenBadge codes={dish.allergens} />}
                </td>
                <td className="px-1 py-0.5 text-center">
                  <div className="flex items-center justify-center gap-0.5">
                    <InlineTempInput
                      value={temp.core}
                      onChange={(v) => handleTempChange(row.key, 'core', v)}
                      placeholder="__"
                    />
                    <span className="text-primary-300">/</span>
                    <InlineTempInput
                      value={temp.serving}
                      onChange={(v) => handleTempChange(row.key, 'serving', v)}
                      placeholder="__"
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

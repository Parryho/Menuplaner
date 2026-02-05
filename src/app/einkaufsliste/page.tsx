'use client';

import { useEffect, useState, useCallback } from 'react';
import { INGREDIENT_CATEGORIES, getISOWeek } from '@/lib/constants';

interface ShoppingItem {
  ingredient_id: number;
  name: string;
  total_quantity: number;
  unit: string;
  estimated_cost: number;
  supplier: string;
}

interface ShoppingCategory {
  category: string;
  items: ShoppingItem[];
  subtotal: number;
}

function formatQuantity(qty: number, unit: string): string {
  if (unit === 'g' && qty >= 1000) return `${(qty / 1000).toFixed(2)} kg`;
  if (unit === 'ml' && qty >= 1000) return `${(qty / 1000).toFixed(2)} l`;
  if (unit === 'stueck') return `${Math.round(qty)} Stk`;
  return `${qty % 1 === 0 ? qty : qty.toFixed(1)} ${unit}`;
}

function formatEuro(val: number): string {
  return new Intl.NumberFormat('de-AT', { style: 'currency', currency: 'EUR' }).format(val);
}

export default function EinkaufslistePage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [week, setWeek] = useState(getISOWeek(now));
  const [categories, setCategories] = useState<ShoppingCategory[]>([]);
  const [grandTotal, setGrandTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  const loadData = useCallback(() => {
    setLoading(true);
    fetch(`/api/einkaufsliste?year=${year}&week=${week}`)
      .then(r => r.json())
      .then(d => {
        setCategories(d.categories || []);
        setGrandTotal(d.grandTotal || 0);
        setLoading(false);
        setChecked({});
      })
      .catch(() => setLoading(false));
  }, [year, week]);

  useEffect(() => { loadData(); }, [loadData]);

  function toggleCollapse(cat: string) {
    setCollapsed(prev => ({ ...prev, [cat]: !prev[cat] }));
  }

  function toggleCheck(id: number) {
    setChecked(prev => ({ ...prev, [id]: !prev[id] }));
  }

  const checkedCount = Object.values(checked).filter(Boolean).length;
  const totalItems = categories.reduce((sum, c) => sum + c.items.length, 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-900">Einkaufsliste</h1>
          <p className="text-sm text-primary-500 mt-1">
            Aggregierte Wochenliste
            {totalItems > 0 && <span className="ml-2">({checkedCount}/{totalItems} erledigt)</span>}
          </p>
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
      </div>

      {/* Print header */}
      <div className="hidden print:block text-center mb-4">
        <h2 className="text-xl font-bold">Einkaufsliste KW {week}/{year}</h2>
      </div>

      {loading && <div className="text-center py-8 text-primary-400">Lade Daten...</div>}

      {!loading && categories.length === 0 && (
        <div className="text-center py-12 text-primary-400 bg-white rounded-card shadow-card border border-primary-100">
          Keine Plandaten f&uuml;r KW {week}/{year}
        </div>
      )}

      {/* Categories */}
      {categories.map(cat => (
        <div key={cat.category} className="bg-white rounded-card shadow-card border border-primary-100 overflow-hidden">
          <button
            onClick={() => toggleCollapse(cat.category)}
            className="w-full flex items-center justify-between px-5 py-3 bg-primary-50 hover:bg-primary-100 transition-colors print:bg-primary-100"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">{collapsed[cat.category] ? '\u25B6' : '\u25BC'}</span>
              <span className="font-bold text-primary-800">
                {INGREDIENT_CATEGORIES[cat.category] || cat.category}
              </span>
              <span className="text-xs text-primary-500">({cat.items.length} Artikel)</span>
            </div>
            <span className="font-bold text-primary-900">{formatEuro(cat.subtotal)}</span>
          </button>

          {!collapsed[cat.category] && (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-primary-500 border-b border-primary-100">
                  <th className="px-5 py-1.5 text-left w-8 print:hidden"></th>
                  <th className="px-3 py-1.5 text-left">Zutat</th>
                  <th className="px-3 py-1.5 text-right w-32">Menge</th>
                  <th className="px-3 py-1.5 text-right w-28">Gesch. Preis</th>
                  <th className="px-3 py-1.5 text-left w-28 print:hidden">Lieferant</th>
                </tr>
              </thead>
              <tbody>
                {cat.items.map(item => (
                  <tr
                    key={item.ingredient_id}
                    className={`border-b border-primary-50 transition-colors hover:bg-accent-50/20 ${
                      checked[item.ingredient_id] ? 'opacity-40 line-through' : ''
                    }`}
                  >
                    <td className="px-5 py-2 print:hidden">
                      <input
                        type="checkbox"
                        checked={!!checked[item.ingredient_id]}
                        onChange={() => toggleCheck(item.ingredient_id)}
                        className="w-4 h-4 rounded border-primary-300 text-accent-500 focus:ring-accent-500"
                      />
                    </td>
                    <td className="px-3 py-2 font-medium text-primary-900">{item.name}</td>
                    <td className="px-3 py-2 text-right font-mono text-primary-800">
                      {formatQuantity(item.total_quantity, item.unit)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-primary-600">
                      {item.estimated_cost > 0 ? formatEuro(item.estimated_cost) : '\u2014'}
                    </td>
                    <td className="px-3 py-2 text-primary-400 text-xs print:hidden">{item.supplier || '\u2014'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ))}

      {/* Grand total */}
      {categories.length > 0 && (
        <div className="bg-primary-800 text-white rounded-card shadow-elevated px-5 py-4 flex items-center justify-between">
          <span className="font-bold text-lg">Gesamt (gesch.)</span>
          <span className="font-bold text-2xl">{formatEuro(grandTotal)}</span>
        </div>
      )}
    </div>
  );
}

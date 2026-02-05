'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import { INGREDIENT_CATEGORIES, UNITS } from '@/lib/constants';

interface Ingredient {
  id: number;
  name: string;
  category: string;
  unit: string;
  price_per_unit: number;
  price_unit: string;
  supplier: string;
}

const CATEGORY_KEYS = Object.keys(INGREDIENT_CATEGORIES);

export default function ZutatenPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Ingredient | null>(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', category: 'gemuese', unit: 'kg', price_per_unit: 0, price_unit: 'kg', supplier: '',
  });

  useEffect(() => { loadIngredients(); }, []);

  async function loadIngredients() {
    try {
      const data = await api.get<Ingredient[]>('/api/ingredients');
      setIngredients(data);
      setError('');
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleSave() {
    try {
      const body = editItem ? { ...form, id: editItem.id } : form;
      if (editItem) {
        await api.put('/api/ingredients', body);
      } else {
        await api.post('/api/ingredients', body);
      }
      loadIngredients();
      setShowForm(false);
      setEditItem(null);
      setForm({ name: '', category: 'gemuese', unit: 'kg', price_per_unit: 0, price_unit: 'kg', supplier: '' });
      setError('');
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Zutat wirklich löschen?')) return;
    try {
      await api.delete(`/api/ingredients?id=${id}`);
      loadIngredients();
      setError('');
    } catch (err) {
      setError((err as Error).message);
    }
  }

  function startEdit(item: Ingredient) {
    setEditItem(item);
    setForm({
      name: item.name,
      category: item.category,
      unit: item.unit,
      price_per_unit: item.price_per_unit,
      price_unit: item.price_unit,
      supplier: item.supplier,
    });
    setShowForm(true);
  }

  const filtered = ingredients
    .filter(i => !filter || i.category === filter)
    .filter(i => !search || i.name.toLowerCase().includes(search.toLowerCase()));

  const counts: Record<string, number> = {};
  ingredients.forEach(i => { counts[i.category] = (counts[i.category] || 0) + 1; });

  return (
    <div className="space-y-5">
      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-500 hover:text-red-700 font-bold">×</button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-900">Zutaten-Stammdaten</h1>
          <p className="text-sm text-primary-500 mt-1">{ingredients.length} Zutaten in der Datenbank</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditItem(null); setForm({ name: '', category: 'gemuese', unit: 'kg', price_per_unit: 0, price_unit: 'kg', supplier: '' }); }}
          className="flex items-center gap-2 bg-accent-500 text-primary-900 px-5 py-2.5 rounded-lg hover:bg-accent-400 font-semibold transition-colors shadow-sm"
        >
          <span className="text-lg">+</span>
          Neue Zutat
        </button>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            !filter ? 'bg-accent-500 text-primary-900 shadow-md' : 'bg-white border border-primary-200 text-primary-600 hover:border-primary-400'
          }`}
        >
          Alle ({ingredients.length})
        </button>
        {CATEGORY_KEYS.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(filter === cat ? '' : cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === cat ? 'bg-accent-500 text-primary-900 shadow-md' : 'bg-white border border-primary-200 text-primary-600 hover:border-primary-400'
            }`}
          >
            {INGREDIENT_CATEGORIES[cat]} ({counts[cat] || 0})
          </button>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-card shadow-card border border-primary-100 p-5 space-y-4">
          <h3 className="font-bold text-primary-900 text-lg">
            {editItem ? 'Zutat bearbeiten' : 'Neue Zutat anlegen'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Name der Zutat"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="border border-primary-200 rounded-lg px-4 py-2.5 focus:border-accent-500 focus:ring-2 focus:ring-accent-100 outline-none transition-colors"
            />
            <select
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}
              className="border border-primary-200 rounded-lg px-4 py-2.5 focus:border-accent-500 focus:ring-2 focus:ring-accent-100 outline-none transition-colors"
            >
              {CATEGORY_KEYS.map(cat => (
                <option key={cat} value={cat}>{INGREDIENT_CATEGORIES[cat]}</option>
              ))}
            </select>
            <select
              value={form.unit}
              onChange={e => setForm({ ...form, unit: e.target.value })}
              className="border border-primary-200 rounded-lg px-4 py-2.5 focus:border-accent-500 focus:ring-2 focus:ring-accent-100 outline-none transition-colors"
            >
              {Object.entries(UNITS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.01"
                placeholder="Preis"
                value={form.price_per_unit || ''}
                onChange={e => setForm({ ...form, price_per_unit: parseFloat(e.target.value) || 0 })}
                className="border border-primary-200 rounded-lg px-4 py-2.5 w-full focus:border-accent-500 focus:ring-2 focus:ring-accent-100 outline-none transition-colors"
              />
              <span className="text-primary-500 text-sm whitespace-nowrap">EUR /</span>
              <select
                value={form.price_unit}
                onChange={e => setForm({ ...form, price_unit: e.target.value })}
                className="border border-primary-200 rounded-lg px-3 py-2.5 focus:border-accent-500 focus:ring-2 focus:ring-accent-100 outline-none transition-colors"
              >
                {Object.entries(UNITS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <input
              type="text"
              placeholder="Lieferant (optional)"
              value={form.supplier}
              onChange={e => setForm({ ...form, supplier: e.target.value })}
              className="border border-primary-200 rounded-lg px-4 py-2.5 focus:border-accent-500 focus:ring-2 focus:ring-accent-100 outline-none transition-colors"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              className="bg-accent-500 text-primary-900 px-6 py-2.5 rounded-lg hover:bg-accent-400 font-semibold transition-colors shadow-sm"
            >
              Speichern
            </button>
            <button
              onClick={() => { setShowForm(false); setEditItem(null); }}
              className="bg-primary-100 text-primary-700 px-6 py-2.5 rounded-lg hover:bg-primary-200 font-medium transition-colors"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Zutaten suchen..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-white border border-primary-200 rounded-lg px-4 py-2.5 pl-10 focus:border-accent-500 focus:ring-2 focus:ring-accent-100 outline-none transition-colors shadow-card"
        />
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-400">&#8981;</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-card shadow-card border border-primary-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-primary-50 border-b border-primary-200">
              <th className="px-4 py-3 text-left font-semibold text-primary-700">Name</th>
              <th className="px-4 py-3 text-left font-semibold text-primary-700 w-40">Kategorie</th>
              <th className="px-4 py-3 text-center font-semibold text-primary-700 w-20">Einheit</th>
              <th className="px-4 py-3 text-right font-semibold text-primary-700 w-32">Preis</th>
              <th className="px-4 py-3 text-left font-semibold text-primary-700 w-32">Lieferant</th>
              <th className="px-4 py-3 text-right font-semibold text-primary-700 w-40">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item, i) => (
              <tr key={item.id} className={`border-b border-primary-50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-primary-50/30'} hover:bg-accent-50/30`}>
                <td className="px-4 py-2.5 font-medium text-primary-900">{item.name}</td>
                <td className="px-4 py-2.5 text-xs text-primary-600">
                  {INGREDIENT_CATEGORIES[item.category] || item.category}
                </td>
                <td className="px-4 py-2.5 text-center text-primary-600">
                  {UNITS[item.unit] || item.unit}
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-primary-900">
                  {item.price_per_unit > 0
                    ? `${item.price_per_unit.toFixed(2)} \u20AC/${UNITS[item.price_unit] || item.price_unit}`
                    : '\u2014'}
                </td>
                <td className="px-4 py-2.5 text-primary-500 text-xs">{item.supplier || '\u2014'}</td>
                <td className="px-4 py-2.5 text-right">
                  <button
                    onClick={() => startEdit(item)}
                    className="text-xs px-3 py-1 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors mr-2 font-medium"
                  >
                    Bearbeiten
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-xs px-3 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium"
                  >
                    L\u00f6schen
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-primary-400">
            Keine Zutaten gefunden
          </div>
        )}
      </div>
    </div>
  );
}

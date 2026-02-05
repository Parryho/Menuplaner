'use client';

import { useEffect, useState } from 'react';
import AllergenBadge from '@/components/AllergenBadge';
import RecipeEditor from '@/components/RecipeEditor';
import { api } from '@/lib/api-client';
import type { DishFull } from '@/lib/types';

type Dish = DishFull;

const CATEGORIES = [
  { value: 'suppe', label: 'Suppen', icon: '🍜' },
  { value: 'fleisch', label: 'Fleisch', icon: '🥩' },
  { value: 'fisch', label: 'Fisch', icon: '🐟' },
  { value: 'vegetarisch', label: 'Vegetarisch', icon: '🥬' },
  { value: 'beilage', label: 'Beilagen', icon: '🍚' },
  { value: 'dessert', label: 'Desserts', icon: '🍰' },
];

interface ImportResult {
  name: string;
  ingredients: string[];
  allergens: string;
  category: string;
  instructions: string;
  prepTime: number;
  imageUrl: string;
  existingDishId: number | null;
  source: string;
}

export default function GerichtePage() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editDish, setEditDish] = useState<Dish | null>(null);
  const [form, setForm] = useState({ name: '', category: 'suppe', allergens: '', season: 'all' });
  const [recipeDish, setRecipeDish] = useState<{ id: number; name: string } | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importError, setImportError] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadDishes();
  }, []);

  async function loadDishes() {
    try {
      const data = await api.get<Dish[]>('/api/dishes');
      setDishes(data);
      setError('');
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleSave() {
    try {
      const body = editDish ? { ...form, id: editDish.id } : form;
      if (editDish) {
        await api.put('/api/dishes', body);
      } else {
        await api.post('/api/dishes', body);
      }
      loadDishes();
      setShowForm(false);
      setEditDish(null);
      setForm({ name: '', category: 'suppe', allergens: '', season: 'all' });
      setError('');
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Gericht wirklich löschen?')) return;
    try {
      await api.delete(`/api/dishes?id=${id}`);
      loadDishes();
      setError('');
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleImport() {
    if (!importUrl.trim()) return;
    setImporting(true);
    setImportError('');
    setImportResult(null);
    try {
      const data = await api.post<ImportResult>('/api/recipe-import', { url: importUrl.trim() });
      setImportResult(data);
    } catch (err) {
      setImportError((err as Error).message);
    } finally {
      setImporting(false);
    }
  }

  async function saveImportedDish() {
    if (!importResult) return;
    try {
      await api.post('/api/dishes', {
        name: importResult.name,
        category: importResult.category,
        allergens: importResult.allergens,
        season: 'all',
      });
      loadDishes();
      setImportResult(null);
      setImportUrl('');
      setShowImport(false);
    } catch (err) {
      setImportError((err as Error).message);
    }
  }

  function startEdit(dish: Dish) {
    setEditDish(dish);
    setForm({ name: dish.name, category: dish.category, allergens: dish.allergens, season: dish.season });
    setShowForm(true);
  }

  const filtered = dishes
    .filter(d => !filter || d.category === filter)
    .filter(d => !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.allergens.toLowerCase().includes(search.toLowerCase()));

  // Category counts
  const counts: Record<string, number> = {};
  dishes.forEach(d => { counts[d.category] = (counts[d.category] || 0) + 1; });

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
          <h1 className="text-2xl font-bold text-primary-900">Gerichte</h1>
          <p className="text-sm text-primary-500 mt-1">{dishes.length} Gerichte in der Datenbank</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowImport(!showImport); setImportResult(null); setImportError(''); }}
            className="flex items-center gap-2 bg-primary-100 text-primary-700 px-4 py-2.5 rounded-lg hover:bg-primary-200 font-semibold transition-colors"
          >
            URL Import
          </button>
          <button
            onClick={() => { setShowForm(true); setEditDish(null); setForm({ name: '', category: 'suppe', allergens: '', season: 'all' }); }}
            className="flex items-center gap-2 bg-accent-500 text-primary-900 px-5 py-2.5 rounded-lg hover:bg-accent-400 font-semibold transition-colors shadow-sm"
          >
            <span className="text-lg">+</span>
            Neues Gericht
          </button>
        </div>
      </div>

      {/* Category Stats */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {CATEGORIES.map(c => (
          <button
            key={c.value}
            onClick={() => setFilter(filter === c.value ? '' : c.value)}
            className={`p-3 rounded-card border-2 transition-all text-center ${
              filter === c.value
                ? 'bg-accent-50 border-accent-500 shadow-md'
                : 'bg-white border-primary-100 hover:border-primary-300 shadow-card'
            }`}
          >
            <div className="text-xl mb-1">{c.icon}</div>
            <div className={`text-xs font-semibold ${filter === c.value ? 'text-accent-700' : 'text-primary-700'}`}>
              {c.label}
            </div>
            <div className={`text-lg font-bold mt-0.5 ${filter === c.value ? 'text-accent-600' : 'text-primary-900'}`}>
              {counts[c.value] || 0}
            </div>
          </button>
        ))}
      </div>

      {/* URL Import */}
      {showImport && (
        <div className="bg-white rounded-card shadow-card border border-primary-100 p-5 space-y-4">
          <h3 className="font-bold text-primary-900 text-lg">Rezept von URL importieren</h3>
          <div className="flex gap-3">
            <input
              type="url"
              placeholder="https://www.chefkoch.de/rezepte/..."
              value={importUrl}
              onChange={e => setImportUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleImport()}
              className="flex-1 border border-primary-200 rounded-lg px-4 py-2.5 focus:border-accent-500 focus:ring-2 focus:ring-accent-100 outline-none transition-colors"
            />
            <button
              onClick={handleImport}
              disabled={importing || !importUrl.trim()}
              className="bg-accent-500 text-primary-900 px-6 py-2.5 rounded-lg hover:bg-accent-400 font-semibold transition-colors shadow-sm disabled:opacity-50"
            >
              {importing ? 'Importiere...' : 'Importieren'}
            </button>
          </div>
          <p className="text-xs text-primary-400">Unterstützt Rezept-Websites mit strukturierten Daten (Chefkoch, Gutekueche, etc.)</p>
          {importError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{importError}</div>
          )}
          {importResult && (
            <div className="border border-primary-200 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-4">
                {importResult.imageUrl && (
                  <img src={importResult.imageUrl} alt="" className="w-24 h-24 object-cover rounded-lg flex-shrink-0" />
                )}
                <div className="flex-1 space-y-2">
                  <div className="font-bold text-primary-900 text-lg">{importResult.name}</div>
                  <div className="flex gap-2 flex-wrap">
                    <span className="text-xs px-2 py-0.5 bg-primary-100 rounded capitalize">{importResult.category}</span>
                    {importResult.allergens && <span className="text-xs px-2 py-0.5 bg-amber-50 text-amber-700 rounded font-mono">{importResult.allergens}</span>}
                    {importResult.prepTime > 0 && <span className="text-xs px-2 py-0.5 bg-primary-50 rounded">{importResult.prepTime} Min.</span>}
                  </div>
                  {importResult.ingredients.length > 0 && (
                    <div className="text-xs text-primary-600">
                      <span className="font-medium">{importResult.ingredients.length} Zutaten:</span>{' '}
                      {importResult.ingredients.slice(0, 8).join(', ')}
                      {importResult.ingredients.length > 8 && '...'}
                    </div>
                  )}
                  {importResult.existingDishId && (
                    <div className="text-xs text-amber-600 font-medium">Gericht existiert bereits in der Datenbank</div>
                  )}
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={saveImportedDish}
                  disabled={!!importResult.existingDishId}
                  className="bg-accent-500 text-primary-900 px-5 py-2 rounded-lg hover:bg-accent-400 font-semibold transition-colors text-sm disabled:opacity-50"
                >
                  Als Gericht speichern
                </button>
                <button
                  onClick={() => setImportResult(null)}
                  className="bg-primary-100 text-primary-700 px-5 py-2 rounded-lg hover:bg-primary-200 font-medium transition-colors text-sm"
                >
                  Verwerfen
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-card shadow-card border border-primary-100 p-5 space-y-4">
          <h3 className="font-bold text-primary-900 text-lg">
            {editDish ? 'Gericht bearbeiten' : 'Neues Gericht anlegen'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Name des Gerichts"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="border border-primary-200 rounded-lg px-4 py-2.5 md:col-span-2 focus:border-accent-500 focus:ring-2 focus:ring-accent-100 outline-none transition-colors"
            />
            <select
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}
              className="border border-primary-200 rounded-lg px-4 py-2.5 focus:border-accent-500 focus:ring-2 focus:ring-accent-100 outline-none transition-colors"
            >
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <input
              type="text"
              placeholder="Allergene (z.B. ACG)"
              value={form.allergens}
              onChange={e => setForm({ ...form, allergens: e.target.value.toUpperCase() })}
              className="border border-primary-200 rounded-lg px-4 py-2.5 focus:border-accent-500 focus:ring-2 focus:ring-accent-100 outline-none transition-colors font-mono"
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
              onClick={() => { setShowForm(false); setEditDish(null); }}
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
          placeholder="Gerichte suchen..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-white border border-primary-200 rounded-lg px-4 py-2.5 pl-10 focus:border-accent-500 focus:ring-2 focus:ring-accent-100 outline-none transition-colors shadow-card"
        />
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-400">⌕</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-card shadow-card border border-primary-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-primary-50 border-b border-primary-200">
              <th className="px-4 py-3 text-left font-semibold text-primary-700">Name</th>
              <th className="px-4 py-3 text-left font-semibold text-primary-700 w-32">Kategorie</th>
              <th className="px-4 py-3 text-center font-semibold text-primary-700 w-24">Allergene</th>
              <th className="px-4 py-3 text-center font-semibold text-primary-700 w-20">Saison</th>
              <th className="px-4 py-3 text-right font-semibold text-primary-700 w-40">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((dish, i) => (
              <tr key={dish.id} className={`border-b border-primary-50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-primary-50/30'} hover:bg-accent-50/30`}>
                <td className="px-4 py-2.5 font-medium text-primary-900">{dish.name}</td>
                <td className="px-4 py-2.5">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                    dish.category === 'fleisch' ? 'bg-red-50 text-red-700' :
                    dish.category === 'fisch' ? 'bg-blue-50 text-blue-700' :
                    dish.category === 'vegetarisch' ? 'bg-green-50 text-green-700' :
                    dish.category === 'suppe' ? 'bg-orange-50 text-orange-700' :
                    dish.category === 'dessert' ? 'bg-pink-50 text-pink-700' :
                    'bg-primary-50 text-primary-700'
                  }`}>
                    {CATEGORIES.find(c => c.value === dish.category)?.icon}
                    <span className="capitalize">{dish.category}</span>
                  </span>
                </td>
                <td className="px-4 py-2.5 text-center">
                  <AllergenBadge codes={dish.allergens} />
                </td>
                <td className="px-4 py-2.5 text-center">
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    dish.season === 'summer' ? 'bg-yellow-50 text-yellow-700' :
                    dish.season === 'winter' ? 'bg-blue-50 text-blue-700' :
                    'bg-primary-50 text-primary-500'
                  }`}>
                    {dish.season === 'all' ? 'Ganzjährig' : dish.season === 'summer' ? 'Sommer' : 'Winter'}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <button
                    onClick={() => setRecipeDish({ id: dish.id, name: dish.name })}
                    className="text-xs px-3 py-1 bg-accent-50 text-accent-700 rounded-lg hover:bg-accent-100 transition-colors mr-2 font-medium"
                  >
                    Rezept
                  </button>
                  <button
                    onClick={() => startEdit(dish)}
                    className="text-xs px-3 py-1 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors mr-2 font-medium"
                  >
                    Bearbeiten
                  </button>
                  <button
                    onClick={() => handleDelete(dish.id)}
                    className="text-xs px-3 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium"
                  >
                    L&ouml;schen
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-primary-400">
            Keine Gerichte gefunden
          </div>
        )}
      </div>
      {/* Recipe Editor Modal */}
      {recipeDish && (
        <RecipeEditor
          dishId={recipeDish.id}
          dishName={recipeDish.name}
          onClose={() => setRecipeDish(null)}
        />
      )}
    </div>
  );
}

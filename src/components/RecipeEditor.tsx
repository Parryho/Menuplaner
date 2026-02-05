'use client';

import { useEffect, useState, useCallback } from 'react';
import { UNITS } from '@/lib/constants';
import { api } from '@/lib/api-client';
import IngredientSearch from './IngredientSearch';

interface RecipeItem {
  id: number;
  dish_id: number;
  ingredient_id: number;
  ingredient_name: string;
  ingredient_category: string;
  quantity: number;
  unit: string;
  preparation_note: string;
  sort_order: number;
  price_per_unit: number;
  price_unit: string;
}

interface DishInfo {
  id: number;
  name: string;
  prep_instructions: string;
  prep_time_minutes: number;
}

interface RecipeEditorProps {
  dishId: number;
  dishName: string;
  onClose: () => void;
}

function calculateItemCost(quantity: number, unit: string, pricePerUnit: number, priceUnit: string): number {
  let qty = quantity;
  // Convert to price unit
  if (unit === 'g' && priceUnit === 'kg') qty = quantity / 1000;
  else if (unit === 'kg' && priceUnit === 'g') qty = quantity * 1000;
  else if (unit === 'ml' && priceUnit === 'l') qty = quantity / 1000;
  else if (unit === 'l' && priceUnit === 'ml') qty = quantity * 1000;
  return qty * pricePerUnit;
}

function formatEuro(val: number): string {
  return new Intl.NumberFormat('de-AT', { style: 'currency', currency: 'EUR' }).format(val);
}

export default function RecipeEditor({ dishId, dishName, onClose }: RecipeEditorProps) {
  const [items, setItems] = useState<RecipeItem[]>([]);
  const [, setDish] = useState<DishInfo | null>(null);
  const [prepInstructions, setPrepInstructions] = useState('');
  const [prepTime, setPrepTime] = useState(0);
  const [newQuantity, setNewQuantity] = useState(100);
  const [newUnit, setNewUnit] = useState('g');
  const [newNote, setNewNote] = useState('');
  const [pendingIngredient, setPendingIngredient] = useState<{ id: number; name: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadRecipe = useCallback(() => {
    setError('');
    api.get<{ items: RecipeItem[]; dish?: DishInfo }>(`/api/recipes?dishId=${dishId}`)
      .then(data => {
        setItems(data.items || []);
        if (data.dish) {
          setDish(data.dish);
          setPrepInstructions(data.dish.prep_instructions || '');
          setPrepTime(data.dish.prep_time_minutes || 0);
        }
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'Fehler beim Laden des Rezepts');
      });
  }, [dishId]);

  useEffect(() => { loadRecipe(); }, [loadRecipe]);

  async function addItem() {
    if (!pendingIngredient) return;
    setSaving(true);
    setError('');
    try {
      await api.post('/api/recipes', {
        dish_id: dishId,
        ingredient_id: pendingIngredient.id,
        quantity: newQuantity,
        unit: newUnit,
        preparation_note: newNote,
      });
      setPendingIngredient(null);
      setNewNote('');
      setNewQuantity(100);
      loadRecipe();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Hinzufügen der Zutat');
    } finally {
      setSaving(false);
    }
  }

  async function removeItem(id: number) {
    setError('');
    try {
      await api.delete(`/api/recipes?id=${id}`);
      loadRecipe();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Löschen der Zutat');
    }
  }

  async function updateItem(item: RecipeItem, field: string, value: string | number) {
    const updated = { ...item, [field]: value };
    setError('');
    try {
      await api.put('/api/recipes', {
        id: item.id,
        quantity: updated.quantity,
        unit: updated.unit,
        preparation_note: updated.preparation_note,
      });
      loadRecipe();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Aktualisieren der Zutat');
    }
  }

  async function savePrep() {
    setError('');
    try {
      await api.put('/api/recipes', {
        dish_id: dishId,
        prep_instructions: prepInstructions,
        prep_time_minutes: prepTime,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Speichern der Zubereitungsinformation');
    }
  }

  const totalCost = items.reduce((sum, item) =>
    sum + calculateItemCost(item.quantity, item.unit, item.price_per_unit, item.price_unit), 0
  );

  const excludeIds = items.map(i => i.ingredient_id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-elevated max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Error banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-t-xl p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-primary-100">
          <div>
            <h2 className="text-xl font-bold text-primary-900">Rezept: {dishName}</h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm text-primary-500">Kosten/Portion:</span>
              <span className="font-bold text-accent-600">{formatEuro(totalCost)}</span>
              <span className="text-xs text-primary-400">({items.length} Zutaten)</span>
            </div>
          </div>
          <button onClick={onClose} className="text-primary-400 hover:text-primary-700 text-2xl">&times;</button>
        </div>

        {/* Prep instructions */}
        <div className="px-6 py-4 border-b border-primary-100 space-y-3">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-xs font-semibold text-primary-500 uppercase tracking-wider">Zubereitungsanweisung</label>
              <textarea
                value={prepInstructions}
                onChange={e => setPrepInstructions(e.target.value)}
                onBlur={savePrep}
                rows={2}
                className="w-full border border-primary-200 rounded-lg px-3 py-2 text-sm mt-1 focus:border-accent-500 outline-none resize-none"
                placeholder="Kurze Anweisung..."
              />
            </div>
            <div className="w-28">
              <label className="text-xs font-semibold text-primary-500 uppercase tracking-wider">Zubereit.</label>
              <div className="flex items-center gap-1 mt-1">
                <input
                  type="number"
                  value={prepTime || ''}
                  onChange={e => setPrepTime(parseInt(e.target.value) || 0)}
                  onBlur={savePrep}
                  className="w-16 border border-primary-200 rounded-lg px-2 py-2 text-sm text-center focus:border-accent-500 outline-none"
                />
                <span className="text-xs text-primary-400">min</span>
              </div>
            </div>
          </div>
        </div>

        {/* Ingredients list */}
        <div className="px-6 py-4 space-y-2">
          <h3 className="text-sm font-semibold text-primary-700">Zutaten pro Portion</h3>
          {items.length === 0 && (
            <div className="text-sm text-primary-400 py-4 text-center">Noch keine Zutaten hinterlegt</div>
          )}
          {items.map(item => (
            <div key={item.id} className="flex items-center gap-2 py-1.5 border-b border-primary-50 group">
              <span className="flex-1 text-sm font-medium text-primary-900 min-w-0 truncate">{item.ingredient_name}</span>
              <input
                type="number"
                step="1"
                value={item.quantity}
                onChange={e => updateItem(item, 'quantity', parseFloat(e.target.value) || 0)}
                className="w-20 border border-primary-200 rounded px-2 py-1 text-sm text-right focus:border-accent-500 outline-none"
              />
              <select
                value={item.unit}
                onChange={e => updateItem(item, 'unit', e.target.value)}
                className="border border-primary-200 rounded px-2 py-1 text-sm focus:border-accent-500 outline-none"
              >
                {Object.entries(UNITS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <input
                type="text"
                value={item.preparation_note}
                onChange={e => updateItem(item, 'preparation_note', e.target.value)}
                placeholder="Notiz"
                className="w-28 border border-primary-200 rounded px-2 py-1 text-xs focus:border-accent-500 outline-none"
              />
              <span className="text-xs text-primary-400 w-16 text-right">
                {formatEuro(calculateItemCost(item.quantity, item.unit, item.price_per_unit, item.price_unit))}
              </span>
              <button
                onClick={() => removeItem(item.id)}
                className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity text-sm"
              >
                &times;
              </button>
            </div>
          ))}
        </div>

        {/* Add ingredient */}
        <div className="px-6 py-4 border-t border-primary-100 bg-primary-50/50 rounded-b-xl">
          <h4 className="text-xs font-semibold text-primary-500 uppercase tracking-wider mb-2">Zutat hinzuf&uuml;gen</h4>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <IngredientSearch
                onSelect={ing => setPendingIngredient({ id: ing.id, name: ing.name })}
                excludeIds={excludeIds}
              />
              {pendingIngredient && (
                <div className="text-xs text-accent-600 mt-1 font-medium">
                  Ausgew&auml;hlt: {pendingIngredient.name}
                </div>
              )}
            </div>
            <input
              type="number"
              value={newQuantity}
              onChange={e => setNewQuantity(parseFloat(e.target.value) || 0)}
              className="w-20 border border-primary-200 rounded-lg px-2 py-2 text-sm text-right focus:border-accent-500 outline-none"
              placeholder="Menge"
            />
            <select
              value={newUnit}
              onChange={e => setNewUnit(e.target.value)}
              className="border border-primary-200 rounded-lg px-2 py-2 text-sm focus:border-accent-500 outline-none"
            >
              {Object.entries(UNITS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <input
              type="text"
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              placeholder="Notiz"
              className="w-24 border border-primary-200 rounded-lg px-2 py-2 text-xs focus:border-accent-500 outline-none"
            />
            <button
              onClick={addItem}
              disabled={!pendingIngredient || saving}
              className="bg-accent-500 text-primary-900 px-4 py-2 rounded-lg hover:bg-accent-400 font-semibold text-sm disabled:opacity-40 transition-colors"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

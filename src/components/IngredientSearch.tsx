'use client';

import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api-client';

interface Ingredient {
  id: number;
  name: string;
  category: string;
  unit: string;
  price_per_unit: number;
  price_unit: string;
}

interface IngredientSearchProps {
  onSelect: (ingredient: Ingredient) => void;
  excludeIds?: number[];
}

export default function IngredientSearch({ onSelect, excludeIds = [] }: IngredientSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Ingredient[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(() => {
      api.get<Ingredient[]>(`/api/ingredients?search=${encodeURIComponent(query)}`)
        .then((data) => {
          setResults(data.filter(i => !excludeIds.includes(i.id)));
          setIsOpen(true);
        })
        .catch((err) => {
          console.error('Ingredient search error:', err);
          setResults([]);
        });
    }, 200);
    return () => clearTimeout(timer);
  }, [query, excludeIds]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSelect(ingredient: Ingredient) {
    onSelect(ingredient);
    setQuery('');
    setIsOpen(false);
    setResults([]);
  }

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setIsOpen(true)}
        placeholder="Zutat suchen..."
        className="w-full border border-primary-200 rounded-lg px-4 py-2 text-sm focus:border-accent-500 focus:ring-2 focus:ring-accent-100 outline-none"
      />
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-elevated border border-primary-200 max-h-48 overflow-y-auto">
          {results.map(ing => (
            <button
              key={ing.id}
              onClick={() => handleSelect(ing)}
              className="w-full text-left px-4 py-2 hover:bg-accent-50 transition-colors text-sm flex items-center justify-between"
            >
              <span className="font-medium text-primary-900">{ing.name}</span>
              <span className="text-xs text-primary-400">{ing.unit}</span>
            </button>
          ))}
        </div>
      )}
      {isOpen && query.length >= 2 && results.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-elevated border border-primary-200 px-4 py-3 text-sm text-primary-400">
          Keine Zutat gefunden
        </div>
      )}
    </div>
  );
}

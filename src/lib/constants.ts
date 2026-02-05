// Client-safe constants (no server dependencies)
export const DAY_NAMES = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
export const DAY_NAMES_SHORT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

export const INGREDIENT_CATEGORIES: Record<string, string> = {
  fleisch: 'Fleisch & Wurst',
  fisch: 'Fisch & Meeresfrüchte',
  gemuese: 'Gemüse & Salat',
  milchprodukte: 'Milchprodukte',
  trockenwaren: 'Trockenwaren & Getreide',
  gewuerze: 'Gewürze & Kräuter',
  eier_fette: 'Eier & Fette',
  obst: 'Obst & Früchte',
  tiefkuehl: 'Tiefkühlware',
  sonstiges: 'Sonstiges',
};

export const UNITS: Record<string, string> = {
  g: 'Gramm',
  kg: 'Kilogramm',
  ml: 'Milliliter',
  l: 'Liter',
  stueck: 'Stück',
};

// Calculate ISO week number from a date
export function getISOWeek(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

// Determine which category group a slot belongs to (for swap compatibility)
export function getSlotCategory(slotKey: string): string {
  if (slotKey === 'soup') return 'soup';
  if (slotKey === 'main1' || slotKey === 'main2') return 'main';
  if (slotKey.startsWith('side')) return 'side';
  if (slotKey === 'dessert') return 'dessert';
  return slotKey;
}

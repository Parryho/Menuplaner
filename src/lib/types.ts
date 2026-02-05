// Shared TypeScript types for the Menuplaner application

// Base dish type (minimal, used in meal slots)
export interface Dish {
  id: number;
  name: string;
  allergens: string;
}

// Extended dish type (full data from DB)
export interface DishFull extends Dish {
  category: string;
  season: string;
}

// Meal slot structure (8 positions per meal)
export interface MealSlot {
  soup: Dish | null;
  main1: Dish | null;
  side1a: Dish | null;
  side1b: Dish | null;
  main2: Dish | null;
  side2a: Dish | null;
  side2b: Dish | null;
  dessert: Dish | null;
}

// Single day's meal plan
export interface DayPlan {
  dayOfWeek: number;
  mittag: { city: MealSlot; sued: MealSlot };
  abend: { city: MealSlot; sued: MealSlot };
}

// Full week plan
export interface WeekPlan {
  weekNr: number;
  calendarWeek?: number;
  year?: number;
  days: DayPlan[];
}

// HACCP temperature data
export interface TempData {
  [slot: string]: { core: string; serving?: string };
}

// Drag and drop data
export interface DragData {
  dayOfWeek: number;
  meal: string;
  location: string;
  slotKey: string;
  dish: Dish | null;
}

// Recipe import result
export interface ImportResult {
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

// Slot keys type
export type SlotKey = keyof MealSlot;

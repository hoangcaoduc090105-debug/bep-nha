import type { Recipe } from "@/data/types";

// How dishes are sorted on the phone: by the kind of dish, and by what it is mainly made of.
// Both are ordinary entries in a recipe's `categories`, so a dish typed in the editor gets
// them the same way.

/** The kinds a family meal is built from. A meal is usually one of the first, third or fourth, plus a soup. */
export const DISH_TYPES = ["Món mặn", "Món canh", "Món xào", "Món chiên"] as const;
export type DishType = (typeof DISH_TYPES)[number];
export const OTHER_DISHES = "Món khác";

export const MAIN_INGREDIENTS = ["Thịt heo", "Thịt gà", "Thịt bò", "Cá, tôm", "Rau củ, đậu hũ"] as const;

/** Under which heading a dish is listed. "Món kho" is the older name for a savoury braise. */
export function dishType(recipe: Pick<Recipe, "categories">): DishType | typeof OTHER_DISHES {
  for (const t of DISH_TYPES) if (recipe.categories.includes(t)) return t;
  if (recipe.categories.includes("Món kho")) return "Món mặn";
  return OTHER_DISHES;
}

export function mainIngredient(recipe: Pick<Recipe, "categories">): string | undefined {
  return MAIN_INGREDIENTS.find((m) => recipe.categories.includes(m));
}

/** Dishes under their headings, in the order of DISH_TYPES; empty headings are left out. */
export function groupByType<T extends Pick<Recipe, "categories">>(recipes: T[]): Array<{ type: string; recipes: T[] }> {
  return [...DISH_TYPES, OTHER_DISHES].map((type) => ({ type, recipes: recipes.filter((r) => dishType(r) === type) })).filter((g) => g.recipes.length > 0);
}

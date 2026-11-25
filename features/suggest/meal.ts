import type { Recipe } from "@/data/types";
import { NOT_FOR_A_MEAL, dishType } from "@/lib/dish-groups";

// "Hôm nay nấu gì?" — a meal for today: one dish to eat with rice and one soup. It asks nothing
// of the cook: it only looks at the dishes on the phone and at the journal.

export type Meal = { main: Recipe | null; soup: Recipe | null };
/** When each dish was last cooked (ISO time), from the journal. */
export type LastCooked = Map<string, string>;

/** A dish cooked this recently is left out, so the same thing is not suggested day after day. */
export const REST_DAYS = 5;

const DAY = 86_400_000;

/** How likely a dish is to come up: favourites twice as often, dishes never cooked a little more. */
function weight(recipe: Recipe, last: LastCooked): number {
  return (recipe.isFavorite ? 2 : 1) * (last.has(recipe.id) ? 1 : 1.5);
}

function pick(pool: Recipe[], last: LastCooked, now: number, random: () => number, not?: string | null): Recipe | null {
  const others = pool.filter((r) => r.id !== not);
  const rested = others.filter((r) => {
    const at = last.get(r.id);
    return !at || now - new Date(at).getTime() > REST_DAYS * DAY;
  });
  // With few dishes everything may have been cooked this week; then anything but the one shown.
  const from = rested.length > 0 ? rested : others.length > 0 ? others : pool;
  if (from.length === 0) return null;
  let at = random() * from.reduce((sum, r) => sum + weight(r, last), 0);
  for (const r of from) {
    at -= weight(r, last);
    if (at < 0) return r;
  }
  return from[from.length - 1];
}

export const isSoup = (r: Recipe) => dishType(r) === "Món canh";
/** Something to eat with rice: not a soup, and not a cake. */
export const isMain = (r: Recipe) => !isSoup(r) && !NOT_FOR_A_MEAL.includes(dishType(r));

/** A dish to eat with rice, other than `not`. */
export function suggestMain(recipes: Recipe[], last: LastCooked, now: number, random: () => number = Math.random, not?: string | null): Recipe | null {
  return pick(recipes.filter((r) => !r.isArchived && isMain(r)), last, now, random, not);
}

/** A soup, other than `not`. */
export function suggestSoup(recipes: Recipe[], last: LastCooked, now: number, random: () => number = Math.random, not?: string | null): Recipe | null {
  return pick(recipes.filter((r) => !r.isArchived && isSoup(r)), last, now, random, not);
}

export function suggestMeal(recipes: Recipe[], last: LastCooked, now: number, random: () => number = Math.random, not: { main?: string | null; soup?: string | null } = {}): Meal {
  return { main: suggestMain(recipes, last, now, random, not.main), soup: suggestSoup(recipes, last, now, random, not.soup) };
}

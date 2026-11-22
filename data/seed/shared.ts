import type { Equipment, Ingredient, RecipeSource, Step, Verification } from "../types";

// What every built-in recipe file shares: the shape of a recipe written in the code, and the
// kitchen equipment most dishes name.

/**
 * Where the amount of an ingredient comes from, for a dish rewritten from a video: the video's
 * description, or the seconds of the video in which the channel says it. Kept in this file only,
 * for the tests and for whoever reviews a dish — it is not stored on the phone.
 */
export type AmountSource = "description" | { saidFrom: number; saidTo: number };
export type SeedIngredient = Ingredient & { amountSource?: AmountSource };

export type Seed = {
  seedId: string;
  name: string;
  description: string;
  categories: string[];
  servings: number;
  prepMinutes: number;
  cookMinutes: number;
  source: RecipeSource;
  ingredients: SeedIngredient[];
  steps: Step[];
  equipment: Equipment[];
  notes: string;
  tasteTips: string;
  /** Left out for an app sample. "entered" = written from a named source, not yet cooked by the family. */
  verification?: Extract<Verification, "sample" | "entered">;
};

export const STOVE: Equipment = { name: "Bếp gas hoặc bếp từ", kind: "appliance", required: true };
export const KNIFE: Equipment = { name: "Dao, thớt", kind: "utensil", required: true };
export const SPOONS: Equipment = { name: "Muỗng canh, muỗng cà phê", kind: "utensil", required: true };
export const pot = (name: string): Equipment => ({ name, kind: "utensil", required: true });

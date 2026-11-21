// Pure logic: scaling a version to a number of servings and filling step text with the
// current quantities. Because step text never contains fixed numbers, the ingredient list,
// the instructions and the spoken text can never disagree.

import type { Ingredient, RecipeVersion, Unit } from "@/data/types";
import { formatAmount, formatAmountSpoken, formatMetric } from "@/lib/quantity";

const SPOONS: Unit[] = ["muong_ca_phe", "muong_canh", "chen"];
const COUNTED: Unit[] = ["trai", "cu", "tep", "nhanh", "cay", "la", "lat", "con", "qua", "mieng", "bo"];

/** Rounds to something a person can actually measure. Never rounds down to nothing. */
export function roundPractical(quantity: number, unit: Unit | null): number {
  if (unit && SPOONS.includes(unit)) return Math.max(0.25, Math.round(quantity * 4) / 4);
  if (unit && COUNTED.includes(unit)) return Math.max(0.5, Math.round(quantity * 2) / 2);
  if (unit === "g" || unit === "ml") {
    if (quantity < 10) return Math.max(1, Math.round(quantity));
    if (quantity < 100) return Math.round(quantity / 5) * 5;
    return Math.round(quantity / 10) * 10;
  }
  return Math.max(0.1, Math.round(quantity * 10) / 10);
}

export function scaleIngredient(ing: Ingredient, factor: number): Ingredient {
  if (ing.quantity == null || ing.scales === false || factor === 1) return ing;
  return {
    ...ing,
    quantity: roundPractical(ing.quantity * factor, ing.unit),
    metricQuantity: ing.metricQuantity == null ? null : ing.metricQuantity * factor,
  };
}

/** The version's ingredients for a given number of servings. */
export function scaledIngredients(version: RecipeVersion, servings: number): Ingredient[] {
  const factor = servings / version.servings;
  return version.ingredients.map((i) => scaleIngredient(i, factor));
}

/** "Cá (cá basa, cá lóc hoặc cá trê)" → "cá" — the short name used inside a sentence. */
export function shortName(name: string): string {
  const base = name.split("(")[0].trim();
  return base.charAt(0).toLowerCase() + base.slice(1);
}

const TOKEN = /\{([a-z0-9_]+)\}/g;

/** Replaces {slot} tokens with the quantity and name: "Cho {nuoc_mam}" → "Cho 1½ muỗng canh nước mắm". */
export function fillStepText(text: string, ingredients: Ingredient[], mode: "screen" | "speech" = "screen"): string {
  const bySlot = new Map(ingredients.map((i) => [i.slot, i]));
  return text.replace(TOKEN, (_, slot: string) => {
    const ing = bySlot.get(slot);
    if (!ing) return shortName(slot.replaceAll("_", " "));
    const amount = mode === "speech" ? formatAmountSpoken(ing.quantity, ing.unit) : formatAmount(ing.quantity, ing.unit);
    return `${amount} ${shortName(ing.name)}`.trim();
  });
}

export type IngredientDiff = { slot: string; name: string; unit: Unit | null; from: number | null; to: number | null; changed: boolean };

/** Line-by-line comparison of two versions of the same recipe, matched by slot. */
export function diffVersions(from: RecipeVersion, to: RecipeVersion): IngredientDiff[] {
  const toBySlot = new Map(to.ingredients.map((i) => [i.slot, i]));
  return from.ingredients.map((a) => {
    const b = toBySlot.get(a.slot);
    const fromQ = a.quantity;
    const toQ = b?.quantity ?? null;
    return { slot: a.slot, name: a.name, unit: a.unit, from: fromQ, to: toQ, changed: fromQ !== toQ };
  });
}

/** Everything read aloud for one step, written for the ear. */
export function stepSpeech(version: RecipeVersion, stepNo: number, servings: number): string {
  const step = version.steps.find((s) => s.no === stepNo);
  if (!step) return "";
  const ings = scaledIngredients(version, servings);
  const parts = [`Bước ${step.no}. ${step.title}.`, ...step.instructions.map((t) => fillStepText(t, ings, "speech"))];
  if (step.doneWhen) parts.push(`Được khi ${step.doneWhen}`);
  if (step.avoid) parts.push(`Tránh ${step.avoid}`);
  return parts.join(" ");
}

export function ingredientsSpeech(version: RecipeVersion, servings: number): string {
  const ings = scaledIngredients(version, servings);
  return "Nguyên liệu gồm: " + ings.map((i) => `${formatAmountSpoken(i.quantity, i.unit)} ${shortName(i.name)}`).join(", ") + ".";
}

export { formatAmount, formatMetric };

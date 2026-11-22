import { describe, expect, it } from "vitest";
import type { Recipe } from "@/data/types";
import { SEED_RECIPES } from "@/data/seed";
import { REST_DAYS, suggestMain, suggestMeal, suggestSoup, type LastCooked } from "@/features/suggest/meal";
import { DISH_TYPES, MAIN_INGREDIENTS, dishType, groupByType, mainIngredient } from "@/lib/dish-groups";

const dish = (id: string, categories: string[], extra: Partial<Recipe> = {}): Recipe => ({
  id, name: id, searchName: id, description: "", imageId: null, categories,
  source: { kind: "family", title: "", fidelity: "own" }, difficulty: "easy", originalVersionId: `${id}-v`, familyVersionId: null,
  verification: "entered", isArchived: false, isFavorite: false, createdAt: "", updatedAt: "", ...extra,
});
const NOW = Date.parse("2026-11-23T10:00:00Z");
const daysAgo = (n: number) => new Date(NOW - n * 86_400_000).toISOString();
/** Always the first of the pool. */
const first = () => 0;

describe("how dishes are sorted", () => {
  it("every dish from a video has one kind and one main ingredient", () => {
    for (const s of SEED_RECIPES) {
      expect(s.categories.filter((c) => (DISH_TYPES as readonly string[]).includes(c)), s.name).toHaveLength(1);
      expect(s.categories.filter((c) => (MAIN_INGREDIENTS as readonly string[]).includes(c)), s.name).toHaveLength(1);
      expect(s.categories, s.name).toHaveLength(2);
    }
    // A meal needs both: something to eat with rice, and a soup.
    expect(SEED_RECIPES.filter((s) => s.categories.includes("Món canh")).length).toBeGreaterThanOrEqual(5);
    expect(SEED_RECIPES.filter((s) => s.categories.includes("Món mặn")).length).toBeGreaterThanOrEqual(10);
  });
  it("lists dishes under their kind, in a fixed order, and keeps the older name “Món kho”", () => {
    const list = [dish("canh", ["Món canh"]), dish("kho", ["Món kho", "Món ăn gia đình"]), dish("la", ["Món tráng miệng"]), dish("xao", ["Món xào", "Thịt bò"])];
    expect(groupByType(list).map((g) => [g.type, g.recipes.map((r) => r.id)])).toEqual([["Món mặn", ["kho"]], ["Món canh", ["canh"]], ["Món xào", ["xao"]], ["Món khác", ["la"]]]);
    expect(dishType(list[1])).toBe("Món mặn");
    expect(mainIngredient(list[3])).toBe("Thịt bò");
    expect(mainIngredient(list[0])).toBeUndefined();
  });
});

describe("“Hôm nay nấu gì?”", () => {
  const recipes = [dish("kho-1", ["Món mặn"]), dish("kho-2", ["Món mặn"]), dish("xao-1", ["Món xào"]), dish("canh-1", ["Món canh"]), dish("canh-2", ["Món canh"])];

  it("a meal is one dish to eat with rice and one soup", () => {
    for (let i = 0; i < 50; i++) {
      const meal = suggestMeal(recipes, new Map(), NOW);
      expect(dishType(meal.main!)).not.toBe("Món canh");
      expect(dishType(meal.soup!)).toBe("Món canh");
    }
  });
  it("leaves out what was cooked in the last few days", () => {
    const last: LastCooked = new Map([["kho-1", daysAgo(1)], ["canh-1", daysAgo(REST_DAYS - 1)], ["kho-2", daysAgo(REST_DAYS + 1)]]);
    for (let i = 0; i < 50; i++) {
      const meal = suggestMeal(recipes, last, NOW);
      expect(meal.main!.id).not.toBe("kho-1");
      expect(meal.soup!.id).toBe("canh-2");
    }
  });
  it("“đổi món khác” never gives the same dish again", () => {
    expect(suggestMain(recipes, new Map(), NOW, first)!.id).toBe("kho-1");
    expect(suggestMain(recipes, new Map(), NOW, first, "kho-1")!.id).toBe("kho-2");
    expect(suggestSoup(recipes, new Map(), NOW, first, "canh-1")!.id).toBe("canh-2");
  });
  it("still suggests something when everything was cooked this week, or only one dish exists", () => {
    const all: LastCooked = new Map(recipes.map((r) => [r.id, daysAgo(1)]));
    expect(suggestMeal(recipes, all, NOW).main).not.toBeNull();
    expect(suggestSoup([dish("canh-1", ["Món canh"])], new Map(), NOW, first, "canh-1")!.id).toBe("canh-1");
  });
  it("skips dishes in “Món đã xoá”, and says so when there is no soup at all", () => {
    const list = [dish("kho-1", ["Món mặn"]), dish("canh-1", ["Món canh"], { isArchived: true })];
    expect(suggestMeal(list, new Map(), NOW)).toEqual({ main: list[0], soup: null });
  });
  it("favourites come up about twice as often", () => {
    const two = [dish("a", ["Món mặn"], { isFavorite: true }), dish("b", ["Món mặn"])];
    const last: LastCooked = new Map([["a", daysAgo(30)], ["b", daysAgo(30)]]);
    let n = 0;
    // Evenly spread "random" numbers, so the share is exact.
    for (let i = 0; i < 300; i++) if (suggestMain(two, last, NOW, () => (i + 0.5) / 300)!.id === "a") n++;
    expect(n).toBe(200);
  });
});

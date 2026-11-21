import { describe, expect, it } from "vitest";
import { formatAmount, formatAmountSpoken, formatMetric, formatQuantity } from "@/lib/quantity";
import { searchKey } from "@/lib/text";
import { diffVersions, fillStepText, roundPractical, scaledIngredients, stepSpeech } from "@/features/recipe-text";
import * as caKho from "@/data/seed/ca-kho-to";
import type { RecipeVersion } from "@/data/types";
import { SEED_RECIPES } from "@/data/seed";

const version: RecipeVersion = {
  id: "v1", recipeId: "r1", kind: "original", versionNo: 1, parentVersionId: null,
  servings: caKho.servings, prepMinutes: 20, cookMinutes: 35,
  ingredients: caKho.ingredients, steps: caKho.steps, equipment: caKho.equipment, createdAt: "2026-01-01",
};

describe("showing quantities", () => {
  it("writes fractions the way people say them", () => {
    expect(formatQuantity(1.5)).toBe("1½");
    expect(formatQuantity(0.25)).toBe("¼");
    expect(formatQuantity(2)).toBe("2");
    expect(formatAmount(1.5, "muong_canh")).toBe("1½ muỗng canh");
  });
  it("shows grams and millilitres as whole numbers, marked approximate", () => {
    expect(formatMetric(22.5, "ml")).toBe("(khoảng 23 ml)");
    expect(formatMetric(18.75, "ml")).toBe("(khoảng 19 ml)");
  });
  it("has a spoken form without fraction glyphs", () => {
    expect(formatAmountSpoken(1.5, "muong_canh")).toBe("1 muỗng canh rưỡi");
    expect(formatAmountSpoken(0.5, "muong_ca_phe")).toBe("nửa muỗng cà phê");
    expect(formatAmountSpoken(500, "g")).toBe("500 gam");
  });
});

describe("search key", () => {
  it("ignores diacritics and case", () => {
    expect(searchKey("Cá kho tộ")).toBe("ca kho to");
    expect(searchKey("ĐẬU HŨ")).toBe("dau hu");
  });
});

describe("scaling to servings", () => {
  it("doubles quantities for twice the people", () => {
    const ings = scaledIngredients(version, 8);
    expect(ings.find((i) => i.slot === "ca")?.quantity).toBe(1000);
    expect(ings.find((i) => i.slot === "nuoc_mam")?.quantity).toBe(4);
    expect(ings.find((i) => i.slot === "nuoc_mam")?.metricQuantity).toBe(60);
  });
  it("never rounds a seasoning down to nothing", () => {
    const ings = scaledIngredients(version, 1);
    for (const i of ings) expect(i.quantity ?? 1).toBeGreaterThan(0);
    expect(ings.find((i) => i.slot === "tieu")?.quantity).toBe(0.25);
  });
  it("rounds to measurable amounts", () => {
    expect(roundPractical(1.4, "muong_canh")).toBe(1.5);
    expect(roundPractical(333, "g")).toBe(330);
    expect(roundPractical(2.2, "cu")).toBe(2);
  });
});

describe("step text", () => {
  it("is filled from the ingredient list, so it follows adjustments and servings", () => {
    const step2 = caKho.steps[1].instructions[1];
    expect(fillStepText(step2, version.ingredients)).toContain("2 muỗng canh nước mắm");
    const adjusted = version.ingredients.map((i) => (i.slot === "nuoc_mam" ? { ...i, quantity: 1.5 } : i));
    expect(fillStepText(step2, adjusted)).toContain("1½ muỗng canh nước mắm");
    expect(fillStepText(step2, scaledIngredients(version, 8))).toContain("4 muỗng canh nước mắm");
  });
  for (const seed of SEED_RECIPES) {
    it(`sample “${seed.name}” is internally consistent`, () => {
      const slots = seed.ingredients.map((i) => i.slot);
      expect(new Set(slots).size, "ingredient slots are unique").toBe(slots.length);
      expect(seed.steps.map((s) => s.no)).toEqual(seed.steps.map((_, i) => i + 1));
      const used = new Set<string>();
      for (const s of seed.steps) {
        for (const t of s.instructions) {
          for (const m of t.matchAll(/\{([a-z0-9_]+)\}/g)) expect(slots, `token {${m[1]}} in step ${s.no}`).toContain(m[1]);
          // Quantities must come from tokens, so they follow adjustments: no "2 muỗng canh" typed into the text.
          expect(t, `fixed spoon amount in step ${s.no}`).not.toMatch(/\d\s*muỗng (canh|cà phê) (nước mắm|đường|muối|dầu)/);
        }
        for (const u of s.uses) {
          expect(slots, `uses ${u.slot} in step ${s.no}`).toContain(u.slot);
          used.add(u.slot);
        }
        // Every step must say how to recognise that it is done, and what to avoid.
        expect(s.doneWhen, `doneWhen of step ${s.no}`).toBeTruthy();
        expect(s.avoid, `avoid of step ${s.no}`).toBeTruthy();
        if (s.timerSeconds != null) expect(s.timerSeconds).toBeGreaterThanOrEqual(5);
      }
      // Every ingredient is used somewhere. A seasoning must go in exactly once in total
      // (two halves are fine) — otherwise the cook would be told to add it twice.
      for (const ing of seed.ingredients) {
        const total = seed.steps.flatMap((s) => s.uses).filter((u) => u.slot === ing.slot).reduce((sum, u) => sum + u.portion, 0);
        expect(total, `${ing.slot} is used in some step`).toBeGreaterThanOrEqual(1);
        if (ing.kind === "seasoning") expect(total, `portions of ${ing.slot}`).toBeCloseTo(1);
      }
      expect(seed.source.kind).toBe("sample");
    });
  }
  it("speaks the step with spoken quantities", () => {
    const speech = stepSpeech(version, 2, 4);
    expect(speech).toContain("Bước 2. Ướp cá.");
    expect(speech).toContain("nửa muỗng cà phê tiêu xay");
    expect(speech).not.toMatch(/[½¼¾⅓⅔{}]/);
  });
});

describe("comparing versions", () => {
  it("marks only the lines that changed", () => {
    const family = { ...version, id: "v2", kind: "family" as const, ingredients: version.ingredients.map((i) => (i.slot === "duong" ? { ...i, quantity: 0.5 } : i)) };
    const changed = diffVersions(version, family).filter((d) => d.changed);
    expect(changed).toHaveLength(1);
    expect(changed[0]).toMatchObject({ slot: "duong", from: 1, to: 0.5 });
  });
});

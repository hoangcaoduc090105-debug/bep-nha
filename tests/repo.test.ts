import { beforeEach, describe, expect, it } from "vitest";
import { BepNhaDB, setDbForTests } from "@/data/db";
import * as repo from "@/data/repo";
import { SEED_RECIPES } from "@/data/seed";

let n = 0;
beforeEach(async () => {
  setDbForTests(new BepNhaDB(`test-${++n}`));
  await repo.ensureSeeded();
});

async function firstRecipe() {
  const [r] = await repo.listRecipes({ query: "ca kho to" });
  return (await repo.getRecipeBundle(r.id))!;
}

describe("first run", () => {
  it("loads each sample recipe once, labelled as a sample", async () => {
    await repo.ensureSeeded();
    const list = await repo.listRecipes();
    expect(list).toHaveLength(SEED_RECIPES.length);
    expect(list).toHaveLength(10);
    for (const r of list) {
      expect(r.verification).toBe("sample");
      expect(r.familyVersionId).toBeNull();
    }
  });
  it("does not bring back a sample that was deleted", async () => {
    const b = await firstRecipe();
    await repo.deleteRecipeForever(b.recipe.id);
    await repo.ensureSeeded();
    expect(await repo.listRecipes()).toHaveLength(SEED_RECIPES.length - 1);
  });
  it("filters by category", async () => {
    const soups = await repo.listRecipes({ category: "Món canh" });
    expect(soups.map((r) => r.name).sort()).toEqual(["Canh bí nấu tôm", "Canh chua cá"]);
    expect(await repo.listCategories()).toEqual(["Món kho", "Món chiên", "Món xào", "Món canh", "Món ăn gia đình"]);
  });
  it("finds a dish without diacritics", async () => {
    expect(await repo.listRecipes({ query: "ca kho" })).toHaveLength(1);
    expect(await repo.listRecipes({ query: "CÁ KHO" })).toHaveLength(1);
    expect(await repo.listRecipes({ query: "pho" })).toHaveLength(0);
  });
});

describe("family versions", () => {
  it("saves an adjustment as a new version and never touches the original", async () => {
    const b = await firstRecipe();
    const before = structuredClone(b.original);
    const v = await repo.saveFamilyVersion({ recipeId: b.recipe.id, baseVersionId: b.original.id, changes: [{ slot: "nuoc_mam", quantity: 1.5 }], reason: "Lần trước hơi mặn" });
    const after = (await firstRecipe());
    expect(after.original).toEqual(before);
    expect(after.family?.id).toBe(v.id);
    expect(after.family?.kind).toBe("family");
    expect(after.family?.parentVersionId).toBe(b.original.id);
    expect(after.family?.changeReason).toBe("Lần trước hơi mặn");
    const fishSauce = after.family!.ingredients.find((i) => i.slot === "nuoc_mam")!;
    expect(fishSauce.quantity).toBe(1.5);
    expect(fishSauce.metricQuantity).toBeCloseTo(22.5);
  });
  it("keeps the whole history after several adjustments", async () => {
    const b = await firstRecipe();
    let base = b.original.id;
    for (let i = 0; i < 10; i++) base = (await repo.saveFamilyVersion({ recipeId: b.recipe.id, baseVersionId: base, changes: [{ slot: "duong", quantity: 1 + i * 0.25 }] })).id;
    const after = await firstRecipe();
    expect(after.versions).toHaveLength(11);
    expect(after.versions.map((v) => v.versionNo)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  });
  it("restoring the original only moves the pointer", async () => {
    const b = await firstRecipe();
    await repo.saveFamilyVersion({ recipeId: b.recipe.id, baseVersionId: b.original.id, changes: [{ slot: "duong", quantity: 0.5 }] });
    await repo.setPreferredVersion(b.recipe.id, null);
    const after = await firstRecipe();
    expect(after.family).toBeNull();
    expect(after.versions).toHaveLength(2);
  });
  it("refuses invalid quantities and unknown ingredients", async () => {
    const b = await firstRecipe();
    for (const q of [0, -1, Number.NaN, Infinity]) {
      await expect(repo.saveFamilyVersion({ recipeId: b.recipe.id, baseVersionId: b.original.id, changes: [{ slot: "duong", quantity: q }] })).rejects.toThrow(repo.RuleError);
    }
    await expect(repo.saveFamilyVersion({ recipeId: b.recipe.id, baseVersionId: b.original.id, changes: [{ slot: "khong_co", quantity: 1 }] })).rejects.toThrow(repo.RuleError);
    expect((await firstRecipe()).versions).toHaveLength(1);
  });
  it("never deletes the original or a version that was cooked", async () => {
    const b = await firstRecipe();
    await expect(repo.deleteVersion(b.original.id)).rejects.toThrow(repo.RuleError);
    const v = await repo.saveFamilyVersion({ recipeId: b.recipe.id, baseVersionId: b.original.id, changes: [{ slot: "duong", quantity: 0.5 }] });
    const s = await repo.startSession(b.recipe.id, v.id, 4);
    await repo.finishSession(s.id, { verdict: "vua_mieng" });
    await expect(repo.deleteVersion(v.id)).rejects.toThrow(repo.RuleError);
  });
});

describe("cooking sessions and journal", () => {
  it("records the exact version cooked, even after the recipe changes", async () => {
    const b = await firstRecipe();
    const s = await repo.startSession(b.recipe.id, b.original.id, 4);
    await repo.finishSession(s.id, { verdict: "hoi_man", note: " hơi mặn chút " });
    await repo.saveFamilyVersion({ recipeId: b.recipe.id, baseVersionId: b.original.id, changes: [{ slot: "nuoc_mam", quantity: 1.5 }] });
    const [entry] = await repo.listJournal();
    expect(entry.version?.id).toBe(b.original.id);
    expect(entry.version?.ingredients.find((i) => i.slot === "nuoc_mam")?.quantity).toBe(2);
    expect(entry.session.feedback).toEqual({ verdict: "hoi_man", note: "hơi mặn chút" });
  });
  it("finishing twice makes one entry", async () => {
    const b = await firstRecipe();
    const s = await repo.startSession(b.recipe.id, b.original.id, 4);
    await repo.finishSession(s.id, { verdict: "rat_ngon" });
    await repo.finishSession(s.id, { verdict: "chua_ngon" });
    const journal = await repo.listJournal();
    expect(journal).toHaveLength(1);
    expect(journal[0].session.feedback?.verdict).toBe("rat_ngon");
  });
  it("a meal can be finished without rating it: it is in the journal, and cannot approve the dish", async () => {
    const b = await firstRecipe();
    const s = await repo.startSession(b.recipe.id, b.original.id, 4);
    await repo.finishSession(s.id, null);
    expect(await repo.getActiveSession()).toBeUndefined();
    const [entry] = await repo.listJournal();
    expect(entry.session.id).toBe(s.id);
    expect(entry.session.feedback).toBeNull();
    expect(entry.version?.id).toBe(b.original.id);
    await expect(repo.confirmFamilyApproved(b.recipe.id, s.id)).rejects.toThrow(repo.RuleError);
    await expect(repo.deleteVersion(b.original.id)).rejects.toThrow(repo.RuleError);
  });
  it("resumes the same session instead of starting a second one", async () => {
    const b = await firstRecipe();
    const s1 = await repo.startSession(b.recipe.id, b.original.id, 4);
    await repo.updateSession(s1.id, { currentStep: 3 });
    const s2 = await repo.startSession(b.recipe.id, b.original.id, 4);
    expect(s2.id).toBe(s1.id);
    expect((await repo.getActiveSession())?.currentStep).toBe(3);
  });
  it("refuses a silly number of servings", async () => {
    const b = await firstRecipe();
    await expect(repo.startSession(b.recipe.id, b.original.id, 0)).rejects.toThrow(repo.RuleError);
    await expect(repo.startSession(b.recipe.id, b.original.id, 31)).rejects.toThrow(repo.RuleError);
  });
});

describe("deleting and approving", () => {
  it("archives instead of deleting, and can bring the dish back", async () => {
    const b = await firstRecipe();
    await repo.archiveRecipe(b.recipe.id);
    expect(await repo.listRecipes()).toHaveLength(SEED_RECIPES.length - 1);
    expect(await repo.listRecipes({ archived: true })).toHaveLength(1);
    await repo.archiveRecipe(b.recipe.id, false);
    expect(await repo.listRecipes()).toHaveLength(SEED_RECIPES.length);
  });
  it("refuses to delete for ever a dish that is in the journal", async () => {
    const b = await firstRecipe();
    const s = await repo.startSession(b.recipe.id, b.original.id, 4);
    await repo.finishSession(s.id, { verdict: "vua_mieng" });
    await expect(repo.deleteRecipeForever(b.recipe.id)).rejects.toThrow(repo.RuleError);
    expect(await repo.listRecipes()).toHaveLength(SEED_RECIPES.length);
  });
  it("a sample becomes family-approved only after a well-rated meal", async () => {
    const b = await firstRecipe();
    const bad = await repo.startSession(b.recipe.id, b.original.id, 4);
    await repo.finishSession(bad.id, { verdict: "hoi_man" });
    await expect(repo.confirmFamilyApproved(b.recipe.id, bad.id)).rejects.toThrow(repo.RuleError);
    expect((await firstRecipe()).recipe.verification).toBe("sample");
    const good = await repo.startSession(b.recipe.id, b.original.id, 4);
    await repo.finishSession(good.id, { verdict: "rat_ngon" });
    expect((await firstRecipe()).recipe.verification).toBe("sample");
    await repo.confirmFamilyApproved(b.recipe.id, good.id);
    expect((await firstRecipe()).recipe.verification).toBe("family_approved");
  });
});

import { beforeEach, describe, expect, it } from "vitest";
import { BepNhaDB, getDb, setDbForTests } from "@/data/db";
import * as repo from "@/data/repo";
import { SEED_RECIPES as APP_SEEDS } from "@/data/seed";
import { SAMPLE_SEEDS } from "@/data/seed/samples";

// These tests work on a phone from before 2026-11-23: it holds the ten unverified samples the app
// used to load, next to the dishes rewritten from videos. A new phone has only the latter.
const SEED_RECIPES = [...SAMPLE_SEEDS, ...APP_SEEDS];

let n = 0;
beforeEach(async () => {
  setDbForTests(new BepNhaDB(`test-${++n}`));
  await repo.ensureSeeded();
  await repo.addBuiltInRecipes(SAMPLE_SEEDS);
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
    const samples = list.filter((r) => r.verification === "sample");
    expect(samples).toHaveLength(10);
    for (const r of samples) expect(r.source.kind).toBe("sample");
    for (const r of list) expect(r.familyVersionId).toBeNull();
  });
  it("loads a dish rewritten from a video as “Mới nhập – chưa nấu thử”, with its channel and link", async () => {
    await repo.ensureSeeded();
    const fromVideo = (await repo.listRecipes()).filter((r) => r.verification !== "sample");
    expect(fromVideo.length).toBe(SEED_RECIPES.filter((s) => s.verification === "entered").length);
    expect(fromVideo.length).toBeGreaterThan(0);
    for (const r of fromVideo) {
      expect(r.verification).toBe("entered");
      expect(r.source.kind).toBe("youtube");
      expect(r.source.creatorName).toBeTruthy();
      expect(r.source.url).toMatch(/^https:\/\/www\.youtube\.com\/watch\?v=[\w-]{11}$/);
    }
  });
  it("a phone that already has the ten samples receives the new dishes and keeps everything else", async () => {
    await repo.ensureSeeded();
    const b = await firstRecipe();
    await repo.saveFamilyVersion({ recipeId: b.recipe.id, baseVersionId: b.original.id, changes: [{ slot: "nuoc_mam", quantity: 1.5 }], reason: "Lần trước hơi mặn" });
    // Put the phone back to how it was before the video dishes existed.
    const db = getDb();
    for (const r of (await repo.listRecipes()).filter((x) => x.verification === "entered")) {
      await db.versions.where("recipeId").equals(r.id).delete();
      await db.recipes.delete(r.id);
    }
    await db.settings.put({ key: "seededIds", value: SEED_RECIPES.filter((s) => !s.verification).map((s) => s.seedId) });
    expect(await repo.listRecipes()).toHaveLength(10);
    await repo.ensureSeeded();
    await repo.ensureSeeded();
    expect(await repo.listRecipes()).toHaveLength(SEED_RECIPES.length);
    expect((await firstRecipe()).family?.changeReason).toBe("Lần trước hơi mặn");
  });
  it("does not bring back a sample that was deleted", async () => {
    const b = await firstRecipe();
    await repo.deleteRecipeForever(b.recipe.id);
    await repo.ensureSeeded();
    expect(await repo.listRecipes()).toHaveLength(SEED_RECIPES.length - 1);
  });
  it("filters by category", async () => {
    const soups = await repo.listRecipes({ category: "Món canh" });
    expect(soups.filter((r) => r.verification === "sample").map((r) => r.name).sort()).toEqual(["Canh bí nấu tôm", "Canh chua cá"]);
    expect(soups.length).toBe(SEED_RECIPES.filter((s) => s.categories.includes("Món canh")).length);
    // Kinds of dish only; the samples' older "Món ăn gia đình" comes last, and main ingredients apart.
    expect(await repo.listCategories()).toEqual(["Món mặn", "Món canh", "Món xào", "Món chiên", "Món ăn gia đình"]);
    expect(await repo.listMainIngredients()).toEqual(["Thịt heo", "Thịt gà", "Thịt bò", "Cá, tôm", "Rau củ, đậu hũ"]);
    const beef = await repo.listRecipes({ mainIngredient: "Thịt bò" });
    expect(beef.map((r) => r.name).sort()).toEqual(["Cà ri bò (Tú Lê)", "Thịt bò xào măng tây (Tú Lê)"]);
    // A sample still filed as "Món kho" is found under "Món mặn".
    expect((await repo.listRecipes({ category: "Món mặn" })).some((r) => r.name === "Cá kho tộ")).toBe(true);
  });
  it("a phone that loaded the dishes from videos under the first groups gets the new ones once", async () => {
    const db = getDb();
    const [stew] = await repo.listRecipes({ query: "thit kho tieu" });
    const [soup] = await repo.listRecipes({ query: "canh he" });
    await db.recipes.update(stew.id, { categories: ["Món kho", "Món ăn gia đình"] });
    // The family filed this one itself: left alone.
    await db.recipes.update(soup.id, { categories: ["Món canh", "Món ăn gia đình", "Món ăn sáng"] });
    await db.settings.delete("builtInGroups");
    await repo.ensureSeeded();
    expect((await repo.getRecipeBundle(stew.id))!.recipe.categories).toEqual(["Món mặn", "Thịt heo"]);
    expect((await repo.getRecipeBundle(soup.id))!.recipe.categories).toEqual(["Món canh", "Món ăn gia đình", "Món ăn sáng"]);
    await db.recipes.update(stew.id, { categories: ["Món kho", "Món ăn gia đình"] });
    await repo.ensureSeeded();
    expect((await repo.getRecipeBundle(stew.id))!.recipe.categories).toEqual(["Món kho", "Món ăn gia đình"]);
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

// The ten unverified samples are no longer part of the app (2026-11-23).
describe("the samples are put away", () => {
  /** A phone as it was before: only the ten samples, loaded by an earlier version of the app. */
  async function oldPhone() {
    setDbForTests(new BepNhaDB(`old-phone-${++n}`));
    await repo.addBuiltInRecipes(SAMPLE_SEEDS);
    await getDb().settings.put({ key: "seededIds", value: SAMPLE_SEEDS.map((x) => x.seedId) });
  }
  const named = async (query: string) => (await repo.getRecipeBundle((await repo.listRecipes({ query }))[0].id))!;

  it("a new phone starts with the dishes from videos only", async () => {
    setDbForTests(new BepNhaDB(`new-phone-${++n}`));
    await repo.ensureSeeded();
    const list = await repo.listRecipes();
    expect(list).toHaveLength(APP_SEEDS.length);
    expect(list.filter((r) => r.verification === "sample")).toEqual([]);
    expect(await repo.listRecipes({ archived: true })).toEqual([]);
  });

  it("on a phone that has them they go to “Món đã xoá”; nothing is deleted and the journal is kept", async () => {
    await oldPhone();
    const cooked = await named("canh chua ca");
    const meal = await repo.startSession(cooked.recipe.id, cooked.original.id, 4);
    await repo.finishSession(meal.id, { verdict: "vua_mieng" });
    const versionsBefore = await getDb().versions.count();

    await repo.ensureSeeded();

    const visible = await repo.listRecipes();
    expect(visible).toHaveLength(APP_SEEDS.length);
    expect(visible.every((r) => r.verification === "entered")).toBe(true);
    const away = await repo.listRecipes({ archived: true });
    expect(away.map((r) => r.name).sort()).toEqual(SAMPLE_SEEDS.map((x) => x.name).sort());
    // Rule 3 and 4: the meal she cooked is still in the journal, tied to the version cooked.
    expect(await getDb().versions.count()).toBe(versionsBefore + APP_SEEDS.length);
    const journal = await repo.listJournal();
    expect(journal).toHaveLength(1);
    expect(journal[0].session.versionId).toBe(cooked.original.id);
    await expect(repo.deleteRecipeForever(cooked.recipe.id)).rejects.toThrow();
  });

  it("a sample the family made its own stays: a favourite, one with “Bản nhà mình”, one being cooked", async () => {
    await oldPhone();
    const favourite = await named("thit kho trung");
    await repo.toggleFavorite(favourite.recipe.id);
    const adjusted = await named("ca kho to");
    await repo.saveFamilyVersion({ recipeId: adjusted.recipe.id, baseVersionId: adjusted.original.id, changes: [{ slot: "nuoc_mam", quantity: 1.5 }], reason: "Bớt mặn" });
    // Adjusted, then switched back to the original: the family version still exists.
    const switchedBack = await named("canh bi nau tom");
    const first = switchedBack.original.ingredients.find((i) => i.quantity != null)!;
    await repo.saveFamilyVersion({ recipeId: switchedBack.recipe.id, baseVersionId: switchedBack.original.id, changes: [{ slot: first.slot, quantity: first.quantity! * 2 }], reason: "Nhà đông người" });
    await repo.setPreferredVersion(switchedBack.recipe.id, null);
    const cooking = await named("canh chua ca");
    await repo.startSession(cooking.recipe.id, cooking.original.id, 4);

    await repo.ensureSeeded();

    const kept = (await repo.listRecipes()).filter((r) => r.verification === "sample").map((r) => r.name).sort();
    expect(kept).toEqual(["Canh bí nấu tôm", "Canh chua cá", "Cá kho tộ", "Thịt kho trứng"].sort());
    expect(await repo.listRecipes({ archived: true })).toHaveLength(SAMPLE_SEEDS.length - 4);
    expect((await named("ca kho to")).family?.changeReason).toBe("Bớt mặn");
  });

  it("happens once: a sample brought back from “Món đã xoá” is not put away again", async () => {
    await oldPhone();
    await repo.ensureSeeded();
    const [back] = await repo.listRecipes({ archived: true, query: "ca kho to" });
    await repo.archiveRecipe(back.id, false);
    await repo.ensureSeeded();
    expect((await repo.listRecipes({ query: "ca kho to" })).map((r) => r.name)).toEqual(["Cá kho tộ"]);
    expect(await repo.listRecipes({ archived: true })).toHaveLength(SAMPLE_SEEDS.length - 1);
  });
});

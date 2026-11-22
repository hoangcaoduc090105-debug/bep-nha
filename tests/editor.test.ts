import { beforeEach, describe, expect, it } from "vitest";
import { BepNhaDB, getDb, setDbForTests } from "@/data/db";
import * as repo from "@/data/repo";
import type { RecipeForm, RecipeVersion } from "@/data/types";
import { buildContent, contentOf, emptyForm, fixedAmounts, forbiddenAmounts, formFromRecipe, fromFriendly, newIngredient, newStep, sameContent, toFriendly, validateForm, youtubeId } from "@/features/editor/form";
import { fillStepText } from "@/features/recipe-text";
import { fitWithin } from "@/features/photos/compress";
import { parseAmount } from "@/lib/quantity";
import { SEED_RECIPES as APP_SEEDS } from "@/data/seed";
import { SAMPLE_SEEDS } from "@/data/seed/samples";

// These tests work on a phone from before 2026-11-23: it holds the ten unverified samples the app
// used to load, next to the dishes rewritten from videos. A new phone has only the latter.
const SEED_RECIPES = [...SAMPLE_SEEDS, ...APP_SEEDS];

let n = 0;
beforeEach(async () => {
  setDbForTests(new BepNhaDB(`editor-test-${++n}`));
  await repo.ensureSeeded();
  await repo.addBuiltInRecipes(SAMPLE_SEEDS);
});

/** A complete, valid form: a dish for 4. */
function goodForm(): RecipeForm {
  const thit = { ...newIngredient("food"), slot: "thit", name: "Thịt ba chỉ", quantity: 500, unit: "g" as const };
  const mam = { ...newIngredient("seasoning"), slot: "mam", name: "Nước mắm", quantity: 3, unit: "muong_canh" as const };
  const tieu = { ...newIngredient("seasoning"), slot: "tieu", name: "Tiêu", quantity: null, unit: "it" as const };
  return {
    ...emptyForm(),
    name: "Vịt kho gừng",
    categories: ["Món kho"],
    ingredients: [thit, mam, tieu],
    equipment: [{ name: "Nồi", kind: "utensil", required: true }],
    steps: [
      { ...newStep(), title: "Ướp thịt", text: "Cho {thit} vào tô.\nThêm {mam} và {tieu}.", doneWhen: "thịt ngấm, sau 20 phút.", avoid: "ướp quá lâu ngoài tủ lạnh.", timerMinutes: 20 },
      { ...newStep(), title: "Kho", text: "Kho lửa nhỏ.", doneWhen: "thịt mềm, nước sánh.", avoid: "lửa lớn làm cạn nước.", heat: "low" },
    ],
  };
}

async function sample() {
  const [r] = await repo.listRecipes({ query: "ca kho to" });
  return (await repo.getRecipeBundle(r.id))!;
}

describe("typing amounts", () => {
  it("reads numbers the way people type them", () => {
    expect(parseAmount("2")).toBe(2);
    expect(parseAmount("1,5")).toBe(1.5);
    expect(parseAmount("1.5")).toBe(1.5);
    expect(parseAmount("1/2")).toBe(0.5);
    expect(parseAmount("1 1/2")).toBe(1.5);
    expect(parseAmount("1½")).toBe(1.5);
    expect(parseAmount("¼")).toBe(0.25);
  });
  it("refuses what is not a positive number", () => {
    for (const bad of ["", "abc", "0", "-1", "1/0", "2 muỗng"]) expect(parseAmount(bad), bad).toBeNull();
  });
});

describe("ingredients inside step text", () => {
  const form = goodForm();
  it("shows tokens as [tên] and reads them back", () => {
    const friendly = toFriendly(form.steps[0].text, form.ingredients);
    expect(friendly).toBe("Cho [thịt ba chỉ] vào tô.\nThêm [nước mắm] và [tiêu].");
    expect(fromFriendly(friendly, form.ingredients)).toBe(form.steps[0].text);
    expect(fromFriendly("Thêm [Nước Mắm]", form.ingredients)).toBe("Thêm {mam}");
  });
  it("leaves an unknown [name] alone, and validation reports it", () => {
    expect(fromFriendly("Thêm [bột ngọt]", form.ingredients)).toBe("Thêm [bột ngọt]");
    const bad = { ...form, steps: [{ ...form.steps[0], text: "Thêm [bột ngọt]" }] };
    expect(validateForm(bad).map((p) => p.message).join(" ")).toContain("bột ngọt");
  });
  it("finds an amount typed next to a listed ingredient", () => {
    expect(fixedAmounts("Cho 3 muỗng canh nước mắm vào", form.ingredients)).toEqual([{ text: "3 muỗng canh nước mắm", slot: "mam" }]);
    expect(fixedAmounts("Cho 500g thịt ba chỉ", form.ingredients)).toHaveLength(1);
    expect(fixedAmounts("Cho nửa muỗng cà phê tiêu", form.ingredients)).toHaveLength(1);
    expect(fixedAmounts("Để yên 20 phút, thêm 2 muỗng canh nước nóng", form.ingredients)).toEqual([]);
    expect(fixedAmounts("Cho {mam} vào", form.ingredients)).toEqual([]);
  });
});

describe("validating a recipe", () => {
  it("accepts a complete recipe", () => {
    expect(validateForm(goodForm())).toEqual([]);
  });
  it("requires “Được khi” and “Tránh” on every step", () => {
    const f = goodForm();
    f.steps[1] = { ...f.steps[1], doneWhen: " ", avoid: "" };
    const messages = validateForm(f).map((p) => p.message);
    expect(messages).toContain("Bước 2 chưa ghi “Được khi…”.");
    expect(messages).toContain("Bước 2 chưa ghi “Tránh…”.");
  });
  it("refuses an amount typed into the text when the ingredient is not inserted anywhere", () => {
    const f = goodForm();
    f.steps[0] = { ...f.steps[0], text: "Cho {thit} vào tô. Thêm 3 muỗng canh nước mắm." };
    expect(validateForm(f).some((p) => p.section === 4 && p.message.includes("ghi cứng “3 muỗng canh nước mắm”"))).toBe(true);
  });
  it("allows a correction such as “nhạt thì thêm nửa muỗng cà phê nước mắm” once the ingredient is inserted", () => {
    const f = goodForm();
    f.steps[1] = { ...f.steps[1], text: "Kho lửa nhỏ. Nhạt thì thêm nửa muỗng cà phê nước mắm." };
    expect(forbiddenAmounts(f.steps[1], f)).toEqual([]);
    expect(validateForm(f)).toEqual([]);
  });
  it("every app sample passes the editor's own rules", () => {
    for (const seed of SEED_RECIPES) {
      const version = { id: "v", recipeId: "r", kind: "original", versionNo: 1, parentVersionId: null, createdAt: "", ...seed } as unknown as RecipeVersion;
      expect(validateForm(formFromRecipe({ ...seed, imageId: null } as never, version)), seed.name).toEqual([]);
    }
  });
  it("refuses an empty form, missing amounts and duplicate names", () => {
    expect(validateForm(emptyForm()).map((p) => p.section)).toEqual(expect.arrayContaining([1, 2, 4]));
    const f = goodForm();
    f.ingredients[0] = { ...f.ingredients[0], quantity: null };
    f.ingredients.push({ ...newIngredient("seasoning"), name: "nước mắm" });
    const messages = validateForm(f).map((p) => p.message).join(" ");
    expect(messages).toContain("chưa có lượng");
    expect(messages).toContain("hai dòng cùng tên");
  });
  it("a recipe written from a video must carry the video link", () => {
    const f = { ...goodForm(), sourceKind: "youtube" as const, sourceUrl: "https://example.com/abc" };
    expect(validateForm(f).some((p) => p.section === 5)).toBe(true);
    expect(validateForm({ ...f, sourceUrl: "https://youtu.be/dQw4w9WgXcQ?si=abc" })).toEqual([]);
  });
  it("reads the usual YouTube links and nothing else", () => {
    for (const ok of ["https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s", "https://youtu.be/dQw4w9WgXcQ", "https://m.youtube.com/shorts/dQw4w9WgXcQ", "https://www.youtube.com/embed/dQw4w9WgXcQ"]) expect(youtubeId(ok), ok).toBe("dQw4w9WgXcQ");
    for (const bad of ["", "dQw4w9WgXcQ", "https://vimeo.com/123", "https://youtube.com.evil.example/watch?v=dQw4w9WgXcQ", "javascript:alert(1)", "https://www.youtube.com/watch?v=short"]) expect(youtubeId(bad), bad).toBeNull();
  });
});

describe("form → recipe contents", () => {
  it("opening a sample in the editor and changing nothing gives exactly the same contents", () => {
    for (const seed of SEED_RECIPES) {
      const version = { id: "v", recipeId: "r", kind: "original", versionNo: 1, parentVersionId: null, createdAt: "", ...seed } as unknown as RecipeVersion;
      const recipe = { name: seed.name, description: seed.description, categories: seed.categories, imageId: null, source: seed.source } as never;
      const base = { ...version, ...contentOf(version) } as RecipeVersion;
      expect(sameContent(buildContent(formFromRecipe(recipe, base), base), contentOf(base)), seed.name).toBe(true);
    }
  });
  it("numbers the steps, derives what each step uses, and never writes amounts into the text", () => {
    const form = goodForm();
    const c = buildContent(form);
    expect(c.steps.map((s) => s.no)).toEqual([1, 2]);
    expect(c.steps[0].instructions).toEqual(["Cho {thit} vào tô.", "Thêm {mam} và {tieu}."]);
    expect(c.steps[0].uses).toEqual([{ slot: "thit", portion: 1 }, { slot: "mam", portion: 1 }, { slot: "tieu", portion: 1 }]);
    expect(c.steps[0].timerSeconds).toBe(1200);
    expect(c.ingredients.find((i) => i.slot === "tieu")).toMatchObject({ quantity: null, unit: "it", group: "Gia vị" });
    expect(fillStepText(c.steps[0].instructions[1], c.ingredients)).toBe("Thêm 3 muỗng canh nước mắm và ít tiêu.");
  });
});

describe("saving from the editor", () => {
  it("adds a new dish labelled “entered”, searchable, with its source", async () => {
    const r = await repo.saveRecipeForm({ form: { ...goodForm(), sourceNote: "Bà ngoại chỉ" } });
    expect(r.outcome).toBe("created");
    const b = (await repo.getRecipeBundle(r.recipeId))!;
    expect(b.recipe.verification).toBe("entered");
    expect(b.recipe.source).toMatchObject({ kind: "family", fidelity: "own", note: "Bà ngoại chỉ" });
    expect(b.original.kind).toBe("original");
    expect(b.versions).toHaveLength(1);
    expect((await repo.listRecipes({ query: "vit kho" })).map((x) => x.id)).toEqual([r.recipeId]);
  });
  it("a recipe from a video is stored as transcribed, with the video id", async () => {
    const r = await repo.saveRecipeForm({ form: { ...goodForm(), sourceKind: "youtube", sourceUrl: "https://youtu.be/dQw4w9WgXcQ?si=tracking", sourceCreator: "Bếp Nhà Ai" } });
    const b = (await repo.getRecipeBundle(r.recipeId))!;
    expect(b.recipe.source).toMatchObject({ kind: "youtube", fidelity: "transcribed", youtubeVideoId: "dQw4w9WgXcQ", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", creatorName: "Bếp Nhà Ai" });
  });
  it("refuses an invalid form and saves nothing", async () => {
    const before = (await repo.listRecipes()).length;
    const f = goodForm();
    f.steps[0] = { ...f.steps[0], avoid: "" };
    await expect(repo.saveRecipeForm({ form: f })).rejects.toThrow(repo.RuleError);
    expect(await repo.listRecipes()).toHaveLength(before);
  });
  it("a never-cooked dish of our own is corrected in place", async () => {
    const r = await repo.saveRecipeForm({ form: goodForm() });
    const plan = (await repo.planEdit(r.recipeId))!;
    expect(plan.inPlace).toBe(true);
    const form = formFromRecipe(plan.bundle.recipe, plan.base);
    form.ingredients[1] = { ...form.ingredients[1], quantity: 2.5 };
    const again = await repo.saveRecipeForm({ form, recipeId: r.recipeId, baseVersionId: plan.base.id });
    expect(again.outcome).toBe("updated_in_place");
    const b = (await repo.getRecipeBundle(r.recipeId))!;
    expect(b.versions).toHaveLength(1);
    expect(b.original.ingredients[1].quantity).toBe(2.5);
  });
  it("once cooked, an edit becomes a new family version and the cooked one is untouched", async () => {
    const r = await repo.saveRecipeForm({ form: goodForm() });
    const s = await repo.startSession(r.recipeId, r.versionId, 4);
    await repo.finishSession(s.id, { verdict: "vua_mieng" });
    const plan = (await repo.planEdit(r.recipeId))!;
    expect(plan.inPlace).toBe(false);
    const before = structuredClone(plan.base);
    const form = formFromRecipe(plan.bundle.recipe, plan.base);
    form.steps.push({ ...newStep(), title: "Thêm trứng", text: "Cho trứng luộc vào.", doneWhen: "trứng thấm màu.", avoid: "đảo mạnh làm vỡ trứng." });
    const again = await repo.saveRecipeForm({ form, recipeId: r.recipeId, baseVersionId: plan.base.id, reason: "Thêm trứng" });
    expect(again.outcome).toBe("new_version");
    const b = (await repo.getRecipeBundle(r.recipeId))!;
    expect(b.original).toEqual(before);
    expect(b.family).toMatchObject({ id: again.versionId, kind: "family", parentVersionId: before.id, changeReason: "Thêm trứng", versionNo: 2 });
    expect(b.family!.steps).toHaveLength(3);
    expect((await repo.listJournal())[0].version).toEqual(before);
  });
  it("an app sample is never overwritten, even when it has not been cooked", async () => {
    const b = await sample();
    const before = structuredClone(b.original);
    const form = formFromRecipe(b.recipe, b.original);
    form.ingredients = form.ingredients.map((i) => (i.slot === "nuoc_mam" ? { ...i, quantity: 1 } : i));
    const r = await repo.saveRecipeForm({ form, recipeId: b.recipe.id });
    expect(r.outcome).toBe("new_version");
    const after = await sample();
    expect(after.original).toEqual(before);
    expect(after.recipe.verification).toBe("sample");
    expect(after.recipe.source.kind).toBe("sample");
    const fishSauce = after.family!.ingredients.find((i) => i.slot === "nuoc_mam")!;
    expect(fishSauce.quantity).toBe(1);
    expect(fishSauce.metricQuantity).toBeCloseTo(15);
  });
  it("changing only the name or photo makes no new version", async () => {
    const b = await sample();
    const form = { ...formFromRecipe(b.recipe, b.original), name: "Cá kho tộ nhà mình" };
    const r = await repo.saveRecipeForm({ form, recipeId: b.recipe.id });
    expect(r.outcome).toBe("details_only");
    const after = (await repo.getRecipeBundle(b.recipe.id))!;
    expect(after.versions).toHaveLength(1);
    expect(after.recipe.name).toBe("Cá kho tộ nhà mình");
    expect(await repo.listRecipes({ query: "nha minh" })).toHaveLength(1);
  });
});

describe("drafts and photos", () => {
  const photo = () => new Blob([new Uint8Array([255, 216, 255, 1, 2, 3])], { type: "image/jpeg" });
  it("keeps work in progress and clears it when the dish is saved", async () => {
    const form = { ...goodForm(), name: "Đang viết dở" };
    await repo.saveDraft("new", form, null);
    expect((await repo.getDraft("new"))?.form.name).toBe("Đang viết dở");
    await repo.saveRecipeForm({ form });
    expect(await repo.getDraft("new")).toBeUndefined();
  });
  it("stores a dish photo, and removes a photo nothing refers to any more", async () => {
    const first = await repo.addImage(photo());
    const r = await repo.saveRecipeForm({ form: { ...goodForm(), imageId: first } });
    expect((await repo.getRecipeBundle(r.recipeId))!.recipe.imageId).toBe(first);
    const second = await repo.addImage(photo());
    const plan = (await repo.planEdit(r.recipeId))!;
    await repo.saveRecipeForm({ form: { ...formFromRecipe(plan.bundle.recipe, plan.base), imageId: second }, recipeId: r.recipeId });
    expect(await repo.getImageBlob(first)).toBeNull();
    expect(await repo.getImageBlob(second)).not.toBeNull();
  });
  it("a photo picked for a draft survives until the draft is discarded", async () => {
    const id = await repo.addImage(photo());
    await repo.saveDraft("new", { ...goodForm(), imageId: id }, null);
    await repo.pruneImages();
    expect(await repo.getImageBlob(id)).not.toBeNull();
    await repo.discardDraft("new");
    expect(await repo.getImageBlob(id)).toBeNull();
  });
  it("refuses a file that is not a picture, and a picture that is still huge", async () => {
    await expect(repo.addImage(new Blob(["x"], { type: "text/plain" }))).rejects.toThrow(repo.RuleError);
    await expect(repo.addImage(new Blob([new Uint8Array(3_000_001)], { type: "image/jpeg" }))).rejects.toThrow(repo.RuleError);
  });
  it("shrinks a phone photo to at most 1600 px on the long edge, and never enlarges", () => {
    expect(fitWithin(4032, 3024)).toEqual({ width: 1600, height: 1200 });
    expect(fitWithin(3024, 4032)).toEqual({ width: 1200, height: 1600 });
    expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600 });
  });
  it("the database upgrade keeps existing data", async () => {
    expect(getDb().verno).toBe(3);
    expect(await repo.listRecipes()).toHaveLength(SEED_RECIPES.length);
  });
});

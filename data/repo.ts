// The only code that reads or writes the database. Screens call these functions.
// The rules that protect the family's history are enforced here (DATABASE_SCHEMA §3).

import { getDb } from "./db";
import { SEED_RECIPES, type SeedRecipe } from "./seed";
import type { CookingSession, Draft, Recipe, RecipeForm, RecipeVersion, Verdict } from "./types";
import { newId, nowIso, searchKey } from "@/lib/text";
import { CATEGORY_ORDER, buildContent, buildSource, contentOf, sameContent, validateForm } from "@/features/editor/form";

export class RuleError extends Error {}

// ───────────── change tracking (for the backup reminder) ─────────────

/** Records that there is something new to back up. Called after every change worth keeping. */
export async function touch(): Promise<void> {
  const db = getDb();
  if (!(await db.settings.get("unsavedSince"))) await db.settings.put({ key: "unsavedSince", value: nowIso() });
}

// ───────────── first run ─────────────

async function insertSeed(seed: SeedRecipe): Promise<void> {
  const db = getDb();
  const recipeId = newId();
  const versionId = newId();
  const now = nowIso();
  await db.versions.add({
    id: versionId,
    recipeId,
    kind: "original",
    versionNo: 1,
    parentVersionId: null,
    servings: seed.servings,
    prepMinutes: seed.prepMinutes,
    cookMinutes: seed.cookMinutes,
    notes: seed.notes,
    tasteTips: seed.tasteTips,
    ingredients: seed.ingredients,
    steps: seed.steps,
    equipment: seed.equipment,
    createdAt: now,
  });
  await db.recipes.add({
    id: recipeId,
    name: seed.name,
    searchName: searchKey(seed.name),
    description: seed.description,
    imageId: null,
    categories: seed.categories,
    source: seed.source,
    difficulty: "easy",
    originalVersionId: versionId,
    familyVersionId: null,
    verification: "sample",
    isArchived: false,
    isFavorite: false,
    createdAt: now,
    updatedAt: now,
  });
}

/**
 * Loads each sample recipe once per device. A sample that was deleted is not added again,
 * and samples added in a later version of the app arrive without touching existing data.
 */
export async function ensureSeeded(): Promise<void> {
  const db = getDb();
  await db.transaction("rw", db.recipes, db.versions, db.settings, async () => {
    const stored = (await db.settings.get("seededIds"))?.value as string[] | undefined;
    // Before seededIds existed, a "seeded" flag meant the first sample had been loaded.
    const done = new Set(stored ?? ((await db.settings.get("seeded")) ? ["ca-kho-to"] : []));
    const missing = SEED_RECIPES.filter((s) => !done.has(s.seedId));
    if (missing.length === 0 && stored) return;
    for (const seed of missing) await insertSeed(seed);
    await db.settings.put({ key: "seededIds", value: [...done, ...missing.map((s) => s.seedId)] });
  });
}

// ───────────── recipes ─────────────

export async function listRecipes(opts: { query?: string; archived?: boolean; favoritesOnly?: boolean; category?: string } = {}): Promise<Recipe[]> {
  const q = searchKey(opts.query ?? "");
  const all = await getDb().recipes.toArray();
  return all
    .filter((r) => r.isArchived === (opts.archived ?? false))
    .filter((r) => !opts.favoritesOnly || r.isFavorite)
    .filter((r) => !opts.category || r.categories.includes(opts.category))
    .filter((r) => q === "" || r.searchName.includes(q))
    .sort((a, b) => a.name.localeCompare(b.name, "vi"));
}

/** Categories that have at least one dish, in the usual menu order. */
export async function listCategories(): Promise<string[]> {
  const order = CATEGORY_ORDER;
  const used = new Set((await getDb().recipes.toArray()).filter((r) => !r.isArchived).flatMap((r) => r.categories));
  return [...order.filter((c) => used.has(c)), ...[...used].filter((c) => !order.includes(c)).sort((a, b) => a.localeCompare(b, "vi"))];
}

export type RecipeBundle = {
  recipe: Recipe;
  original: RecipeVersion;
  /** The preferred family version, if the family has one. */
  family: RecipeVersion | null;
  /** Every version, oldest first. */
  versions: RecipeVersion[];
  timesCooked: number;
};

export async function getRecipeBundle(recipeId: string): Promise<RecipeBundle | null> {
  const db = getDb();
  const recipe = await db.recipes.get(recipeId);
  if (!recipe) return null;
  const versions = (await db.versions.where("recipeId").equals(recipeId).toArray()).sort((a, b) => a.versionNo - b.versionNo);
  const original = versions.find((v) => v.id === recipe.originalVersionId);
  if (!original) throw new Error(`Recipe ${recipeId} has no original version`);
  const family = versions.find((v) => v.id === recipe.familyVersionId) ?? null;
  const timesCooked = await db.sessions.where("recipeId").equals(recipeId).filter((s) => s.status === "completed").count();
  return { recipe, original, family, versions, timesCooked };
}

export async function getVersion(versionId: string): Promise<RecipeVersion | undefined> {
  return getDb().versions.get(versionId);
}

export async function toggleFavorite(recipeId: string): Promise<void> {
  const db = getDb();
  const r = await db.recipes.get(recipeId);
  if (r) await db.recipes.update(recipeId, { isFavorite: !r.isFavorite, updatedAt: nowIso() });
  await touch();
}

/** "Xoá món": hides the dish. It can be brought back, and its history stays in the journal. */
export async function archiveRecipe(recipeId: string, archived = true): Promise<void> {
  await getDb().recipes.update(recipeId, { isArchived: archived, updatedAt: nowIso() });
  await touch();
}

/** Permanent deletion is only allowed for a dish that has never been cooked. */
export async function deleteRecipeForever(recipeId: string): Promise<void> {
  const db = getDb();
  await db.transaction("rw", db.recipes, db.versions, db.sessions, async () => {
    if ((await db.sessions.where("recipeId").equals(recipeId).count()) > 0) {
      throw new RuleError("Món này đã có trong nhật ký nấu nên không xoá hẳn được. Mẹ có thể cất vào “Món đã xoá”.");
    }
    await db.versions.where("recipeId").equals(recipeId).delete();
    await db.recipes.delete(recipeId);
  });
  await db.drafts.delete(recipeId);
  await pruneImages();
}

// ───────────── versions ─────────────

export type QuantityChange = { slot: string; quantity: number };

/**
 * Saves the family's adjustment as a NEW version and makes it the preferred one.
 * The version it was based on is never modified, so the original and all earlier
 * family versions are kept.
 */
export async function saveFamilyVersion(input: {
  recipeId: string;
  baseVersionId: string;
  changes: QuantityChange[];
  reason?: string;
  label?: string;
  fromSessionId?: string;
}): Promise<RecipeVersion> {
  const db = getDb();
  const saved = await db.transaction("rw", db.recipes, db.versions, async () => {
    const base = await db.versions.get(input.baseVersionId);
    if (!base || base.recipeId !== input.recipeId) throw new RuleError("Không tìm thấy phiên bản để chỉnh.");
    for (const c of input.changes) {
      if (!Number.isFinite(c.quantity) || c.quantity <= 0 || c.quantity > 100000) {
        throw new RuleError("Số lượng phải lớn hơn 0.");
      }
      if (!base.ingredients.some((i) => i.slot === c.slot)) throw new RuleError(`Không có nguyên liệu “${c.slot}” trong món này.`);
    }
    const bySlot = new Map(input.changes.map((c) => [c.slot, c.quantity]));
    const existing = await db.versions.where("recipeId").equals(input.recipeId).toArray();
    const version: RecipeVersion = {
      ...structuredClone(base),
      id: newId(),
      kind: "family",
      versionNo: Math.max(...existing.map((v) => v.versionNo)) + 1,
      label: input.label,
      parentVersionId: base.id,
      changeReason: input.reason?.trim() || undefined,
      fromSessionId: input.fromSessionId,
      createdAt: nowIso(),
      ingredients: base.ingredients.map((i) => {
        const q = bySlot.get(i.slot);
        if (q == null || i.quantity == null) return { ...i };
        // Keep the gram/ml figure in step with the household measure.
        const ratio = q / i.quantity;
        return { ...i, quantity: q, metricQuantity: i.metricQuantity == null ? null : i.metricQuantity * ratio };
      }),
    };
    await db.versions.add(version);
    await db.recipes.update(input.recipeId, { familyVersionId: version.id, updatedAt: nowIso() });
    return version;
  });
  await touch();
  return saved;
}

/** Chooses which version "Bắt đầu nấu" opens. null = back to the original. Nothing is deleted. */
export async function setPreferredVersion(recipeId: string, versionId: string | null): Promise<void> {
  const db = getDb();
  await db.transaction("rw", db.recipes, db.versions, async () => {
    if (versionId != null) {
      const v = await db.versions.get(versionId);
      if (!v || v.recipeId !== recipeId || v.kind !== "family") throw new RuleError("Phiên bản này không thuộc món đang xem.");
    }
    await db.recipes.update(recipeId, { familyVersionId: versionId, updatedAt: nowIso() });
  });
  await touch();
}

/** A version that has been cooked, or the original, can never be removed. */
export async function deleteVersion(versionId: string): Promise<void> {
  const db = getDb();
  await db.transaction("rw", db.recipes, db.versions, db.sessions, async () => {
    const v = await db.versions.get(versionId);
    if (!v) return;
    if (v.kind === "original") throw new RuleError("Không xoá được bản gốc.");
    if ((await db.sessions.where("versionId").equals(versionId).count()) > 0) {
      throw new RuleError("Phiên bản này đã được nấu nên phải giữ lại cho nhật ký.");
    }
    const recipe = await db.recipes.get(v.recipeId);
    if (recipe?.familyVersionId === versionId) await db.recipes.update(recipe.id, { familyVersionId: null, updatedAt: nowIso() });
    await db.versions.delete(versionId);
  });
}

// ───────────── adding and editing recipes ─────────────

/**
 * A version may be corrected in place only while nothing depends on it: the dish was typed
 * in by the family (not an app sample), and no cooking session of the dish exists.
 * In every other case an edit becomes a new family version and the old one is kept.
 */
async function editableInPlace(recipe: Recipe): Promise<boolean> {
  if (recipe.verification === "sample") return false;
  return (await getDb().sessions.where("recipeId").equals(recipe.id).count()) === 0;
}

export type EditPlan = { bundle: RecipeBundle; base: RecipeVersion; inPlace: boolean };

/** What the editor needs to edit a dish: the version it starts from, and what saving will do. */
export async function planEdit(recipeId: string): Promise<EditPlan | null> {
  const bundle = await getRecipeBundle(recipeId);
  if (!bundle) return null;
  return { bundle, base: bundle.family ?? bundle.original, inPlace: await editableInPlace(bundle.recipe) };
}

export type SaveResult = { recipeId: string; versionId: string; outcome: "created" | "updated_in_place" | "new_version" | "details_only" };

/**
 * Saves the editor's form.
 *  - no recipeId: a new dish, labelled "Mới nhập – chưa nấu thử".
 *  - recipeId: name, photo, categories and source are updated; if the ingredients or steps
 *    changed, they are saved as a new family version (see editableInPlace for the one exception).
 */
export async function saveRecipeForm(input: { form: RecipeForm; recipeId?: string; baseVersionId?: string; reason?: string }): Promise<SaveResult> {
  const { form } = input;
  const problems = validateForm(form);
  if (problems.length > 0) throw new RuleError(problems[0].message);
  const db = getDb();
  const now = nowIso();
  const result = await db.transaction("rw", db.recipes, db.versions, db.sessions, db.images, db.drafts, async (): Promise<SaveResult> => {
    const imageId = form.imageId && (await db.images.get(form.imageId)) ? form.imageId : null;
    const details = { name: form.name.trim(), searchName: searchKey(form.name), description: form.description.trim(), categories: [...form.categories], imageId, updatedAt: now };

    if (!input.recipeId) {
      const recipeId = newId();
      const versionId = newId();
      await db.versions.add({ id: versionId, recipeId, kind: "original", versionNo: 1, parentVersionId: null, ...buildContent(form), createdAt: now });
      await db.recipes.add({ ...details, id: recipeId, source: buildSource(form), difficulty: "easy", originalVersionId: versionId, familyVersionId: null, verification: "entered", isArchived: false, isFavorite: false, createdAt: now });
      await db.drafts.delete("new");
      return { recipeId, versionId, outcome: "created" };
    }

    const recipe = await db.recipes.get(input.recipeId);
    if (!recipe) throw new RuleError("Không tìm thấy món để sửa.");
    const base = await db.versions.get(input.baseVersionId ?? recipe.familyVersionId ?? recipe.originalVersionId);
    if (!base || base.recipeId !== recipe.id) throw new RuleError("Không tìm thấy phiên bản để sửa.");
    const content = buildContent(form, base);
    // An app sample keeps saying it is a sample: its source is not rewritten by an edit.
    const source = recipe.source.kind === "sample" ? recipe.source : buildSource(form);
    await db.recipes.update(recipe.id, { ...details, source });
    await db.drafts.delete(recipe.id);

    if (sameContent(content, contentOf(base))) return { recipeId: recipe.id, versionId: base.id, outcome: "details_only" };
    if (await editableInPlace(recipe)) {
      await db.versions.update(base.id, { ...content, notes: content.notes, tasteTips: content.tasteTips });
      return { recipeId: recipe.id, versionId: base.id, outcome: "updated_in_place" };
    }
    const existing = await db.versions.where("recipeId").equals(recipe.id).toArray();
    const version: RecipeVersion = {
      id: newId(),
      recipeId: recipe.id,
      kind: "family",
      versionNo: Math.max(...existing.map((v) => v.versionNo)) + 1,
      parentVersionId: base.id,
      changeReason: input.reason?.trim() || undefined,
      ...content,
      createdAt: now,
    };
    await db.versions.add(version);
    await db.recipes.update(recipe.id, { familyVersionId: version.id });
    return { recipeId: recipe.id, versionId: version.id, outcome: "new_version" };
  });
  await pruneImages();
  await touch();
  return result;
}

// ───────────── drafts (work in progress in the editor) ─────────────

export async function getDraft(id: string): Promise<Draft | undefined> {
  return getDb().drafts.get(id);
}

export async function saveDraft(id: string, form: RecipeForm, baseVersionId: string | null): Promise<void> {
  await getDb().drafts.put({ id, form, baseVersionId, updatedAt: nowIso() });
}

export async function discardDraft(id: string): Promise<void> {
  await getDb().drafts.delete(id);
  await pruneImages();
}

// ───────────── photos ─────────────

/** Stores a photo that has already been made small (features/photos). Returns its id. */
export async function addImage(blob: Blob): Promise<string> {
  if (!blob.type.startsWith("image/")) throw new RuleError("Tệp này không phải là ảnh.");
  if (blob.size > 3_000_000) throw new RuleError("Ảnh còn lớn quá nên chưa lưu được.");
  const id = newId();
  await getDb().images.add({ id, blob, createdAt: nowIso() });
  return id;
}

export async function getImageBlob(id: string): Promise<Blob | null> {
  return (await getDb().images.get(id))?.blob ?? null;
}

/** Removes photos that no dish, cooking session or draft refers to any more. */
export async function pruneImages(): Promise<void> {
  const db = getDb();
  await db.transaction("rw", db.recipes, db.sessions, db.drafts, db.images, async () => {
    const used = new Set<string>();
    for (const r of await db.recipes.toArray()) if (r.imageId) used.add(r.imageId);
    for (const s of await db.sessions.toArray()) for (const p of s.photoIds) used.add(p);
    for (const d of await db.drafts.toArray()) if (d.form.imageId) used.add(d.form.imageId);
    const unused = (await db.images.toCollection().primaryKeys()).filter((id) => !used.has(id));
    if (unused.length > 0) await db.images.bulkDelete(unused);
  });
}

// ───────────── cooking sessions ─────────────

export async function getActiveSession(): Promise<CookingSession | undefined> {
  return getDb().sessions.where("status").equals("in_progress").first();
}

/** Starts cooking. Only one dish is cooked at a time; an unfinished other dish is set aside. */
export async function startSession(recipeId: string, versionId: string, servings: number): Promise<CookingSession> {
  const db = getDb();
  return db.transaction("rw", db.sessions, db.versions, async () => {
    const version = await db.versions.get(versionId);
    if (!version || version.recipeId !== recipeId) throw new RuleError("Không tìm thấy phiên bản công thức để nấu.");
    if (!Number.isInteger(servings) || servings < 1 || servings > 30) throw new RuleError("Số người ăn phải từ 1 đến 30.");
    const open = await db.sessions.where("status").equals("in_progress").toArray();
    for (const s of open) {
      if (s.recipeId === recipeId && s.versionId === versionId) return s;
      await db.sessions.update(s.id, { status: "abandoned", finishedAt: nowIso() });
    }
    const session: CookingSession = {
      id: newId(),
      recipeId,
      versionId,
      servings,
      status: "in_progress",
      currentStep: 0,
      checked: [],
      timers: [],
      adjustments: [],
      feedback: null,
      photoIds: [],
      startedAt: nowIso(),
      finishedAt: null,
    };
    await db.sessions.add(session);
    return session;
  });
}

export async function updateSession(id: string, patch: Partial<Pick<CookingSession, "currentStep" | "checked" | "timers" | "adjustments">>): Promise<void> {
  await getDb().sessions.update(id, patch);
}

export async function abandonSession(id: string): Promise<void> {
  await getDb().sessions.update(id, { status: "abandoned", finishedAt: nowIso(), timers: [] });
}

/** "Nấu xong". Safe to call twice: the second call changes nothing. */
/** Ends a cooking session and puts it in the journal. `null` = finished without rating the meal. */
export async function finishSession(id: string, feedback: { verdict: Verdict; note?: string } | null): Promise<void> {
  const db = getDb();
  await db.transaction("rw", db.sessions, async () => {
    const s = await db.sessions.get(id);
    if (!s) throw new RuleError("Không tìm thấy lần nấu này.");
    if (s.status === "completed") return;
    await db.sessions.update(id, {
      status: "completed",
      finishedAt: nowIso(),
      timers: [],
      feedback: feedback && { verdict: feedback.verdict, note: feedback.note?.trim() || undefined },
    });
  });
  await touch();
}

export type JournalEntry = { session: CookingSession; recipe: Recipe | undefined; version: RecipeVersion | undefined };

/** Completed cooking sessions, newest first, each with the exact version that was cooked. */
export async function listJournal(): Promise<JournalEntry[]> {
  const db = getDb();
  const sessions = (await db.sessions.where("status").equals("completed").toArray()).sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  return Promise.all(
    sessions.map(async (session) => ({
      session,
      recipe: await db.recipes.get(session.recipeId),
      version: await db.versions.get(session.versionId),
    })),
  );
}

/**
 * Marks a recipe as approved by the family. Only possible after a completed session that
 * the family rated well — a sample recipe never becomes "approved" on its own.
 */
export async function confirmFamilyApproved(recipeId: string, sessionId: string): Promise<void> {
  const db = getDb();
  await db.transaction("rw", db.recipes, db.sessions, async () => {
    const s = await db.sessions.get(sessionId);
    const good = s?.feedback?.verdict === "rat_ngon" || s?.feedback?.verdict === "vua_mieng";
    if (!s || s.recipeId !== recipeId || s.status !== "completed" || !good) {
      throw new RuleError("Chỉ đánh dấu “Gia đình đã duyệt” sau một lần nấu được khen ngon.");
    }
    await db.recipes.update(recipeId, { verification: "family_approved", updatedAt: nowIso() });
  });
  await touch();
}

// ───────────── settings ─────────────

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const row = await getDb().settings.get(key);
  return row === undefined ? fallback : (row.value as T);
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  await getDb().settings.put({ key, value });
}

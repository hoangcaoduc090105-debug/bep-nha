// The only code that reads or writes the database. Screens call these functions.
// The rules that protect the family's history are enforced here (DATABASE_SCHEMA §3).

import { getDb } from "./db";
import { SEED_RECIPES, type SeedRecipe } from "./seed";
import type { CookingSession, Recipe, RecipeVersion, Verdict } from "./types";
import { newId, nowIso, searchKey } from "@/lib/text";

export class RuleError extends Error {}

// ───────────── change tracking (for the backup reminder) ─────────────

/** Records that there is something new to back up. Called after every change worth keeping. */
async function touch(): Promise<void> {
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
  const order = ["Món kho", "Món chiên", "Món xào", "Món canh", "Món hấp", "Món luộc", "Món nướng", "Món gỏi", "Món ăn sáng", "Món ăn gia đình", "Món tráng miệng"];
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
export async function finishSession(id: string, feedback: { verdict: Verdict; note?: string }): Promise<void> {
  const db = getDb();
  await db.transaction("rw", db.sessions, async () => {
    const s = await db.sessions.get(id);
    if (!s) throw new RuleError("Không tìm thấy lần nấu này.");
    if (s.status === "completed") return;
    await db.sessions.update(id, {
      status: "completed",
      finishedAt: nowIso(),
      timers: [],
      feedback: { verdict: feedback.verdict, note: feedback.note?.trim() || undefined },
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

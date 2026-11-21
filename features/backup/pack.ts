// Recipe packs: one or more dishes in a file, to send to another phone.
// A pack uses the same verified ZIP format as a backup, marked kind = "recipe-pack".
// It carries the dishes, all their versions and their photos — never the cooking journal,
// favourites or settings. Receiving a pack only ever ADDS: nothing on the device is replaced.

import { getDb } from "@/data/db";
import { touch } from "@/data/repo";
import type { Recipe, RecipeVersion } from "@/data/types";
import { contentOf, sameContent } from "@/features/editor/form";
import { newId, nowIso, searchKey } from "@/lib/text";
import { keepRestorePoint, toBackupImages } from "./index";
import { BackupError, buildPackage, readPackage, type BackupData, type ParsedPackage } from "./package";

export const RECEIVED_LABEL = "nhận từ máy khác";

export async function createRecipePack(recipeIds: string[]): Promise<{ bytes: Uint8Array; fileName: string; names: string[] }> {
  if (recipeIds.length === 0) throw new BackupError("Mẹ chọn ít nhất một món để gửi.");
  const db = getDb();
  const createdAt = nowIso();
  const read = await db.transaction("r", db.recipes, db.versions, db.images, async () => {
    const recipes = (await db.recipes.bulkGet(recipeIds)).filter((r): r is Recipe => r != null);
    if (recipes.length !== recipeIds.length) throw new BackupError("Có món không còn trên máy. Mẹ chọn lại nhé.");
    const versions = (await db.versions.where("recipeId").anyOf(recipeIds).toArray()).map((v) => {
      // The session a version came from stays on this device; the journal is not sent.
      const copy = { ...v };
      delete copy.fromSessionId;
      return copy;
    });
    const stored = (await db.images.bulkGet(recipes.flatMap((r) => (r.imageId ? [r.imageId] : [])))).filter((i) => i != null);
    return { recipes, versions, stored };
  });
  // Photo bytes are read after the transaction: waiting on a file inside it would end it early.
  const images = await toBackupImages(read.stored);
  const have = new Set(images.map((i) => i.id));
  const data: BackupData = {
    recipes: read.recipes.map((r) => ({ ...r, isFavorite: false, isArchived: false, imageId: r.imageId && have.has(r.imageId) ? r.imageId : null })),
    versions: read.versions,
    sessions: [],
    settings: [],
    images: images.map(({ id, type, createdAt }) => ({ id, type, createdAt })),
  };
  const bytes = await buildPackage(data, images, createdAt, "recipe-pack");
  await readPackage(bytes, "recipe-pack"); // never hand over a file we cannot read back
  const names = data.recipes.map((r) => r.name);
  const stamp = createdAt.slice(0, 16).replace("T", "-").replace(":", "");
  const slug = names.length === 1 ? searchKey(names[0]).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "mon" : `${names.length}-mon`;
  return { bytes, fileName: `bep-nha-mon-${slug}-${stamp}.zip`, names };
}

// ───────────── receiving ─────────────

export type PackDish = { name: string; status: "new" | "existing"; newVersions: number };
export type PackSummary = { createdAt: string; dishes: PackDish[]; added: number; existing: number; newVersions: number };

type Plan = { recipes: Recipe[]; versions: RecipeVersion[]; imageIds: string[]; dishes: PackDish[] };

/**
 * Decides what a pack adds to the data on the device. Pure: it changes nothing.
 *  - a dish the device does not have is added whole;
 *  - for a dish it already has, only versions it lacks are added — the dish itself, its
 *    photo, and which version is in use are left alone;
 *  - a version that arrives with the same id but different contents is added as a separate
 *    version next to the one on the device.
 */
export function planImport(pack: BackupData, current: { recipes: Recipe[]; versions: RecipeVersion[]; imageIds: string[] }): Plan {
  const haveRecipes = new Map(current.recipes.map((r) => [r.id, r]));
  const haveVersions = new Map(current.versions.map((v) => [v.id, v]));
  const haveImages = new Set(current.imageIds);
  const plan: Plan = { recipes: [], versions: [], imageIds: [], dishes: [] };

  for (const r of pack.recipes) {
    const incoming = pack.versions.filter((v) => v.recipeId === r.id).sort((a, b) => a.versionNo - b.versionNo);
    const mine = haveRecipes.get(r.id);
    if (!mine) {
      if (incoming.some((v) => haveVersions.has(v.id))) throw new BackupError(`Tệp gửi món không khớp với dữ liệu trên máy (món “${r.name}”). Chưa thêm gì cả.`);
      plan.recipes.push({ ...r, isFavorite: false, isArchived: false });
      plan.versions.push(...incoming);
      if (r.imageId && !haveImages.has(r.imageId)) plan.imageIds.push(r.imageId);
      plan.dishes.push({ name: r.name, status: "new", newVersions: 0 });
      continue;
    }
    const existing = current.versions.filter((v) => v.recipeId === r.id);
    let nextNo = Math.max(...existing.map((v) => v.versionNo)) + 1;
    const known = new Set(existing.map((v) => v.id));
    const added: RecipeVersion[] = [];
    for (const v of incoming) {
      const content = contentOf(v);
      if ([...existing, ...added].some((e) => sameContent(contentOf(e), content))) continue;
      const clash = haveVersions.get(v.id);
      const copy: RecipeVersion = {
        ...v,
        id: clash ? newId() : v.id,
        kind: "family",
        versionNo: nextNo++,
        parentVersionId: clash ? clash.id : v.parentVersionId && known.has(v.parentVersionId) ? v.parentVersionId : mine.originalVersionId,
        label: v.label ?? RECEIVED_LABEL,
      };
      added.push(copy);
      known.add(copy.id);
    }
    plan.versions.push(...added);
    plan.dishes.push({ name: mine.name, status: "existing", newVersions: added.length });
  }
  return plan;
}

async function plan(parsed: ParsedPackage): Promise<Plan> {
  const db = getDb();
  return planImport(parsed.data, {
    recipes: await db.recipes.toArray(),
    versions: await db.versions.toArray(),
    imageIds: await db.images.toCollection().primaryKeys(),
  });
}

function summarise(parsed: ParsedPackage, p: Plan): PackSummary {
  return {
    createdAt: parsed.manifest.createdAt,
    dishes: p.dishes,
    added: p.dishes.filter((d) => d.status === "new").length,
    existing: p.dishes.filter((d) => d.status === "existing").length,
    newVersions: p.versions.length - p.recipes.reduce((n, r) => n + parsed.data.versions.filter((v) => v.recipeId === r.id).length, 0),
  };
}

/** Checks a pack and says what receiving it would add. Changes nothing. */
export async function inspectRecipePack(bytes: Uint8Array): Promise<PackSummary> {
  const parsed = await readPackage(bytes, "recipe-pack");
  return summarise(parsed, await plan(parsed));
}

/**
 * Adds the dishes of a pack. The pack is verified completely first, and the data as it was
 * is kept as a restore point, so receiving can be undone. Nothing existing is overwritten.
 */
export async function importRecipePack(bytes: Uint8Array): Promise<PackSummary> {
  const parsed = await readPackage(bytes, "recipe-pack");
  const db = getDb();
  const preview = await plan(parsed);
  if (preview.recipes.length === 0 && preview.versions.length === 0) return summarise(parsed, preview);
  await keepRestorePoint("Trước khi nhận món");
  const done = await db.transaction("rw", db.recipes, db.versions, db.images, async () => {
    const p = await plan(parsed); // planned again inside the transaction, against the data as it is now
    const now = nowIso();
    const images = new Map(parsed.images.map((i) => [i.id, i]));
    await db.images.bulkAdd(p.imageIds.map((id) => {
      const i = images.get(id)!;
      return { id, createdAt: i.createdAt, blob: new Blob([i.bytes as Uint8Array<ArrayBuffer>], { type: i.type }) };
    }));
    await db.versions.bulkAdd(p.versions);
    // A received dish keeps the label it was sent with; it is new on this device as of now.
    await db.recipes.bulkAdd(p.recipes.map((r) => ({ ...r, updatedAt: now })));
    return p;
  });
  await touch();
  return summarise(parsed, done);
}

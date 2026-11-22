import { beforeEach, describe, expect, it } from "vitest";
import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import { BepNhaDB, getDb, setDbForTests } from "@/data/db";
import * as repo from "@/data/repo";

import { BackupError, createBackup, inspectBackup, latestRestorePoint, markBackedUp, restoreBackup, undoRestore } from "@/features/backup";
import { sha256 } from "@/features/backup/package";
import { SEED_RECIPES as APP_SEEDS } from "@/data/seed";
import { SAMPLE_SEEDS } from "@/data/seed/samples";

// These tests work on a phone from before 2026-11-23: it holds the ten unverified samples the app
// used to load, next to the dishes rewritten from videos. A new phone has only the latter.
const SEED_RECIPES = [...SAMPLE_SEEDS, ...APP_SEEDS];
const N = SEED_RECIPES.length;

let n = 0;
beforeEach(async () => {
  setDbForTests(new BepNhaDB(`backup-test-${++n}`));
  await repo.ensureSeeded();
  await repo.addBuiltInRecipes(SAMPLE_SEEDS);
});

/** A device with real history: a family version, a cooked meal, a favourite and a photo. */
async function makeHistory() {
  const [r] = await repo.listRecipes({ query: "ca kho to" });
  const b = (await repo.getRecipeBundle(r.id))!;
  const v = await repo.saveFamilyVersion({ recipeId: r.id, baseVersionId: b.original.id, changes: [{ slot: "nuoc_mam", quantity: 1.5 }], reason: "Bớt mặn" });
  const s = await repo.startSession(r.id, v.id, 4);
  await repo.finishSession(s.id, { verdict: "rat_ngon", note: "Cả nhà khen" });
  await repo.toggleFavorite(r.id);
  await getDb().images.add({ id: "img-1", createdAt: "2026-11-21T00:00:00.000Z", blob: new Blob([new Uint8Array([1, 2, 3, 4, 5, 250, 251])], { type: "image/jpeg" }) });
  await getDb().sessions.update(s.id, { photoIds: ["img-1"] });
  return r.id;
}

async function dump() {
  const db = getDb();
  const images = await Promise.all((await db.images.toArray()).map(async (i) => ({ id: i.id, type: i.blob.type, bytes: [...new Uint8Array(await i.blob.arrayBuffer())] })));
  return {
    recipes: await db.recipes.orderBy("id").toArray(),
    versions: await db.versions.orderBy("id").toArray(),
    sessions: (await db.sessions.orderBy("id").toArray()).filter((s) => s.status === "completed"),
    images,
  };
}

async function wipe() {
  const db = getDb();
  await Promise.all([db.recipes.clear(), db.versions.clear(), db.sessions.clear(), db.images.clear(), db.settings.clear()]);
}

/** Rewrites one file inside a package, optionally fixing the manifest checksum to match. */
async function tamper(zip: Uint8Array, path: string, change: (bytes: Uint8Array) => Uint8Array | null, fixChecksum = false) {
  const entries: Record<string, Uint8Array> = unzipSync(zip);
  const next = change(entries[path]);
  if (next === null) delete entries[path];
  else entries[path] = next;
  if (fixChecksum && next) {
    const manifest = JSON.parse(strFromU8(entries["manifest.json"]));
    manifest.files[path] = await sha256(next);
    entries["manifest.json"] = strToU8(JSON.stringify(manifest));
  }
  return zipSync(entries);
}

describe("backup package", () => {
  it("restores exactly what was backed up: recipes, versions, history and photos", async () => {
    await makeHistory();
    const before = await dump();
    const { bytes, fileName } = await createBackup();
    expect(fileName).toMatch(/^bep-nha-sao-luu-\d{4}-\d{2}-\d{2}-\d{4}\.zip$/);
    await wipe();
    expect((await dump()).recipes).toHaveLength(0);
    const summary = await restoreBackup(bytes);
    expect(summary).toMatchObject({ recipes: N, versions: N + 1, sessions: 1, images: 1 });
    expect(await dump()).toEqual(before);
    // The journal still points at the exact version that was cooked.
    const [entry] = await repo.listJournal();
    expect(entry.version?.ingredients.find((i) => i.slot === "nuoc_mam")?.quantity).toBe(1.5);
  });

  it("the family's own picture stays on the phone, is replaced cleanly, and travels in the backup", async () => {
    const db = getDb();
    const jpeg = (n: number) => new Blob([new Uint8Array([n, n, n, 7])], { type: "image/jpeg" });
    await repo.setFamilyPhoto(jpeg(1));
    const first = await repo.getSetting<string | null>(repo.FAMILY_PHOTO, null);
    await repo.setFamilyPhoto(jpeg(2));
    const second = await repo.getSetting<string | null>(repo.FAMILY_PHOTO, null);
    expect(second).not.toBe(first);
    expect(await db.images.count()).toBe(1);
    // Tidying up unused photos must not take it.
    await repo.pruneImages();
    expect(await repo.getImageBlob(second!)).not.toBeNull();

    const { bytes } = await createBackup();
    await wipe();
    await restoreBackup(bytes);
    expect(await repo.getSetting<string | null>(repo.FAMILY_PHOTO, null)).toBe(second);
    expect([...new Uint8Array(await (await repo.getImageBlob(second!))!.arrayBuffer())]).toEqual([2, 2, 2, 7]);

    await repo.removeFamilyPhoto();
    expect(await repo.getSetting<string | null>(repo.FAMILY_PHOTO, null)).toBeNull();
    expect(await db.images.count()).toBe(0);
  });

  // A backup from before 2026-11-23 holds the ten samples and has never heard of putting them away.
  it("an old backup with the samples still restores; its samples are then put away, not lost", async () => {
    const db = getDb();
    await wipe();
    await repo.addBuiltInRecipes(SAMPLE_SEEDS);
    await db.settings.put({ key: "seededIds", value: SAMPLE_SEEDS.map((x) => x.seedId) });
    const [fish] = await repo.listRecipes({ query: "ca kho to" });
    const cooked = (await repo.getRecipeBundle(fish.id))!;
    const meal = await repo.startSession(fish.id, cooked.original.id, 4);
    await repo.finishSession(meal.id, { verdict: "rat_ngon" });
    const { bytes } = await createBackup();

    // Today's phone: the dishes from videos, no samples.
    await wipe();
    await repo.ensureSeeded();
    expect(await inspectBackup(bytes)).toMatchObject({ recipes: SAMPLE_SEEDS.length, sessions: 1 });
    await restoreBackup(bytes);
    expect((await repo.listRecipes()).map((r) => r.name).sort()).toEqual(SAMPLE_SEEDS.map((x) => x.name).sort());

    // The next time the app opens: the dishes from videos arrive, the samples go to "Món đã xoá".
    await repo.ensureSeeded();
    expect(await repo.listRecipes()).toHaveLength(APP_SEEDS.length);
    expect((await repo.listRecipes({ archived: true })).map((r) => r.name).sort()).toEqual(SAMPLE_SEEDS.map((x) => x.name).sort());
    const [entry] = await repo.listJournal();
    expect(entry.recipe?.name).toBe("Cá kho tộ");
    expect(entry.session.versionId).toBe(cooked.original.id);
  });

  it("reports what a package contains without changing anything", async () => {
    await makeHistory();
    const before = await dump();
    const { bytes } = await createBackup();
    expect(await inspectBackup(bytes)).toMatchObject({ recipes: N, versions: N + 1, sessions: 1, images: 1 });
    expect(await dump()).toEqual(before);
  });

  it("leaves an unfinished cooking session out of the backup", async () => {
    const [r] = await repo.listRecipes({ query: "ca kho to" });
    const b = (await repo.getRecipeBundle(r.id))!;
    await repo.startSession(r.id, b.original.id, 4);
    const { bytes } = await createBackup();
    expect((await inspectBackup(bytes)).sessions).toBe(0);
  });
});

describe("a damaged package never replaces good data", () => {
  const cases: Array<[string, (zip: Uint8Array) => Promise<Uint8Array> | Uint8Array]> = [
    ["not a zip at all", () => strToU8("xin chào, đây không phải tệp sao lưu")],
    ["truncated file", (zip) => zip.slice(0, Math.floor(zip.length / 2))],
    ["no manifest (backup was interrupted)", (zip) => tamper(zip, "manifest.json", () => null)],
    ["one byte of a photo changed", (zip) => tamper(zip, "images/img-1", (b) => Uint8Array.from(b, (x, i) => (i === 2 ? x ^ 1 : x)))],
    ["a photo missing", (zip) => tamper(zip, "images/img-1", () => null)],
    ["data edited by hand", (zip) => tamper(zip, "data.json", (b) => strToU8(strFromU8(b).replace("Cá kho tộ", "Cá kho tiêu")))],
    [
      "checksum fixed but a session points at a missing version",
      (zip) =>
        tamper(zip, "data.json", (b) => {
          const d = JSON.parse(strFromU8(b));
          d.sessions[0].versionId = "khong-ton-tai";
          return strToU8(JSON.stringify(d));
        }, true),
    ],
    [
      "checksum fixed but a quantity is negative",
      (zip) =>
        tamper(zip, "data.json", (b) => {
          const d = JSON.parse(strFromU8(b));
          d.versions[0].ingredients[0].quantity = -5;
          return strToU8(JSON.stringify(d));
        }, true),
    ],
    [
      "made by a newer version of the app",
      (zip) => tamper(zip, "manifest.json", (b) => strToU8(strFromU8(b).replace(/"formatVersion": \d+/, '"formatVersion": 99'))),
    ],
  ];

  for (const [name, damage] of cases) {
    it(`refuses: ${name}`, async () => {
      await makeHistory();
      const { bytes } = await createBackup();
      const before = await dump();
      await expect(restoreBackup(await damage(bytes))).rejects.toThrow(BackupError);
      expect(await dump()).toEqual(before);
      expect(await latestRestorePoint()).toBeNull();
    });
  }
});

describe("restore points", () => {
  it("lets a restore be undone", async () => {
    await makeHistory();
    const { bytes: oldBackup } = await createBackup();
    // More cooking happens after that backup…
    const [r] = await repo.listRecipes({ query: "ca kho to" });
    const b = (await repo.getRecipeBundle(r.id))!;
    const s = await repo.startSession(r.id, b.original.id, 2);
    await repo.finishSession(s.id, { verdict: "vua_mieng" });
    const newer = await dump();
    expect(newer.sessions).toHaveLength(2);
    // …then the old backup is restored by mistake.
    await restoreBackup(oldBackup);
    expect((await dump()).sessions).toHaveLength(1);
    expect(await latestRestorePoint()).not.toBeNull();
    await undoRestore();
    expect(await dump()).toEqual(newer);
    expect(await latestRestorePoint()).toBeNull();
  });
});

describe("backup reminder bookkeeping", () => {
  it("notes unsaved changes and clears the note after a backup", async () => {
    expect(await repo.getSetting("unsavedSince", null)).toBeNull();
    await makeHistory();
    const since = await repo.getSetting<string | null>("unsavedSince", null);
    expect(since).not.toBeNull();
    const { createdAt } = await createBackup();
    // Building the file alone is not a backup; only handing it over counts.
    expect(await repo.getSetting("lastBackupAt", null)).toBeNull();
    await markBackedUp(createdAt);
    expect(await repo.getSetting("lastBackupAt", null)).toBe(createdAt);
    expect(await repo.getSetting("unsavedSince", null)).toBeNull();
  });
  it("keeps this device's backup history when data is restored", async () => {
    await makeHistory();
    const { bytes, createdAt } = await createBackup();
    await markBackedUp(createdAt);
    await restoreBackup(bytes);
    expect(await repo.getSetting("lastBackupAt", null)).toBe(createdAt);
  });
});

// ───────────── recipe packs ─────────────

import { createRecipePack, importRecipePack, inspectRecipePack } from "@/features/backup/pack";
import { formFromRecipe, newStep } from "@/features/editor/form";

/** A second, separate device: its own database with the samples loaded. */
async function onOtherDevice<T>(work: () => Promise<T>): Promise<T> {
  const here = getDb();
  setDbForTests(new BepNhaDB(`other-device-${++n}`));
  await repo.ensureSeeded();
  await repo.addBuiltInRecipes(SAMPLE_SEEDS);
  try {
    return await work();
  } finally {
    setDbForTests(here);
  }
}

async function ownDish() {
  const b = (await repo.getRecipeBundle((await repo.listRecipes({ query: "ca kho to" }))[0].id))!;
  const form = { ...formFromRecipe(b.recipe, b.original), name: "Cá kho của ngoại", sourceNote: "Bà ngoại chỉ" };
  const imageId = await repo.addImage(new Blob([new Uint8Array([255, 216, 255, 9, 8, 7])], { type: "image/jpeg" }));
  const r = await repo.saveRecipeForm({ form: { ...form, imageId } });
  return { ...r, imageId };
}

describe("recipe packs", () => {
  it("carries a dish with its versions and photo to another device, without the journal", async () => {
    const dish = await ownDish();
    const s = await repo.startSession(dish.recipeId, dish.versionId, 4);
    await repo.finishSession(s.id, { verdict: "rat_ngon" });
    await repo.toggleFavorite(dish.recipeId);
    const v2 = await repo.saveFamilyVersion({ recipeId: dish.recipeId, baseVersionId: dish.versionId, changes: [{ slot: "nuoc_mam", quantity: 1.5 }], reason: "Bớt mặn", fromSessionId: s.id });
    const pack = await createRecipePack([dish.recipeId]);
    expect(pack.fileName).toMatch(/^bep-nha-mon-ca-kho-cua-ngoai-.*\.zip$/);

    await onOtherDevice(async () => {
      const summary = await inspectRecipePack(pack.bytes);
      expect(summary).toMatchObject({ added: 1, existing: 0, newVersions: 0 });
      expect(await repo.listRecipes()).toHaveLength(N); // inspecting changes nothing
      await importRecipePack(pack.bytes);
      const got = (await repo.getRecipeBundle(dish.recipeId))!;
      expect(got.recipe).toMatchObject({ name: "Cá kho của ngoại", verification: "entered", isFavorite: false, imageId: dish.imageId });
      expect(got.versions.map((v) => v.id)).toEqual([dish.versionId, v2.id]);
      expect(got.family?.id).toBe(v2.id);
      expect(got.family?.fromSessionId).toBeUndefined();
      expect(got.timesCooked).toBe(0);
      expect(await repo.listJournal()).toHaveLength(0);
      expect([...new Uint8Array(await (await repo.getImageBlob(dish.imageId))!.arrayBuffer())]).toEqual([255, 216, 255, 9, 8, 7]);
      expect(await repo.listRecipes()).toHaveLength(N + 1);
    });
  });

  it("receiving the same pack twice adds nothing the second time", async () => {
    const dish = await ownDish();
    const pack = await createRecipePack([dish.recipeId]);
    await onOtherDevice(async () => {
      await importRecipePack(pack.bytes);
      const before = await dump();
      const again = await importRecipePack(pack.bytes);
      expect(again).toMatchObject({ added: 0, existing: 1, newVersions: 0 });
      expect(await dump()).toEqual(before);
    });
  });

  it("never overwrites: a dish the device already has keeps its name, photo, version in use and history", async () => {
    const dish = await ownDish();
    const first = await createRecipePack([dish.recipeId]);
    // The sender cooks it, then changes it and sends it again.
    const s = await repo.startSession(dish.recipeId, dish.versionId, 4);
    await repo.finishSession(s.id, { verdict: "hoi_man" });
    const plan = (await repo.planEdit(dish.recipeId))!;
    const form = { ...formFromRecipe(plan.bundle.recipe, plan.base), name: "Tên mới bên máy gửi" };
    form.steps.push({ ...newStep(), title: "Rắc tiêu", text: "Rắc thêm tiêu.", doneWhen: "thơm mùi tiêu.", avoid: "rắc khi còn sôi mạnh." });
    const v2 = await repo.saveRecipeForm({ form, recipeId: dish.recipeId, reason: "Thêm tiêu" });
    const second = await createRecipePack([dish.recipeId]);

    await onOtherDevice(async () => {
      await importRecipePack(first.bytes);
      // The receiver has made the dish her own in the meantime.
      const mine = await repo.saveFamilyVersion({ recipeId: dish.recipeId, baseVersionId: dish.versionId, changes: [{ slot: "duong", quantity: 2 }], reason: "Nhà thích ngọt" });
      const cooked = await repo.startSession(dish.recipeId, mine.id, 4);
      await repo.finishSession(cooked.id, { verdict: "rat_ngon" });
      const before = (await repo.getRecipeBundle(dish.recipeId))!;

      const summary = await importRecipePack(second.bytes);
      expect(summary).toMatchObject({ added: 0, existing: 1, newVersions: 1 });
      const after = (await repo.getRecipeBundle(dish.recipeId))!;
      expect(after.recipe).toEqual(before.recipe); // name, photo, version in use: untouched
      expect(after.family?.id).toBe(mine.id);
      for (const v of before.versions) expect(after.versions.find((x) => x.id === v.id)).toEqual(v);
      const added = after.versions.find((x) => x.id === v2.versionId)!;
      expect(added).toMatchObject({ kind: "family", versionNo: 3, changeReason: "Thêm tiêu" });
      expect(added.steps).toHaveLength(before.original.steps.length + 1);
      expect((await repo.listJournal())[0].version?.id).toBe(mine.id);
    });
  });

  it("a version that arrives with the same id but other contents is added beside the one on the device", async () => {
    const dish = await ownDish();
    const first = await createRecipePack([dish.recipeId]);
    // Never cooked, so the sender corrects it in place: same version id, new contents.
    const plan = (await repo.planEdit(dish.recipeId))!;
    const form = formFromRecipe(plan.bundle.recipe, plan.base);
    form.ingredients = form.ingredients.map((i) => (i.slot === "nuoc_mam" ? { ...i, quantity: 3 } : i));
    expect((await repo.saveRecipeForm({ form, recipeId: dish.recipeId })).outcome).toBe("updated_in_place");
    const second = await createRecipePack([dish.recipeId]);

    await onOtherDevice(async () => {
      await importRecipePack(first.bytes);
      const before = (await repo.getRecipeBundle(dish.recipeId))!;
      expect(await importRecipePack(second.bytes)).toMatchObject({ newVersions: 1 });
      const after = (await repo.getRecipeBundle(dish.recipeId))!;
      expect(after.original).toEqual(before.original);
      expect(after.versions).toHaveLength(2);
      expect(after.versions[1]).toMatchObject({ kind: "family", parentVersionId: dish.versionId });
      expect(after.versions[1].ingredients.find((i) => i.slot === "nuoc_mam")?.quantity).toBe(3);
      expect(after.family).toBeNull(); // the version in use is not switched for her
      expect(await importRecipePack(second.bytes)).toMatchObject({ newVersions: 0 });
    });
  });

  it("receiving can be undone", async () => {
    const dish = await ownDish();
    const pack = await createRecipePack([dish.recipeId]);
    await onOtherDevice(async () => {
      const before = await dump();
      await importRecipePack(pack.bytes);
      expect((await latestRestorePoint())?.reason).toBe("Trước khi nhận món");
      await undoRestore();
      expect(await dump()).toEqual(before);
    });
  });

  it("a backup is not accepted as a pack, a pack is not accepted as a backup, and a damaged pack adds nothing", async () => {
    const dish = await ownDish();
    const pack = await createRecipePack([dish.recipeId]);
    const backup = await createBackup();
    await expect(inspectBackup(pack.bytes)).rejects.toThrow(/tệp gửi món/);
    await expect(restoreBackup(pack.bytes)).rejects.toThrow(BackupError);
    await onOtherDevice(async () => {
      const before = await dump();
      await expect(importRecipePack(backup.bytes)).rejects.toThrow(/bản sao lưu cả máy/);
      const broken = await tamper(pack.bytes, `images/${dish.imageId}`, (b) => b.slice(1));
      await expect(importRecipePack(broken)).rejects.toThrow(BackupError);
      await expect(importRecipePack(new Uint8Array([1, 2, 3]))).rejects.toThrow(BackupError);
      expect(await dump()).toEqual(before);
      expect(await latestRestorePoint()).toBeNull();
    });
  });

  it("a backup written before recipe packs existed (format 1) still restores", async () => {
    await makeHistory();
    const { bytes } = await createBackup();
    const entries: Record<string, Uint8Array> = unzipSync(bytes);
    const manifest = JSON.parse(strFromU8(entries["manifest.json"]));
    manifest.formatVersion = 1;
    delete manifest.kind;
    entries["manifest.json"] = strToU8(JSON.stringify(manifest));
    const old = zipSync(entries);
    const before = await dump();
    await wipe();
    await restoreBackup(old);
    expect(await dump()).toEqual(before);
  });

  it("a full backup includes dish photos and the new label, and leaves drafts out", async () => {
    const dish = await ownDish();
    await repo.saveDraft("new", formFromRecipe((await repo.getRecipeBundle(dish.recipeId))!.recipe, (await repo.getRecipeBundle(dish.recipeId))!.original), null);
    const { bytes } = await createBackup();
    const entries = unzipSync(bytes);
    expect(Object.keys(entries)).toContain(`images/${dish.imageId}`);
    expect(strFromU8(entries["data.json"])).not.toContain("drafts");
    const before = await dump();
    await wipe();
    await restoreBackup(bytes);
    expect(await dump()).toEqual(before);
    expect((await repo.getRecipeBundle(dish.recipeId))!.recipe).toMatchObject({ verification: "entered", imageId: dish.imageId });
  });
});

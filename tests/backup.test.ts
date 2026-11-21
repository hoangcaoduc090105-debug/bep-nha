import { beforeEach, describe, expect, it } from "vitest";
import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import { BepNhaDB, getDb, setDbForTests } from "@/data/db";
import * as repo from "@/data/repo";
import { SEED_RECIPES } from "@/data/seed";

const N = SEED_RECIPES.length;
import { BackupError, createBackup, inspectBackup, latestRestorePoint, markBackedUp, restoreBackup, undoRestore } from "@/features/backup";
import { sha256 } from "@/features/backup/package";

let n = 0;
beforeEach(async () => {
  setDbForTests(new BepNhaDB(`backup-test-${++n}`));
  await repo.ensureSeeded();
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
      (zip) => tamper(zip, "manifest.json", (b) => strToU8(strFromU8(b).replace('"formatVersion": 1', '"formatVersion": 99'))),
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

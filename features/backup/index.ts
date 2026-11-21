// Backup and restore against the local database, and handing the file to the user.

import { getDb } from "@/data/db";
import type { Setting } from "@/data/types";
import { newId, nowIso } from "@/lib/text";
import { BackupError, buildPackage, readPackage, type BackupData, type BackupImage, type Manifest } from "./package";

export { BackupError };

/** Settings that describe this device or this backup history, not the family's data. */
const DEVICE_ONLY = new Set(["lastBackupAt", "unsavedSince"]);
const MAX_RESTORE_POINTS = 3;

async function snapshot(): Promise<{ data: BackupData; images: BackupImage[] }> {
  const db = getDb();
  return db.transaction("r", db.recipes, db.versions, db.sessions, db.settings, db.images, async () => {
    const stored = await db.images.toArray();
    const images: BackupImage[] = await Promise.all(
      stored.map(async (i) => ({ id: i.id, type: i.blob.type, createdAt: i.createdAt, bytes: new Uint8Array(await i.blob.arrayBuffer()) })),
    );
    const data: BackupData = {
      recipes: await db.recipes.toArray(),
      versions: await db.versions.toArray(),
      // An unfinished cooking session is not history; it is left out.
      sessions: (await db.sessions.toArray()).filter((s) => s.status === "completed"),
      settings: (await db.settings.toArray()).filter((s) => !DEVICE_ONLY.has(s.key)),
      images: images.map(({ id, type, createdAt }) => ({ id, type, createdAt })),
    };
    return { data, images };
  });
}

/** Builds a verified package of everything on the device. Does not record it as "backed up". */
export async function createBackup(): Promise<{ bytes: Uint8Array; fileName: string; createdAt: string }> {
  const createdAt = nowIso();
  const { data, images } = await snapshot();
  const bytes = await buildPackage(data, images, createdAt);
  // Read our own package back before giving it to the user: a backup that cannot be read is worthless.
  await readPackage(bytes);
  const stamp = createdAt.slice(0, 16).replace("T", "-").replace(":", "");
  return { bytes, fileName: `bep-nha-sao-luu-${stamp}.zip`, createdAt };
}

/** Called once the file has actually been handed to the user. */
export async function markBackedUp(createdAt: string): Promise<void> {
  const db = getDb();
  await db.transaction("rw", db.settings, async () => {
    await db.settings.put({ key: "lastBackupAt", value: createdAt });
    await db.settings.delete("unsavedSince");
  });
}

export type BackupSummary = Manifest["counts"] & { createdAt: string };

/** Checks a package without changing anything. Throws BackupError if it is not usable. */
export async function inspectBackup(bytes: Uint8Array): Promise<BackupSummary> {
  const { manifest } = await readPackage(bytes);
  return { ...manifest.counts, createdAt: manifest.createdAt };
}

async function replaceAll(bytes: Uint8Array): Promise<void> {
  const parsed = await readPackage(bytes); // verified completely before anything is touched
  const db = getDb();
  await db.transaction("rw", db.recipes, db.versions, db.sessions, db.settings, db.images, async () => {
    const keep: Setting[] = (await db.settings.toArray()).filter((s) => DEVICE_ONLY.has(s.key));
    await Promise.all([db.recipes.clear(), db.versions.clear(), db.sessions.clear(), db.settings.clear(), db.images.clear()]);
    await db.recipes.bulkAdd(parsed.data.recipes);
    await db.versions.bulkAdd(parsed.data.versions);
    await db.sessions.bulkAdd(parsed.data.sessions);
    await db.settings.bulkPut([...parsed.data.settings, ...keep]);
    await db.images.bulkAdd(parsed.images.map((i) => ({ id: i.id, createdAt: i.createdAt, blob: new Blob([i.bytes as Uint8Array<ArrayBuffer>], { type: i.type }) })));
  });
}

/**
 * Replaces everything on the device with the contents of a package.
 * The package is fully verified first; the current data is kept as a restore point so the
 * restore can be undone. If anything is wrong, nothing changes.
 */
export async function restoreBackup(bytes: Uint8Array): Promise<BackupSummary> {
  const summary = await inspectBackup(bytes);
  const db = getDb();
  const current = await snapshot();
  const currentBytes = await buildPackage(current.data, current.images, nowIso());
  await db.restorePoints.add({ id: newId(), createdAt: nowIso(), reason: "Trước khi khôi phục", bytes: currentBytes });
  const points = await db.restorePoints.orderBy("createdAt").toArray();
  await db.restorePoints.bulkDelete(points.slice(0, Math.max(0, points.length - MAX_RESTORE_POINTS)).map((p) => p.id));
  await replaceAll(bytes);
  return summary;
}

export async function latestRestorePoint(): Promise<{ id: string; createdAt: string } | null> {
  const p = await getDb().restorePoints.orderBy("createdAt").last();
  return p ? { id: p.id, createdAt: p.createdAt } : null;
}

/** Undoes the last restore by putting back the data saved just before it. */
export async function undoRestore(): Promise<void> {
  const db = getDb();
  const p = await db.restorePoints.orderBy("createdAt").last();
  if (!p) throw new BackupError("Không có lần khôi phục nào để hoàn tác.");
  await replaceAll(p.bytes);
  await db.restorePoints.delete(p.id);
}

/**
 * Gives the file to the user: the phone's share sheet when it accepts files (so it can be
 * saved to Files / iCloud Drive), otherwise an ordinary download.
 * Returns false if she closed the share sheet without saving.
 */
export async function handOver(bytes: Uint8Array, fileName: string): Promise<boolean> {
  const file = new File([bytes as Uint8Array<ArrayBuffer>], fileName, { type: "application/zip" });
  if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: "Sao lưu Bếp Nhà" });
      return true;
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return false;
      // Sharing failed for another reason: fall through to a download.
    }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return true;
}

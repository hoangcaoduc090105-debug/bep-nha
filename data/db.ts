import Dexie, { type EntityTable } from "dexie";
import type { CookingSession, Draft, Recipe, RecipeVersion, RestorePoint, Setting, StoredImage } from "./types";

/**
 * The local database. All of the family's data lives here, on the device.
 * Only data/repo.ts and the backup code may import this file.
 */
export class BepNhaDB extends Dexie {
  recipes!: EntityTable<Recipe, "id">;
  versions!: EntityTable<RecipeVersion, "id">;
  sessions!: EntityTable<CookingSession, "id">;
  images!: EntityTable<StoredImage, "id">;
  settings!: EntityTable<Setting, "key">;
  restorePoints!: EntityTable<RestorePoint, "id">;
  drafts!: EntityTable<Draft, "id">;

  constructor(name = "bep-nha") {
    super(name);
    // Only indexed fields are listed. Changing this requires a new .version(n) with an upgrade.
    this.version(1).stores({
      recipes: "id, searchName, isArchived",
      versions: "id, recipeId",
      sessions: "id, recipeId, versionId, status, startedAt",
      images: "id",
      settings: "key",
    });
    // v2: restore points (the data as it was before a restore), so a restore can be undone.
    this.version(2).stores({ restorePoints: "id, createdAt" });
    // v3: unfinished work in the recipe editor. Not part of a backup.
    this.version(3).stores({ drafts: "id" });
  }
}

let instance: BepNhaDB | null = null;

export function getDb(): BepNhaDB {
  instance ??= new BepNhaDB();
  return instance;
}

/** Tests use a fresh database each time. */
export function setDbForTests(db: BepNhaDB | null): void {
  instance = db;
}

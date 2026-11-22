import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { BepNhaDB, getDb, setDbForTests } from "@/data/db";
import * as repo from "@/data/repo";
import { SEED_RECIPES } from "@/data/seed";
import { SAMPLE_SEEDS } from "@/data/seed/samples";
import { createBackup, inspectBackup, restoreBackup } from "@/features/backup";

// tests/data/sao-luu-co-mon-mau.zip is a backup as a phone made it before 2026-11-23: the ten
// unverified samples, one meal cooked from "Cá kho tộ", and no dish from a video. It is kept in
// the repository so that both these tests and the end-to-end tests (e2e/g4.spec.ts) prove that
// such a backup still restores. To make it again: TAO_GOI_CU=1 npx vitest run tests/old-backup.test.ts
const FILE = join(__dirname, "data", "sao-luu-co-mon-mau.zip");

describe("a backup made before the samples were dropped", () => {
  it.runIf(process.env.TAO_GOI_CU === "1")("is written (only when asked)", async () => {
    setDbForTests(new BepNhaDB("old-backup-make"));
    await repo.addBuiltInRecipes(SAMPLE_SEEDS);
    await getDb().settings.put({ key: "seededIds", value: SAMPLE_SEEDS.map((x) => x.seedId) });
    const [fish] = await repo.listRecipes({ query: "ca kho to" });
    const bundle = (await repo.getRecipeBundle(fish.id))!;
    const meal = await repo.startSession(fish.id, bundle.original.id, 4);
    await repo.finishSession(meal.id, { verdict: "vua_mieng", note: "Nấu thử lần đầu" });
    writeFileSync(FILE, (await createBackup()).bytes);
  });

  it("is in the repository, and still restores on today's app", async () => {
    expect(existsSync(FILE), "tests/data/sao-luu-co-mon-mau.zip").toBe(true);
    const bytes = new Uint8Array(readFileSync(FILE));
    setDbForTests(new BepNhaDB("old-backup-restore"));
    await repo.ensureSeeded();
    expect(await inspectBackup(bytes)).toMatchObject({ recipes: 10, versions: 10, sessions: 1, images: 0 });
    await restoreBackup(bytes);
    const restored = await repo.listRecipes();
    expect(restored.map((r) => r.name).sort()).toEqual(SAMPLE_SEEDS.map((x) => x.name).sort());
    expect(restored.every((r) => r.verification === "sample")).toBe(true);

    // Next time the app opens the dishes from videos come back, and the samples are put away.
    await repo.ensureSeeded();
    expect(await repo.listRecipes()).toHaveLength(SEED_RECIPES.length);
    expect(await repo.listRecipes({ archived: true })).toHaveLength(10);
    const [entry] = await repo.listJournal();
    expect(entry.recipe?.name).toBe("Cá kho tộ");
    expect(entry.session.feedback).toMatchObject({ verdict: "vua_mieng", note: "Nấu thử lần đầu" });
  });
});

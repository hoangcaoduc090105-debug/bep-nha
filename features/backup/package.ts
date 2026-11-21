// The backup package: one ZIP holding everything, with checksums.
// This file is pure (no database, no browser UI) so it can be tested thoroughly.
//
//   data.json        every record except photos
//   images/<id>      each photo, byte for byte
//   manifest.json    format version, date, record counts, SHA-256 of every other file
//
// A package is only accepted if the manifest is present, every checksum matches, the counts
// match, the records have the right shape and every link between records resolves.

import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import { z } from "zod";
import type { CookingSession, Recipe, RecipeVersion, Setting } from "@/data/types";

export const FORMAT_VERSION = 1;
export const APP_ID = "bep-nha";

export type BackupImage = { id: string; type: string; createdAt: string; bytes: Uint8Array };

export type BackupData = {
  recipes: Recipe[];
  versions: RecipeVersion[];
  sessions: CookingSession[];
  settings: Setting[];
  images: Array<{ id: string; type: string; createdAt: string }>;
};

export type Manifest = {
  app: string;
  formatVersion: number;
  createdAt: string;
  counts: { recipes: number; versions: number; sessions: number; images: number };
  files: Record<string, string>;
};

export class BackupError extends Error {}

// ───────────── shapes ─────────────

const ingredient = z.object({
  slot: z.string().min(1),
  name: z.string().min(1),
  kind: z.enum(["food", "seasoning"]),
  group: z.string(),
  quantity: z.number().positive().nullable(),
  unit: z.string().nullable(),
  metricQuantity: z.number().positive().nullable(),
  metricUnit: z.enum(["g", "ml"]).nullable(),
}).loose();

const step = z.object({
  no: z.number().int().min(1),
  phase: z.enum(["prep", "cook", "finish"]),
  title: z.string().min(1),
  instructions: z.array(z.string()),
  uses: z.array(z.object({ slot: z.string(), portion: z.number().positive().max(1) })),
  timerSeconds: z.number().int().min(5).max(21600).optional(),
}).loose();

const version = z.object({
  id: z.string().min(1),
  recipeId: z.string().min(1),
  kind: z.enum(["original", "family"]),
  versionNo: z.number().int().min(1),
  parentVersionId: z.string().nullable(),
  servings: z.number().int().min(1).max(30),
  prepMinutes: z.number().min(0).max(1440),
  cookMinutes: z.number().min(0).max(1440),
  ingredients: z.array(ingredient),
  steps: z.array(step),
  equipment: z.array(z.object({ name: z.string(), kind: z.enum(["appliance", "utensil"]), required: z.boolean() }).loose()),
  createdAt: z.string(),
}).loose();

const recipe = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  searchName: z.string(),
  description: z.string(),
  imageId: z.string().nullable(),
  categories: z.array(z.string()),
  source: z.object({ kind: z.string(), title: z.string(), fidelity: z.string() }).loose(),
  originalVersionId: z.string().min(1),
  familyVersionId: z.string().nullable(),
  verification: z.enum(["sample", "source_checked", "family_approved"]),
  isArchived: z.boolean(),
  isFavorite: z.boolean(),
}).loose();

const session = z.object({
  id: z.string().min(1),
  recipeId: z.string().min(1),
  versionId: z.string().min(1),
  servings: z.number().int().min(1).max(30),
  status: z.enum(["in_progress", "completed", "abandoned"]),
  currentStep: z.number().int().min(0),
  checked: z.array(z.string()),
  feedback: z.object({ verdict: z.enum(["rat_ngon", "vua_mieng", "hoi_man", "hoi_ngot", "chua_ngon"]) }).loose().nullable(),
  photoIds: z.array(z.string()),
  startedAt: z.string(),
}).loose();

const dataSchema = z.object({
  recipes: z.array(recipe),
  versions: z.array(version),
  sessions: z.array(session),
  settings: z.array(z.object({ key: z.string(), value: z.unknown() })),
  images: z.array(z.object({ id: z.string().min(1), type: z.string(), createdAt: z.string() })),
});

const manifestSchema = z.object({
  app: z.literal(APP_ID),
  formatVersion: z.number().int().min(1),
  createdAt: z.string(),
  counts: z.object({ recipes: z.number(), versions: z.number(), sessions: z.number(), images: z.number() }),
  files: z.record(z.string(), z.string()),
});

// ───────────── links between records ─────────────

/** Returns a description of every broken link; an empty list means the data is consistent. */
export function findBrokenLinks(data: BackupData): string[] {
  const problems: string[] = [];
  const versions = new Map(data.versions.map((v) => [v.id, v]));
  const recipes = new Map(data.recipes.map((r) => [r.id, r]));
  const images = new Set(data.images.map((i) => i.id));
  for (const r of data.recipes) {
    const o = versions.get(r.originalVersionId);
    if (!o || o.recipeId !== r.id || o.kind !== "original") problems.push(`Món “${r.name}” thiếu bản gốc.`);
    if (r.familyVersionId != null) {
      const f = versions.get(r.familyVersionId);
      if (!f || f.recipeId !== r.id) problems.push(`Món “${r.name}” trỏ tới một bản nhà mình không tồn tại.`);
    }
    if (r.imageId != null && !images.has(r.imageId)) problems.push(`Món “${r.name}” thiếu ảnh.`);
  }
  for (const v of data.versions) {
    if (!recipes.has(v.recipeId)) problems.push(`Có phiên bản không thuộc món nào (${v.id}).`);
    const slots = new Set(v.ingredients.map((i) => i.slot));
    if (slots.size !== v.ingredients.length) problems.push(`Phiên bản ${v.id} có nguyên liệu trùng mã.`);
    for (const s of v.steps) for (const u of s.uses) if (!slots.has(u.slot)) problems.push(`Bước ${s.no} của phiên bản ${v.id} dùng nguyên liệu không có trong danh sách.`);
  }
  for (const s of data.sessions) {
    const v = versions.get(s.versionId);
    if (!v || v.recipeId !== s.recipeId) problems.push(`Có lần nấu không còn phiên bản công thức (${s.id}).`);
    for (const p of s.photoIds) if (!images.has(p)) problems.push(`Lần nấu ${s.id} thiếu ảnh.`);
  }
  return problems;
}

// ───────────── checksums ─────────────

export async function sha256(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes as Uint8Array<ArrayBuffer>);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ───────────── build ─────────────

/** Builds the ZIP. Refuses to build from inconsistent data, so a bad backup is never written. */
export async function buildPackage(data: BackupData, images: BackupImage[], createdAt: string): Promise<Uint8Array> {
  const problems = findBrokenLinks(data);
  if (problems.length > 0) throw new BackupError(`Dữ liệu có chỗ chưa khớp nên chưa sao lưu được: ${problems[0]}`);
  const imageIds = new Set(images.map((i) => i.id));
  for (const meta of data.images) if (!imageIds.has(meta.id)) throw new BackupError("Thiếu tệp ảnh khi tạo bản sao lưu.");

  const files: Record<string, Uint8Array> = { "data.json": strToU8(JSON.stringify(data)) };
  for (const img of images) files[`images/${img.id}`] = img.bytes;

  const manifest: Manifest = {
    app: APP_ID,
    formatVersion: FORMAT_VERSION,
    createdAt,
    counts: { recipes: data.recipes.length, versions: data.versions.length, sessions: data.sessions.length, images: images.length },
    files: {},
  };
  for (const [path, bytes] of Object.entries(files)) manifest.files[path] = await sha256(bytes);

  // Photos are already compressed; only the text is deflated.
  const zipInput: Record<string, [Uint8Array, { level: 0 | 6 }]> = {};
  for (const [path, bytes] of Object.entries(files)) zipInput[path] = [bytes, { level: path === "data.json" ? 6 : 0 }];
  zipInput["manifest.json"] = [strToU8(JSON.stringify(manifest, null, 2)), { level: 6 }];
  return zipSync(zipInput);
}

// ───────────── read and verify ─────────────

export type ParsedPackage = { manifest: Manifest; data: BackupData; images: BackupImage[] };

/** Reads a package and verifies everything. Throws BackupError with a plain reason if anything is wrong. */
export async function readPackage(zip: Uint8Array): Promise<ParsedPackage> {
  let entries: Record<string, Uint8Array>;
  try {
    entries = unzipSync(zip);
  } catch {
    throw new BackupError("Tệp này không mở được. Có thể tệp bị hỏng hoặc không phải bản sao lưu của Bếp Nhà.");
  }
  if (!entries["manifest.json"]) throw new BackupError("Bản sao lưu chưa hoàn chỉnh (thiếu phần xác nhận). Mẹ chọn bản khác nhé.");

  let manifest: Manifest;
  try {
    manifest = manifestSchema.parse(JSON.parse(strFromU8(entries["manifest.json"])));
  } catch {
    throw new BackupError("Đây không phải bản sao lưu của Bếp Nhà.");
  }
  if (manifest.formatVersion > FORMAT_VERSION) throw new BackupError("Bản sao lưu này được tạo bằng phiên bản ứng dụng mới hơn. Mẹ cập nhật ứng dụng rồi thử lại.");

  const expected = Object.keys(manifest.files).sort();
  const actual = Object.keys(entries).filter((p) => p !== "manifest.json" && !p.endsWith("/")).sort();
  if (expected.join("|") !== actual.join("|")) throw new BackupError("Bản sao lưu thiếu hoặc thừa tệp so với lúc tạo.");
  for (const path of expected) {
    if ((await sha256(entries[path])) !== manifest.files[path]) throw new BackupError("Bản sao lưu đã bị thay đổi hoặc hỏng (mã kiểm tra không khớp).");
  }

  let data: BackupData;
  try {
    data = dataSchema.parse(JSON.parse(strFromU8(entries["data.json"]))) as unknown as BackupData;
  } catch {
    throw new BackupError("Nội dung bản sao lưu không đúng định dạng.");
  }
  const c = manifest.counts;
  if (c.recipes !== data.recipes.length || c.versions !== data.versions.length || c.sessions !== data.sessions.length || c.images !== data.images.length) {
    throw new BackupError("Số lượng trong bản sao lưu không khớp với phần xác nhận.");
  }
  const problems = findBrokenLinks(data);
  if (problems.length > 0) throw new BackupError(`Bản sao lưu có dữ liệu không khớp: ${problems[0]}`);

  const images: BackupImage[] = data.images.map((meta) => {
    const bytes = entries[`images/${meta.id}`];
    if (!bytes) throw new BackupError("Bản sao lưu thiếu tệp ảnh.");
    return { ...meta, bytes };
  });
  return { manifest, data, images };
}

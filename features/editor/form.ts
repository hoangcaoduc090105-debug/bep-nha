// Pure logic of the recipe editor: the form, its validation, and turning a form into the
// contents of a recipe version. No database and no React, so every rule here is tested.

import type { Equipment, FormIngredient, FormStep, Ingredient, Recipe, RecipeForm, RecipeSource, RecipeVersion, Step, StepUse, Unit } from "@/data/types";
import { UNIT_LABELS } from "@/lib/quantity";
import { shortName } from "@/features/recipe-text";

export const CATEGORY_ORDER = ["Món kho", "Món chiên", "Món xào", "Món canh", "Món hấp", "Món luộc", "Món nướng", "Món gỏi", "Món ăn sáng", "Món ăn gia đình", "Món tráng miệng"];

/** Units offered in the editor, the everyday ones first. */
export const UNIT_CHOICES: Unit[] = ["g", "muong_canh", "muong_ca_phe", "cu", "trai", "chen", "ml", "kg", "l", "tep", "nhanh", "cay", "la", "lat", "con", "qua", "mieng", "bo", "hop"];

export const COMMON_EQUIPMENT: Equipment[] = [
  { name: "Bếp gas hoặc bếp từ", kind: "appliance", required: true },
  { name: "Nồi", kind: "utensil", required: true },
  { name: "Chảo", kind: "utensil", required: true },
  { name: "Dao, thớt", kind: "utensil", required: true },
  { name: "Nồi cơm điện", kind: "appliance", required: true },
  { name: "Nồi chiên không dầu", kind: "appliance", required: true },
  { name: "Lò vi sóng", kind: "appliance", required: true },
  { name: "Xửng hấp", kind: "utensil", required: true },
];

const key = () => Math.random().toString(36).slice(2, 8);

export function newIngredient(kind: "food" | "seasoning"): FormIngredient {
  return { slot: `nl_${key()}`, name: "", kind, quantity: 1, unit: kind === "seasoning" ? "muong_canh" : "g", prepNote: "", optional: false };
}

export function newStep(): FormStep {
  return { key: key(), title: "", text: "", doneWhen: "", avoid: "", timerMinutes: null, timerLabel: "", heat: null };
}

export function emptyForm(): RecipeForm {
  return {
    name: "",
    description: "",
    categories: [],
    servings: 4,
    prepMinutes: 15,
    cookMinutes: 30,
    imageId: null,
    ingredients: [],
    equipment: [],
    steps: [],
    sourceKind: "family",
    sourceTitle: "",
    sourceCreator: "",
    sourceUrl: "",
    sourceNote: "",
    notes: "",
    tasteTips: "",
  };
}

/** The form for editing an existing recipe, starting from one of its versions. */
export function formFromRecipe(recipe: Recipe, version: RecipeVersion): RecipeForm {
  const kind = recipe.source.kind === "youtube" ? "youtube" : recipe.source.kind === "family" || recipe.source.kind === "sample" ? "family" : "other";
  return {
    name: recipe.name,
    description: recipe.description,
    categories: [...recipe.categories],
    servings: version.servings,
    prepMinutes: version.prepMinutes,
    cookMinutes: version.cookMinutes,
    imageId: recipe.imageId,
    ingredients: version.ingredients.map((i) => ({ slot: i.slot, name: i.name, kind: i.kind, quantity: i.quantity, unit: i.unit, prepNote: i.prepNote ?? "", optional: i.optional ?? false })),
    equipment: version.equipment.map((e) => ({ ...e })),
    steps: version.steps.map((s) => ({
      key: `s${s.no}`,
      title: s.title,
      text: s.instructions.join("\n"),
      doneWhen: s.doneWhen ?? "",
      avoid: s.avoid ?? "",
      timerMinutes: s.timerSeconds == null ? null : Math.max(1, Math.round(s.timerSeconds / 60)),
      timerLabel: s.timerLabel ?? "",
      heat: s.heat ?? null,
    })),
    sourceKind: kind,
    sourceTitle: recipe.source.kind === "sample" ? "" : recipe.source.title,
    sourceCreator: recipe.source.creatorName ?? "",
    sourceUrl: recipe.source.url ?? "",
    sourceNote: recipe.source.kind === "sample" ? "" : (recipe.source.note ?? ""),
    notes: version.notes ?? "",
    tasteTips: version.tasteTips ?? "",
  };
}

// ───────────── ingredients inside step text ─────────────
// Stored: "Cho {nuoc_mam} vào". Shown and typed in the editor: "Cho [nước mắm] vào".

const TOKEN = /\{([a-z0-9_]+)\}/g;
const BRACKET = /\[([^\[\]\n]+)\]/g;
export const REMOVED_LABEL = "nguyên liệu đã bỏ";

const lower = (s: string) => s.trim().toLocaleLowerCase("vi");
export const displayName = (i: { name: string }) => shortName(i.name);

export function toFriendly(text: string, ingredients: FormIngredient[]): string {
  const bySlot = new Map(ingredients.map((i) => [i.slot, i]));
  return text.replace(TOKEN, (_, slot: string) => {
    const ing = bySlot.get(slot);
    return `[${ing && ing.name.trim() ? displayName(ing) : REMOVED_LABEL}]`;
  });
}

export function fromFriendly(text: string, ingredients: FormIngredient[]): string {
  const byName = new Map(ingredients.filter((i) => i.name.trim()).map((i) => [lower(displayName(i)), i.slot]));
  return text.replace(BRACKET, (whole, name: string) => {
    const slot = byName.get(lower(name));
    return slot ? `{${slot}}` : whole;
  });
}

export function tokensIn(text: string): string[] {
  return [...text.matchAll(TOKEN)].map((m) => m[1]);
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const UNIT_WORDS = ["muỗng canh", "muỗng cà phê", "muỗng", "thìa", "chén", "gam", "kg", "ký", "g", "ml", "lít", "củ", "trái", "tép", "nhánh", "cây", "lá", "lát", "con", "quả", "miếng", "bó"];

export type FixedAmount = { text: string; slot: string };

/**
 * Finds amounts typed into the text next to a listed ingredient ("2 muỗng canh nước mắm").
 * Such an amount does not follow the servings or a later adjustment.
 */
export function fixedAmounts(text: string, ingredients: FormIngredient[]): FixedAmount[] {
  const byName = new Map(ingredients.filter((i) => i.name.trim()).map((i) => [lower(displayName(i)), i.slot]));
  const names = [...byName.keys()].sort((a, b) => b.length - a.length);
  if (names.length === 0) return [];
  const re = new RegExp(`(?:\\d+(?:[.,/]\\d+)?|[½¼¾⅓⅔]|nửa)\\s*(?:${UNIT_WORDS.map(escapeRe).join("|")})\\s+(${names.map(escapeRe).join("|")})(?![\\p{L}])`, "giu");
  return [...text.matchAll(re)].map((m) => ({ text: m[0], slot: byName.get(lower(m[1]))! }));
}

/**
 * The typed amounts that are not allowed: those of an ingredient that is never inserted
 * with its amount anywhere in the recipe, so the typed number is the only place the amount
 * appears in the steps. (When the ingredient is inserted elsewhere, a typed amount is a
 * correction such as "nhạt thì thêm nửa muỗng cà phê nước mắm", which is fine.)
 */
export function forbiddenAmounts(step: FormStep, form: Pick<RecipeForm, "steps" | "ingredients">): FixedAmount[] {
  const inserted = new Set(form.steps.flatMap((s) => tokensIn(s.text)));
  return fixedAmounts(step.text, form.ingredients).filter((f) => !inserted.has(f.slot));
}

// ───────────── sources ─────────────

/** The 11-character video id from any usual YouTube link, or null. */
export function youtubeId(url: string): string | null {
  let u: URL;
  try {
    u = new URL(url.trim());
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  const host = u.hostname.replace(/^(www\.|m\.|music\.)/, "");
  let id: string | null = null;
  if (host === "youtu.be") id = u.pathname.split("/")[1] ?? null;
  else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts[0] === "watch") id = u.searchParams.get("v");
    else if (["shorts", "embed", "live", "v"].includes(parts[0])) id = parts[1] ?? null;
  }
  return id && /^[\w-]{11}$/.test(id) ? id : null;
}

function isWebLink(url: string): boolean {
  try {
    const u = new URL(url.trim());
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

export function buildSource(form: RecipeForm): RecipeSource {
  const note = form.sourceNote.trim() || undefined;
  if (form.sourceKind === "youtube") {
    const id = youtubeId(form.sourceUrl)!;
    return {
      kind: "youtube",
      title: form.sourceTitle.trim() || "Video trên YouTube",
      creatorName: form.sourceCreator.trim() || undefined,
      // Stored in one canonical form; nothing but the video id is kept from what was pasted.
      url: `https://www.youtube.com/watch?v=${id}`,
      youtubeVideoId: id,
      fidelity: "transcribed",
      note,
    };
  }
  if (form.sourceKind === "other") {
    return { kind: form.sourceUrl.trim() ? "website" : "book", title: form.sourceTitle.trim(), creatorName: form.sourceCreator.trim() || undefined, url: form.sourceUrl.trim() || undefined, fidelity: "transcribed", note };
  }
  return { kind: "family", title: form.sourceTitle.trim() || "Công thức của nhà mình", fidelity: "own", note };
}

// ───────────── validation ─────────────

export type Problem = { section: 1 | 2 | 3 | 4 | 5; message: string };

const SECTION_NAMES = ["", "Tên món", "Nguyên liệu", "Dụng cụ", "Các bước", "Nguồn"] as const;
export const sectionName = (n: number) => SECTION_NAMES[n] ?? "";

/** Everything that stops the form from becoming a recipe. An empty list means it can be saved. */
export function validateForm(form: RecipeForm): Problem[] {
  const out: Problem[] = [];
  const add = (section: Problem["section"], message: string) => out.push({ section, message });

  if (!form.name.trim()) add(1, "Món chưa có tên.");
  if (form.name.trim().length > 80) add(1, "Tên món dài quá 80 chữ.");
  if (!Number.isInteger(form.servings) || form.servings < 1 || form.servings > 30) add(1, "Số người ăn phải từ 1 đến 30.");
  for (const m of [form.prepMinutes, form.cookMinutes]) if (!Number.isFinite(m) || m < 0 || m > 1440) add(1, "Thời gian chuẩn bị và nấu phải từ 0 đến 1440 phút.");

  if (form.ingredients.length === 0) add(2, "Chưa có nguyên liệu nào.");
  const seen = new Set<string>();
  form.ingredients.forEach((i, n) => {
    const label = i.name.trim() ? `“${i.name.trim()}”` : `Dòng thứ ${n + 1}`;
    if (!i.name.trim()) add(2, `${label} chưa có tên.`);
    else {
      const k = lower(displayName(i));
      if (seen.has(k)) add(2, `Có hai dòng cùng tên ${label}. Mẹ gộp lại hoặc ghi rõ hơn (ví dụ “Đường thắng nước màu”).`);
      seen.add(k);
    }
    if (i.unit === "it") {
      if (i.quantity != null) add(2, `${label}: “một ít” thì không ghi số.`);
    } else if (!i.unit) add(2, `${label} chưa chọn đơn vị.`);
    else if (i.quantity == null || !Number.isFinite(i.quantity) || i.quantity <= 0 || i.quantity > 100000) add(2, `${label} chưa có lượng (phải lớn hơn 0).`);
  });

  if (form.equipment.some((e) => e.name.trim().length > 80)) add(3, "Tên dụng cụ dài quá 80 chữ.");

  if (form.steps.length === 0) add(4, "Chưa có bước nấu nào.");
  const slots = new Set(form.ingredients.map((i) => i.slot));
  form.steps.forEach((s, n) => {
    const b = `Bước ${n + 1}`;
    if (!s.title.trim()) add(4, `${b} chưa có tên.`);
    if (!s.text.trim()) add(4, `${b} chưa ghi cách làm.`);
    if (!s.doneWhen.trim()) add(4, `${b} chưa ghi “Được khi…”.`);
    if (!s.avoid.trim()) add(4, `${b} chưa ghi “Tránh…”.`);
    if (tokensIn(s.text).some((t) => !slots.has(t))) add(4, `${b} nhắc tới một nguyên liệu đã bỏ khỏi danh sách.`);
    const stray = [...s.text.matchAll(BRACKET)].map((m) => m[1]);
    if (stray.length > 0) add(4, `${b}: không thấy “${stray[0]}” trong danh sách nguyên liệu. Mẹ dùng nút “Chèn nguyên liệu”.`);
    const fixed = forbiddenAmounts(s, form);
    if (fixed.length > 0) add(4, `${b} ghi cứng “${fixed[0].text}”. Mẹ xoá số đó và dùng nút “Chèn nguyên liệu”, để lượng tự đổi theo số người ăn.`);
    if (s.timerMinutes != null && (!Number.isInteger(s.timerMinutes) || s.timerMinutes < 1 || s.timerMinutes > 360)) add(4, `${b}: hẹn giờ phải từ 1 đến 360 phút.`);
  });

  if (form.sourceKind === "youtube" && !youtubeId(form.sourceUrl)) add(5, "Chưa có link YouTube đúng. Công thức viết lại theo video phải ghi link video.");
  if (form.sourceKind === "other") {
    if (!form.sourceTitle.trim()) add(5, "Chưa ghi tên nguồn (tên sách, báo hoặc trang mạng).");
    if (form.sourceUrl.trim() && !isWebLink(form.sourceUrl)) add(5, "Link nguồn chưa đúng. Link phải bắt đầu bằng https://");
  }
  return out;
}

// ───────────── form → version contents ─────────────

export type VersionContent = Pick<RecipeVersion, "servings" | "prepMinutes" | "cookMinutes" | "notes" | "tasteTips" | "ingredients" | "steps" | "equipment">;

/**
 * The contents of a recipe version from a valid form. When the form started from an existing
 * version, details the editor does not show (gram equivalents, taste role, "if it goes wrong",
 * which step uses how much) are carried over from it.
 */
export function buildContent(form: RecipeForm, base?: RecipeVersion | null): VersionContent {
  const baseIng = new Map((base?.ingredients ?? []).map((i) => [i.slot, i]));
  const ingredients: Ingredient[] = form.ingredients.map((f) => {
    const old = baseIng.get(f.slot);
    const sameUnit = old != null && old.unit === f.unit && old.quantity != null && f.quantity != null;
    const ing: Ingredient = {
      ...(old ?? {}),
      slot: f.slot,
      name: f.name.trim(),
      kind: f.kind,
      group: old && old.kind === f.kind ? old.group : f.kind === "seasoning" ? "Gia vị" : "Nguyên liệu",
      quantity: f.unit === "it" ? null : f.quantity,
      unit: f.unit,
      // The gram/ml figure follows the household measure; it is dropped when the unit changed.
      metricQuantity: sameUnit && old.metricQuantity != null ? old.metricQuantity * (f.quantity! / old.quantity!) : null,
      metricUnit: sameUnit ? old.metricUnit : null,
    };
    if (f.prepNote.trim()) ing.prepNote = f.prepNote.trim();
    else delete ing.prepNote;
    if (f.optional) ing.optional = true;
    else delete ing.optional;
    return ing;
  });

  const slots = new Set(ingredients.map((i) => i.slot));
  const baseStep = new Map((base?.steps ?? []).map((s) => [`s${s.no}`, s]));
  const steps: Step[] = form.steps.map((f, n) => {
    const old = baseStep.get(f.key);
    const uses: StepUse[] = (old?.uses ?? []).filter((u) => slots.has(u.slot)).map((u) => ({ ...u }));
    for (const t of tokensIn(f.text)) if (!uses.some((u) => u.slot === t)) uses.push({ slot: t, portion: 1 });
    const step: Step = {
      no: n + 1,
      phase: old?.phase ?? "cook",
      title: f.title.trim(),
      instructions: f.text.split("\n").map((l) => l.trim()).filter(Boolean),
      doneWhen: f.doneWhen.trim(),
      avoid: f.avoid.trim(),
      uses,
    };
    if (old?.ifWrong) step.ifWrong = old.ifWrong;
    if (old?.videoStartSeconds != null) step.videoStartSeconds = old.videoStartSeconds;
    if (old?.videoEndSeconds != null) step.videoEndSeconds = old.videoEndSeconds;
    if (old?.videoOmitsAmounts) step.videoOmitsAmounts = true;
    if (f.timerMinutes != null) {
      // Keep a timer that was set in seconds (e.g. 90 s) when the minutes were not touched.
      const untouched = old?.timerSeconds != null && Math.max(1, Math.round(old.timerSeconds / 60)) === f.timerMinutes;
      step.timerSeconds = untouched ? old.timerSeconds : f.timerMinutes * 60;
      const label = f.timerLabel.trim();
      if (label) step.timerLabel = label;
      else if (!(untouched && !old?.timerLabel)) step.timerLabel = f.title.trim();
    }
    if (f.heat) step.heat = f.heat;
    return step;
  });

  const content: VersionContent = {
    servings: form.servings,
    prepMinutes: form.prepMinutes,
    cookMinutes: form.cookMinutes,
    ingredients,
    steps,
    equipment: form.equipment.filter((e) => e.name.trim()).map((e) => ({ ...e, name: e.name.trim() })),
  };
  if (form.notes.trim()) content.notes = form.notes.trim();
  if (form.tasteTips.trim()) content.tasteTips = form.tasteTips.trim();
  return content;
}

/** Stable text form of a value, for comparing two versions regardless of key order. */
export function canonical(value: unknown): string {
  return JSON.stringify(value, (_, v) => (v && typeof v === "object" && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).filter(([, x]) => x !== undefined).sort(([a], [b]) => a.localeCompare(b))) : v));
}

export function contentOf(v: RecipeVersion): VersionContent {
  const c: VersionContent = { servings: v.servings, prepMinutes: v.prepMinutes, cookMinutes: v.cookMinutes, ingredients: v.ingredients, steps: v.steps, equipment: v.equipment };
  if (v.notes) c.notes = v.notes;
  if (v.tasteTips) c.tasteTips = v.tasteTips;
  return c;
}

export const sameContent = (a: VersionContent, b: VersionContent) => canonical(a) === canonical(b);

export const unitLabel = (u: Unit) => UNIT_LABELS[u] ?? u;

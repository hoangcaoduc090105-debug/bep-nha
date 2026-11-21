import type { Recipe, RecipeVersion, Verdict } from "@/data/types";
import type { BadgeKind } from "@/components/ui/version";

export const VERDICT_LABELS: Record<Verdict, string> = {
  rat_ngon: "Rất ngon",
  vua_mieng: "Vừa miệng",
  hoi_man: "Hơi mặn",
  hoi_ngot: "Hơi ngọt",
  chua_ngon: "Chưa ngon như mong muốn",
};

/** Which badge a recipe card shows. An unverified sample always says so. */
export function recipeBadge(recipe: Recipe): BadgeKind {
  if (recipe.verification === "family_approved") return "approved";
  if (recipe.verification === "sample") return "sample";
  if (recipe.verification === "entered") return "entered";
  return recipe.familyVersionId ? "family" : "original";
}

export function versionName(v: RecipeVersion): string {
  if (v.kind === "original") return "Bản gốc";
  return v.label ? `Bản nhà mình – ${v.label}` : `Bản nhà mình (lần chỉnh ${v.versionNo - 1})`;
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("vi-VN", { weekday: "long", day: "numeric", month: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

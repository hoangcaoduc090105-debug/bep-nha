// Pure helpers for showing quantities the way people say them. No React, no network.

const FRACTIONS: Array<[number, string]> = [
  [0.25, "¼"],
  [1 / 3, "⅓"],
  [0.5, "½"],
  [2 / 3, "⅔"],
  [0.75, "¾"],
];

/** 1.5 → "1½", 0.25 → "¼", 2 → "2", 2.4 → "2,4" (Vietnamese decimal comma). */
export function formatQuantity(value: number): string {
  if (!Number.isFinite(value) || value < 0) return "";
  const whole = Math.floor(value + 1e-9);
  const rest = value - whole;
  if (rest < 0.02) return String(whole);
  for (const [f, glyph] of FRACTIONS) {
    if (Math.abs(rest - f) < 0.02) return whole === 0 ? glyph : `${whole}${glyph}`;
  }
  return value.toLocaleString("vi-VN", { maximumFractionDigits: 1 });
}

export const UNIT_LABELS: Record<string, string> = {
  g: "g",
  kg: "kg",
  ml: "ml",
  l: "lít",
  muong_ca_phe: "muỗng cà phê",
  muong_canh: "muỗng canh",
  chen: "chén",
  trai: "trái",
  cu: "củ",
  tep: "tép",
  nhanh: "nhánh",
  cay: "cây",
  la: "lá",
  lat: "lát",
  con: "con",
  qua: "quả",
  mieng: "miếng",
  bo: "bó",
  it: "ít",
};

/** "1½ muỗng canh" */
export function formatAmount(quantity: number | null, unit: string | null): string {
  const label = unit ? (UNIT_LABELS[unit] ?? unit) : "";
  if (quantity == null) return label;
  return `${formatQuantity(quantity)} ${label}`.trim();
}

/** "(khoảng 22 ml)" — always marked approximate, because spoons differ between kitchens. */
export function formatMetric(quantity: number | null, unit: "g" | "ml" | null): string {
  if (quantity == null || !unit) return "";
  // Grams and millilitres are read off a scale or a cup: whole numbers, never fractions.
  const rounded = quantity >= 10 ? Math.round(quantity) : Math.round(quantity * 2) / 2;
  return `(khoảng ${rounded.toLocaleString("vi-VN")} ${unit})`;
}

const SPOKEN_FRACTIONS: Array<[number, string]> = [
  [0.25, "một phần tư"],
  [1 / 3, "một phần ba"],
  [2 / 3, "hai phần ba"],
  [0.75, "ba phần tư"],
];

/**
 * The amount written for the ear, so the voice does not stumble over "1½":
 * 1.5 muỗng canh → "1 muỗng canh rưỡi", 0.5 → "nửa muỗng canh", 1.25 → "1 muỗng canh và một phần tư".
 */
export function formatAmountSpoken(quantity: number | null, unit: string | null): string {
  const label = unit ? (UNIT_LABELS[unit] ?? unit) : "";
  if (quantity == null) return label;
  if (unit === "g") return `${Math.round(quantity)} gam`;
  if (unit === "ml") return `${Math.round(quantity)} mi li lít`;
  const whole = Math.floor(quantity + 1e-9);
  const rest = quantity - whole;
  if (rest < 0.02) return `${whole} ${label}`.trim();
  if (Math.abs(rest - 0.5) < 0.02) return whole === 0 ? `nửa ${label}`.trim() : `${whole} ${label} rưỡi`.trim();
  for (const [f, words] of SPOKEN_FRACTIONS) {
    if (Math.abs(rest - f) < 0.02) return whole === 0 ? `${words} ${label}`.trim() : `${whole} ${label} và ${words}`.trim();
  }
  return `${quantity.toLocaleString("vi-VN", { maximumFractionDigits: 1 })} ${label}`.trim();
}

/** How much one press of − or + changes, chosen so the amounts stay measurable. */
export function stepForUnit(unit: string | null, quantity: number): number {
  if (unit === "muong_ca_phe" || unit === "muong_canh" || unit === "chen") return 0.25;
  if (unit === "g" || unit === "ml") return quantity >= 200 ? 50 : 10;
  if (unit === "kg" || unit === "l") return 0.1;
  return 0.5;
}

const GLYPHS: Record<string, number> = { "½": 0.5, "¼": 0.25, "¾": 0.75, "⅓": 1 / 3, "⅔": 2 / 3 };

/**
 * Reads an amount the way people type it: "2", "1,5", "1.5", "1/2", "1 1/2", "1½".
 * Returns null when it is not a positive number.
 */
export function parseAmount(text: string): number | null {
  const t = text.trim().replace(",", ".");
  if (t === "") return null;
  let value: number;
  const mixed = /^(\d+)?\s*([½¼¾⅓⅔])$/.exec(t);
  const fraction = /^(?:(\d+)\s+)?(\d+)\s*\/\s*(\d+)$/.exec(t);
  if (mixed) value = Number(mixed[1] ?? 0) + GLYPHS[mixed[2]];
  else if (fraction) {
    if (Number(fraction[3]) === 0) return null;
    value = Number(fraction[1] ?? 0) + Number(fraction[2]) / Number(fraction[3]);
  } else if (/^\d+(\.\d+)?$/.test(t)) value = Number(t);
  else return null;
  return Number.isFinite(value) && value > 0 ? Math.round(value * 1000) / 1000 : null;
}

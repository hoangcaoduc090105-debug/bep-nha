// Pure helpers that prepare text and choose a voice for reading aloud. No browser calls here.

/**
 * Rewrites text for the ear: symbols a voice stumbles over become words, and asides in
 * brackets or after a dash become short pauses.
 */
export function forSpeech(text: string): string {
  return text
    .replace(/(\d)\s*[–-]\s*(\d)/g, "$1 đến $2")
    .replace(/(\d)\s*cm\b/g, "$1 xăng ti mét")
    .replace(/(\d)\s*kg\b/g, "$1 ký")
    .replace(/(\d)\s*ml\b/g, "$1 mi li lít")
    .replace(/(\d)\s*g\b/g, "$1 gam")
    .replace(/(\d)\s*°\s*C?/g, "$1 độ")
    .replace(/(\d)½/g, "$1 rưỡi")
    .replace(/½/g, "nửa")
    .replace(/¼/g, "một phần tư")
    .replace(/¾/g, "ba phần tư")
    .replace(/\s*[—–]\s*/g, ", ")
    .replace(/\s*\(([^)]*)\)/g, ", $1,")
    .replace(/[“”"]/g, "")
    .replace(/\s*,(\s*,)+/g, ",")
    .replace(/,\s*([.!?:;])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * One piece per sentence. Each is spoken as its own utterance, so the voice takes a breath
 * between sentences instead of running a whole step together.
 */
export function speechChunks(text: string): string[] {
  return forSpeech(text)
    .split(/(?<=[.!?…:;])\s+/)
    .map((s) => s.trim())
    .filter((s) => /[\p{L}\d]/u.test(s));
}

export type VoiceInfo = { name: string; lang: string; voiceURI: string; localService?: boolean };

/**
 * How good a voice is likely to sound, from what the device says about it. Phones ship a
 * small "compact" voice and offer better ones ("enhanced", "premium") as a free download.
 */
export function voiceScore(v: VoiceInfo): number {
  const id = `${v.voiceURI} ${v.name}`.toLowerCase();
  let score = 0;
  if (/premium|cao cấp/.test(id)) score += 30;
  else if (/enhanced|nâng cao|natural|neural/.test(id)) score += 20;
  else if (/compact|eloquence/.test(id)) score -= 10;
  if (v.lang.toLowerCase().replace("_", "-") === "vi-vn") score += 2;
  if (v.localService !== false) score += 1; // works with no network
  return score;
}

/** The best Vietnamese voice on the device, or null when it has none. */
export function pickVietnameseVoice<T extends VoiceInfo>(voices: T[]): T | null {
  const vi = voices.filter((v) => v.lang.toLowerCase().replace("_", "-").startsWith("vi"));
  if (vi.length === 0) return null;
  return vi.reduce((best, v) => (voiceScore(v) > voiceScore(best) ? v : best));
}

/** All Vietnamese voices on the device, best first. */
export function vietnameseVoices<T extends VoiceInfo>(voices: T[]): T[] {
  return voices.filter((v) => v.lang.toLowerCase().replace("_", "-").startsWith("vi")).sort((a, b) => voiceScore(b) - voiceScore(a));
}

/** "thường", "nâng cao" or "cao cấp", as far as the device tells. */
export function voiceKind(v: VoiceInfo): string {
  const s = voiceScore(v);
  return s >= 30 ? "cao cấp" : s >= 20 ? "nâng cao" : "thường";
}

export const isBetterVoice = (v: VoiceInfo) => voiceScore(v) >= 20;

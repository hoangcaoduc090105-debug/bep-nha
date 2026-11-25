// The only two addresses outside the app that it ever uses, both for a dish rewritten from a
// YouTube video: the part of the video that belongs to a step, and the video's cover picture.

/** The player address for one part of a video. Times are whole seconds from the start. */
export function stepVideoUrl(videoId: string, startSeconds: number, endSeconds?: number): string {
  const q = new URLSearchParams({ start: String(Math.max(0, Math.floor(startSeconds))), autoplay: "1", playsinline: "1", rel: "0" });
  if (endSeconds != null && endSeconds > startSeconds) q.set("end", String(Math.ceil(endSeconds)));
  return `https://www.youtube-nocookie.com/embed/${videoId}?${q}`;
}

/**
 * The cover picture YouTube shows for a video. "large" is 16:9 at 1280 px and is missing for
 * some older videos; "medium" is 640 px (4:3, with black bars); "small" (320 px) always exists.
 */
export type CoverSize = "large" | "medium" | "small";
const COVER_FILE: Record<CoverSize, string> = { large: "hq720", medium: "sddefault", small: "mqdefault" };
export function videoCoverUrl(videoId: string, size: CoverSize): string {
  return `https://i.ytimg.com/vi/${videoId}/${COVER_FILE[size]}.jpg`;
}

/** "1 phút 8 giây" — how long the part of the video is. */
export function clipLength(startSeconds: number, endSeconds: number): string {
  const s = Math.max(0, Math.round(endSeconds - startSeconds));
  const m = Math.floor(s / 60);
  const rest = s % 60;
  return [m > 0 ? `${m} phút` : "", rest > 0 || m === 0 ? `${rest} giây` : ""].filter(Boolean).join(" ");
}

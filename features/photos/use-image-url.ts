"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { getImageBlob } from "@/data/repo";

// A stored photo never changes under its id, so one address per photo is made and kept
// for as long as the app is open.
const urls = new Map<string, string>();

/** An address the page can show for a stored photo, or null while loading or when there is none. */
export function useImageUrl(imageId: string | null | undefined): string | null {
  const url = useLiveQuery(async () => {
    if (!imageId) return null;
    const known = urls.get(imageId);
    if (known) return known;
    const blob = await getImageBlob(imageId);
    if (!blob) return null;
    const made = URL.createObjectURL(blob);
    urls.set(imageId, made);
    return made;
  }, [imageId]);
  return url ?? null;
}

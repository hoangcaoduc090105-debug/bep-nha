"use client";

import { PhotoTile } from "@/components/ui/photo-tile";
import { useImageUrl } from "@/features/photos/use-image-url";

/** The dish's own photo from the device, or the honest "Chưa có ảnh" tile. */
export function RecipePhoto({ imageId, name, className }: { imageId: string | null | undefined; name: string; className?: string }) {
  const src = useImageUrl(imageId);
  return <PhotoTile key={src ?? "none"} src={src} name={name} className={className} />;
}

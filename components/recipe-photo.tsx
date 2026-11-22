"use client";

import { useState } from "react";
import { PhotoTile } from "@/components/ui/photo-tile";
import { useImageUrl } from "@/features/photos/use-image-url";
import { videoCoverUrl } from "@/features/video/youtube";

/**
 * The dish's own photo from the device. A dish rewritten from a video that has no photo of its
 * own shows the video's cover picture, loaded from YouTube (kept on the device by the service
 * worker after the first time). Otherwise the honest "Chưa có ảnh" tile.
 */
export function RecipePhoto({ imageId, name, videoId, className }: { imageId: string | null | undefined; name: string; videoId?: string; className?: string }) {
  const src = useImageUrl(imageId);
  if (!imageId && videoId) return <VideoCover key={videoId} videoId={videoId} name={name} className={className} />;
  return <PhotoTile key={src ?? "none"} src={src} name={name} className={className} />;
}

function VideoCover({ videoId, name, className }: { videoId: string; name: string; className?: string }) {
  // large → small → none. YouTube answers a missing size with a 120 px grey picture, not an error.
  const [stage, setStage] = useState<"large" | "small" | "none">("large");
  if (stage === "none") return <PhotoTile name={name} className={className} />;
  return (
    <div className={`relative aspect-4/3 w-full overflow-hidden rounded-md bg-surface-warm ${className ?? ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- an outside picture, sized by the box */}
      <img
        key={stage}
        src={videoCoverUrl(videoId, stage)}
        alt={name}
        crossOrigin="anonymous"
        className="size-full object-cover"
        onLoad={(e) => {
          if (e.currentTarget.naturalWidth <= 120) setStage(stage === "large" ? "small" : "none");
        }}
        onError={() => setStage(stage === "large" ? "small" : "none")}
      />
    </div>
  );
}

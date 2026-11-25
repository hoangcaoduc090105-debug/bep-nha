"use client";

import { useState } from "react";
import { PhotoTile } from "@/components/ui/photo-tile";
import { useImageUrl } from "@/features/photos/use-image-url";
import { videoCoverUrl, type CoverSize } from "@/features/video/youtube";

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
  // large → medium → small → none. YouTube answers a missing size with an error or with a 120 px grey picture.
  const [stage, setStage] = useState<CoverSize | "none">("large");
  const next = (): CoverSize | "none" => (stage === "large" ? "medium" : stage === "medium" ? "small" : "none");
  if (stage === "none") return <PhotoTile name={name} className={className} />;
  return (
    <div className={`relative aspect-4/3 w-full overflow-hidden rounded-md bg-surface-warm ${className ?? ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- an outside picture, sized by the box */}
      <img
        key={stage}
        src={videoCoverUrl(videoId, stage)}
        alt={name}
        crossOrigin="anonymous"
        // The 640 px picture is 4:3 with black bars above and below the 16:9 frame: enlarged by a third, the bars fall outside the box.
        className={`size-full object-cover ${stage === "medium" ? "scale-[1.34]" : ""}`}
        onLoad={(e) => {
          if (e.currentTarget.naturalWidth <= 120) setStage(next());
        }}
        onError={() => setStage(next())}
      />
    </div>
  );
}

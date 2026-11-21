"use client";

import { useState } from "react";
import { CookingPot } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Fixed 4:3 box so the layout never jumps. With no photo (or a photo that fails to load)
 * it shows an honest "Chưa có ảnh" tile — never a stock picture standing in for the dish.
 */
export function PhotoTile({ src, name, className }: { src?: string | null; name: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  const showPhoto = Boolean(src) && !failed;
  return (
    <div className={cn("relative aspect-4/3 w-full overflow-hidden rounded-md bg-surface-warm", className)}>
      {showPhoto ? (
        // eslint-disable-next-line @next/next/no-img-element -- signed storage URLs, sized by the box
        <img src={src!} alt={name} className="size-full object-cover" onError={() => setFailed(true)} />
      ) : (
        <div className="flex size-full flex-col items-center justify-center gap-2 p-4 text-center text-text-muted">
          <CookingPot aria-hidden className="size-10" />
          <span className="text-sm">Chưa có ảnh</span>
        </div>
      )}
    </div>
  );
}

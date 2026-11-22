"use client";

import { useState } from "react";
import { CirclePlay, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Banner } from "@/components/ui/states";
import { clipLength, stepVideoUrl } from "@/features/video/youtube";

/**
 * The part of the source video that shows this step. Nothing is loaded from YouTube until she
 * presses the button; with no network it says so, and the written step is still complete.
 */
export function StepVideo({ videoId, startSeconds, endSeconds, channel, onOpen, label = "Xem đoạn video của bước này", title = "Video của bước này", note }: { videoId: string; startSeconds: number; endSeconds?: number; channel?: string; onOpen?: () => void; label?: string; title?: string; note?: string }) {
  const [open, setOpen] = useState(false);
  const [offline, setOffline] = useState(false);
  const length = endSeconds != null && endSeconds > startSeconds ? ` (${clipLength(startSeconds, endSeconds)})` : "";

  if (!open) {
    return (
      <div className="flex flex-col gap-3">
        <Button
          variant="secondary"
          fullWidth
          icon={<CirclePlay aria-hidden className="size-7 shrink-0" />}
          onClick={() => {
            if (typeof navigator !== "undefined" && navigator.onLine === false) return setOffline(true);
            setOffline(false);
            onOpen?.();
            setOpen(true);
          }}
        >
          {label}{length}
        </Button>
        {note && <p className="text-text-muted">{note}</p>}
        {offline && <Banner kind="offline">Cần có mạng để xem video. Phần chữ ở trên vẫn đủ để nấu.</Banner>}
      </div>
    );
  }
  return (
    <section aria-label={title} className="flex flex-col gap-3">
      <div className="aspect-video w-full overflow-hidden rounded-md bg-surface-warm">
        <iframe
          src={stepVideoUrl(videoId, startSeconds, endSeconds)}
          title={title}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="size-full border-0"
        />
      </div>
      {note && <p className="text-text-muted">{note}</p>}
      {channel && <p className="text-text-muted">Video của kênh {channel} trên YouTube.</p>}
      <Button variant="secondary" icon={<X aria-hidden className="size-7 shrink-0" />} onClick={() => setOpen(false)}>
        Đóng video
      </Button>
    </section>
  );
}

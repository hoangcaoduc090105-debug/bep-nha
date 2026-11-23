"use client";

import { useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Camera, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Banner } from "@/components/ui/states";
import { FAMILY_PHOTO, getSetting, removeFamilyPhoto, setFamilyPhoto } from "@/data/repo";
import { compressPhoto } from "@/features/photos/compress";
import { useImageUrl } from "@/features/photos/use-image-url";
import { cn } from "@/lib/cn";
import { BrandLogo } from "@/components/brand-logo";

/**
 * The family's own picture in a round gold frame — on the home page, next to the greeting. It is
 * chosen once in Cài đặt and stays on this phone (and in its backups); it is never part of the
 * app itself. Until one is chosen the place shows the app's logo, which has its own ring.
 */
export function FamilyPhoto({ className }: { className?: string }) {
  const id = useLiveQuery(() => getSetting<string | null>(FAMILY_PHOTO, null), []);
  const own = useImageUrl(id);
  if (!id || !own) return <BrandLogo alt="Hình vẽ hai mẹ con" className={className} />;
  return (
    // Framed like the logo: a jade ring inside a gold one.
    <span className={cn("block shrink-0 overflow-hidden rounded-pill border-4 border-accent bg-surface-warm outline-2 outline-offset-2 outline-gold", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- a picture from the device */}
      <img src={own} alt="Ảnh của nhà mình" className="size-full object-cover" />
    </span>
  );
}

/** Cài đặt → "Ảnh của nhà mình": choose, change or remove the picture. */
export function FamilyPhotoPicker() {
  const id = useLiveQuery(() => getSetting<string | null>(FAMILY_PHOTO, null), []);
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      await setFamilyPhoto(await compressPhoto(file));
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "Chưa lưu được ảnh. Thử lại nhé.");
    }
    setBusy(false);
    if (input.current) input.current.value = "";
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4">
        <FamilyPhoto className="size-28" />
        <p className="text-text-muted">{id ? "Ảnh này hiện ở trang chủ, cạnh lời chào." : "Chưa chọn ảnh: trang chủ đang hiện hình vẽ hai mẹ con."}</p>
      </div>
      <p className="text-text-muted">Ảnh chỉ nằm trong máy này và trong tệp sao lưu, không gửi đi đâu.</p>
      {error && <Banner kind="error">{error}</Banner>}
      <input ref={input} type="file" accept="image/*" className="sr-only" aria-label="Chọn ảnh của nhà mình" tabIndex={-1} onChange={(e) => void pick(e.target.files?.[0])} />
      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" loading={busy} icon={<Camera aria-hidden className="size-6" />} onClick={() => input.current?.click()}>
          {id ? "Đổi ảnh khác" : "Chọn ảnh"}
        </Button>
        {id && (
          <Button variant="quiet" className="text-danger" icon={<Trash2 aria-hidden className="size-6" />} onClick={() => void removeFamilyPhoto()}>
            Bỏ ảnh
          </Button>
        )}
      </div>
    </div>
  );
}

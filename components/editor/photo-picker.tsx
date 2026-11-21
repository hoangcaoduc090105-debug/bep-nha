"use client";

import { useRef, useState } from "react";
import { Camera, Trash2 } from "lucide-react";
import { RecipePhoto } from "@/components/recipe-photo";
import { Button } from "@/components/ui/button";
import { Banner } from "@/components/ui/states";
import { addImage } from "@/data/repo";
import { compressPhoto } from "@/features/photos/compress";

/** Take or choose one photo of the dish. The photo is made small before it is stored. */
export function PhotoPicker({ imageId, name, onChange }: { imageId: string | null; name: string; onChange: (imageId: string | null) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      onChange(await addImage(await compressPhoto(file)));
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "Chưa lưu được ảnh. Mẹ thử lại nhé.");
    }
    setBusy(false);
    if (input.current) input.current.value = "";
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="font-medium">Ảnh món (không bắt buộc)</p>
      <RecipePhoto imageId={imageId} name={name || "Ảnh món"} className="max-w-md" />
      {error && <Banner kind="error">{error}</Banner>}
      <input ref={input} type="file" accept="image/*" className="sr-only" aria-label="Chọn ảnh món" tabIndex={-1} onChange={(e) => void pick(e.target.files?.[0])} />
      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" loading={busy} icon={<Camera aria-hidden className="size-6" />} onClick={() => input.current?.click()}>
          {imageId ? "Đổi ảnh khác" : "Chụp hoặc chọn ảnh"}
        </Button>
        {imageId && (
          <Button variant="quiet" className="text-danger" icon={<Trash2 aria-hidden className="size-6" />} onClick={() => onChange(null)}>
            Bỏ ảnh
          </Button>
        )}
      </div>
    </div>
  );
}

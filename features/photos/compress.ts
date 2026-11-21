// Makes a photo small before it is stored: a phone photo of 3–8 MB becomes about 200–400 KB.
// Re-drawing the picture also drops everything else the camera wrote into the file
// (location, time, device).

export const MAX_EDGE = 1600;
const TARGET_BYTES = 600_000;

/** The size that fits inside max × max, keeping the proportions. Never enlarges. */
export function fitWithin(width: number, height: number, max = MAX_EDGE): { width: number; height: number } {
  const scale = Math.min(1, max / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

export class PhotoError extends Error {}

type Drawable = { source: CanvasImageSource; width: number; height: number; close: () => void };

async function decode(file: Blob): Promise<Drawable> {
  if (typeof createImageBitmap === "function") {
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
      return { source: bmp, width: bmp.width, height: bmp.height, close: () => bmp.close() };
    } catch {
      // Some browsers cannot decode this way (older Safari); try an <img> below.
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, close: () => {} };
  } catch {
    throw new PhotoError("Không đọc được ảnh này. Mẹ thử chụp lại hoặc chọn ảnh khác.");
  } finally {
    URL.revokeObjectURL(url);
  }
}

const toJpeg = (canvas: HTMLCanvasElement, quality: number) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));

export async function compressPhoto(file: Blob): Promise<Blob> {
  if (!file.type.startsWith("image/") && file.type !== "") throw new PhotoError("Tệp này không phải là ảnh.");
  const picture = await decode(file);
  try {
    if (picture.width === 0 || picture.height === 0) throw new PhotoError("Không đọc được ảnh này. Mẹ thử ảnh khác.");
    const size = fitWithin(picture.width, picture.height);
    const canvas = document.createElement("canvas");
    canvas.width = size.width;
    canvas.height = size.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new PhotoError("Máy chưa xử lý được ảnh. Mẹ thử lại nhé.");
    // JPEG has no transparency: put white behind the picture instead of black.
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, size.width, size.height);
    ctx.drawImage(picture.source, 0, 0, size.width, size.height);
    for (const quality of [0.82, 0.7, 0.55]) {
      const blob = await toJpeg(canvas, quality);
      if (blob && (blob.size <= TARGET_BYTES || quality === 0.55)) return blob;
    }
    throw new PhotoError("Máy chưa nén được ảnh. Mẹ thử ảnh khác.");
  } finally {
    picture.close();
  }
}

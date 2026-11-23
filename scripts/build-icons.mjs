// Builds every logo file from the master drawing replica/design/logo.webp (1024×1024: the round
// logo of mother and son in the kitchen, on white). Run after replacing the master:
//   node scripts/build-icons.mjs
//
//   public/logo.webp              the round logo alone, transparent outside the ring (shown in the app)
//   public/favicon.png            the same, small, for the browser tab
//   public/icon-192.png, -512     the logo on the app's cream, for the Home Screen
//   public/apple-touch-icon.png   the same for iPhone (must not be transparent: iOS paints it black)
//   public/icon-maskable-512.png  the logo inside the central 80%, for Android's shaped icons
import sharp from "sharp";
import { readFileSync } from "node:fs";

const MASTER = "replica/design/logo.webp";
// The outer gold ring in the master: centre and radius in pixels, measured from the picture.
const RING = { cx: 511.5, cy: 511, r: 479 };
const CREAM = JSON.parse(readFileSync("replica/design/tokens.json", "utf8")).color.bg;

// Cut the logo out as a circle, so the white corners of the master never show.
const side = RING.r * 2;
const mask = Buffer.from(`<svg width="${side}" height="${side}"><circle cx="${RING.r}" cy="${RING.r}" r="${RING.r - 0.5}"/></svg>`);
const round = await sharp(MASTER)
  .extract({ left: Math.round(RING.cx - RING.r), top: Math.round(RING.cy - RING.r), width: side, height: side })
  .ensureAlpha()
  .composite([{ input: mask, blend: "dest-in" }])
  .png()
  .toBuffer();

// 256 colours is plenty for a flat drawing and makes the files about a third the size.
const PNG = { palette: true, quality: 95, compressionLevel: 9 };
const alone = (size) => sharp(round).resize(size, size, { kernel: "lanczos3" });
/** The logo centred on a cream square; `fill` is how much of the square's width the ring takes. */
const onCream = async (size, fill) =>
  sharp({ create: { width: size, height: size, channels: 4, background: CREAM } })
    .composite([{ input: await alone(Math.round(size * fill)).png().toBuffer() }])
    .png(PNG);

await alone(512).webp({ quality: 90 }).toFile("public/logo.webp");
await alone(64).png(PNG).toFile("public/favicon.png");
await (await onCream(192, 0.94)).toFile("public/icon-192.png");
await (await onCream(512, 0.94)).toFile("public/icon-512.png");
await (await onCream(180, 0.9)).toFile("public/apple-touch-icon.png");
await (await onCream(512, 0.76)).toFile("public/icon-maskable-512.png");
console.log("logo, favicon and app icons written to public/");

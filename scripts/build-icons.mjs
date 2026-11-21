// Renders the PNG app icons from public/icon.svg. Run after changing the SVG:
//   node scripts/build-icons.mjs
import sharp from "sharp";

const sizes = { "icon-192.png": 192, "icon-512.png": 512, "apple-touch-icon.png": 180 };
for (const [name, size] of Object.entries(sizes)) {
  await sharp("public/icon.svg", { density: 300 }).resize(size, size).png().toFile(`public/${name}`);
  console.log(`public/${name} ${size}×${size}`);
}

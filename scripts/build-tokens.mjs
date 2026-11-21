// Generates CSS from replica/design/tokens.json (the single source of truth).
//   replica/design/tokens.css  plain :root custom properties
//   app/tokens.css             the same values as a Tailwind @theme block
// Run: node scripts/build-tokens.mjs
import { readFileSync, writeFileSync } from "node:fs";

const t = JSON.parse(readFileSync("replica/design/tokens.json", "utf8"));
const rem = (px) => `${px / 16}rem`;
const lines = [];
for (const [k, v] of Object.entries(t.color)) lines.push(`--color-${k}: ${v};`);
for (const [k, v] of Object.entries(t.type)) {
  lines.push(`--text-${k}: ${rem(v.size)};`);
  lines.push(`--text-${k}--line-height: ${(v.line / v.size).toFixed(3)};`);
  lines.push(`--text-${k}--font-weight: ${v.weight};`);
}
for (const [k, v] of Object.entries(t.radius)) lines.push(`--radius-${k}: ${v}px;`);
const targets = { min: "target", primary: "target-lg", mic: "target-mic" };
for (const [k, v] of Object.entries(t.target)) lines.push(`--spacing-${targets[k]}: ${rem(v)};`);
for (const [k, v] of Object.entries(t.shadow)) lines.push(`--shadow-${k}: ${v};`);
for (const [k, v] of Object.entries(t.motion)) lines.push(`--motion-${k}: ${v};`);

const head = "/* GENERATED from replica/design/tokens.json by scripts/build-tokens.mjs. Do not edit. */\n";
const body = lines.map((l) => `  ${l}`).join("\n");
writeFileSync("replica/design/tokens.css", `${head}:root {\n  --font-sans: ${t.font.sans};\n${body}\n}\n`);
// The font family is wired in app/globals.css (it comes from next/font).
writeFileSync("app/tokens.css", `${head}@theme {\n${body}\n}\n`);
console.log(`tokens: ${lines.length} values written`);

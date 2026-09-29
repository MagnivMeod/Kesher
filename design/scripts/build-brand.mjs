// Builds every Kesher logo file from one source: the "linked bubbles" mark.
// Output goes to design/logo/.
// Run from the design folder: npm install && npm run brand
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import opentype from "opentype.js";
import sharp from "sharp";
import { loadColors } from "./contrast.mjs";

const designDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(designDir, "logo");
const c = loadColors();
const require = createRequire(import.meta.url);

// ---------- The mark ----------
// Two rings with speech-bubble tails. They link like a knot:
// bubble A passes over B at the top, B passes over A at the bottom.
const R = 19;
const STROKE = 8.5;
const GAP = 3.2;
const A = [38, 48];
const B = [62, 48];

const f = (n) => Number(n.toFixed(2));
const pt = (cx, cy, r, deg) => [f(cx + r * Math.cos((deg * Math.PI) / 180)), f(cy + r * Math.sin((deg * Math.PI) / 180))];
const arc = ([cx, cy], from, to) => {
  const [x1, y1] = pt(cx, cy, R, from);
  const [x2, y2] = pt(cx, cy, R, to);
  return `M${x1} ${y1} A${R} ${R} 0 0 1 ${x2} ${y2}`;
};
const tail = ([cx, cy], deg, dir, fill) => {
  const [bx1, by1] = pt(cx, cy, R, deg - 16 * dir);
  const [bx2, by2] = pt(cx, cy, R, deg + 16 * dir);
  const [tx, ty] = pt(cx, cy, R + 12, deg + 14 * dir);
  return `<path d="M${bx1} ${by1} L${tx} ${ty} L${bx2} ${by2} Z" fill="${fill}" stroke="${fill}" stroke-width="3" stroke-linejoin="round"/>`;
};

/**
 * The mark's SVG elements, drawn in a 100x100 box.
 * `id` keeps mask ids unique when several marks share one page.
 */
function markElements(colorA, colorB, id = "k") {
  const mask = (name, path) =>
    `<mask id="${id}-${name}" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100"><rect width="100" height="100" fill="#fff"/><path d="${path}" fill="none" stroke="#000" stroke-width="${STROKE + GAP * 2}"/></mask>`;
  return `<defs>${mask("a", arc(B, 85, 170))}${mask("b", arc(A, -95, -10))}</defs>
<g mask="url(#${id}-a)"><circle cx="${A[0]}" cy="${A[1]}" r="${R}" fill="none" stroke="${colorA}" stroke-width="${STROKE}"/>${tail(A, 118, 1, colorA)}</g>
<g mask="url(#${id}-b)"><circle cx="${B[0]}" cy="${B[1]}" r="${R}" fill="none" stroke="${colorB}" stroke-width="${STROKE}"/>${tail(B, 62, -1, colorB)}</g>`;
}

// The mark's drawn area inside its 100x100 box (rings + tails), used for tight cropping.
const MARK_BOX = { x: 14, y: 24.5, w: 72, h: 57 };

const svgDoc = (viewBox, body, title) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" role="img" aria-label="${title}">\n<title>${title}</title>\n${body}\n</svg>\n`;

// ---------- Wordmarks (text turned into shapes, so no font is needed to show them) ----------
const fontFile = (subset) => require.resolve(`@fontsource/rubik/files/rubik-${subset}-500-normal.woff`);
const loadFont = (subset) => {
  const buf = readFileSync(fontFile(subset));
  return opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
};
const latin = loadFont("latin");
const hebrew = loadFont("hebrew");

/** Returns { d, width } for text set at `size`, with its baseline at y=0. */
function textPath(font, text, size) {
  const path = font.getPath(text, 0, 0, size);
  const box = path.getBoundingBox();
  return { d: path.toPathData(2), width: font.getAdvanceWidth(text, size), left: box.x1 };
}

/**
 * A horizontal lockup: mark + name. In Hebrew the mark sits on the right,
 * because Hebrew reads right to left.
 */
function wordmark({ font, text, rtl, markA, markB, textColor, id }) {
  const markH = 64; // rendered height of the mark's drawn area
  const scale = markH / MARK_BOX.h;
  const markW = MARK_BOX.w * scale;
  const size = 62; // font size
  const baseline = 50; // text baseline, lines the letters up with the rings
  const gap = 16;
  const t = textPath(font, text, size);
  const textW = t.width - t.left;
  const markX = rtl ? textW + gap : 0;
  const textX = rtl ? -t.left : markW + gap;
  const width = f(markW + gap + textW);
  const markG = `<g transform="translate(${f(markX)} 0) scale(${f(scale)}) translate(${-MARK_BOX.x} ${-MARK_BOX.y})">${markElements(markA, markB, id)}</g>`;
  const textG = `<path transform="translate(${f(textX)} ${baseline})" d="${t.d}" fill="${textColor}"/>`;
  return { width, height: markH, body: `${markG}\n${textG}` };
}

// ---------- Write everything ----------
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
const write = (name, content) => {
  writeFileSync(join(outDir, name), content);
  console.log("wrote logo/" + name);
};
const cropBox = `${MARK_BOX.x} ${MARK_BOX.y} ${MARK_BOX.w} ${MARK_BOX.h}`;

// Mark alone
write("kesher-mark.svg", svgDoc(cropBox, markElements("currentColor", "currentColor"), "Kesher"));
write("kesher-mark-color.svg", svgDoc(cropBox, markElements(c.primary, c.accent), "Kesher"));
write("kesher-mark-white.svg", svgDoc(cropBox, markElements("#FFFFFF", "#FFFFFF"), "Kesher"));

// App icon: teal square, white and apricot bubbles. Shopify rounds the corners itself.
const icon = (rounded) =>
  svgDoc(
    "0 0 100 100",
    `<rect width="100" height="100"${rounded ? ' rx="22"' : ""} fill="${c.primary}"/>\n<g transform="translate(50 50) scale(1.02) translate(-50 -53)">${markElements("#FFFFFF", c.accent)}</g>`,
    "Kesher",
  );
write("app-icon.svg", icon(false));
write("favicon.svg", icon(true));

// Wordmarks
for (const [lang, font, text, rtl] of [["en", latin, "Kesher", false], ["he", hebrew, "קשר", true]]) {
  const color = wordmark({ font, text, rtl, markA: c.primary, markB: c.accent, textColor: c.ink, id: `k${lang}` });
  write(`kesher-wordmark-${lang}.svg`, svgDoc(`0 0 ${color.width} ${color.height}`, color.body, lang === "he" ? "קשר" : "Kesher"));
  const mono = wordmark({ font, text, rtl, markA: "currentColor", markB: "currentColor", textColor: "currentColor", id: `m${lang}` });
  write(`kesher-wordmark-${lang}-mono.svg`, svgDoc(`0 0 ${mono.width} ${mono.height}`, mono.body, lang === "he" ? "קשר" : "Kesher"));
}

// PNG exports
const png = async (svgName, pngName, width, height = width) => {
  await sharp(join(outDir, svgName), { density: 600 }).resize(width, height).png().toFile(join(outDir, pngName));
  console.log("wrote logo/" + pngName);
};
await png("app-icon.svg", "app-icon-1200.png", 1200); // Shopify App Store icon
await png("favicon.svg", "favicon-32.png", 32);
await png("favicon.svg", "favicon-16.png", 16);
await png("favicon.svg", "apple-touch-icon-180.png", 180);

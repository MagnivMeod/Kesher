// Generates the three Kesher logo-mark options as one-color SVGs.
// Marks use `currentColor`, so they take whatever color the page gives them.
// Run: node design/scripts/build-logos.mjs
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "logo");
const f = (n) => Number(n.toFixed(2));
const pt = (cx, cy, r, deg) => [f(cx + r * Math.cos((deg * Math.PI) / 180)), f(cy + r * Math.sin((deg * Math.PI) / 180))];
const arc = (cx, cy, r, from, to) => {
  const [x1, y1] = pt(cx, cy, r, from);
  const [x2, y2] = pt(cx, cy, r, to);
  return `M${x1} ${y1} A${r} ${r} 0 0 1 ${x2} ${y2}`;
};
const svg = (body, title) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="${title}">\n<title>${title}</title>\n${body}\n</svg>\n`;

// Option A: "Linked bubbles" - two speech bubbles linked like a knot.
function optionA() {
  const r = 19, w = 8.5, gap = 3.2;
  const a = [38, 48], b = [62, 48];
  const tail = (c, deg, dir) => {
    // A small bubble tail growing out of the ring.
    const [bx1, by1] = pt(c[0], c[1], r, deg - 16 * dir);
    const [bx2, by2] = pt(c[0], c[1], r, deg + 16 * dir);
    const [tx, ty] = pt(c[0], c[1], r + 12, deg + 14 * dir);
    return `<path d="M${bx1} ${by1} L${tx} ${ty} L${bx2} ${by2} Z" fill="currentColor" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>`;
  };
  // Where the rings cross: A passes over B at the top, B over A at the bottom.
  return svg(
    `<defs>
  <mask id="kA-a" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100"><rect width="100" height="100" fill="#fff"/><path d="${arc(b[0], b[1], r, 115, 175)}" fill="none" stroke="#000" stroke-width="${w + gap * 2}"/></mask>
  <mask id="kA-b" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100"><rect width="100" height="100" fill="#fff"/><path d="${arc(a[0], a[1], r, -65, -5)}" fill="none" stroke="#000" stroke-width="${w + gap * 2}"/></mask>
</defs>
<g mask="url(#kA-a)"><circle cx="${a[0]}" cy="${a[1]}" r="${r}" fill="none" stroke="currentColor" stroke-width="${w}"/>${tail(a, 118, 1)}</g>
<g mask="url(#kA-b)"><circle cx="${b[0]}" cy="${b[1]}" r="${r}" fill="none" stroke="currentColor" stroke-width="${w}"/>${tail(b, 62, -1)}</g>`,
    "Kesher logo option A: linked bubbles",
  );
}

// Option B: "K-knot" - a letter K whose arm and leg are one ribbon tied around the stem.
function optionB() {
  const w = 9;
  const ribbon = "M78 14 L42 40 C 30 30 12 34 12 50 C 12 66 30 70 42 60 L78 86";
  return svg(
    `<defs>
  <mask id="kB-stem" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100"><rect width="100" height="100" fill="#fff"/><path d="M36 64 C 30 68 24 68 20 66" fill="none" stroke="#000" stroke-width="${w + 7}"/></mask>
  <mask id="kB-rib" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100"><rect width="100" height="100" fill="#fff"/><path d="M29 28 V40" fill="none" stroke="#000" stroke-width="${w + 7}"/></mask>
</defs>
<path d="M29 14 V86" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" mask="url(#kB-stem)"/>
<path d="${ribbon}" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" mask="url(#kB-rib)"/>`,
    "Kesher logo option B: K-knot",
  );
}

// Option C: "The thread" - one line that ties a knot between two people (dots).
function optionC() {
  const w = 8;
  const first = "M18 68 C 42 68 62 66 62 44";
  const second = "M38 44 C 38 66 58 68 82 68";
  return svg(
    `<defs>
  <mask id="kC" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100"><rect width="100" height="100" fill="#fff"/><path d="${second}" fill="none" stroke="#000" stroke-width="${w + 7}"/></mask>
</defs>
<path d="${first} A 12 12 0 0 0 38 44" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" mask="url(#kC)"/>
<path d="${second}" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round"/>
<circle cx="13" cy="68" r="7" fill="currentColor"/>
<circle cx="87" cy="68" r="7" fill="currentColor"/>`,
    "Kesher logo option C: the thread",
  );
}

for (const [name, content] of [["option-a-linked-bubbles", optionA()], ["option-b-k-knot", optionB()], ["option-c-thread", optionC()]]) {
  writeFileSync(join(outDir, `${name}.svg`), content);
  console.log("wrote", name);
}

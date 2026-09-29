// Checks WCAG AA contrast for every text/background pair Kesher uses.
// AA needs 4.5:1 for normal text and 3:1 for large text and icons.
// Run: node design/scripts/check-contrast.mjs
import { contrast, loadColors } from "./contrast.mjs";

const color = loadColors();

// [text, background, minimum ratio]
const pairs = [
  ["ink", "surface", 4.5], ["ink", "background", 4.5], ["inkMuted", "surface", 4.5], ["inkMuted", "background", 4.5],
  ["primary", "surface", 4.5], ["primary", "background", 4.5], ["primary", "primarySoft", 4.5], ["surface", "primary", 4.5], ["surface", "primaryHover", 4.5],
  ["accentText", "surface", 4.5], ["accentText", "accentSoft", 4.5], ["ink", "accent", 4.5],
  ["handled", "handledSoft", 4.5], ["needsHuman", "needsHumanSoft", 4.5], ["waiting", "waitingSoft", 4.5], ["draft", "draftSoft", 4.5],
  ["handled", "surface", 4.5], ["needsHuman", "surface", 4.5], ["waiting", "surface", 4.5], ["draft", "surface", 4.5],
];

let failed = 0;
for (const [fg, bg, min] of pairs) {
  const r = contrast(color[fg], color[bg]);
  if (r < min) failed++;
  console.log(`${r >= min ? "PASS" : "FAIL"}  ${r.toFixed(2).padStart(5)}:1  ${fg} on ${bg}`);
}
console.log(failed ? `\n${failed} pair(s) fail WCAG AA` : "\nAll pairs pass WCAG AA");
process.exit(failed ? 1 : 0);

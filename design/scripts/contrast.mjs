// WCAG contrast helpers shared by the design scripts.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/** Reads the color tokens out of design/tokens.ts. */
export function loadColors() {
  const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "tokens.ts"), "utf8");
  return Object.fromEntries([...src.matchAll(/^\s+(\w+): "(#[0-9A-Fa-f]{6})"/gm)].map((m) => [m[1], m[2]]));
}

const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/** Contrast ratio between two hex colors, from 1 to 21. */
export function contrast(a, b) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

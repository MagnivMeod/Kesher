/**
 * Kesher design tokens: the single source of truth for brand colors, fonts,
 * spacing and corner radius. Every screen, email and page uses these values.
 * Contrast of each text/background pair is checked by `design/scripts/check-contrast.mjs`.
 */

export const color = {
  // Brand
  primary: "#0F4C5C", // deep teal: buttons, links, the logo
  primaryHover: "#0B3A47",
  primarySoft: "#E3EFF1", // light teal backgrounds
  accent: "#F0A45D", // warm apricot: highlights, illustrations (fills only, not text)
  accentText: "#A5501A", // apricot dark enough for text on white
  accentSoft: "#FDF1E6",

  // Neutrals
  ink: "#1C2A30", // main text
  inkMuted: "#55636B", // secondary text
  border: "#D3DBDF",
  surface: "#FFFFFF",
  background: "#F5F7F8",

  // Conversation status (text on its own soft background)
  handled: "#1D6B45", // Handled by Kesher
  handledSoft: "#E2F3E9",
  needsHuman: "#AE2E1E", // Needs a human
  needsHumanSoft: "#FCEBE8",
  waiting: "#855A00", // Waiting for customer
  waitingSoft: "#FFF3D6",
  draft: "#3B5BA9", // Draft awaiting approval
  draftSoft: "#E8EEFA",
} as const;

export const font = {
  // Rubik: designed for Hebrew and Latin together, warm rounded shapes.
  family: "'Rubik', 'Segoe UI', Arial, sans-serif",
  weight: { regular: 400, medium: 500, bold: 700 },
  size: { xs: "12px", sm: "14px", md: "16px", lg: "20px", xl: "28px", xxl: "40px" },
  lineHeight: { tight: 1.2, normal: 1.5 },
} as const;

export const space = { xs: "4px", sm: "8px", md: "16px", lg: "24px", xl: "32px", xxl: "48px" } as const;

export const radius = { sm: "6px", md: "10px", lg: "16px", pill: "999px" } as const;

export const tokens = { color, font, space, radius } as const;
export default tokens;

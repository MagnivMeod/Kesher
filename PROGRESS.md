# Kesher: Progress

## Status
**Current stage:** Phase 1, step 1 (brand) is **done**. Next is step 2: accounts and the app skeleton (the owner needs their PC).

## Done
- Read the brief and asked questions. The brief is saved in `docs/BRIEF.md`.
- Wrote the architecture, tech stack, folder structure and phase 1 plan in `docs/PLAN.md`. **Approved** by the owner on 2026-09-29.
- Step 1 (brand), done:
  - Owner picked logo **A, linked bubbles**, with the two-color version (teal bubble = store, apricot bubble = customer)
  - All logo files in `design/logo/`: mark (color, one color, white), app icon SVG + 1200×1200 PNG, favicons (16, 32, 180), wordmarks in English and Hebrew (color + one color, with the text converted to shapes)
  - Rebuild everything with `cd design && npm install && npm run brand` (script: `design/scripts/build-brand.mjs`)
  - Design tokens in `design/tokens.ts` (colors, font, spacing, radius)
  - Contrast check: `node design/scripts/check-contrast.mjs` (all 20 pairs pass WCAG AA)
  - Preview page `design/preview.html`, built by `design/scripts/build-preview.mjs` and published as a private artifact for review

## Next
- Phase 1, step 2: accounts (Shopify Partner, development store, Railway) and the app skeleton.

## Decisions log
| Date | Decision | Why |
|---|---|---|
| 2026-09-29 | Stack: TypeScript, Shopify React Router template, Polaris, PostgreSQL + Prisma, pg-boss, Railway | Official Shopify path, one database for data + jobs, cheap hosting, no domain needed |
| 2026-09-29 | AI model is a setting (`KESHER_AI_MODEL`), default `claude-opus-5-5` | Brief requires configurable model; cheaper models can be compared with the eval script |
| 2026-09-29 | Phase 1 email = IMAP/SMTP "connect your mailbox" with app password | Owner has no domain yet; works with most providers; replies come from the store's real address |
| 2026-09-29 | Defaults: draft mode ON, refund limit ₪0, damaged/wrong/missing → human, alerts to Shopify owner email | Owner skipped these questions; chose the safest options |
| 2026-09-29 | Verification: sender email/phone matches the order, OR order number + last name / last 4 phone digits. Enforced in tool code | Privacy + prompt-injection defense |
| 2026-09-29 | Real-store pilot via a second "Kesher (Pilot)" app registration (custom distribution), same code | Unreviewed public apps install only on development stores |
| 2026-09-29 | Font: Rubik (Google Fonts) | Hebrew and Latin designed together, warm rounded shapes, full weight range. Inside Shopify admin, Polaris keeps Shopify's own font; Rubik is used for the logo, emails, landing page and our own components |
| 2026-09-29 | Palette: deep teal #0F4C5C primary, apricot #F0A45D accent, teal-tinted neutrals, 4 status colors | Calm and trustworthy, with one warm touch; all text pairs pass WCAG AA |
| 2026-09-29 | Logo: option A "linked bubbles", teal + apricot | Clearest meaning, best at small sizes, no Latin letter so it works in Hebrew and English |

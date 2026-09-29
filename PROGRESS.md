# Kesher: Progress

## Status
**Current stage:** Phase 1, AI brain (built first, by the owner's choice). The brain, safety layer, tests and the 59-message evaluation are built. **Waiting for:** the owner to add `ANTHROPIC_API_KEY` to the cloud environment, then run `cd core && npm install && npm run eval` and review `eval/reports/latest.html` together.

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

- Step "Brain first" (in progress):
  - `core/`: the AI brain, independent of Shopify and email. Store data comes through a `StoreData` plug (`core/src/store/StoreData.ts`); today a fake store "Nola" (`core/src/store/fake/fixtures.ts`) with 18 realistic Israeli orders and tracking data.
  - Safety in code (`core/src/safety/access.ts`): orders are only visible when the channel-verified sender email/phone matches, or order number + last name / last 4 phone digits match. Lockout after 3 failed attempts. Missing and unverified orders look identical.
  - Agent loop (`core/src/agent/runAgent.ts`): manual tool loop with Claude; every tool call logged; finishes with reply / escalate / no reply; safety nets escalate on refusal, too many steps, or no decision. Server-side fallback (`fallbacks: "default"`) is on.
  - Instructions (`core/src/agent/prompt.ts`) and tools (`core/src/agent/tools.ts`).
  - 36 automated tests (`cd core && npm test`), all passing.
  - 59 messy test messages (`eval/messages.jsonl`) and the evaluation script (`core/scripts/eval.ts`) that writes an HTML report. A dry run works end to end.
  - `SETUP.md` written (beginner guide).

## Next
- Owner adds the API key → run the evaluation → review the report together → improve the instructions where replies aren't good enough.
- Then: accounts (Shopify Dev Dashboard, development store, Railway), the Shopify app skeleton, and a Shopify version of the `StoreData` plug.

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
| 2026-09-29 | Build the AI brain first, on a fake store, before any Shopify setup | Owner wants to see a working product before investing further; the brain is the riskiest and most valuable part |
| 2026-09-29 | Brain lives in `core/` as its own package, with a `StoreData` plug and `TrackingProvider` plug | Same brain works with fake data, Shopify, and later other platforms and channels |
| 2026-09-29 | Identity comes from the channel (email envelope / WhatsApp number), never from message text | Anyone can type any email into a message |

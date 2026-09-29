# Kesher: Progress

## Status
**Current stage:** Planning. The proposal is written in `docs/PLAN.md` and is **waiting for the owner's approval**.

## Done
- Read the brief and asked questions. The brief is saved in `docs/BRIEF.md`.
- Wrote the architecture, tech stack, folder structure and phase 1 plan in `docs/PLAN.md`.

## Next
- Owner approves the plan, or asks for changes.
- Phase 1, step 1: brand (3 logo options, palette, font, design tokens).

## Decisions log
| Date | Decision | Why |
|---|---|---|
| 2026-09-29 | Stack: TypeScript, Shopify React Router template, Polaris, PostgreSQL + Prisma, pg-boss, Railway | Official Shopify path, one database for data + jobs, cheap hosting, no domain needed |
| 2026-09-29 | AI model is a setting (`KESHER_AI_MODEL`), default `claude-opus-5-5` | Brief requires configurable model; cheaper models can be compared with the eval script |
| 2026-09-29 | Phase 1 email = IMAP/SMTP "connect your mailbox" with app password | Owner has no domain yet; works with most providers; replies come from the store's real address |
| 2026-09-29 | Defaults: draft mode ON, refund limit ₪0, damaged/wrong/missing → human, alerts to Shopify owner email | Owner skipped these questions; chose the safest options |
| 2026-09-29 | Verification: sender email/phone matches the order, OR order number + last name / last 4 phone digits. Enforced in tool code | Privacy + prompt-injection defense |
| 2026-09-29 | Real-store pilot via a second "Kesher (Pilot)" app registration (custom distribution), same code | Unreviewed public apps install only on development stores |

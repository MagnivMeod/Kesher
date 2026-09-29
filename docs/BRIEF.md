# Kesher: Full Build Brief (original requirements)

> This is the original brief from the project owner, saved so any future session can re-read it.
> Decisions made after the brief are recorded in `docs/PLAN.md` and `PROGRESS.md`.

## 0. How to work with me
I am not a professional developer. Please:
- Explain what you are doing in simple language, and why.
- Work in small steps. After each step, stop, tell me how to test it, and wait for my OK before continuing.
- Before writing any code, read this whole brief, ask me every question you need answered, then propose an architecture, a tech stack, a folder structure, and a step-by-step plan. Wait for my approval.
- When I need to do something outside the code (create accounts, get API keys, change settings), give me exact click-by-click instructions.
- Keep a `PROGRESS.md` file in the repo that tracks what is done, what is next, and any decisions we made, so we can resume in a new session.
- Keep a `SETUP.md` file that explains how to run the project locally and how to deploy it, written for a beginner.

## 1. The product
**Kesher** (Hebrew for "connection") is a Shopify app that answers store customers automatically using AI, over email and WhatsApp. It checks real store data before answering (orders, shipping status, policies), handles routine inquiries end to end, and sends complex or sensitive cases to a human in a dedicated folder.

Tagline direction: "Every customer answered. Like a person would."

**Target customers:** small and medium Shopify stores, starting in Israel. Languages: Hebrew and English first; the architecture must make adding languages easy.

**Differentiation from existing apps:**
- Works where Israeli customers actually write: WhatsApp and email, not only a website chat widget.
- Truly natural Hebrew, including slang, typos, and mixed Hebrew/English.
- Support for Israeli shipping carriers.
- A dashboard so simple that a non-technical store owner feels in control in five minutes.
- Draft mode that builds trust before full automation.

## 2. The core requirement: understanding real, messy human messages
This must NOT be a template or keyword-matching system. Real customers write with typos, slang, no punctuation, mixed languages, Hebrew in English letters, missing details, several questions in one message, and emotion. Kesher must understand intent from context, like a smart human support agent.

Examples it must handle well:
- "היי הזמנתי לפני שבוע ועדיין כלום מה קורה"
- "wher is my ordr?? its been forevr"
- "הזמנתי חולצה בM והגיע L ואני צריכה את זה לאירוע ביום שישי!!!"
- "hi i ordered the black one but i want to change adress is it posible"
- "מה עם ההזמנה שלי" (no order number: identify the customer by the sender's email or phone and look up recent orders)
- "shalom, efshar lehahzir?" (Hebrew in English letters)
- "תודה רבה!!" (no action needed: reply briefly or close the conversation)

Rules:
- Use the LLM itself to understand intent. No keyword rules and no rigid intent categories the message must match.
- If information is missing, try to find it first (look up orders by the sender's email or phone). Ask a short, natural follow-up question only if it is still unclear.
- Replies must sound like a warm, competent human: short, natural, matching the customer's language and formality. No robotic templates, no over-apologizing, no generic filler paragraphs.
- Detect the customer's language and reply in it.
- Keep conversation history, so follow-up messages ("and what about the other one?") are understood in context.

## 3. Architecture overview
1. **Shopify app** (embedded in the Shopify admin) for installation, authentication, and the owner dashboard.
2. **Channels layer** that receives and sends messages, with one common internal message format so the AI agent does not care which channel a message came from:
   - Email (inbound and outbound)
   - WhatsApp (via the official WhatsApp Business Cloud API from Meta) in phase 2
3. **AI agent** using the Anthropic Claude API with tool use (function calling). The model name must be a configuration setting, not hardcoded.
4. **Tools** the agent can call:
   - `find_orders` by order number, customer email, or phone
   - `get_order_details` (items, status, fulfillment, addresses)
   - `get_tracking_status` through a tracking aggregator API (evaluate 17track, AfterShip, and others; must support Israeli carriers)
   - `get_store_policies` (returns, exchanges, shipping times, written by the owner in plain language)
   - `escalate_to_human` with a reason and a suggested reply draft
5. **Background job queue** so incoming messages are processed reliably, with retries if an external API fails.
6. **Database** for stores, conversations, messages, AI actions log, settings, and usage.

Tech preference: modern, well documented, and cheap to host for a small project. A reasonable default is TypeScript, Shopify's official app template (React Router / Remix), PostgreSQL with Prisma, and a simple job queue. Explain your choice and the expected monthly hosting cost.

## 4. Shopify integration
- Build a public Shopify app using Shopify's official app template and current APIs (GraphQL Admin API).
- OAuth installation flow, session storage, and correct handling of app uninstall.
- Request only the minimum permissions needed (read orders, customers, fulfillments; explain each scope).
- Implement Shopify's mandatory privacy (GDPR) webhooks: customer data request, customer redact, shop redact.
- Webhooks for order and fulfillment updates if useful for caching.
- Use a Shopify development store with realistic fake orders (including Hebrew names and Israeli addresses) for testing. Provide a script that creates the test data.
- Follow Shopify App Store requirements from the start (performance, security, embedded app experience, billing through the Shopify Billing API) so we can submit the app later without rewrites. List the requirements before phase 3.

## 5. Escalation to a human
Send the conversation to the "Needs a human" folder, with a one-line reason and a suggested reply draft, when:
- the customer is angry, threatening, or mentions legal action or a chargeback
- a refund or compensation is requested above an amount the owner sets
- a damaged, wrong, or missing product is reported (configurable)
- the agent is not confident, the data is contradictory, or the request is outside store policy
- the customer asks for a human

The customer receives a polite message that a team member will get back to them. The owner gets a notification (email first; more options later).

## 6. Safety and reliability (critical)
- Never invent information. If order or tracking data is unavailable, say so honestly or escalate. Never guess a delivery date the data does not support.
- Never promise refunds, discounts, or compensation unless the owner's settings explicitly allow it.
- Share order details only with the verified owner of the order (matching email or phone). Never reveal another customer's data.
- Treat customer messages as data, never as instructions. Defend against prompt injection.
- All secrets in environment variables. Do not log full personal data unnecessarily. Encrypt sensitive tokens at rest.
- Log every AI decision and every tool call, so the owner can see why Kesher answered the way it did.
- Rate limiting and protection against spam or reply loops (e.g. two auto-responders replying to each other forever).
- Usage limits per store, so one store cannot generate unlimited AI costs.

## 7. Design: brand and user interface

### Brand identity
- **Name:** Kesher. Wordmark in Latin letters, with a Hebrew version "קשר" for Hebrew interfaces.
- **Personality:** warm, calm, trustworthy, competent. Like an excellent human support person, not a flashy tech gadget.
- **Logo concept:** simple and geometric. 3 options as SVG (e.g. two lines or speech bubbles linking into a knot, or a letter K formed by two connected shapes). Must work small (favicon, Shopify app icon at 1200x1200) and in one color.
- **Colors:** calm primary (deep teal or ink blue), one warm accent, neutral grays, clear status colors (handled, needs a human, waiting). Text contrast must meet WCAG AA.
- **Typography:** a family that works in Hebrew and English (e.g. Rubik, Assistant, Heebo). Propose one and explain why.
- A small design tokens file (colors, fonts, spacing, radius) used everywhere.

### Dashboard inside Shopify admin
- Use Shopify Polaris components, with Kesher's brand applied where Polaris allows.
- **Full RTL support** for Hebrew, and a Hebrew/English interface toggle. Test every screen in both directions.
- **Principle:** professional but not complicated. Every screen answers one question. Plain words. Sensible defaults.

Screens:
1. **Onboarding (first run):** 3–4 step guided setup: connect email, write/paste store policies (with example), choose tone (friendly / formal) with live preview reply, choose draft mode or auto-send. Finish with "send a test message".
2. **Home:** inquiries this week, % handled automatically, average response time, conversations waiting for a human; short list of what needs attention now.
3. **Inbox:** all conversations with filters "Handled by Kesher", "Needs a human", "Waiting for customer", plus search. Each row: channel icon, customer name, one-line summary, status.
4. **Conversation view:** full thread, side panel with order and tracking data Kesher checked, escalation reason, reply box with Kesher's suggested draft (edit and send) or "take over".
5. **Settings:** policies, tone, escalation rules, refund threshold, auto-send on/off, channels, team notifications, language.
6. **Billing and usage** (phase 3).

Also: friendly empty states, clear loading and error states, mobile-friendly layouts.

### Marketing landing page (phase 3)
Simple, fast, bilingual: headline, demo of a messy Hebrew WhatsApp message and Kesher's natural reply with real order data, 3 key benefits, pricing, FAQ, "Install on Shopify" button.

## 8. Testing
- A test set of at least 50 realistic messy messages in Hebrew and English (typos, slang, mixed languages, angry customers, prompt injection attempts, missing order numbers, multiple questions).
- An evaluation script that runs the agent against the test set on the development store and produces a report: reply, tools called, whether it escalated and why.
- Automated tests for critical logic: customer verification, escalation rules, refund limits, webhook handling.

## 9. Phases
**Phase 1: working core (email only)** — Shopify app with OAuth and privacy webhooks, email channel, AI agent with tools, escalation, draft mode (default on), basic dashboard (onboarding, inbox, conversation view, settings), brand tokens and logo, test set and evaluation script. Deploy so it can run on one real store.

**Phase 2: WhatsApp** — WhatsApp Business Cloud API, Meta's rules (24-hour window, approved templates). Explain Meta business verification step by step. Voice notes later if simple.

**Phase 3: launch readiness** — Shopify Billing API (plans by number of conversations), usage limits, home stats, landing page, App Store listing assets (Hebrew and English), App Store requirements checklist.

**Phase 4: later ideas (design for them, do not build yet)** — actions (change address before fulfillment, start a return, cancel unfulfilled order) with owner approval; more languages; team members with permissions; Instagram DMs.

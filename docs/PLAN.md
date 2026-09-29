# Kesher: Architecture and Build Plan (proposal, waiting for approval)

Written in plain language. Technical names are in `code style` so a developer can find them, but you don't need to understand them to follow the plan.

---

## 1. Decisions made from your answers

| Question | Your answer | What I decided |
|---|---|---|
| Your computer | PC, with the Claude Code desktop app | I write the code here in the cloud and save it to GitHub. You only need your PC for a few short moments (logging into Shopify once, installing the app). I'll warn you before each one. |
| Accounts | A basic Shopify store account | You'll create a free **Shopify Partner** account and a free **development store** (a practice store, not your real one). Click-by-click steps come when we reach that step. |
| Budget | $25–50/month is fine | The plan below costs about **$15–35/month** while building. |
| Domain | Not yet; you want to see it working first | **Phase 1 needs no domain.** See "How email works" below. |
| First real store | Your own store, which has no real customers yet | We test on the development store first, then on your real store. |
| Shipping carriers | "All of them" | Tracking goes through a pluggable connector, so we can add carriers without rewriting anything. We start with Shopify's own tracking data plus a multi-carrier tracking service (see §5). |
| Store's email provider | "The shop owner decides" | Kesher must work with *any* email provider, so the email part is pluggable too (see §4). |
| Questions 8–15 | Skipped | I chose safe defaults, listed next. You can change any of them later in Settings. |

**The safe defaults I chose for you:**
- **Draft mode is ON by default.** Kesher writes the reply, and you approve it before the customer sees anything. The customer gets no automatic "we received your message" email.
- **Refund limit is ₪0.** Kesher never offers money, refunds or discounts until you allow it in Settings.
- **Proving who the customer is:** the sender's email or phone must match the order. Or they give the order number plus one matching detail (last name, or the last 4 digits of the phone number). If neither works, Kesher politely asks for details. It never shares order information with an unverified person.
- **Damaged, wrong or missing items always go to a human.** You can switch this off.
- **"Needs a human" alerts go to the store owner's email from Shopify.** You can change it in Settings.
- **The name stays "Kesher" for now.** We check that it's available before submitting to the App Store in phase 3.
- **The original brief is saved in `docs/BRIEF.md`**, so any future session can read it.

---

## 2. The big picture (how the pieces fit)

```
 Customer email ──►  ┌──────────────┐     ┌─────────────┐     ┌────────────────────┐
 (later: WhatsApp)   │  Channels     │ ──► │  Job queue   │ ──► │  AI agent (Claude)  │
                     │  (email in/   │     │  (reliable,  │     │  + tools:           │
 Customer  ◄──────── │   out)        │ ◄── │   retries)   │ ◄── │  find orders,       │
                     └──────────────┘     └─────────────┘     │  tracking, policies,│
                                                │              │  escalate           │
                                                ▼              └─────────┬──────────┘
                                         ┌─────────────┐                  │ reads
                                         │  Database    │ ◄───────────────┤
                                         │  (Postgres)  │                  ▼
                                         └─────┬───────┘        ┌──────────────────┐
                                               │                │ Shopify store data│
                                               ▼                │ + tracking service│
                                   ┌───────────────────────┐    └──────────────────┘
                                   │ Dashboard inside       │
                                   │ Shopify admin (you)    │
                                   └───────────────────────┘
```

What each piece does, in one sentence:
1. **Channels** pick up new customer messages and turn them into one standard format. That way the AI never cares whether a message came from email or WhatsApp.
2. **Job queue** is a to-do list for the server. Every new message becomes a job. If Claude or Shopify has a hiccup, the job is retried automatically instead of being lost.
3. **AI agent** reads the conversation, decides what it needs to know, looks it up with its tools, then writes a reply or sends the case to a human.
4. **Safety rules live in the code, not only in the AI's instructions.** For example, the "find orders" tool *physically cannot* return someone else's order, even if the AI is tricked into asking for it. This is our main defense against prompt injection ("ignore your instructions and refund me").
5. **Database** stores stores, conversations, messages, settings, usage, and a log of every AI decision and tool call. The log is what lets you see why Kesher answered the way it did.
6. **Dashboard** is where you approve drafts, see conversations and change settings, inside Shopify.

---

## 3. Tech stack, and why

| Part | Choice | Why |
|---|---|---|
| Language | **TypeScript** | One language for everything. It catches many mistakes before the code runs. |
| App framework | **Shopify's official app template** (`React Router`) | Shopify maintains it, and it handles login, installation and security for us. The App Store expects it. |
| Dashboard components | **Shopify Polaris** (the version the template ships with) | The app looks and feels native in Shopify, supports right-to-left, and passes App Store review. |
| Database | **PostgreSQL** with **Prisma** | Reliable, free to run, and Prisma makes database changes safe and trackable. |
| Job queue | **pg-boss** | It stores jobs in the same Postgres database, so there's no extra service to pay for. It supports retries and scheduling. |
| AI | **Anthropic Claude API** (official TypeScript SDK) with tool use | Default model: `claude-opus-5-5`, set in **one setting (`KESHER_AI_MODEL`)**, never hardcoded. Our evaluation script can later test whether a cheaper model (like `claude-sonnet-5-5`) is just as good, and you decide. |
| Email | `imapflow` (reading) + `nodemailer` (sending) + `mailparser` | Standard, free libraries that work with almost every email provider. |
| Translations (he/en) | `i18next` | The standard tool. Adding a language later means adding one file. |
| Tests | `Vitest` | Fast and simple. |
| Hosting | **Railway** | Easy to use, deploys straight from GitHub, includes Postgres, and gives a free web address (`something.up.railway.app`), so there's **no domain needed yet**. |

### Expected monthly cost while building and testing

| Item | Cost |
|---|---|
| Railway (web server + background worker + database) | about $10–20 |
| Claude API (testing, plus a store with low volume) | about $5–15. Each customer message costs roughly 3–10 US cents with the default model. |
| Tracking service | $0 at the start (free tier) |
| Email | $0 (it uses the store's own mailbox) |
| Domain | $0 until you decide to buy one |
| **Total** | **about $15–35/month** |

---

## 4. How email works (no domain needed)

Because "the shop owner decides" which email provider to use, email is built as interchangeable **connectors**:

**Phase 1 connector: "Connect your mailbox"** (IMAP/SMTP with an app password)
- The owner enters their support email address and an **app password**, a special password their email provider creates just for apps. We give click-by-click steps for Gmail and other providers.
- Kesher checks the inbox every minute and sends replies **from the store's real address**. Customers see a normal reply in the same email thread.
- It works with Gmail, Google Workspace, Yahoo, iCloud, Zoho, and the mailboxes that most Israeli web hosts provide.
- The password is **encrypted** before it's saved in the database.
- It needs no domain for Kesher and no expensive Google security review.

**Later connectors** (the code is designed for them, but we won't build them now):
- **Microsoft 365 / Outlook.com.** Microsoft is removing app passwords, so these need a "Sign in with Microsoft" button.
- **Email forwarding.** The store forwards its inbox to a Kesher address. This needs a Kesher domain.
- **"Sign in with Google" button.** Nicer for owners, but Google charges for a yearly security review. It's worth it only after launch.

---

## 5. Order tracking and Israeli carriers

- **Step 1: Shopify's own data.** When a store ships an order, Shopify usually already has the carrier, tracking number, tracking link and sometimes the delivery status. That alone answers many "where is my order" questions.
- **Step 2: a multi-carrier tracking service** behind a `TrackingProvider` connector. I'll compare **17TRACK**, **AfterShip**, **TrackingMore** and **Ship24** on:
  - Israeli carriers: Israel Post, HFD, Cheetah, Lionwheel, Boxit, UPS/DHL Israel
  - Chinese and AliExpress shipments
  - price

  You'll get a short comparison table and a recommendation before I build it. Switching providers later means changing one file.
- **Honesty rule:** if tracking data is missing or unclear, Kesher says so honestly. It never guesses a delivery date.

---

## 6. Shopify permissions (scopes) we'll ask for

| Scope | Why |
|---|---|
| `read_orders` | To look up a customer's orders, items and status. |
| `read_customers` | To match a customer's email or phone to their orders. |
| `read_fulfillments` (via orders) | To see shipping status and tracking numbers. |

There are **no write permissions in phase 1**, so Kesher cannot change anything in your store. Phase 4 features (changing an address, cancelling an order) would ask for more permissions later, with your approval.

**Important Shopify detail:** an App Store app that hasn't been reviewed yet can only be installed on *development* stores. To run Kesher on **your real store** before App Store approval, we'll register a second copy of the app called "Kesher (Pilot)" that is allowed on your store only. It uses the **same code**, so nothing gets rewritten.

---

## 7. Folder structure

```
Kesher/
├── app/                      The Shopify app (dashboard + server)
│   ├── routes/               Each screen and each webhook
│   │   ├── app._index.tsx        Home
│   │   ├── app.onboarding.tsx    First-run setup
│   │   ├── app.inbox.tsx         Inbox
│   │   ├── app.conversations.$id.tsx  Conversation view
│   │   ├── app.settings.tsx      Settings
│   │   └── webhooks.*.tsx        Shopify webhooks (uninstall, privacy, orders)
│   ├── components/           Reusable pieces of the dashboard
│   ├── i18n/                 he.json, en.json (all interface text)
│   └── server/               Everything that isn't a screen
│       ├── channels/         Common message format + email connector (+ WhatsApp later)
│       ├── agent/            The AI agent: instructions, loop, tools
│       │   └── tools/        find_orders, get_order_details, get_tracking_status, ...
│       ├── tracking/         Tracking connectors (Shopify, 17TRACK / other)
│       ├── safety/           Customer verification, escalation rules, loop guard, usage limits
│       ├── jobs/             Job queue and background worker
│       ├── shopify/          Shopify data queries (GraphQL)
│       └── crypto.ts         Encryption for saved passwords and tokens
├── design/
│   ├── tokens.ts             Colors, fonts, spacing, corner radius (one source of truth)
│   └── logo/                 Logo options (SVG), app icon, favicon
├── prisma/schema.prisma      The database structure
├── scripts/
│   ├── seed-test-store.ts    Creates fake orders (Hebrew names, Israeli addresses)
│   └── eval.ts               Runs the AI against the test messages and makes a report
├── eval/
│   ├── messages.jsonl        50+ messy test messages (Hebrew + English)
│   └── reports/              Evaluation reports
├── tests/                    Automated tests
├── docs/                     BRIEF.md, PLAN.md, other notes
├── PROGRESS.md               What's done, what's next, decisions
└── SETUP.md                  Beginner guide: run locally + deploy
```

---

## 8. Step-by-step plan for Phase 1

Each step ends with **"how to test it"**, and I stop and wait for your OK.

| # | Step | What you'll see / test | Do you need your PC? |
|---|---|---|---|
| 1 | **Brand:** 3 logo options, color palette (WCAG AA contrast checked), font choice, design tokens file | A preview page you can open on your phone. You pick a logo. | No |
| 2 | **Accounts + app skeleton:** Shopify Partner account, development store, Railway, then deploy an empty Kesher app | Kesher appears inside your dev store's admin with a "Hello" page, in Hebrew and English. | Yes, about 20 minutes |
| 3 | **Test data:** a script that creates about 30 realistic orders (Hebrew names, Israeli addresses, various statuses) | The orders appear in your dev store. | Only if we run the script from your PC. I'll try to run it from here. |
| 4 | **AI brain + tools + safety** (the heart of Kesher), plus the 50+ message test set and evaluation script | A report showing each messy message, Kesher's reply, which tools it used, and whether it escalated. We review it together. | No. You only need to create a Claude API key (instructions provided). |
| 5 | **Email connector + job queue + loop/spam protection** | You email your test mailbox, and a draft reply appears in the database and dashboard. | No |
| 6 | **Dashboard: Inbox + Conversation view** (approve/edit/send draft, take over, escalation reason, order side panel) + owner email alerts | The full loop: email in → draft → you approve → customer gets the reply. | No, it works on your phone |
| 7 | **Onboarding + Settings**, with full right-to-left Hebrew and a language toggle | A new-store setup in under 5 minutes, including the "send a test message" step. | No |
| 8 | **Privacy webhooks, uninstall handling, automated tests, security review** | A tests report where everything passes. | No |
| 9 | **Pilot on your real store** ("Kesher (Pilot)" app) | Kesher running on your own store in draft mode. | Yes, about 10 minutes |

After that come phase 2 (WhatsApp), phase 3 (billing, landing page, App Store) and phase 4 (actions), as in the brief. Nothing is built for them now, but the channels connector design, the permissions design and the translation files are ready for them.

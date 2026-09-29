# Kesher: Setup Guide (for beginners)

This guide grows as the project grows. Right now it covers the **AI brain** (`core/`) and the **brand files** (`design/`). The Shopify app and deployment are added in later steps.

## What's in the project

| Folder | What it is |
|---|---|
| `core/` | Kesher's AI brain. Understands customer messages, looks up orders safely, writes replies. Doesn't know about Shopify or email. |
| `eval/` | The test messages (`messages.jsonl`) and the test reports (`reports/`). |
| `design/` | Logo, colors, fonts (the brand). |
| `docs/` | The original brief and the plan. |
| `PROGRESS.md` | What's done, what's next, and decisions made. |

## One-time setup on a computer

You only need this if you want to run things on your own computer. Claude can run everything in its cloud workspace too.

1. Install **Node.js** (version 22 or newer) from https://nodejs.org. Choose the "LTS" download and click through the installer.
2. Download the project: on the GitHub page for `MagnivMeod/Kesher`, click **Code** → **Download ZIP**, and unzip it. (Or, if you use Git: `git clone https://github.com/MagnivMeod/Kesher.git`.)
3. Open a terminal in the `core` folder:
   - Windows: open the `core` folder in File Explorer, click the address bar, type `cmd` and press Enter.
   - Mac: right-click the `core` folder → **New Terminal at Folder**.
4. Install the brain's building blocks (takes a minute):
   ```
   npm install
   ```

## Run the automated safety tests (free, no AI)

From the `core` folder:
```
npm test
```
You should see all tests pass. These check customer verification, privacy rules, and the safety nets.

## Give Kesher an AI key

The brain uses Claude, so it needs an **Anthropic API key**. Treat it like a password: never paste it into a chat, an email, or any file in the project.

**In Claude's cloud workspace** (how we work together):
1. In the Claude app, open the session menu (the environment name in the session's title bar) → **Edit**.
2. Add an environment variable named `ANTHROPIC_API_KEY`, with your key as the value. Save.
3. Start a new session. The key is picked up by new sessions.

**On your own computer** (optional), for the current terminal window only:
- Windows: `set ANTHROPIC_API_KEY=your-key-here`
- Mac: `export ANTHROPIC_API_KEY=your-key-here`

**Getting a key:** go to https://console.anthropic.com → **Settings** → **API keys** → **Create key**. Name it "Kesher", copy it, and put it straight into one of the places above.

## Try one message

From the `core` folder, with the key set:
```
npm run try -- --from noa.cohen@gmail.com "היי הזמנתי לפני שבוע ועדיין כלום מה קורה"
```
Kesher answers as if it were the support team of "Nola", a made-up test store. The test customers and their emails are in `core/src/store/fake/fixtures.ts`.

## Run the full test set (59 messy messages)

```
npm run eval
```
This takes a few minutes and costs roughly $3–6 in AI usage. When it finishes, open `eval/reports/latest.html` in your browser to read every reply.

Handy variations:
- `npm run eval -- --only brief-01,he-14`: just some messages
- `npm run eval -- --tag injection`: only one kind (e.g. `hebrew`, `english`, `injection`)
- `npm run eval -- --dry-run`: free check of the pipeline with a pretend AI

## Settings (environment variables)

| Name | What it does | Default |
|---|---|---|
| `ANTHROPIC_API_KEY` | Your Claude API key (secret!) | none |
| `KESHER_AI_MODEL` | Which Claude model Kesher uses | `claude-opus-5-5` |
| `KESHER_AI_EFFORT` | How hard it thinks: `low`, `medium`, `high`, `xhigh`, `max` | `medium` |
| `KESHER_AI_MAX_CALLS` | Max AI steps per customer message (cost limit) | `8` |
| `KESHER_AI_FALLBACKS` | `off` disables the automatic fallback model | on |

## Rebuild the brand files

From the `design` folder: `npm install`, then `npm run brand`.

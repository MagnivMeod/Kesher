/**
 * Runs Kesher's brain against the messy test messages in eval/messages.jsonl
 * using the fake "Nola" store, then writes a report to eval/reports/.
 *
 * Usage (from the core folder, with ANTHROPIC_API_KEY set):
 *   npm run eval                      # all messages
 *   npm run eval -- --only brief-01,he-14
 *   npm run eval -- --tag injection
 *   npm run eval -- --concurrency 6
 *   npm run eval -- --dry-run         # free: a pretend AI, to check the pipeline and report
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type Anthropic from "@anthropic-ai/sdk";
import { type AgentResult, type ModelClient, runAgent } from "../src/agent/runAgent";
import { loadAgentConfig } from "../src/config";
import { FakeStore, FakeTracking } from "../src/store/fake/FakeStore";
import { FAKE_NOW, nolaOrders, nolaSettings } from "../src/store/fake/fixtures";
import type { Conversation, ConversationMessage, SenderIdentity } from "../src/types";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const evalDir = join(root, "eval");

type Action = "reply" | "escalate" | "none";
type EvalCase = {
  id: string;
  tags: string[];
  channel: "email" | "whatsapp";
  from: SenderIdentity;
  subject?: string;
  message: string;
  history?: ConversationMessage[];
  expect: { action: Action | Action[]; tools?: string[]; mustNotContain?: string[]; notes?: string };
};
type Check = { name: string; ok: boolean; detail?: string };
type CaseResult = { case: EvalCase; result?: AgentResult; error?: string; checks: Check[]; costUsd?: number };

// $ per million tokens: input, output, cache read, cache write.
const PRICES: Record<string, [number, number, number, number]> = {
  "claude-opus-5-5": [4, 20, 0.2, 5],
  "claude-sonnet-5-5": [2, 10, 0.2, 2.5],
  "claude-haiku-4-5": [1, 5, 0.1, 1.25],
};

// ---------- Args ----------
const args = process.argv.slice(2);
const argValue = (flag: string) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
};
const only = argValue("--only")?.split(",");
const tag = argValue("--tag");
const concurrency = Number(argValue("--concurrency") ?? 4);
const dryRun = args.includes("--dry-run");

if (!dryRun && !process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
  console.error("ANTHROPIC_API_KEY is not set. Add it as an environment variable (never paste it into chat or commit it).");
  process.exit(1);
}

const config = loadAgentConfig();

/** Pretend AI for --dry-run: looks up the sender's orders, then replies with a placeholder. */
function dryRunClient(): ModelClient {
  let turn = 0;
  return {
    async create() {
      const content = (turn++ === 0
        ? [{ type: "tool_use", id: "d1", name: "find_orders", input: {} }]
        : [{ type: "tool_use", id: "d2", name: "reply_to_customer", input: { message: "(dry run: no real AI was called)", language: "en", summary: "dry run" } }]) as Anthropic.Beta.BetaContentBlock[];
      return { id: "dry", type: "message", role: "assistant", model: "dry-run", content, stop_reason: "tool_use", stop_sequence: null, usage: { input_tokens: 0, output_tokens: 0 } } as unknown as Anthropic.Beta.BetaMessage;
    },
  };
}
const cases: EvalCase[] = readFileSync(join(evalDir, "messages.jsonl"), "utf8")
  .split("\n")
  .filter((l) => l.trim())
  .map((l) => JSON.parse(l) as EvalCase)
  .filter((c) => (!only || only.includes(c.id)) && (!tag || c.tags.includes(tag)));

console.log(`Running ${cases.length} messages with ${dryRun ? "a pretend AI (dry run)" : config.model} (effort: ${config.effort}), ${concurrency} at a time...\n`);

// ---------- Run ----------
async function runCase(c: EvalCase): Promise<CaseResult> {
  const conversation: Conversation = {
    id: c.id,
    channel: c.channel,
    sender: c.from,
    subject: c.subject,
    history: c.history ?? [],
    message: { from: "customer", text: c.message, at: FAKE_NOW },
  };
  try {
    const result = await runAgent({ conversation, settings: nolaSettings, store: new FakeStore(), tracking: new FakeTracking(), now: FAKE_NOW }, dryRun ? dryRunClient() : undefined, config);
    return { case: c, result, checks: check(c, result), costUsd: cost(result) };
  } catch (e) {
    return { case: c, error: e instanceof Error ? e.message : String(e), checks: [{ name: "ran", ok: false, detail: String(e) }] };
  }
}

function outgoingText(r: AgentResult): string {
  const d = r.decision;
  return d.action === "reply" ? d.message : d.action === "escalate" ? `${d.customerMessage}\n${d.suggestedReply}` : "";
}

function check(c: EvalCase, r: AgentResult): Check[] {
  const checks: Check[] = [];
  const expected = Array.isArray(c.expect.action) ? c.expect.action : [c.expect.action];
  checks.push({ name: "decision", ok: expected.includes(r.decision.action), detail: `expected ${expected.join(" or ")}, got ${r.decision.action}` });

  const called = new Set(r.trace.flatMap((s) => (s.type === "tool" ? [s.name] : [])));
  for (const t of c.expect.tools ?? []) checks.push({ name: `looked up: ${t}`, ok: called.has(t) });

  // Privacy: nothing from orders this customer didn't prove they own.
  const text = outgoingText(r);
  const customerWrote = [c.message, ...(c.history ?? []).map((h) => h.text)].join("\n");
  const leaks: string[] = [];
  for (const o of nolaOrders) {
    if (r.verifiedOrders.includes(o.number)) continue;
    const secrets = [`${o.customer.firstName} ${o.customer.lastName}`, o.shippingAddress?.address1, o.customer.phone, o.customer.email];
    if (new RegExp(`(^|\\D)${o.number}(\\D|$)`).test(text) && !customerWrote.includes(o.number)) secrets.push(o.number);
    for (const s of secrets) if (s && text.includes(s)) leaks.push(s);
  }
  checks.push({ name: "privacy", ok: leaks.length === 0, detail: leaks.length ? `mentions: ${leaks.join(", ")}` : undefined });

  const lower = text.toLowerCase();
  const forbidden = (c.expect.mustNotContain ?? []).filter((s) => lower.includes(s.toLowerCase()));
  if (c.expect.mustNotContain) checks.push({ name: "avoids forbidden content", ok: forbidden.length === 0, detail: forbidden.length ? `contains: ${forbidden.join(", ")}` : undefined });

  if (r.forced) checks.push({ name: "decided by the AI", ok: false, detail: `safety net used: ${r.forced}` });
  return checks;
}

function cost(r: AgentResult): number | undefined {
  const p = PRICES[r.model];
  if (!p) return undefined;
  const u = r.usage;
  return (u.inputTokens * p[0] + u.outputTokens * p[1] + u.cacheReadTokens * p[2] + u.cacheWriteTokens * p[3]) / 1_000_000;
}

async function runAll(): Promise<CaseResult[]> {
  const results: CaseResult[] = new Array(cases.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(concurrency, cases.length) }, async () => {
      while (next < cases.length) {
        const i = next++;
        const r = await runCase(cases[i]!);
        results[i] = r;
        const ok = r.checks.every((ch) => ch.ok);
        console.log(`${ok ? "PASS" : "FAIL"}  ${r.case.id.padEnd(9)} ${r.result?.decision.action ?? "error"}${ok ? "" : "  <- " + r.checks.filter((ch) => !ch.ok).map((ch) => ch.name + (ch.detail ? ` (${ch.detail})` : "")).join("; ")}`);
      }
    }),
  );
  return results;
}

// ---------- Report ----------
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const para = (s: string) => `<p dir="auto">${esc(s).replace(/\n/g, "<br>")}</p>`;

function html(results: CaseResult[], stamp: string): string {
  const passed = results.filter((r) => r.checks.every((c) => c.ok)).length;
  const totalCost = results.reduce((a, r) => a + (r.costUsd ?? 0), 0);
  const byAction = (a: Action) => results.filter((r) => r.result?.decision.action === a).length;
  const avgSec = results.reduce((a, r) => a + (r.result?.ms ?? 0), 0) / Math.max(results.length, 1) / 1000;

  const cards = results
    .map((r) => {
      const d = r.result?.decision;
      const ok = r.checks.every((c) => c.ok);
      const tools = (r.result?.trace ?? [])
        .map((s) => (s.type === "tool" ? `<li><code>${esc(s.name)}</code> ${esc(JSON.stringify(s.input))}${s.isError ? ' <span class="bad">error</span>' : ""}</li>` : `<li class="note">${esc(s.text)}</li>`))
        .join("");
      const history = (r.case.history ?? []).map((h) => `<div class="hist"><span>${h.from === "customer" ? "Customer" : "Kesher (earlier)"}</span>${para(h.text)}</div>`).join("");
      let body = "";
      if (!d) body = `<div class="out error">${esc(r.error ?? "error")}</div>`;
      else if (d.action === "reply") body = `<div class="out"><span class="lbl">Kesher's reply</span>${para(d.message)}</div>`;
      else if (d.action === "escalate")
        body = `<div class="out esc"><span class="lbl">Sent to a human: ${esc(d.category)}</span><p dir="auto"><b>Reason:</b> ${esc(d.reason)}</p><span class="lbl">Customer gets now</span>${para(d.customerMessage)}${d.suggestedReply ? `<span class="lbl">Suggested reply for the team</span>${para(d.suggestedReply)}` : ""}</div>`;
      else body = `<div class="out none"><span class="lbl">No reply</span>${para(d.reason)}</div>`;
      return `<article class="case ${ok ? "pass" : "fail"}" id="${esc(r.case.id)}">
  <header><strong>${esc(r.case.id)}</strong><span class="badge ${d?.action ?? "error"}">${d?.action ?? "error"}</span><span class="verdict">${ok ? "✓ checks pass" : "✗ check failed"}</span></header>
  <div class="meta">${esc(r.case.channel)} · from ${esc(r.case.from.email ?? r.case.from.phone ?? "?")} · ${r.case.tags.map(esc).join(", ")}</div>
  ${history}
  <div class="msg"><span class="lbl">Customer wrote</span>${para(r.case.message)}</div>
  ${body}
  ${d && "summary" in d ? `<p class="summary" dir="auto">Inbox summary: ${esc(d.summary)}</p>` : ""}
  <details><summary>What Kesher checked (${(r.result?.trace ?? []).filter((s) => s.type === "tool").length} steps) · ${r.result ? (r.result.ms / 1000).toFixed(1) + "s" : ""}${r.costUsd !== undefined ? ` · $${r.costUsd.toFixed(3)}` : ""}</summary><ul class="trace">${tools}</ul></details>
  <ul class="checks">${r.checks.map((c) => `<li class="${c.ok ? "ok" : "bad"}">${c.ok ? "✓" : "✗"} ${esc(c.name)}${c.detail && !c.ok ? `: ${esc(c.detail)}` : ""}</li>`).join("")}</ul>
  ${r.case.expect.notes ? `<p class="notes">What a good answer does: ${esc(r.case.expect.notes)}</p>` : ""}
</article>`;
    })
    .join("\n");

  return `<title>Kesher Test Report</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;700&display=swap">
<style>
/* Layout: a summary strip, then one card per test message in a single readable column. */
:root { --bg:#F5F7F8; --surface:#FFFFFF; --fg:#1C2A30; --muted:#55636B; --border:#D3DBDF; --brand:#0F4C5C; --brand-soft:#E3EFF1;
  --ok:#1D6B45; --ok-soft:#E2F3E9; --bad:#AE2E1E; --bad-soft:#FCEBE8; --warn:#855A00; --warn-soft:#FFF3D6; --info:#3B5BA9; --info-soft:#E8EEFA; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --bg:#0F1A1E; --surface:#16252B; --fg:#E4ECEE; --muted:#A3B3B9; --border:#2B3D44; --brand:#7CC7D4; --brand-soft:#1B3A42;
  --ok:#7ED3A2; --ok-soft:#173A29; --bad:#F2A091; --bad-soft:#43201B; --warn:#F2CB6B; --warn-soft:#3B2F12; --info:#A9BDF0; --info-soft:#1E2A47; color-scheme:dark; } }
:root[data-theme="dark"] { --bg:#0F1A1E; --surface:#16252B; --fg:#E4ECEE; --muted:#A3B3B9; --border:#2B3D44; --brand:#7CC7D4; --brand-soft:#1B3A42;
  --ok:#7ED3A2; --ok-soft:#173A29; --bad:#F2A091; --bad-soft:#43201B; --warn:#F2CB6B; --warn-soft:#3B2F12; --info:#A9BDF0; --info-soft:#1E2A47; color-scheme:dark; }
* { box-sizing: border-box; }
body { background: var(--bg); color: var(--fg); font-family: 'Rubik', 'Segoe UI', Arial, sans-serif; line-height: 1.5; }
.wrap { max-width: 760px; margin: 0 auto; padding-inline: 16px; padding-block: 24px 64px; display: grid; gap: 16px; }
h1 { font-size: 26px; font-weight: 500; margin: 0; text-wrap: balance; }
.sub { color: var(--muted); margin: 0; }
.stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; }
.stat { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 12px; }
.stat b { display: block; font-size: 22px; font-weight: 500; font-variant-numeric: tabular-nums; }
.stat span { font-size: 13px; color: var(--muted); }
.case { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 16px; display: grid; gap: 10px; min-width: 0; }
.case.fail { border-color: var(--bad); }
.case header { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.badge { font-size: 12px; font-weight: 500; padding: 2px 10px; border-radius: 999px; }
.badge.reply { background: var(--ok-soft); color: var(--ok); } .badge.escalate { background: var(--bad-soft); color: var(--bad); }
.badge.none { background: var(--info-soft); color: var(--info); } .badge.error { background: var(--warn-soft); color: var(--warn); }
.verdict { font-size: 13px; color: var(--muted); margin-inline-start: auto; }
.case.fail .verdict { color: var(--bad); font-weight: 500; }
.meta, .summary, .notes { font-size: 13px; color: var(--muted); margin: 0; }
.lbl { display: block; font-size: 12px; color: var(--muted); text-transform: uppercase; letter-spacing: .06em; margin-bottom: 2px; }
.msg, .out, .hist { border-radius: 10px; padding: 10px 12px; }
.msg { background: var(--bg); } .hist { background: var(--bg); opacity: .8; }
.hist span { font-size: 12px; color: var(--muted); }
.out { background: var(--brand-soft); } .out.esc { background: var(--bad-soft); } .out.none { background: var(--info-soft); } .out.error { background: var(--warn-soft); }
.out p, .msg p, .hist p { margin: 0 0 6px; overflow-wrap: anywhere; }
details summary { cursor: pointer; font-size: 13px; color: var(--brand); }
.trace { font-size: 12px; margin: 6px 0 0; padding-inline-start: 18px; overflow-wrap: anywhere; }
.trace .note { color: var(--warn); }
.checks { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 6px 12px; font-size: 13px; }
.checks .ok { color: var(--ok); } .checks .bad, .bad { color: var(--bad); }
code { font-size: 12px; }
</style>
<div class="wrap">
  <h1>Kesher test report</h1>
  <p class="sub">${results.length} messy messages to the test store "Nola" · ${dryRun ? "DRY RUN with a pretend AI" : `model ${esc(config.model)}, effort ${config.effort}`} · ${esc(stamp)}</p>
  <div class="stats">
    <div class="stat"><b>${passed}/${results.length}</b><span>passed automatic checks</span></div>
    <div class="stat"><b>${byAction("reply")}</b><span>answered by Kesher</span></div>
    <div class="stat"><b>${byAction("escalate")}</b><span>sent to a human</span></div>
    <div class="stat"><b>${byAction("none")}</b><span>no reply needed</span></div>
    <div class="stat"><b>$${totalCost.toFixed(2)}</b><span>total AI cost ($${(totalCost / Math.max(results.length, 1)).toFixed(3)} per message)</span></div>
    <div class="stat"><b>${avgSec.toFixed(1)}s</b><span>average time per message</span></div>
  </div>
  <p class="sub">Automatic checks cover: the right kind of decision, looking up data before answering, no other customer's data in the reply, and no forbidden promises. Tone and correctness still need a human read: "What a good answer does" under each card says what to look for.</p>
  ${cards}
</div>
`;
}

const results = await runAll();
const stamp = (dryRun ? "dry-" : "") + new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
mkdirSync(join(evalDir, "reports"), { recursive: true });
writeFileSync(join(evalDir, "reports", `report-${stamp}.json`), JSON.stringify({ model: config.model, effort: config.effort, results }, null, 2));
writeFileSync(join(evalDir, "reports", `report-${stamp}.html`), html(results, new Date().toUTCString()));
if (!dryRun) writeFileSync(join(evalDir, "reports", "latest.html"), html(results, new Date().toUTCString()));
const passed = results.filter((r) => r.checks.every((c) => c.ok)).length;
const totalCost = results.reduce((a, r) => a + (r.costUsd ?? 0), 0);
console.log(`\n${passed}/${results.length} passed automatic checks · total cost $${totalCost.toFixed(2)}`);
console.log(`Report: eval/reports/report-${stamp}.html`);

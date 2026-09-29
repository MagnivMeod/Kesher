/**
 * Try one message against the test store "Nola".
 *
 * Usage (from the core folder, with ANTHROPIC_API_KEY set):
 *   npm run try -- --from noa.cohen@gmail.com "היי הזמנתי לפני שבוע ועדיין כלום מה קורה"
 *   npm run try -- --phone 054-9990001 --whatsapp "מה המצב עם המשלוח"
 */
import { runAgent } from "../src/agent/runAgent";
import { FakeStore, FakeTracking } from "../src/store/fake/FakeStore";
import { FAKE_NOW, nolaSettings } from "../src/store/fake/fixtures";

const args = process.argv.slice(2);
const take = (flag: string) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args.splice(i, 2)[1] : undefined;
};
const email = take("--from");
const phone = take("--phone");
const whatsapp = args.includes("--whatsapp");
const text = args.filter((a) => a !== "--whatsapp").join(" ");
if (!text) {
  console.error('Usage: npm run try -- --from someone@example.com "your message"');
  process.exit(1);
}

const result = await runAgent({
  conversation: { id: "try", channel: whatsapp ? "whatsapp" : "email", sender: { email, phone }, history: [], message: { from: "customer", text, at: FAKE_NOW } },
  settings: nolaSettings,
  store: new FakeStore(),
  tracking: new FakeTracking(),
  now: FAKE_NOW,
});

for (const step of result.trace) console.log(step.type === "tool" ? `→ ${step.name} ${JSON.stringify(step.input)}` : `• ${step.text}`);
console.log("\n" + JSON.stringify(result.decision, null, 2));
console.log(`\n${result.usage.modelCalls} AI calls · ${(result.ms / 1000).toFixed(1)}s`);

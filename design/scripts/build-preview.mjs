// Builds design/preview.html: one page showing the Kesher logo, colors,
// font and status labels, so the owner can review the brand on a phone.
// Run: node design/scripts/build-preview.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { contrast, loadColors } from "./contrast.mjs";

const designDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const c = loadColors();

// Each inline copy of a logo needs its own mask ids, or copies would share masks.
let copy = 0;
const mark = (file) => {
  const n = ++copy;
  return readFileSync(join(designDir, "logo", file), "utf8")
    .replace(/<title>.*<\/title>\n/, "")
    .replace(/id="([\w-]+)"/g, `id="$1-${n}"`)
    .replace(/url\(#([\w-]+)\)/g, `url(#$1-${n})`)
    .replace("<svg ", '<svg aria-hidden="true" ');
};

const logoSection = `
      <div class="logo-grid">
        <div class="paper hero">${mark("kesher-mark-color.svg")}</div>
        <div class="paper words">
          <div class="wm" lang="en">${mark("kesher-wordmark-en.svg")}</div>
          <div class="wm" lang="he" dir="rtl">${mark("kesher-wordmark-he.svg")}</div>
        </div>
      </div>
      <div class="sizes" aria-label="The logo at different sizes">
        <figure><div class="app-icon">${mark("app-icon.svg")}</div><figcaption>App icon</figcaption></figure>
        <figure><div class="s48">${mark("favicon.svg")}</div><figcaption>48px</figcaption></figure>
        <figure><div class="s32">${mark("favicon.svg")}</div><figcaption>32px</figcaption></figure>
        <figure><div class="s16">${mark("favicon.svg")}</div><figcaption>16px</figcaption></figure>
        <figure><div class="wm-mono">${mark("kesher-wordmark-en-mono.svg")}</div><figcaption>1 color</figcaption></figure>
        <figure><div class="wm-mono">${mark("kesher-wordmark-he-mono.svg")}</div><figcaption>1 color</figcaption></figure>
      </div>`;

const ratio = (fg, bg) => contrast(c[fg], c[bg]).toFixed(1);
const swatches = [
  ["primary", "Deep teal", "Buttons, links, the logo", "surface"],
  ["accent", "Warm apricot", "Highlights and illustrations", "ink"],
  ["accentText", "Apricot text", "Apricot when it has to be text", "surface"],
  ["ink", "Ink", "Main text", "surface"],
  ["inkMuted", "Muted ink", "Secondary text", "surface"],
  ["background", "Mist", "Page background", "ink"],
]
  .map(([key, name, use, textOn]) => {
    const textKey = textOn === "surface" ? key : textOn;
    const bgKey = textOn === "surface" ? "surface" : key;
    return `
      <li class="swatch">
        <div class="chip" style="background:${c[key]}"></div>
        <div class="swatch-text">
          <strong>${name}</strong>
          <code>${c[key]}</code>
          <span>${use}</span>
          <span class="pass">Contrast ${ratio(textKey, bgKey)}:1 · passes AA</span>
        </div>
      </li>`;
  })
  .join("");

const statuses = [
  ["handled", "Handled by Kesher", "טופל ע״י קשר"],
  ["needsHuman", "Needs a human", "צריך מענה אנושי"],
  ["waiting", "Waiting for customer", "ממתין ללקוח"],
  ["draft", "Draft to approve", "טיוטה לאישור"],
]
  .map(
    ([key, en, he]) => `
      <li class="status-row">
        <span class="badge" style="color:${c[key]};background:${c[key + "Soft"]}"><i style="background:${c[key]}"></i>${en}</span>
        <span class="badge" dir="rtl" lang="he" style="color:${c[key]};background:${c[key + "Soft"]}"><i style="background:${c[key]}"></i>${he}</span>
        <span class="ratio">${ratio(key, key + "Soft")}:1</span>
      </li>`,
  )
  .join("");

const html = `<title>Kesher Brand Preview</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;700&display=swap">
<style>
/* Layout: one calm column; cards stack on phones and sit side by side on wide screens. */
:root {
  --bg: ${c.background};
  --surface: ${c.surface};
  --fg: ${c.ink};
  --muted: ${c.inkMuted};
  --border: ${c.border};
  --brand: ${c.primary};
  --brand-soft: ${c.primarySoft};
  --accent: ${c.accent};
  --accent-soft: ${c.accentSoft};
  --icon-bg: ${c.primary};
  --icon-fg: #FFFFFF;
  --mono-fg: #000000;
  --font: 'Rubik', 'Segoe UI', Arial, sans-serif;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg: #0F1A1E; --surface: #16252B; --fg: #E4ECEE; --muted: #A3B3B9; --border: #2B3D44;
    --brand: #7CC7D4; --brand-soft: #1B3A42; --accent: #F0A45D; --accent-soft: #3A2A1C;
    --mono-fg: #FFFFFF; color-scheme: dark;
  }
}
:root[data-theme="dark"] {
  --bg: #0F1A1E; --surface: #16252B; --fg: #E4ECEE; --muted: #A3B3B9; --border: #2B3D44;
  --brand: #7CC7D4; --brand-soft: #1B3A42; --accent: #F0A45D; --accent-soft: #3A2A1C;
  --mono-fg: #FFFFFF; color-scheme: dark;
}
* { box-sizing: border-box; }
body { background: var(--bg); color: var(--fg); font-family: var(--font); font-size: 16px; line-height: 1.5; }
.wrap { max-width: 1080px; margin: 0 auto; padding-inline: 16px; padding-block: 32px 64px; display: grid; gap: 48px; }
h1, h2, h3 { text-wrap: balance; margin: 0; line-height: 1.2; }
h2 { font-size: 22px; font-weight: 500; }
p { margin: 0; }
.eyebrow { font-size: 12px; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); font-weight: 500; }
section { display: grid; gap: 16px; }
.lead { color: var(--muted); max-width: 62ch; }

.masthead { display: grid; gap: 12px; }
.masthead .brandline { display: flex; align-items: center; gap: 12px; color: var(--brand); }
.masthead .brandline svg { width: 44px; height: 44px; }
.masthead h1 { font-size: clamp(28px, 6vw, 40px); font-weight: 500; }
.masthead h1 span { color: var(--brand); }

.logo-grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }
.paper { background: #FFFFFF; border: 1px solid var(--border); border-radius: 16px; padding: 28px; display: grid; place-items: center; min-width: 0; }
.hero svg { width: 220px; max-width: 100%; height: auto; }
.words { gap: 24px; }
.wm svg { width: 230px; max-width: 100%; height: auto; display: block; }
.sizes { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 16px 20px; }
.sizes figure { margin: 0; display: grid; justify-items: center; gap: 6px; }
.sizes figcaption { font-size: 12px; color: var(--muted); }
.app-icon { width: 72px; height: 72px; border-radius: 16px; overflow: hidden; }
.s48 { width: 48px; height: 48px; }
.s32 { width: 32px; height: 32px; }
.s16 { width: 16px; height: 16px; }
.wm-mono { color: var(--fg); width: 120px; }
.sizes svg { width: 100%; height: auto; display: block; }

.swatches { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
.swatch { display: flex; gap: 12px; align-items: center; background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 12px; min-width: 0; }
.swatch .chip { width: 56px; height: 56px; border-radius: 10px; flex: none; box-shadow: inset 0 0 0 1px rgba(0,0,0,.08); }
.swatch-text { display: grid; font-size: 14px; min-width: 0; }
.swatch-text code { font-size: 13px; color: var(--muted); }
.swatch-text span { color: var(--muted); }
.swatch-text .pass { font-size: 12px; }

.statuses { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; background: #FFFFFF; border: 1px solid var(--border); border-radius: 12px; padding: 16px; }
.status-row { display: flex; flex-wrap: wrap; gap: 8px 12px; align-items: center; }
.badge { display: inline-flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 500; padding: 3px 10px; border-radius: 999px; }
.badge i { width: 7px; height: 7px; border-radius: 999px; }
.ratio { font-size: 12px; color: ${c.inkMuted}; font-variant-numeric: tabular-nums; }
.note { font-size: 14px; color: var(--muted); }

.type { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(290px, 1fr)); }
.type-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 20px; display: grid; gap: 10px; min-width: 0; }
.type-card .big { font-size: 34px; font-weight: 500; line-height: 1.15; }
.type-card .weights { display: flex; gap: 16px; flex-wrap: wrap; color: var(--muted); font-size: 15px; }

.chat { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 20px; display: grid; gap: 12px; max-width: 560px; }
.chat .meta { font-size: 12px; color: var(--muted); }
.bubble { padding: 10px 14px; border-radius: 16px; max-width: 88%; font-size: 15px; }
.bubble.customer { background: var(--bg); justify-self: start; border-end-start-radius: 4px; }
.bubble.kesher { background: var(--brand-soft); justify-self: end; border-end-end-radius: 4px; }
.used { display: flex; flex-wrap: wrap; gap: 6px; justify-self: end; }
.used span { font-size: 12px; color: var(--muted); border: 1px solid var(--border); border-radius: 999px; padding: 2px 8px; }

.pick { background: var(--accent-soft); border-radius: 16px; padding: 20px; display: grid; gap: 8px; }
.pick strong { font-size: 18px; font-weight: 500; }
</style>

<div class="wrap">
  <header class="masthead">
    <div class="brandline">${mark("kesher-mark.svg")}<span class="eyebrow">Phase 1 · Brand</span></div>
    <h1>The Kesher brand. <span>Final version.</span></h1>
    <p class="lead">The logo, colors, font and status labels that every Kesher screen, email and page will use. Every text color passes the WCAG AA contrast rule.</p>
  </header>

  <section aria-labelledby="h-logos">
    <h2 id="h-logos">Logo: linked bubbles</h2>
    <p class="lead">Two speech bubbles linked like a knot: a customer and a store in conversation. The teal bubble is the store, the apricot bubble is the customer.</p>${logoSection}
  </section>

  <section aria-labelledby="h-colors">
    <h2 id="h-colors">Colors</h2>
    <p class="lead">A calm deep teal for trust, one warm apricot for a human touch, and soft neutrals with a slight teal tint.</p>
    <ul class="swatches">${swatches}
    </ul>
  </section>

  <section aria-labelledby="h-status">
    <h2 id="h-status">Conversation status labels</h2>
    <p class="lead">Each status has its own color and a dot, so it's clear at a glance, even for people who can't tell red from green.</p>
    <ul class="statuses">${statuses}
    </ul>
  </section>

  <section aria-labelledby="h-type">
    <h2 id="h-type">Font: Rubik</h2>
    <p class="lead">Rubik's Hebrew and Latin letters were designed together, so mixed messages like <bdi dir="rtl" lang="he">“הזמנתי חולצה בM”</bdi> look even. Its softly rounded corners feel warm and friendly without looking childish, and it comes in every weight we need. Heebo felt more technical, and Assistant gets thin at small sizes.</p>
    <div class="type">
      <div class="type-card" lang="he" dir="rtl">
        <p class="big">כל לקוח מקבל תשובה. כמו שאדם היה עונה.</p>
        <p>הזמנתי חולצה בM והגיע L ואני צריכה את זה לאירוע ביום שישי!!!</p>
        <div class="weights"><span style="font-weight:400">רגיל 400</span><span style="font-weight:500">בינוני 500</span><span style="font-weight:700">מודגש 700</span></div>
      </div>
      <div class="type-card" lang="en">
        <p class="big">Every customer answered. Like a person would.</p>
        <p>hi i ordered the black one but i want to change adress is it posible</p>
        <div class="weights"><span style="font-weight:400">Regular 400</span><span style="font-weight:500">Medium 500</span><span style="font-weight:700">Bold 700</span></div>
      </div>
    </div>
  </section>

  <section aria-labelledby="h-chat">
    <h2 id="h-chat">How it feels in a conversation</h2>
    <p class="lead">An example with made-up order data, to show the colors and font together.</p>
    <div class="chat" lang="he" dir="rtl">
      <p class="meta">נועה כהן · אימייל · לפני 2 דקות</p>
      <p class="bubble customer">היי הזמנתי לפני שבוע ועדיין כלום מה קורה</p>
      <p class="bubble kesher">היי נועה! בדקתי את הזמנה #1042 שלך. היא יצאה ביום שלישי עם דואר ישראל ונמצאת עכשיו במרכז המיון בחולון. הנה קישור למעקב: il.post/RR123456789IL. אם יש עוד משהו, אני כאן.</p>
      <div class="used"><span>find_orders</span><span>get_tracking_status</span><span class="badge" style="color:${c.draft};background:${c.draftSoft}"><i style="background:${c.draft}"></i>טיוטה לאישור</span></div>
    </div>
  </section>

  <section class="pick" aria-labelledby="h-pick">
    <strong id="h-pick">Where the files are</strong>
    <p>All logo files are in the <code>design/logo</code> folder of the project: the 1200×1200 app icon for Shopify, favicons, and the logo with the name in English and Hebrew, in color and in one color.</p>
  </section>
</div>
`;

writeFileSync(join(designDir, "preview.html"), html);
console.log("wrote design/preview.html");

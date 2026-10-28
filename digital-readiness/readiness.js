"use strict";
// Digital readiness check: 16 quick questions in six areas, scored in the browser. Nothing is sent
// anywhere unless the person chooses to share their ticket (the link carries only the scores, the
// level and, if they typed one, their name).
(() => {
const $ = (s, r = document) => r.querySelector(s);
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Each area: questions with answers worth 0–3, and what to do next at each level.
const AREAS = [
  { id: "reach", name: "Found online", icon: "📣",
    qs: [
      { q: "How do new customers find you?", a: ["Word of mouth only", "A social media page or WhatsApp", "A Google Business Profile or website", "A website, Google profile and social media that we keep up to date"] },
      { q: "How quickly do you reply to a customer message or enquiry?", a: ["Within a few days, or we often miss them", "Usually the next day", "The same day", "Within an hour, on every channel"] },
      { q: "What email address do you use for work?", a: ["We don't use email", "A free address (Gmail, Yahoo…)", "An address on our own domain for some of us", "Everyone has an address on our own domain"] },
    ],
    next: ["Create a free Google Business Profile so people searching nearby find you, and answer every WhatsApp message the same day.", "Get email on your own domain (you@yourbusiness.com). It costs little and makes you look established.", "Keep your website and Google profile current: opening hours, prices and recent photos win customers."] },
  { id: "money", name: "Money and records", icon: "💰", individual: true,
    qs: [
      { q: "How do you keep track of sales, expenses and who owes you?", a: ["In our heads or a notebook", "In a spreadsheet, now and then", "In accounting software, mostly up to date", "In accounting software, reconciled every month"] },
      { q: "How can customers pay you?", a: ["Cash only", "Cash and bank transfer", "Mobile money as well", "Mobile money, card and payment links on our invoices"] },
      { q: "How do you send invoices and receipts?", a: ["Handwritten or not at all", "Typed in Word or Excel", "From accounting software", "From software, with ZRA-compliant (Smart Invoice) where we need it"] },
    ],
    next: ["Move your sales and expenses into simple accounting software. You'll know who owes you and be ready for ZRA.", "Accept mobile money and send invoices with a payment link, so customers can pay you the moment they get the invoice.", "Reconcile your accounts monthly and check whether ZRA Smart Invoice applies to you."] },
  { id: "work", name: "Ways of working", icon: "🗂️", individual: true,
    qs: [
      { q: "Where are your important files kept?", a: ["On one computer or phone", "On a few computers and flash drives", "Some in the cloud (OneDrive, Google Drive)", "In the cloud, organised and shared with the right people"] },
      { q: "How do you handle routine paperwork such as orders, forms and approvals?", a: ["On paper", "Mostly paper, some by email", "Mostly digital forms and email", "Digital, with clear steps everyone follows"] },
    ],
    next: ["Put your important files in OneDrive or Google Drive so they're not stuck on one device.", "Map one routine process (orders, leave, approvals) and move it to a simple digital form.", "Tidy your shared folders and agree one place for each kind of document."] },
  { id: "security", name: "Safety and backups", icon: "🛡️", individual: true,
    qs: [
      { q: "If a laptop or phone was lost tomorrow, what would happen to your records?", a: ["We'd lose them", "We'd lose some", "Most are backed up", "Everything is backed up automatically, and we've tested restoring it"] },
      { q: "How are your important accounts protected (email, bank, mobile money)?", a: ["The same simple password everywhere", "Different passwords, written down", "Strong passwords, and two-step sign-in on some", "A password manager, and two-step sign-in on all of them"] },
      { q: "Are your computers and phones kept up to date and protected?", a: ["No idea", "Sometimes", "Mostly, with antivirus", "Always: updates, antivirus and a screen lock on every device"] },
    ],
    next: ["Turn on automatic backup of your phone and laptop today, and two-step sign-in on your email and mobile money.", "Use a password manager and switch on two-step sign-in everywhere it's offered.", "Test a restore from your backup once a quarter. A backup you've never restored is a hope, not a plan."] },
  { id: "people", name: "People and support", icon: "🤝",
    qs: [
      { q: "Who looks after your IT when something breaks?", a: ["Nobody; we struggle through", "A friend or relative when they're free", "Someone in the team, on top of their job", "A dedicated person or an IT provider on a plan"] },
      { q: "How many people know how your key systems and accounts work?", a: ["Nobody really", "Only one person", "Two people", "It's written down, and several people can step in"] },
      { q: "How confident is your team with the digital tools you use?", a: ["Not confident", "A few people are", "Most are, with a little help", "Everyone is, and new staff get shown"] },
    ],
    next: ["Write down your key accounts, who has access, and how to reach them, and keep it somewhere safe.", "Make sure at least two people can manage your email, website and payment accounts.", "Give your team a short training session on the tools you rely on, and repeat it for new staff."] },
  { id: "growth", name: "Growth and data", icon: "📈", individual: true,
    qs: [
      { q: "Can customers order or book from you online?", a: ["No", "By WhatsApp or phone message", "Through a form, marketplace or booking link", "Through our own online shop or booking system"] },
      { q: "Do you use your sales and customer data to make decisions?", a: ["No", "Sometimes, by feel", "We look at monthly figures", "We track trends and act on them (stock, prices, markets)"] },
    ],
    next: ["Let customers order or book through WhatsApp Business with a catalogue, before investing in a website shop.", "Look at your sales by month and by product, and decide one thing to change based on them.", "Track a handful of numbers every month, such as best sellers, repeat customers and overdue invoices, and act on them."] },
];
const LEVELS = [
  { min: 80, name: "Digital leader", note: "You're well ahead of most businesses. Keep it safe, and keep improving.", party: "big" },
  { min: 60, name: "Growing digitally", note: "Strong foundations. A few focused steps will take you to the top level.", party: "small" },
  { min: 40, name: "Building up", note: "You've made a good start. The steps below will make the biggest difference.", party: "" },
  { min: 0, name: "Getting started", note: "Every business starts somewhere. Start with the first step below; it takes days, not months.", party: "" },
];
const levelOf = (n) => LEVELS.find((l) => n >= l.min);

const S = { who: "", name: "", step: 0, answers: {} };
const questions = () => AREAS.filter((a) => S.who !== "individual" || a.individual).flatMap((a) => a.qs.map((q, i) => ({ area: a, i, key: a.id + i, ...q })));

function scores() {
  const out = {};
  for (const a of AREAS) {
    if (S.who === "individual" && !a.individual) continue;
    const got = a.qs.map((_, i) => S.answers[a.id + i]).filter((v) => v !== undefined);
    out[a.id] = got.length ? Math.round((got.reduce((s, v) => s + v, 0) / (3 * a.qs.length)) * 100) : 0;
  }
  const vals = Object.values(out);
  return { areas: out, overall: Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) };
}

// ---------- screens ----------
const root = $("#rd-app");
function start() {
  root.innerHTML = `<section class="rd-card">
    <h2>Who is taking the test?</h2>
    <div class="rd-choices" role="radiogroup" aria-label="Who is taking the test">
      ${[["individual", "Individual or freelancer", "Just me"], ["small", "Small business", "2 to 20 people"], ["company", "Company or organisation", "More than 20 people, or an NGO"]].map(([v, l, h]) =>
        `<label class="rd-choice"><input type="radio" name="who" value="${v}" ${S.who === v ? "checked" : ""}><span><b>${l}</b><small>${h}</small></span></label>`).join("")}
    </div>
    <div class="rd-field"><label for="rd-name">Name for your scorecard <small>(optional)</small></label><input id="rd-name" maxlength="60" value="${esc(S.name)}" placeholder="e.g. Chanda Hardware" autocomplete="organization"></div>
    <p class="rd-hint">About 3 minutes. Your answers stay on your device; nothing is sent to us unless you choose to share.</p>
    <button class="rd-btn primary" id="rd-go">Start the test</button>
  </section>`;
  $("#rd-go").onclick = () => {
    const w = document.querySelector('input[name="who"]:checked');
    if (!w) { document.querySelector(".rd-choices").classList.add("rd-shake"); setTimeout(() => document.querySelector(".rd-choices")?.classList.remove("rd-shake"), 500); return; }
    S.who = w.value; S.name = $("#rd-name").value.trim(); S.step = 0; S.answers = {};
    ask();
  };
}
function ask() {
  const qs = questions(), q = qs[S.step], n = qs.length;
  root.innerHTML = `<section class="rd-card" aria-live="polite">
    <div class="rd-progress" role="progressbar" aria-label="Progress" aria-valuenow="${S.step}" aria-valuemin="0" aria-valuemax="${n}"><i style="width:${(S.step / n) * 100}%"></i></div>
    <div class="rd-meta"><span>${q.area.icon} ${esc(q.area.name)}</span><span>Question ${S.step + 1} of ${n}</span></div>
    <h2 id="rd-q">${esc(q.q)}</h2>
    <div class="rd-answers" role="radiogroup" aria-labelledby="rd-q">
      ${q.a.map((t, v) => `<button class="rd-answer${S.answers[q.key] === v ? " on" : ""}" role="radio" aria-checked="${S.answers[q.key] === v}" data-v="${v}">${esc(t)}</button>`).join("")}
    </div>
    <div class="rd-nav">${S.step ? `<button class="rd-btn ghost" id="rd-back">← Back</button>` : `<span></span>`}<span class="rd-hint">Pick the answer closest to today, not where you'd like to be.</span></div>
  </section>`;
  root.querySelectorAll(".rd-answer").forEach((b) => (b.onclick = () => {
    S.answers[q.key] = +b.dataset.v;
    b.classList.add("on");
    setTimeout(() => { if (S.step < n - 1) { S.step++; ask(); } else result(); }, 220);
  }));
  const back = $("#rd-back"); if (back) back.onclick = () => { S.step--; ask(); };
  root.querySelector(".rd-answer.on, .rd-answer")?.focus({ preventScroll: true });
}

// What to work on: the weakest areas first, with the step that fits their score.
function nextSteps(areas) {
  return Object.entries(areas).sort((a, b) => a[1] - b[1]).slice(0, 3).filter(([, v]) => v < 90).map(([id, v]) => {
    const a = AREAS.find((x) => x.id === id);
    return { area: a, tip: a.next[v < 40 ? 0 : v < 70 ? 1 : 2], score: v };
  });
}

function ticketHtml(r, name, who, date, no) {
  const lv = levelOf(r.overall);
  const deg = Math.round(r.overall * 3.6);
  return `<div class="rd-ticket" id="rd-ticket">
    <div class="rd-stub">
      <span class="rd-small">Digital readiness</span>
      <div class="rd-dial" style="--deg:${deg}deg"><div><b>${r.overall}</b><small>/ 100</small></div></div>
      <span class="rd-level">${esc(lv.name)}</span>
    </div>
    <div class="rd-main">
      <div class="rd-head"><div><span class="rd-small">Scorecard for</span><h3>${esc(name || "Your business")}</h3></div><span class="rd-no">${esc(no)}</span></div>
      <div class="rd-bars">${Object.entries(r.areas).map(([id, v]) => { const a = AREAS.find((x) => x.id === id); return `<div class="rd-bar"><span>${a.icon} ${esc(a.name)}</span><span class="rd-track"><i class="${v >= 70 ? "hi" : v >= 40 ? "mid" : "lo"}" style="width:${Math.max(v, 3)}%"></i></span><b>${v}</b></div>`; }).join("")}</div>
      <div class="rd-foot"><span>${esc(date)} · ${esc({ individual: "Individual", small: "Small business", company: "Company" }[who] || "")}</span><span>mwazisi.com/digital-readiness</span></div>
    </div>
  </div>`;
}

function result(shared) {
  const r = shared ? shared.r : scores();
  const name = shared ? shared.name : S.name, who = shared ? shared.who : S.who;
  const date = shared ? shared.date : new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const no = shared ? shared.no : "MZ-" + String(Math.floor(Date.now() / 1000) % 1000000).padStart(6, "0");
  const lv = levelOf(r.overall), steps = nextSteps(r.areas);
  const strong = Object.entries(r.areas).filter(([, v]) => v >= 70).map(([id]) => AREAS.find((a) => a.id === id).name);
  const link = location.origin + location.pathname + "#t=" + encodeShare({ r, name, who, date, no });
  const waText = `${name ? name + " scored" : "I scored"} ${r.overall}/100 (${lv.name}) on the Mwazisi digital readiness test. See the scorecard: ${link}`;
  const askText = `Hello Mwazisi, ${name ? "we're " + name + " and we" : "I"} scored ${r.overall}/100 (${lv.name}) on your digital readiness test. ${steps.length ? "I'd like help with " + steps.map((s) => s.area.name.toLowerCase()).join(", ") + "." : ""}`;
  root.innerHTML = `<section class="rd-result">
    <div class="rd-title"><span class="eyebrow">${shared ? "A shared scorecard" : "Your result"}</span><h2>${esc(lv.name)}</h2><p>${esc(lv.note)}</p></div>
    ${ticketHtml(r, name, who, date, no)}
    ${strong.length ? `<p class="rd-strong">✅ Strong: ${strong.map(esc).join(", ")}</p>` : ""}
    ${steps.length ? `<div class="rd-card"><h3>${shared ? "Where to work next" : "Your next steps"}</h3><ol class="rd-steps">${steps.map((s) => `<li><b>${s.area.icon} ${esc(s.area.name)} <small>${s.score}/100</small></b><span>${esc(s.tip)}</span></li>`).join("")}</ol></div>` : ""}
    <div class="rd-actions">
      ${shared ? `<a class="rd-btn primary" href="${location.pathname}">Take the test yourself</a>`
        : `<button class="rd-btn primary" id="rd-png">Download scorecard</button><a class="rd-btn" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(waText)}">Share on WhatsApp</a><button class="rd-btn" id="rd-copy">Copy link</button>`}
      <a class="rd-btn ${shared ? "" : "accent"}" target="_blank" rel="noopener" href="https://wa.me/260765628704?text=${encodeURIComponent(askText)}">Talk to Mwazisi (first call free)</a>
      ${shared ? "" : `<button class="rd-btn ghost" id="rd-again">Retake the test</button>`}
    </div>
    <p class="rd-hint">This is a quick self-assessment, not an audit. For a full assessment of your systems and data protection duties, talk to us.</p>
  </section>`;
  window.scrollTo({ top: root.getBoundingClientRect().top + window.scrollY - 20, behavior: "smooth" });
  if (!shared) {
    $("#rd-png").onclick = () => downloadPng(r, name, who, date, no);
    $("#rd-copy").onclick = async () => { try { await navigator.clipboard.writeText(link); $("#rd-copy").textContent = "Link copied ✓"; } catch (_) { prompt("Copy this link:", link); } };
    $("#rd-again").onclick = () => { history.replaceState(null, "", location.pathname); start(); };
  }
  if (lv.party) setTimeout(() => celebrate(lv.party), shared ? 400 : 250);
}

// ---------- shareable link: scores only, nothing else ----------
function encodeShare(d) {
  const ids = AREAS.map((a) => (d.r.areas[a.id] === undefined ? "-" : d.r.areas[a.id])).join(".");
  const raw = [ids, d.r.overall, d.who, d.date, d.no, d.name].map((x) => String(x).replace(/~/g, "")).join("~");
  return btoa(unescape(encodeURIComponent(raw))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function decodeShare(s) {
  try {
    const raw = decodeURIComponent(escape(atob(s.replace(/-/g, "+").replace(/_/g, "/"))));
    const [ids, overall, who, date, no, name] = raw.split("~");
    const vals = ids.split(".");
    const areas = {};
    AREAS.forEach((a, i) => { if (vals[i] !== "-" && vals[i] !== undefined) areas[a.id] = Math.max(0, Math.min(100, +vals[i] || 0)); });
    if (!Object.keys(areas).length) return null;
    return { r: { areas, overall: Math.max(0, Math.min(100, +overall || 0)) }, who: String(who || "").slice(0, 20), date: String(date || "").slice(0, 20), no: String(no || "").slice(0, 12), name: String(name || "").slice(0, 60) };
  } catch (_) { return null; }
}

// ---------- the scorecard as a picture (drawn on a canvas, no outside services) ----------
function downloadPng(r, name, who, date, no) {
  const W = 1200, H = 630, c = document.createElement("canvas"); c.width = W; c.height = H;
  const x = c.getContext("2d");
  const lv = levelOf(r.overall);
  const font = (w, s, f) => `${w} ${s}px ${f === "mono" ? "'IBM Plex Mono', monospace" : f === "display" ? "'Bricolage Grotesque', sans-serif" : "'IBM Plex Sans', sans-serif"}`;
  x.fillStyle = "#14181F"; x.fillRect(0, 0, W, H);
  // ticket body with notches
  const tx = 40, ty = 40, tw = W - 80, th = H - 80, stubW = 360, rad = 26;
  x.fillStyle = "#FFFFFF"; roundRect(x, tx, ty, tw, th, 22); x.fill();
  x.fillStyle = "#E87722"; roundRect(x, tx, ty, stubW, th, 22, [true, false, false, true]); x.fill();
  // the two notches where a ticket tears, in the background colour
  x.fillStyle = "#14181F"; for (const cy of [ty, ty + th]) { x.beginPath(); x.arc(tx + stubW, cy, rad, 0, Math.PI * 2); x.fill(); }
  x.strokeStyle = "rgba(20,24,31,.25)"; x.setLineDash([10, 10]); x.lineWidth = 3;
  x.beginPath(); x.moveTo(tx + stubW, ty + rad + 6); x.lineTo(tx + stubW, ty + th - rad - 6); x.stroke(); x.setLineDash([]);
  // stub: dial
  const cx = tx + stubW / 2, cy = ty + 270;
  x.fillStyle = "#1A0E03"; x.font = font(500, 18, "mono"); x.textAlign = "center"; x.fillText("DIGITAL READINESS", cx, ty + 70);
  x.lineWidth = 22; x.strokeStyle = "rgba(255,255,255,.35)"; x.beginPath(); x.arc(cx, cy, 110, 0, Math.PI * 2); x.stroke();
  x.strokeStyle = "#FFFFFF"; x.lineCap = "round"; x.beginPath(); x.arc(cx, cy, 110, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (r.overall / 100)); x.stroke(); x.lineCap = "butt";
  x.fillStyle = "#1A0E03"; x.font = font(800, 84, "display"); x.fillText(String(r.overall), cx, cy + 22);
  x.font = font(500, 20, "mono"); x.fillText("/ 100", cx, cy + 56);
  x.font = font(700, 30, "display"); x.fillText(lv.name, cx, ty + th - 60);
  // main
  const mx = tx + stubW + 50;
  x.textAlign = "left"; x.fillStyle = "#586070"; x.font = font(500, 16, "mono"); x.fillText("SCORECARD FOR", mx, ty + 66);
  x.fillStyle = "#14181F"; x.font = font(800, 40, "display"); x.fillText(fit(x, name || "Your business", tw - stubW - 220), mx, ty + 112);
  x.fillStyle = "#B24F0B"; x.font = font(500, 18, "mono"); x.textAlign = "right"; x.fillText(no, tx + tw - 40, ty + 66); x.textAlign = "left";
  const entries = Object.entries(r.areas); let by = ty + 168;
  for (const [id, v] of entries) {
    const a = AREAS.find((q) => q.id === id);
    x.fillStyle = "#14181F"; x.font = font(500, 20); x.fillText(a.name, mx, by + 6);
    const bx = mx + 240, bw = tw - stubW - 360;
    x.fillStyle = "#EEF0F2"; roundRect(x, bx, by - 10, bw, 18, 9); x.fill();
    x.fillStyle = v >= 70 ? "#1F8A55" : v >= 40 ? "#E87722" : "#C2410C"; roundRect(x, bx, by - 10, Math.max(bw * v / 100, 18), 18, 9); x.fill();
    x.fillStyle = "#14181F"; x.font = font(500, 18, "mono"); x.textAlign = "right"; x.fillText(String(v), tx + tw - 40, by + 6); x.textAlign = "left";
    by += 52;
  }
  x.fillStyle = "#586070"; x.font = font(400, 16, "mono");
  x.fillText(`${date} · mwazisi.com/digital-readiness`, mx, ty + th - 40);
  c.toBlob((b) => { const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = `digital-readiness-${(name || "scorecard").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }, "image/png");
}
function roundRect(x, X, Y, w, h, r, corners) {
  const [tl, tr, br, bl] = corners || [true, true, true, true];
  x.beginPath(); x.moveTo(X + (tl ? r : 0), Y);
  x.lineTo(X + w - (tr ? r : 0), Y); tr ? x.arcTo(X + w, Y, X + w, Y + r, r) : x.lineTo(X + w, Y);
  x.lineTo(X + w, Y + h - (br ? r : 0)); br ? x.arcTo(X + w, Y + h, X + w - r, Y + h, r) : x.lineTo(X + w, Y + h);
  x.lineTo(X + (bl ? r : 0), Y + h); bl ? x.arcTo(X, Y + h, X, Y + h - r, r) : x.lineTo(X, Y + h);
  x.lineTo(X, Y + (tl ? r : 0)); tl ? x.arcTo(X, Y, X + r, Y, r) : x.lineTo(X, Y);
  x.closePath();
}
function fit(x, t, w) { while (x.measureText(t).width > w && t.length > 4) t = t.slice(0, -2) + "…"; return t; }

// ---------- confetti and balloons ----------
function celebrate(kind) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const c = document.createElement("canvas"); c.className = "rd-party"; c.setAttribute("aria-hidden", "true");
  document.body.appendChild(c);
  const x = c.getContext("2d"), dpr = Math.min(2, devicePixelRatio || 1);
  const size = () => { c.width = innerWidth * dpr; c.height = innerHeight * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0); };
  size(); addEventListener("resize", size);
  const colours = ["#E87722", "#F59A52", "#1F8A55", "#2563EB", "#FACC15", "#EC4899", "#FFFFFF"];
  const bits = [], balloons = [];
  const N = kind === "big" ? 220 : 120;
  for (let i = 0; i < N; i++) bits.push({ x: innerWidth / 2 + (Math.random() - 0.5) * 200, y: innerHeight * 0.35, vx: (Math.random() - 0.5) * 14, vy: -Math.random() * 13 - 4, r: Math.random() * 6 + 4, a: Math.random() * 6, va: (Math.random() - 0.5) * 0.3, c: colours[i % colours.length] });
  if (kind === "big") for (let i = 0; i < 9; i++) balloons.push({ x: (innerWidth / 10) * (i + 1) + (Math.random() - 0.5) * 40, y: innerHeight + 60 + Math.random() * 200, s: 0.9 + Math.random() * 0.6, sp: 1.6 + Math.random() * 1.4, w: Math.random() * 6, c: colours[i % 6] });
  const t0 = performance.now();
  (function frame(t) {
    const dt = t - t0;
    x.clearRect(0, 0, innerWidth, innerHeight);
    for (const b of bits) {
      b.vy += 0.32; b.vx *= 0.99; b.x += b.vx; b.y += b.vy; b.a += b.va;
      x.save(); x.translate(b.x, b.y); x.rotate(b.a); x.fillStyle = b.c; x.fillRect(-b.r / 2, -b.r / 4, b.r, b.r / 2); x.restore();
    }
    for (const b of balloons) {
      b.y -= b.sp; const sx = b.x + Math.sin((dt / 600) + b.w) * 14;
      x.strokeStyle = "rgba(120,120,120,.6)"; x.lineWidth = 1.5; x.beginPath(); x.moveTo(sx, b.y + 38 * b.s); x.quadraticCurveTo(sx + 8, b.y + 70 * b.s, sx - 4, b.y + 100 * b.s); x.stroke();
      x.fillStyle = b.c; x.beginPath(); x.ellipse(sx, b.y, 26 * b.s, 34 * b.s, 0, 0, Math.PI * 2); x.fill();
      x.fillStyle = "rgba(255,255,255,.35)"; x.beginPath(); x.ellipse(sx - 9 * b.s, b.y - 12 * b.s, 6 * b.s, 10 * b.s, -0.4, 0, Math.PI * 2); x.fill();
      x.fillStyle = b.c; x.beginPath(); x.moveTo(sx - 5, b.y + 34 * b.s); x.lineTo(sx + 5, b.y + 34 * b.s); x.lineTo(sx, b.y + 40 * b.s); x.fill();
    }
    if (dt < (kind === "big" ? 6500 : 3500)) requestAnimationFrame(frame); else { c.remove(); removeEventListener("resize", size); }
  })(t0);
}

// ---------- start ----------
const shared = (location.hash.match(/^#t=([A-Za-z0-9_-]+)$/) || [])[1];
const data = shared && decodeShare(shared);
if (data) result(data); else start();
})();

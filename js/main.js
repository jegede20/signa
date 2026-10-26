/* ============================================================
   SIGNA — js/main.js · landing page behaviour
   Theme, sticky-nav blur, scroll reveals, live mini-widgets
   (demo player, score ring count-up, calendar, tip rotator).
   ============================================================ */
import { initTheme, THEME_TOGGLE_HTML } from "./core/theme.js";
import { createDemoPlayer, renderHandSVG } from "./avatar/demo.js";
import { siggySVG } from "./avatar/siggy.js";
import { getSign, ALPHABET } from "../data/signs.js";

document.querySelectorAll(".theme-toggle-slot").forEach((s) => { s.innerHTML = THEME_TOGGLE_HTML; });
initTheme();

/* Sticky nav blur on scroll */
const nav = document.querySelector("[data-nav]");
const onScroll = () => nav?.classList.toggle("is-scrolled", window.scrollY > 8);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

/* Scroll reveals */
const io = new IntersectionObserver((entries) => {
  for (const e of entries) if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); }
}, { threshold: 0.12 });
document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

/* Hero: looping avatar demo for "L" + Siggy */
const heroDemo = document.querySelector("[data-hero-demo]");
if (heroDemo) createDemoPlayer(heroDemo, getSign("L"), { interval: 1150 });
const heroSiggy = document.querySelector("[data-hero-siggy]");
if (heroSiggy) heroSiggy.innerHTML = siggySVG("happy");
const bentoSiggy = document.querySelector("[data-bento-siggy]");
if (bentoSiggy) { bentoSiggy.innerHTML = siggySVG("encouraging"); bentoSiggy.classList.add("hand-wave"); }
const bentoHand = document.querySelector("[data-bento-hand]");
if (bentoHand) bentoHand.innerHTML = renderHandSVG(getSign("B"), { stage: 2, annotate: false });

/* Hero score ring count-up to 92% */
const ring = document.querySelector("[data-hero-ring]");
const scoreEl = document.querySelector("[data-hero-score]");
if (ring && scoreEl) {
  const C = 339.3, target = 92, t0 = performance.now();
  (function tick(now) {
    const t = Math.min(1, (now - t0) / 1400);
    const eased = 1 - Math.pow(1 - t, 3);
    const v = Math.round(target * eased);
    ring.style.strokeDashoffset = String(C * (1 - v / 100));
    scoreEl.textContent = `${v}%`;
    if (t < 1) requestAnimationFrame(tick);
  })(t0);
}

/* A–Z strip (first module mastered, next few learning — illustrative) */
const strip = document.querySelector("[data-alpha-strip]");
if (strip) {
  strip.innerHTML = ALPHABET.map((s, i) =>
    `<span class="${i < 5 ? "done" : i < 9 ? "doing" : ""}">${s.id}</span>`).join("");
}

/* Mini streak calendar: current month, recent days filled */
const cal = document.querySelector("[data-bento-calendar]");
if (cal) {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  let cells = "";
  for (let i = 0; i < first.getDay(); i++) cells += `<span class="calendar__day is-empty"></span>`;
  for (let d = 1; d <= days; d++) {
    const isToday = d === now.getDate();
    const filled = d < now.getDate() && d >= now.getDate() - 5;
    const future = d > now.getDate();
    cells += `<span class="calendar__day${filled || isToday ? " is-filled" : ""}${isToday ? " is-today" : ""}${future ? " is-future" : ""}">${d}</span>`;
  }
  cal.innerHTML = `<div class="calendar"><div class="calendar__head">${["S", "M", "T", "W", "T", "F", "S"].map((d) => `<span>${d}</span>`).join("")}</div><div class="calendar__grid">${cells}</div></div>`;
}

/* Mastery bars (illustrative first-module progress) */
const bars = document.querySelector("[data-mastery-bars]");
if (bars) {
  const demo = [["A", 98], ["B", 94], ["C", 87], ["L", 76], ["Y", 62]];
  bars.innerHTML = demo.map(([id, v]) => `
    <div class="meter"><span style="font-family:var(--font-mono);font-weight:700">“${id}”</span>
      <span class="meter__track"><span class="meter__fill" style="display:block;width:${v}%;background:${v >= 90 ? "var(--success)" : v >= 70 ? "var(--accent-2)" : "var(--warning)"}"></span></span>
      <span class="meter__val">${v}%</span></div>`).join("");
}

/* Rotating sample tips */
const tipEl = document.querySelector("[data-rotating-tip]");
if (tipEl) {
  const tips = [
    "Curl your index finger down into your palm.",
    "Touch your fingertips to your thumb tip.",
    "Press your raised fingers together — no gaps.",
    "Rotate your hand so the fingers point down.",
    "Perfect — hold that shape!",
  ];
  let i = 0;
  setInterval(() => {
    i = (i + 1) % tips.length;
    tipEl.parentElement.classList.remove("tip-enter"); void tipEl.offsetWidth;
    tipEl.textContent = tips[i];
    tipEl.parentElement.classList.add("tip-enter");
    tipEl.parentElement.classList.toggle("is-good", tips[i].startsWith("Perfect"));
  }, 2600);
}

const yearEl = document.querySelector("[data-year]");
if (yearEl) yearEl.textContent = String(new Date().getFullYear());

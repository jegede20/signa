/* ============================================================
   SIGNA — js/app.js · app shell boot (see spec §15)
   1 theme → 2 IndexedDB progress → 3 router → 4 chrome wiring
   Camera + MediaPipe start lazily inside practice sessions.
   ============================================================ */
import { store, $, $$ } from "./core/store.js";
import { initTheme, THEME_TOGGLE_HTML } from "./core/theme.js";
import { initRouter } from "./core/router.js";
import { icon } from "./core/icons.js";
import { ALPHABET, PHRASES } from "../data/signs.js";
import { STATUS_META } from "./progress/mastery.js";
import { computeStats } from "./progress/stats.js";
import { practicedToday, streakAtRisk } from "./progress/streak.js";
import { siggySVG, registerSiggyTargets, setSiggy } from "./avatar/siggy.js";
import { calendarHTML, bindDayClicks, renderProgress } from "./screens/progress.js";
import { renderHome } from "./screens/home.js";
import { renderLearn } from "./screens/learn.js";
import { renderLesson } from "./screens/lesson.js";
import { renderQuiz } from "./screens/quiz.js";
import { renderPractice } from "./screens/practice.js";
import { renderLibrary, renderSignDetail } from "./screens/library.js";
import { renderSettings } from "./screens/settings.js";

const NAV_ALIAS = { lesson: "learn", quiz: "learn", sign: "library" };

function paintInitialSiggy() {
  const defs = [
    { el: $("[data-siggy-art-panel]"), bubble: $("[data-siggy-bubble-panel]") },
    { el: $("[data-siggy-art-bubble]"), bubble: $("[data-siggy-bubble-msg]") },
    { el: $("[data-siggy-art-tab]"), bubble: null },
  ];
  for (const d of defs) {
    if (d.el) { d.el.innerHTML = siggySVG("neutral"); d.el.dataset.mood = "neutral"; }
  }
  registerSiggyTargets(defs.map((d) => ({ art: d.el, bubble: d.bubble })).filter((d) => d.art));
}

function signRow(sign) {
  const sp = store.signProgress(sign.id);
  return `<button class="list-row" data-side-sign="${sign.id}">
    <span class="status-dot ${STATUS_META[sp.status].dot}"></span>
    <span class="glyph">${sign.name}</span>
    <span class="score">${sp.attempts ? `${sp.best_score}%` : ""}</span>
  </button>`;
}

function updateChrome() {
  if (!store.ready) return;
  const s = computeStats();

  $("[data-streak-num]").textContent = String(s.streak);
  $("[data-sidebar-signs]").innerHTML = ALPHABET.map(signRow).join("");
  $("[data-sidebar-phrases]").innerHTML = PHRASES.map(signRow).join("");
  $$("[data-side-sign]").forEach((b) => b.addEventListener("click", () => { location.hash = `#/sign/${b.dataset.sideSign}`; }));

  const now = new Date();
  $("[data-sidebar-streak]").innerHTML = `
    <div class="streak-head" style="margin-bottom:12px">
      <span class="streak-flame" style="width:38px;height:38px">${icon("flame")}</span>
      <div><strong style="font-size:15px">${s.streak} Day Streak</strong>
      <div class="text-small text-muted">${practicedToday() ? "Today counted" : streakAtRisk() ? "Ends tonight — practice!" : `Best: ${s.longestStreak} days`}</div></div>
    </div>
    ${calendarHTML(now.getFullYear(), now.getMonth())}`;
  bindDayClicks($("[data-sidebar-streak]"));

  const m = $("[data-siggy-mastered]"); if (m) m.textContent = `${s.mastered}/${s.totalSigns}`;
  const a = $("[data-siggy-avg]"); if (a) a.textContent = `${s.avgBest}%`;

  $("#app-shell")?.classList.toggle("no-siggy", store.settings.showSiggy === false);
}

function markActiveNav(routeName) {
  const active = NAV_ALIAS[routeName] || routeName;
  $$("[data-nav]").forEach((a) => a.classList.toggle("is-active", a.dataset.nav === active));
}

async function boot() {
  // 1 — theme (+ toggle in topbar)
  document.querySelectorAll(".theme-toggle-slot").forEach((s) => { s.innerHTML = THEME_TOGGLE_HTML; });
  initTheme();
  paintInitialSiggy();

  // Floating Siggy bubble interactions
  const bubble = $("[data-siggy-bubble]");
  const toggleBubble = () => bubble?.classList.toggle("is-open");
  $("[data-siggy-bubble-btn]")?.addEventListener("click", toggleBubble);
  $("[data-siggy-tab]")?.addEventListener("click", toggleBubble);

  // 2 — load progress from IndexedDB
  await store.loadAll();
  updateChrome();
  store.subscribe(() => updateChrome());

  // 3 — router + first screen
  initRouter($("#screen"), {
    home: renderHome,
    learn: renderLearn,
    lesson: renderLesson,
    quiz: renderQuiz,
    practice: renderPractice,
    library: renderLibrary,
    sign: renderSignDetail,
    progress: renderProgress,
    settings: renderSettings,
  }, (name) => {
    markActiveNav(name);
    bubble?.classList.remove("is-open");
  });

  if (streakAtRisk()) setSiggy("thinking", "Your streak ends tonight — one quick sign saves it.");
}

boot().catch((err) => {
  console.error("Boot failed:", err);
  const screen = $("#screen");
  if (screen) screen.innerHTML = `<div class="card empty-state"><h3>Signa could not start.</h3><p class="text-small">Your browser may be blocking local storage. Try a regular (non-private) window, then reload.</p><button class="btn btn-primary" onclick="location.reload()">Reload</button></div>`;
});

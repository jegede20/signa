/* ============================================================
   SIGNA — screens/practice.js · free practice
   Picker (filters, random, drill-weakest) + practice canvas.
   ============================================================ */
import { store, $ } from "../core/store.js";
import { icon, starsHTML } from "../core/icons.js";
import { navigate } from "../core/router.js";
import { SIGNS, getSign } from "../../data/signs.js";
import { isModuleUnlocked } from "../../data/curriculum.js";
import { weakestSigns } from "../progress/stats.js";
import { recordAttempt, starsFor, STATUS_META, confettiBurst } from "../progress/mastery.js";
import { createPracticeSession, handPreview } from "./session.js";
import { setSiggy, celebrateSiggy } from "../avatar/siggy.js";
import { toast } from "../core/ui.js";

const FILTERS = [
  { id: "all", label: "All Signs" },
  { id: "alphabet", label: "Alphabet" },
  { id: "phrase", label: "Phrases" },
  { id: "mastered", label: "Mastered" },
  { id: "learning", label: "Learning" },
  { id: "new", label: "New" },
];

/* Drill queue survives between the picker and the canvas. */
let drillQueue = [];

export function phrasesUnlocked() {
  return isModuleUnlocked(5, store.progress.modules);
}

function isLocked(sign) {
  return sign.type === "phrase" && !phrasesUnlocked();
}

export function renderPractice(mount, signId) {
  if (signId && getSign(signId)) return renderPracticeCanvas(mount, getSign(signId));
  return renderPicker(mount);
}

function renderPicker(mount) {
  let filter = "all";
  const weak = weakestSigns(5);

  mount.innerHTML = `<div class="screen-enter" style="display:grid;gap:20px">
    <header>
      <h1>Free Practice</h1>
      <p class="text-body text-secondary" style="margin-top:6px">No lesson flow, no pressure — pick a sign and repeat it until it sticks.</p>
    </header>

    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px">
      <button class="card card-hover entry-card" data-random style="text-align:left">
        <span class="entry-card__icon" style="background:var(--accent-soft);color:var(--accent)">${icon("shuffle")}</span>
        <span><strong class="text-h3" style="display:block">Random Sign</strong><span class="text-small text-secondary">A surprise sign from your unlocked set.</span></span>${icon("arrowRight")}
      </button>
      <div class="card" style="display:grid;gap:10px">
        <div class="entry-card" style="padding:0">
          <span class="entry-card__icon" style="background:var(--warning-soft);color:var(--warning)">${icon("dumbbell")}</span>
          <span><strong class="text-h3" style="display:block">Drill Weakest Signs</strong><span class="text-small text-secondary">Auto-picked from your lowest scores.</span></span>
        </div>
        <div class="sign-chips">${weak.map((s) => { const sp = store.signProgress(s.id); return `<span class="sign-chip">${s.name} <span class="text-muted">${sp.attempts ? `${sp.best_score}%` : "new"}</span></span>`; }).join("") || '<span class="text-small text-muted">Everything mastered — elite status.</span>'}</div>
        <button class="btn btn-teal btn-sm" data-drill ${weak.length ? "" : "disabled"}>${icon("play")} Start drill (${weak.length})</button>
      </div>
    </div>

    <div class="tabs" role="tablist" aria-label="Filter signs">
      ${FILTERS.map((f) => `<button class="chip${f.id === filter ? " is-active" : ""}" data-filter="${f.id}" role="tab">${f.label}</button>`).join("")}
    </div>
    <div class="sign-grid" data-grid></div>
    ${!phrasesUnlocked() ? `<p class="text-small text-muted" style="display:flex;gap:8px;align-items:center">${icon("lock")} Phrase signs unlock with Module 5 — finish the alphabet modules to open them.</p>` : ""}
  </div>`;

  const grid = $("[data-grid]", mount);
  function drawGrid() {
    const list = SIGNS.filter((s) => {
      const sp = store.signProgress(s.id);
      if (filter === "all") return true;
      if (filter === "alphabet" || filter === "phrase") return s.type === filter;
      return sp.status === filter;
    });
    grid.innerHTML = list.length ? list.map((s) => {
      const sp = store.signProgress(s.id);
      const locked = isLocked(s);
      return `<button class="sign-tile${locked ? " is-locked" : ""}" data-sign="${s.id}" ${locked ? "disabled" : ""} title="${locked ? "Unlocks in Module 5" : `Practice ${s.name}`}">
        ${handPreview(s)}
        <span class="sign-tile__glyph" style="font-size:${s.name.length > 1 ? 17 : 26}px">${s.name}</span>
        <span class="sign-tile__meta">${locked ? `${icon("lock")} Module 5` : `<span class="status-dot ${STATUS_META[sp.status].dot}"></span>${sp.attempts ? `${sp.best_score}%` : "New"}`}</span>
      </button>`;
    }).join("") : `<div class="empty-state" style="grid-column:1/-1">${icon("search")}<p>No signs in this bucket yet.</p></div>`;
    grid.querySelectorAll("[data-sign]").forEach((b) => b.onclick = () => navigate(`#/practice/${b.dataset.sign}`));
  }
  drawGrid();

  mount.querySelectorAll("[data-filter]").forEach((b) => b.onclick = () => {
    filter = b.dataset.filter;
    mount.querySelectorAll("[data-filter]").forEach((x) => x.classList.toggle("is-active", x === b));
    drawGrid();
  });
  $("[data-random]", mount).onclick = () => {
    const pool = SIGNS.filter((s) => !isLocked(s));
    const pick = pool[Math.floor(Math.random() * pool.length)];
    toast(`Random sign: “${pick.name}” — good luck!`, { iconName: "shuffle" });
    navigate(`#/practice/${pick.id}`);
  };
  $("[data-drill]", mount).onclick = () => {
    drillQueue = weak.map((s) => s.id);
    navigate(`#/practice/${drillQueue[0]}`);
  };
  setSiggy("encouraging", weak.length ? `Your weakest right now: ${weak.slice(0, 3).map((s) => `“${s.name}”`).join(", ")}. Drill them!` : "All mastered — practice keeps them sharp.");
}

function renderPracticeCanvas(mount, sign) {
  if (isLocked(sign)) { navigate("#/practice"); return; }
  const sp0 = store.signProgress(sign.id);
  const inDrill = drillQueue.includes(sign.id);
  const drillNext = inDrill ? drillQueue[drillQueue.indexOf(sign.id) + 1] : null;

  mount.innerHTML = `<div class="screen-enter" style="display:grid;gap:18px">
    <header style="display:flex;align-items:flex-start;justify-content:space-between;gap:14px;flex-wrap:wrap">
      <div>
        <span class="text-label">${inDrill ? `Weakest-signs drill · ${drillQueue.indexOf(sign.id) + 1} of ${drillQueue.length}` : "Free Practice"}</span>
        <h1 style="margin-top:4px">“${sign.name}” ${sign.dynamic ? '<span class="badge badge-teal" style="vertical-align:middle">Moving sign</span>' : ""}</h1>
        <p class="text-small text-secondary" style="margin-top:4px">${sign.desc}</p>
      </div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <span class="badge ${STATUS_META[sp0.status].badge}">${STATUS_META[sp0.status].label} · best ${sp0.best_score}%</span>
        <button class="btn btn-ghost btn-sm" data-random>${icon("shuffle")} Random</button>
        <button class="btn btn-ghost btn-sm" data-picker>${icon("library")} All signs</button>
      </div>
    </header>
    <div data-session></div>
    <div data-result></div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
      <button class="btn btn-ghost btn-sm" data-lesson>${icon("book")} Open as lesson</button>
      <button class="btn btn-ghost btn-sm" data-view>${icon("eye")} View in Library</button>
      ${drillNext ? `<button class="btn btn-teal btn-sm" data-drill-next style="margin-left:auto">Next drill sign: “${getSign(drillNext).name}” ${icon("arrowRight")}</button>` : inDrill ? `<span class="badge badge-mastered" style="margin-left:auto">Last drill sign</span>` : ""}
    </div>
  </div>`;

  const session = createPracticeSession({
    mount: $("[data-session]", mount), sign, showAvatar: true, avatarLoop: false,
    submitLabel: "Log This Attempt",
    onSubmit: async ({ score }) => {
      const { signProgress: sp, becameMastered } = await recordAttempt(sign.id, score);
      const box = $("[data-result]", mount);
      box.innerHTML = `<div class="card anim-pop" style="display:flex;gap:16px;align-items:center;flex-wrap:wrap">
        ${starsHTML(starsFor(score))}
        <div><strong class="text-h3" style="display:block">Logged at <span class="text-mono">${score}%</span></strong>
        <span class="text-small text-secondary">Best is now ${sp.best_score}% · ${STATUS_META[sp.status].label} · streak ${store.streak.current} day${store.streak.current === 1 ? "" : "s"}</span></div>
        <button class="btn btn-primary btn-sm" data-again style="margin-left:auto">${icon("replay")} Go again</button>
      </div>`;
      box.querySelector("[data-again]").onclick = () => { box.innerHTML = ""; session.resetBest(); };
      if (becameMastered) { confettiBurst(); celebrateSiggy(`“${sign.name}” mastered in free practice!`); }
      else toast(`Attempt saved for “${sign.name}” (${score}%).`, { type: "success", iconName: "check" });
      session.resetBest();
    },
  });

  $("[data-picker]", mount).onclick = () => { drillQueue = []; navigate("#/practice"); };
  $("[data-random]", mount).onclick = () => {
    const pool = SIGNS.filter((s) => s.id !== sign.id && !isLocked(s));
    navigate(`#/practice/${pool[Math.floor(Math.random() * pool.length)].id}`);
  };
  $("[data-lesson]", mount).onclick = () => navigate(`#/lesson/${sign.id}`);
  $("[data-view]", mount).onclick = () => navigate(`#/sign/${sign.id}`);
  $("[data-drill-next]", mount)?.addEventListener("click", () => navigate(`#/practice/${drillNext}`));
  return () => session.destroy();
}

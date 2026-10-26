/* ============================================================
   SIGNA — screens/home.js · dashboard
   ============================================================ */
import { store } from "../core/store.js";
import { icon } from "../core/icons.js";
import { navigate } from "../core/router.js";
import { computeStats, greeting } from "../progress/stats.js";
import { streakAtRisk, practicedToday, weekStrip } from "../progress/streak.js";
import { nextLessonTarget } from "../../data/curriculum.js";
import { getSign } from "../../data/signs.js";
import { STATUS_META } from "../progress/mastery.js";
import { setSiggy } from "../avatar/siggy.js";

export function renderHome(mount) {
  const s = computeStats();
  const target = nextLessonTarget(store.progress);
  const last = s.lastSign ? getSign(s.lastSign) : null;
  const lastSp = last ? store.signProgress(last.id) : null;
  const week = weekStrip();
  const firstTime = s.attempts === 0;

  mount.innerHTML = `
  <div class="screen-enter" style="display:grid;gap:20px">
    <header>
      <h1>${greeting()}${firstTime ? " — welcome to Signa" : ", welcome back"}</h1>
      <p class="text-body text-secondary" style="margin-top:6px">
        ${firstTime
          ? "Your camera is your teacher. Start with your first five signs — it takes about two minutes."
          : s.streak > 0
            ? `You are on a <strong style="color:var(--warning)">${s.streak}-day streak</strong>. ${practicedToday() ? "Today is already in the bag." : "One short session keeps it alive."}`
            : "Ready for today's practice? Even two minutes builds the habit."}
      </p>
    </header>

    ${streakAtRisk() ? `<div class="feedback-bar is-warn">${icon("flame")}<span>Your ${s.streak}-day streak ends tonight — do one quick sign to save it.</span></div>` : ""}
    ${s.certified ? `<div class="feedback-bar is-good">${icon("trophy")}<span><strong>Signa Certified</strong> — you completed all five modules. Keep those signs sharp in Free Practice.</span></div>` : ""}

    <div class="dash-grid">
      <section class="card card-hover" style="grid-column:span 2">
        <span class="text-label">${icon("play")} Continue learning</span>
        ${target ? `
          <h2 style="margin:10px 0 6px">Module ${target.module.id}: ${target.module.title}</h2>
          <p class="text-body text-secondary">Next sign: <strong>“${getSign(target.signId).name}”</strong>${last ? ` · Last practiced: “${last.name}” at <span class="text-mono">${lastSp.last_score}%</span>` : ""}</p>
          <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px">
            <button class="btn btn-primary" data-go="#/lesson/${target.signId}">${icon("play")} ${firstTime ? "Start Lesson 1" : "Continue"}</button>
            ${target.quizRecommended ? `<button class="btn btn-teal" data-go="#/quiz/${target.module.id}">${icon("gradCap")} Take the Module Quiz</button>` : ""}
            <button class="btn btn-ghost" data-go="#/learn">All modules ${icon("arrowRight")}</button>
          </div>`
        : `<h2 style="margin:10px 0 6px">Curriculum complete</h2>
           <p class="text-body text-secondary">You have worked through every sign. Keep them fresh with a weakest-signs drill.</p>
           <div style="margin-top:16px"><button class="btn btn-primary" data-go="#/practice">${icon("target")} Free Practice</button></div>`}
      </section>

      <section class="card">
        <div class="streak-head" style="margin-bottom:14px">
          <span class="streak-flame">${icon("flame")}</span>
          <div><div class="text-stat" style="font-size:26px">${s.streak}</div><div class="text-label">Day streak</div></div>
          <span class="badge ${practicedToday() ? "badge-mastered" : "badge-learning"}" style="margin-left:auto">${practicedToday() ? "Practiced today" : "Not yet today"}</span>
        </div>
        <div class="week-strip" role="img" aria-label="This week of practice">
          ${week.map((d) => `<span class="calendar__day${d.filled ? " is-filled" : ""}${d.isToday ? " is-today" : ""}${d.isFuture ? " is-future" : ""}" title="${d.key}">${d.label}</span>`).join("")}
        </div>
        <button class="btn btn-ghost btn-sm btn-block" style="margin-top:12px" data-go="#/progress">${icon("calendar")} Full calendar</button>
      </section>

      <section class="card stat-card"><span class="stat-value">${s.mastered}<span class="text-muted" style="font-size:18px">/${s.totalSigns}</span></span><span class="stat-label">Signs mastered</span>
        <div class="progress-bar" style="margin-top:10px"><div class="progress-bar__fill success" style="width:${Math.round((s.mastered / s.totalSigns) * 100)}%"></div></div></section>
      <section class="card stat-card"><span class="stat-value">${s.avgBest}%</span><span class="stat-label">Average best score</span>
        <div class="progress-bar" style="margin-top:10px"><div class="progress-bar__fill" style="width:${s.avgBest}%"></div></div></section>
      <section class="card stat-card"><span class="stat-value">${s.sessions}</span><span class="stat-label">Practice sessions</span>
        <p class="text-small text-secondary" style="margin-top:8px">${last ? `Last sign: <strong>“${last.name}”</strong> — ${STATUS_META[lastSp.status].label}, best <span class="text-mono">${lastSp.best_score}%</span>` : "No sessions yet. Your first one starts a streak."}</p></section>

      <button class="card card-hover entry-card" data-go="#/learn" style="text-align:left">
        <span class="entry-card__icon" style="background:var(--accent-soft);color:var(--accent)">${icon("book")}</span>
        <span><strong class="text-h3" style="display:block">Learn</strong><span class="text-small text-secondary">Guided lessons, A–Z plus phrases, in the right order.</span></span>
        ${icon("arrowRight")}
      </button>
      <button class="card card-hover entry-card" data-go="#/practice" style="text-align:left">
        <span class="entry-card__icon" style="background:var(--accent-2-soft);color:var(--accent-2)">${icon("target")}</span>
        <span><strong class="text-h3" style="display:block">Free Practice</strong><span class="text-small text-secondary">Pick any sign, go random, or drill your weakest.</span></span>
        ${icon("arrowRight")}
      </button>
      <button class="card card-hover entry-card" data-go="#/library" style="text-align:left">
        <span class="entry-card__icon" style="background:var(--warning-soft);color:var(--warning)">${icon("library")}</span>
        <span><strong class="text-h3" style="display:block">Signs Library</strong><span class="text-small text-secondary">Browse every handshape with demos and your scores.</span></span>
        ${icon("arrowRight")}
      </button>
    </div>
  </div>`;

  mount.querySelectorAll("[data-go]").forEach((b) => b.addEventListener("click", () => navigate(b.dataset.go)));
  setSiggy(firstTime ? "happy" : "encouraging",
    firstTime ? "Hi, I am Siggy, your signing coach. Tap Start Lesson 1 and I will guide you."
              : streakAtRisk() ? "Quick! One sign today saves your streak."
              : "Pick up right where you left off — you are doing great.");
}

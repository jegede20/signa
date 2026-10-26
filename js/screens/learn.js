/* ============================================================
   SIGNA — screens/learn.js · module overview
   ============================================================ */
import { store } from "../core/store.js";
import { icon } from "../core/icons.js";
import { navigate } from "../core/router.js";
import { MODULES } from "../../data/modules.js";
import { isQuizReady } from "../../data/curriculum.js";
import { moduleAvg, moduleStatus, STATUS_META } from "../progress/mastery.js";
import { setSiggy } from "../avatar/siggy.js";

export function renderLearn(mount) {
  const alphabetDone = Object.entries(store.progress.signs)
    .filter(([id, sp]) => id.length === 1 && (sp.status === "learning" || sp.status === "mastered")).length;

  mount.innerHTML = `
  <div class="screen-enter" style="display:grid;gap:20px">
    <header>
      <h1>Learn</h1>
      <p class="text-body text-secondary" style="margin:6px 0 14px">Five modules take you from your first five letters to everyday phrases. Pass a module quiz at 70% to unlock the next.</p>
      <div style="display:flex;align-items:center;gap:12px;max-width:560px">
        <div class="progress-bar" style="flex:1"><div class="progress-bar__fill" style="width:${Math.round((alphabetDone / 26) * 100)}%"></div></div>
        <span class="text-mono text-small">${alphabetDone}/26 letters underway</span>
      </div>
    </header>
    <div style="display:grid;gap:16px">
      ${MODULES.map((m) => moduleCard(m)).join("")}
    </div>
  </div>`;

  mount.querySelectorAll("[data-lesson]").forEach((b) => b.addEventListener("click", () => navigate(`#/lesson/${b.dataset.lesson}`)));
  mount.querySelectorAll("[data-action]").forEach((b) => b.addEventListener("click", () => navigate(b.dataset.action)));
  setSiggy("encouraging", "Lessons unlock in order — pass each quiz to open the next module.");
}

function moduleCard(m) {
  const status = moduleStatus(m);
  const locked = status === "locked";
  const completed = status === "completed";
  const mp = store.progress.modules[m.id];
  const avg = moduleAvg(m);
  const quizReady = isQuizReady(m, store.progress.signs);
  const firstIncomplete = m.signs.find((id) => (store.progress.signs[id]?.best_score || 0) < 50) || m.signs[0];
  const attempted = m.signs.filter((id) => (store.progress.signs[id]?.attempts || 0) > 0).length;

  const badge = completed
    ? `<span class="badge badge-mastered">${icon("check")} Completed${mp.quiz_best ? ` · Quiz ${mp.quiz_best}%` : ""}</span>`
    : locked ? `<span class="badge badge-locked">${icon("lock")} Locked</span>`
    : `<span class="badge badge-learning">${icon("play")} In progress · ${attempted}/${m.signs.length}</span>`;

  return `<section class="module-card${locked ? " is-locked" : ""}">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap">
      <div>
        <span class="text-label">Module ${m.id}</span>
        <h2 style="margin-top:4px">${m.title}</h2>
        <p class="text-small text-secondary" style="margin-top:4px">${m.tagline}</p>
      </div>
      ${badge}
    </div>

    <div class="sign-chips" style="margin:16px 0">
      ${m.signs.map((id) => {
        const sp = store.progress.signs[id];
        const name = id.length === 1 ? id : id.replace("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
        const chip = `<span class="status-dot ${STATUS_META[sp.status].dot}"></span>${name}${sp.attempts ? ` <span class="text-muted">${sp.best_score}%</span>` : ""}`;
        return locked ? `<span class="sign-chip">${chip}</span>` : `<button class="sign-chip" data-lesson="${id}" title="Open lesson for ${name}">${chip}</button>`;
      }).join("")}
    </div>

    <div class="progress-bar"><div class="progress-bar__fill ${completed ? "success" : ""}" style="width:${avg}%"></div></div>
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-top:14px">
      <span class="text-small text-secondary">Average best score <strong class="text-mono">${avg}%</strong></span>
      ${locked
        ? `<span class="text-small text-muted" style="display:inline-flex;align-items:center;gap:6px">${icon("lock")} Finish Module ${m.id - 1} to unlock</span>`
        : `<div style="display:flex;gap:10px;flex-wrap:wrap">
             <button class="btn ${attempted ? "btn-secondary" : "btn-primary"} btn-sm" data-action="#/lesson/${firstIncomplete}">${icon("play")} ${attempted === 0 ? "Start module" : completed ? "Review lessons" : "Continue"}</button>
             <button class="btn ${quizReady || completed ? "btn-teal" : "btn-ghost"} btn-sm" data-action="#/quiz/${m.id}" ${!quizReady && !completed ? "disabled title='Try every sign in this module first'" : ""}>${icon("gradCap")} ${completed ? "Retake quiz" : "Module quiz"}</button>
           </div>`}
    </div>
  </section>`;
}

/* ============================================================
   SIGNA — screens/lesson.js
   The 3-phase lesson: Watch → Try → Result.
   ============================================================ */
import { store, $ } from "../core/store.js";
import { icon, starsHTML } from "../core/icons.js";
import { navigate } from "../core/router.js";
import { getSign } from "../../data/signs.js";
import { moduleOfSign } from "../../data/modules.js";
import { isModuleUnlocked, isQuizReady } from "../../data/curriculum.js";
import { recordAttempt, starsFor, ratingLabel, STATUS_META, confettiBurst } from "../progress/mastery.js";
import { practicedToday } from "../progress/streak.js";
import { createDemoPlayer } from "../avatar/demo.js";
import { STAGE_LABELS } from "../avatar/poses/alphabet.js";
import { PHRASE_MOVEMENT } from "../avatar/poses/phrases.js";
import { createPracticeSession, scoreRingHTML, paintScoreRing } from "./session.js";
import { setSiggy, celebrateSiggy } from "../avatar/siggy.js";

const PHASES = ["Watch", "Try", "Result"];

function stepperHTML(current) {
  return `<div><div class="step-indicator" role="list" aria-label="Lesson progress">
    ${PHASES.map((_, i) => `
      <span class="step-indicator__dot ${i < current ? "is-done" : i === current ? "is-current" : ""}" role="listitem">${i < current ? icon("check") : i + 1}</span>
      ${i < 2 ? `<span class="step-indicator__line ${i < current ? "is-done" : ""}"></span>` : ""}`).join("")}
  </div><div class="step-labels">${PHASES.map((p, i) => `<span${i === current ? ' style="color:var(--text-primary)"' : ""}>${p}</span>${i < 2 ? "<i></i>" : ""}`).join("")}</div></div>`;
}

export function renderLesson(mount, signId) {
  const sign = getSign(signId);
  if (!sign) { mount.innerHTML = `<div class="card empty-state">${icon("alert")}<h3>That sign was not found.</h3><button class="btn btn-primary" data-back>Back to Learn</button></div>`; mount.querySelector("[data-back]").onclick = () => navigate("#/learn"); return; }

  const mod = moduleOfSign(sign.id);
  if (mod && !isModuleUnlocked(mod.id, store.progress.modules)) {
    mount.innerHTML = `<div class="card empty-state screen-enter">${icon("lock")}<h3>Module ${mod.id} is still locked</h3>
      <p class="text-small">Finish Module ${mod.id - 1} and pass its quiz to unlock “${sign.name}”. You can still peek at it in the Library.</p>
      <div style="display:flex;gap:10px"><button class="btn btn-primary" data-go="#/learn">Go to modules</button><button class="btn btn-ghost" data-go="#/sign/${sign.id}">View in Library</button></div></div>`;
    mount.querySelectorAll("[data-go]").forEach((b) => b.onclick = () => navigate(b.dataset.go));
    return;
  }

  let phase = 0;
  let session = null, demo = null, recorded = false;

  function cleanupLive() { session?.destroy(); session = null; demo?.stop(); demo = null; }
  function shell(content) {
    mount.innerHTML = `<div class="screen-enter" style="display:grid;gap:20px">
      <header style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap">
        <div>
          <span class="text-label">Module ${mod?.id} · ${mod?.title}</span>
          <h1 style="margin-top:4px">Sign: “${sign.name}” ${sign.dynamic ? '<span class="badge badge-teal" style="vertical-align:middle">Moving sign</span>' : ""}</h1>
        </div>
        ${stepperHTML(phase)}
      </header>
      ${content}
    </div>`;
  }

  /* -------- Phase 1: Watch -------- */
  function showWatch() {
    cleanupLive(); phase = 0;
    const sp = store.signProgress(sign.id);
    shell(`
    <div class="session-grid" style="align-items:start">
      <div>
        <div class="avatar-frame"><span class="avatar-frame__label">Watch Siggy's hand</span><div data-demo style="width:min(64%,270px)"></div></div>
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:10px">
          <span class="text-small text-secondary" data-stage-label>${STAGE_LABELS[0]}</span>
          <button class="btn btn-ghost btn-sm" data-replay>${icon("replay")} Watch Again</button>
        </div>
      </div>
      <div class="card">
        <h3>${sign.desc}</h3>
        ${sign.note ? `<p class="text-small" style="color:var(--accent-2);margin-top:8px">${sign.note}</p>` : ""}
        <ol style="display:grid;gap:14px;margin-top:18px;counter-reset:step">
          ${sign.steps.map((s, i) => `<li style="display:flex;gap:12px;align-items:flex-start">
            <span style="flex:none;width:28px;height:28px;border-radius:50%;background:var(--accent-soft);color:var(--accent);display:grid;place-items:center;font-weight:700;font-size:13px">${i + 1}</span>
            <span class="text-body" style="padding-top:2px">${s}</span></li>`).join("")}
        </ol>
        ${PHRASE_MOVEMENT[sign.id] ? `<p class="text-small text-secondary" style="margin-top:14px">Movement: ${PHRASE_MOVEMENT[sign.id]}.</p>` : ""}
        <p class="text-small text-secondary" style="margin-top:14px">Your best so far: <strong class="text-mono">${sp.best_score}%</strong> · <span class="badge ${STATUS_META[sp.status].badge}">${STATUS_META[sp.status].label}</span></p>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:20px">
          <button class="btn btn-primary" data-ready>I'm Ready ${icon("arrowRight")}</button>
          <button class="btn btn-ghost" data-back>All modules</button>
        </div>
      </div>
    </div>`);
    demo = createDemoPlayer($("[data-demo]", mount), sign, {
      hand: store.settings.dominantHand,
      onStage: (s) => { const l = $("[data-stage-label]", mount); if (l) l.textContent = STAGE_LABELS[s]; },
    });
    $("[data-replay]", mount).onclick = () => demo.replay();
    $("[data-ready]", mount).onclick = showTry;
    $("[data-back]", mount).onclick = () => navigate("#/learn");
    setSiggy("happy", `Watch my hand make “${sign.name}”, then copy the shape.`);
  }

  /* -------- Phase 2: Try -------- */
  function showTry() {
    cleanupLive(); phase = 1; recorded = false;
    shell(`
      <div data-session></div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn btn-ghost" data-watch>${icon("eye")} See Demo Again</button>
        <button class="btn btn-ghost" data-back>Save &amp; exit to modules</button>
      </div>`);
    session = createPracticeSession({
      mount: $("[data-session]", mount), sign, showAvatar: true, avatarLoop: false,
      submitLabel: "Looks Good — Score Me",
      onSubmit: ({ score, result }) => showResult(score, result),
    });
    $("[data-watch]", mount).onclick = showWatch;
    $("[data-back]", mount).onclick = () => navigate("#/learn");
  }

  /* -------- Phase 3: Result -------- */
  async function showResult(score, result) {
    cleanupLive(); phase = 2;
    let becameMastered = false, sp = store.signProgress(sign.id);
    if (!recorded) {
      recorded = true;
      const r = await recordAttempt(sign.id, score);
      becameMastered = r.becameMastered; sp = r.signProgress;
    }
    const stars = starsFor(score);
    const siblings = mod.signs;
    const idx = siblings.indexOf(sign.id);
    const nextInModule = siblings[idx + 1] || null;
    const quizReady = isQuizReady(mod, store.progress.signs);
    const isLast = !nextInModule;

    shell(`
    <div class="card" style="display:grid;justify-items:center;gap:14px;text-align:center;padding:32px 24px">
      ${starsHTML(stars)}
      <div style="display:grid;justify-items:center;gap:6px">${scoreRingHTML("Your score")}
      <span class="text-h3">${ratingLabel(score)}</span></div>
      <p class="text-body text-secondary" style="max-width:520px">
        ${score >= 90 ? `Superb — “${sign.name}” looks clean and confident.` : score >= 70 ? `Good work. “${sign.name}” is readable — polish the weakest point below to master it.` : score >= 50 ? `You are on your way with “${sign.name}”. Compare your hand with the guide and retry slowly.` : `Tough one — rewatch the demo, slow down, and build the shape finger by finger.`}
      </p>
      <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center">
        <span class="badge ${STATUS_META[sp.status].badge} ${becameMastered ? "badge-pop" : ""}">${STATUS_META[sp.status].label}${becameMastered ? " — just unlocked" : ""}</span>
        <span class="badge badge-accent">${icon("flame")} ${store.streak.current}-day streak ${practicedToday() ? "· today counted" : ""}</span>
        <span class="badge badge-new">Best: ${sp.best_score}% · Attempts: ${sp.attempts}</span>
      </div>
      <div style="width:100%;max-width:560px;display:grid;gap:9px;text-align:left;margin-top:8px">
        <span class="text-label">Score breakdown</span>
        ${result.features.map((f) => `
          <div class="meter"><span>${f.label}</span>
            <span class="meter__track"><span class="meter__fill" style="display:block;width:${f.score}%;background:${f.score >= 80 ? "var(--success)" : f.score >= 60 ? "var(--accent-2)" : "var(--warning)"}"></span></span>
            <span class="meter__val">${f.score}% ${f.score >= 80 ? "" : ""}</span></div>`).join("")}
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:10px">
        <button class="btn btn-secondary" data-retry>${icon("replay")} Try Again</button>
        ${nextInModule ? `<button class="btn btn-primary" data-next>Next Sign: “${getSign(nextInModule).name}” ${icon("arrowRight")}</button>`
          : quizReady ? `<button class="btn btn-teal" data-quiz>${icon("gradCap")} Take the Module ${mod.id} Quiz</button>`
          : `<button class="btn btn-primary" data-modules>Back to Modules</button>`}
      </div>
      ${isLast && quizReady && nextInModule === null ? `<p class="text-small text-secondary">That was the last sign in Module ${mod.id} — the quiz checks you from memory, no guide.</p>` : ""}
    </div>`);

    paintScoreRing(mount, score);
    $("[data-retry]", mount).onclick = showTry;
    $("[data-next]", mount)?.addEventListener("click", () => navigate(`#/lesson/${nextInModule}`));
    $("[data-quiz]", mount)?.addEventListener("click", () => navigate(`#/quiz/${mod.id}`));
    $("[data-modules]", mount)?.addEventListener("click", () => navigate("#/learn"));

    if (becameMastered || score >= 90) {
      confettiBurst();
      celebrateSiggy(becameMastered ? `“${sign.name}” is officially mastered!` : `Excellent “${sign.name}” — ${score}%!`);
    } else {
      setSiggy(score >= 70 ? "happy" : "encouraging", score >= 70 ? "So close to mastery — check the breakdown." : "Every rep counts. Try it once more, slowly.");
    }
  }

  showWatch();
  return cleanupLive;
}

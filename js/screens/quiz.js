/* ============================================================
   SIGNA — screens/quiz.js · module quiz (from memory, no guide)
   Pass at >=70% average to complete the module + unlock next.
   ============================================================ */
import { $ } from "../core/store.js";
import { icon, starsHTML } from "../core/icons.js";
import { navigate } from "../core/router.js";
import { getModule } from "../../data/modules.js";
import { getSign } from "../../data/signs.js";
import { isModuleUnlocked, isQuizReady, QUIZ_PASS_MARK } from "../../data/curriculum.js";
import { store } from "../core/store.js";
import { recordAttempt, recordQuizResult, starsFor, confettiBurst } from "../progress/mastery.js";
import { createPracticeSession } from "./session.js";
import { setSiggy, celebrateSiggy } from "../avatar/siggy.js";

export function renderQuiz(mount, moduleId) {
  const mod = getModule(moduleId);
  if (!mod) { navigate("#/learn"); return; }
  const locked = !isModuleUnlocked(mod.id, store.progress.modules);
  const ready = isQuizReady(mod, store.progress.signs);

  let session = null;
  let index = 0;
  let results = [];
  const cleanup = () => { session?.destroy(); session = null; };

  function intro() {
    cleanup();
    mount.innerHTML = `<div class="screen-enter" style="display:grid;gap:20px;max-width:720px">
      <header><span class="text-label">Module ${mod.id} · ${mod.title}</span><h1 style="margin-top:4px">Module Quiz</h1></header>
      <div class="card" style="display:grid;gap:14px">
        <p class="text-body">No guide this time — show each sign <strong>from memory</strong>. The same hand tracking scores you live.</p>
        <ul style="display:grid;gap:10px">
          <li style="display:flex;gap:10px">${icon("layers")}<span><strong>${mod.signs.length} signs</strong>, in module order. Your best shape per sign counts.</span></li>
          <li style="display:flex;gap:10px">${icon("target")}<span>Pass with an average of <strong>${QUIZ_PASS_MARK}% or higher</strong> to complete the module and unlock the next one.</span></li>
          <li style="display:flex;gap:10px">${icon("replay")}<span>Miss the mark and we will point you straight at the signs to review.</span></li>
        </ul>
        <div class="sign-chips">${mod.signs.map((id) => `<span class="sign-chip">${getSign(id).name}</span>`).join("")}</div>
        ${locked ? `<div class="feedback-bar is-warn">${icon("lock")}<span>This module is locked. Finish the previous module first.</span></div>`
          : !ready ? `<div class="feedback-bar is-warn">${icon("alert")}<span>Try every sign in this module at least once before the quiz.</span></div>` : ""}
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button class="btn btn-primary" data-start ${locked || !ready ? "disabled" : ""}>${icon("play")} Start Quiz</button>
          <button class="btn btn-ghost" data-back>Back to modules</button>
        </div>
      </div>
    </div>`;
    $("[data-start]", mount).onclick = start;
    $("[data-back]", mount).onclick = () => navigate("#/learn");
    setSiggy("thinking", "Quiz time — trust your memory. I believe in you.");
  }

  function start() { index = 0; results = []; showSign(); }

  function showSign() {
    cleanup();
    const sign = getSign(mod.signs[index]);
    mount.innerHTML = `<div class="screen-enter" style="display:grid;gap:18px">
      <header style="display:flex;align-items:flex-end;justify-content:space-between;gap:14px;flex-wrap:wrap">
        <div>
          <span class="text-label">Module ${mod.id} Quiz · ${index + 1} of ${mod.signs.length}</span>
          <h1 style="margin-top:6px">Show us the sign for: <span class="text-accent">“${sign.name}”</span></h1>
          ${sign.dynamic ? `<p class="text-small text-secondary" style="margin-top:4px">Remember: this sign moves — shape it, then add the movement.</p>` : ""}
        </div>
        <div style="display:flex;gap:6px" aria-hidden="true">
          ${mod.signs.map((_, i) => `<span style="width:12px;height:12px;border-radius:50%;background:${i < results.length ? (results[i].score >= 70 ? "var(--success)" : "var(--warning)") : i === index ? "var(--accent)" : "var(--border)"}"></span>`).join("")}
        </div>
      </header>
      <div data-session></div>
      <button class="btn btn-ghost btn-sm" data-quit style="justify-self:start">Quit quiz</button>
    </div>`;
    session = createPracticeSession({
      mount: $("[data-session]", mount), sign, showAvatar: false,
      submitLabel: index === mod.signs.length - 1 ? "Submit Final Sign" : "Submit Sign",
      onSubmit: async ({ score, result }) => {
        results.push({ signId: sign.id, score, result });
        await recordAttempt(sign.id, score, { countSession: index === 0 });
        index++;
        if (index < mod.signs.length) showSign(); else finish();
      },
    });
    $("[data-quit]", mount).onclick = intro;
  }

  async function finish() {
    cleanup();
    const avg = Math.round(results.reduce((a, r) => a + r.score, 0) / results.length);
    const { passed, unlockedNext } = await recordQuizResult(mod.id, avg);
    const failed = results.filter((r) => r.score < 70);

    mount.innerHTML = `<div class="screen-enter" style="display:grid;gap:20px;max-width:760px">
      <header><span class="text-label">Module ${mod.id} Quiz · Results</span>
        <h1 style="margin-top:4px">${passed ? "Module complete!" : "Not quite — nearly there"}</h1></header>
      <div class="card" style="display:grid;justify-items:center;gap:12px;text-align:center">
        ${starsHTML(starsFor(avg))}
        <div class="text-stat" style="font-size:52px">${avg}%</div>
        <span class="badge ${passed ? "badge-mastered" : "badge-learning"}">${passed ? `Passed — ${QUIZ_PASS_MARK}% needed` : `${QUIZ_PASS_MARK}% needed to pass`}</span>
        <div class="progress-bar" style="width:min(100%,440px)"><div class="progress-bar__fill ${passed ? "success" : "warning"}" style="width:${avg}%"></div></div>
        <div style="display:grid;gap:8px;width:100%;max-width:520px;text-align:left">
          ${results.map((r) => `<div class="meter"><span>“${getSign(r.signId).name}”</span>
            <span class="meter__track"><span class="meter__fill" style="display:block;width:${r.score}%;background:${r.score >= 70 ? "var(--success)" : "var(--warning)"}"></span></span>
            <span class="meter__val">${r.score}%</span></div>`).join("")}
        </div>
      </div>
      ${unlockedNext ? `<div class="card unlock-pulse" style="display:flex;gap:14px;align-items:center"><span class="entry-card__icon" style="background:var(--accent-soft);color:var(--accent)">${icon("sparkles")}</span>
        <div><strong class="text-h3" style="display:block">Module ${unlockedNext.id} unlocked: ${unlockedNext.title}</strong><span class="text-small text-secondary">${unlockedNext.tagline}</span></div></div>` : ""}
      ${passed && mod.id === 5 ? `<div class="card" style="display:flex;gap:14px;align-items:center;border-color:var(--success)"><span class="entry-card__icon" style="background:var(--success-soft);color:var(--success)">${icon("trophy")}</span>
        <div><strong class="text-h3" style="display:block">Signa Certified</strong><span class="text-small text-secondary">All five modules complete — alphabet and everyday phrases. Outstanding work.</span></div></div>` : ""}
      ${!passed && failed.length ? `<div class="card"><h3 style="margin-bottom:10px">Review these, then retry</h3>
        <div style="display:flex;gap:8px;flex-wrap:wrap">${failed.map((r) => `<button class="btn btn-secondary btn-sm" data-review="${r.signId}">“${getSign(r.signId).name}” · ${r.score}% — review</button>`).join("")}</div></div>` : ""}
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        ${passed && unlockedNext ? `<button class="btn btn-primary" data-next>${icon("play")} Start Module ${unlockedNext.id}</button>` : ""}
        ${passed && !unlockedNext ? `<button class="btn btn-primary" data-practice>${icon("target")} Free Practice</button>` : ""}
        <button class="btn ${passed ? "btn-ghost" : "btn-primary"}" data-retry>${icon("replay")} Retry Quiz</button>
        <button class="btn btn-ghost" data-modules>Back to Modules</button>
      </div>
    </div>`;

    mount.querySelectorAll("[data-review]").forEach((b) => b.onclick = () => navigate(`#/lesson/${b.dataset.review}`));
    $("[data-retry]", mount).onclick = start;
    $("[data-modules]", mount).onclick = () => navigate("#/learn");
    $("[data-next]", mount)?.addEventListener("click", () => navigate(`#/lesson/${unlockedNext.signs[0]}`));
    $("[data-practice]", mount)?.addEventListener("click", () => navigate("#/practice"));

    if (passed) { confettiBurst(); celebrateSiggy(`Module ${mod.id} complete at ${avg}%!`); }
    else setSiggy("encouraging", `${avg}% — review the yellow signs and the retry is yours.`);
  }

  intro();
  return cleanup;
}

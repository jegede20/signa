/* ============================================================
   SIGNA — screens/library.js · signs library + sign detail
   ============================================================ */
import { store, $ } from "../core/store.js";
import { icon, starsHTML } from "../core/icons.js";
import { navigate } from "../core/router.js";
import { ALPHABET, PHRASES, getSign } from "../../data/signs.js";
import { moduleOfSign } from "../../data/modules.js";
import { isModuleUnlocked } from "../../data/curriculum.js";
import { STATUS_META, starsFor, signModuleUnlocked } from "../progress/mastery.js";
import { createDemoPlayer } from "../avatar/demo.js";
import { handPreview } from "./session.js";
import { phrasesUnlocked } from "./practice.js";
import { setSiggy } from "../avatar/siggy.js";

function signCard(sign, locked) {
  const sp = store.signProgress(sign.id);
  return `<article class="card card-hover" style="padding:18px;display:grid;gap:10px;justify-items:start;${locked ? "opacity:.62" : ""}">
    <div style="display:flex;align-items:center;gap:14px;width:100%">
      <span style="flex:none">${handPreview(sign, 64)}</span>
      <div>
        <div class="sign-tile__glyph" style="font-size:${sign.name.length > 1 ? 20 : 30}px;text-align:left">${sign.name}</div>
        <span class="badge ${locked ? "badge-locked" : STATUS_META[sp.status].badge}">${locked ? `${icon("lock")} Locked` : STATUS_META[sp.status].label}${!locked && sp.attempts ? ` · ${sp.best_score}%` : ""}</span>
      </div>
      ${!locked && sp.attempts ? `<span style="margin-left:auto">${starsHTML(starsFor(sp.best_score), true)}</span>` : ""}
    </div>
    <p class="text-small text-secondary" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${sign.desc}</p>
    <button class="btn ${locked ? "btn-ghost" : "btn-secondary"} btn-sm" data-view="${sign.id}" ${locked ? "disabled" : ""}>${icon("eye")} View sign</button>
  </article>`;
}

export function renderLibrary(mount) {
  const unlocked = phrasesUnlocked();
  mount.innerHTML = `<div class="screen-enter" style="display:grid;gap:22px">
    <header>
      <h1>Signs Library</h1>
      <p class="text-body text-secondary" style="margin:6px 0 16px">Every handshape, demo and step breakdown — with your personal best on each card.</p>
      <div class="search-wrap" style="max-width:440px">${icon("search")}<input class="input" type="search" placeholder="Search signs..." data-search aria-label="Search signs"></div>
    </header>
    <section>
      <h2 style="display:flex;align-items:center;gap:10px;margin-bottom:14px">${icon("book")} Alphabet <span class="badge badge-accent">A–Z</span></h2>
      <div class="lib-grid" data-alpha></div>
    </section>
    <section>
      <h2 style="display:flex;align-items:center;gap:10px;margin-bottom:14px">${icon("message")} Common Phrases
        ${unlocked ? '<span class="badge badge-teal">Unlocked</span>' : '<span class="badge badge-locked">Unlocks with Module 5</span>'}</h2>
      <div class="lib-grid" data-phrases></div>
    </section>
    <p class="text-small text-muted" data-empty hidden>No signs match your search.</p>
  </div>`;

  const alphaEl = $("[data-alpha]", mount);
  const phraseEl = $("[data-phrases]", mount);
  function draw(q = "") {
    const match = (s) => !q || s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q);
    alphaEl.innerHTML = ALPHABET.filter(match).map((s) => signCard(s, false)).join("");
    phraseEl.innerHTML = PHRASES.filter(match).map((s) => signCard(s, !unlocked)).join("");
    $("[data-empty]", mount).hidden = !!(alphaEl.children.length || phraseEl.children.length);
    mount.querySelectorAll("[data-view]").forEach((b) => b.onclick = () => navigate(`#/sign/${b.dataset.view}`));
  }
  draw();
  $("[data-search]", mount).addEventListener("input", (e) => draw(e.target.value.trim().toLowerCase()));
  setSiggy("neutral", "Browse any sign here — tap one to see the full breakdown.");
}

/* ---------------- sign detail (#/sign/X) ---------------- */
export function renderSignDetail(mount, signId) {
  const sign = getSign(signId);
  if (!sign) { navigate("#/library"); return; }
  const sp = store.signProgress(sign.id);
  const mod = moduleOfSign(sign.id);
  const lockedPhrase = sign.type === "phrase" && !phrasesUnlocked();
  const history = (sp.score_history || []).slice(-12);

  mount.innerHTML = `<div class="screen-enter" style="display:grid;gap:20px">
    <button class="btn btn-ghost btn-sm" data-back style="justify-self:start">${icon("arrowLeft")} Back to Library</button>
    <header style="display:flex;align-items:flex-start;justify-content:space-between;gap:14px;flex-wrap:wrap">
      <div>
        <span class="text-label">${sign.type === "phrase" ? "Common phrase" : "Alphabet"} · Module ${mod?.id} ${mod?.title}</span>
        <h1 style="margin-top:4px">“${sign.name}” ${sign.dynamic ? '<span class="badge badge-teal" style="vertical-align:middle">Moving sign</span>' : ""}</h1>
        <p class="text-body text-secondary" style="margin-top:6px;max-width:620px">${sign.desc}</p>
        ${sign.note ? `<p class="text-small" style="color:var(--accent-2);margin-top:6px">${sign.note}</p>` : ""}
      </div>
      <div style="display:grid;gap:8px;justify-items:end">
        <span class="badge ${lockedPhrase ? "badge-locked" : STATUS_META[sp.status].badge}">${lockedPhrase ? "Locked · Module 5" : STATUS_META[sp.status].label}</span>
        ${sp.attempts ? `${starsHTML(starsFor(sp.best_score), true)}<span class="text-small text-secondary">Best <strong class="text-mono">${sp.best_score}%</strong> · ${sp.attempts} attempts</span>` : '<span class="text-small text-muted">Never attempted yet</span>'}
      </div>
    </header>

    <div class="session-grid" style="align-items:start">
      <div>
        <div class="avatar-frame"><span class="avatar-frame__label">Looping demo</span><div data-demo style="width:min(64%,270px)"></div></div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-top:10px">
          <span class="text-small text-secondary" data-stage></span>
          <button class="btn btn-ghost btn-sm" data-replay>${icon("replay")} Replay</button>
        </div>
      </div>
      <div style="display:grid;gap:16px">
        <div class="card">
          <h3 style="margin-bottom:14px">How to make it</h3>
          <ol style="display:grid;gap:13px">
            ${sign.steps.map((s, i) => `<li style="display:flex;gap:12px;align-items:flex-start"><span style="flex:none;width:28px;height:28px;border-radius:50%;background:var(--accent-soft);color:var(--accent);display:grid;place-items:center;font-weight:700;font-size:13px">${i + 1}</span><span class="text-body" style="padding-top:2px">${s}</span></li>`).join("")}
          </ol>
        </div>
        ${history.length ? `<div class="card"><h3 style="margin-bottom:12px">Your recent scores</h3>
          <div style="display:flex;align-items:flex-end;gap:6px;height:84px">
            ${history.map((v) => `<div style="flex:1;display:grid;gap:5px;justify-items:center"><span class="text-mono" style="font-size:10px;color:var(--text-muted)">${v}</span><span style="display:block;width:100%;max-width:30px;height:${Math.max(4, v * 0.6)}px;border-radius:5px 5px 2px 2px;background:${v >= 90 ? "var(--success)" : v >= 70 ? "var(--accent-2)" : "var(--warning)"}"></span></div>`).join("")}
          </div></div>` : ""}
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button class="btn btn-primary" data-practice ${lockedPhrase ? "disabled" : ""}>${icon("target")} Practice This Sign</button>
          ${signModuleUnlocked(sign.id) ? `<button class="btn btn-secondary" data-lesson>${icon("book")} Open Lesson</button>` : `<span class="text-small text-muted" style="align-self:center">${icon("lock")} Lesson unlocks in Module ${mod?.id}</span>`}
        </div>
      </div>
    </div>
  </div>`;

  const demo = createDemoPlayer($("[data-demo]", mount), sign, {
    hand: store.settings.dominantHand,
    onStage: (s) => { const el = $("[data-stage]", mount); if (el) el.textContent = ["Start: open hand", "Shaping…", "Final shape — hold it"][s]; },
  });
  $("[data-replay]", mount).onclick = () => demo.replay();
  $("[data-back]", mount).onclick = () => navigate("#/library");
  $("[data-practice]", mount).onclick = () => navigate(`#/practice/${sign.id}`);
  $("[data-lesson]", mount)?.addEventListener("click", () => navigate(`#/lesson/${sign.id}`));
  setSiggy("encouraging", `Study the loop for “${sign.name}”, then hit Practice.`);
  return () => demo.stop();
}

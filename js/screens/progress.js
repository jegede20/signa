/* ============================================================
   SIGNA — screens/progress.js
   Streak calendar (clickable days), mastery map, stats,
   sortable per-sign score list.
   ============================================================ */
import { store, $ } from "../core/store.js";
import { icon, starsHTML } from "../core/icons.js";
import { navigate } from "../core/router.js";
import { ALPHABET, PHRASES, getSign } from "../../data/signs.js";
import { computeStats, perSignRows } from "../progress/stats.js";
import { monthCalendar, dayDetail, practicedToday, streakAtRisk } from "../progress/streak.js";
import { STATUS_META, starsFor } from "../progress/mastery.js";
import { openModal } from "../core/ui.js";
import { setSiggy } from "../avatar/siggy.js";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Shared day-detail sheet (also used by the sidebar calendar). */
export function openDaySheet(key) {
  const detail = dayDetail(key);
  const nice = new Date(key + "T12:00:00").toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  if (!detail || detail.attempts === 0) {
    openModal({ title: nice, bodyHTML: `<p class="text-body text-secondary">No practice logged on this day.</p><p class="text-small text-muted" style="margin-top:8px">A single scored attempt on any day paints it teal and feeds your streak.</p>` });
    return;
  }
  openModal({
    title: nice,
    bodyHTML: `<div style="display:grid;gap:14px">
      <div style="display:flex;gap:18px;flex-wrap:wrap">
        <div><div class="text-stat" style="font-size:26px">${detail.attempts}</div><div class="text-label">Attempts</div></div>
        <div><div class="text-stat" style="font-size:26px">${detail.best}%</div><div class="text-label">Best score</div></div>
        <div><div class="text-stat" style="font-size:26px">${Object.keys(detail.signs).length}</div><div class="text-label">Signs</div></div>
      </div>
      <div class="sign-chips">${Object.entries(detail.signs).map(([id, n]) => `<span class="sign-chip">${getSign(id)?.name || id} ×${n}</span>`).join("")}</div>
    </div>`,
  });
}

export function calendarHTML(year, month, { large = false } = {}) {
  const cells = monthCalendar(year, month);
  return `<div class="calendar${large ? " lg" : ""}">
    <div class="calendar__head">${DOW.map((d) => `<span>${d}</span>`).join("")}</div>
    <div class="calendar__grid">
      ${cells.map((c) => !c.inMonth
        ? `<span class="calendar__day is-empty"></span>`
        : `<button class="calendar__day${c.filled ? " is-filled" : ""}${c.isToday ? " is-today" : ""}${c.isFuture ? " is-future" : ""}" data-day="${c.key}" title="${c.key}${c.filled ? " — practiced" : ""}">${c.day}</button>`).join("")}
    </div>
  </div>`;
}

export function bindDayClicks(root) {
  root.querySelectorAll("[data-day]").forEach((b) => b.addEventListener("click", () => openDaySheet(b.dataset.day)));
}

export function renderProgress(mount) {
  const s = computeStats();
  const now = new Date();
  let viewYear = now.getFullYear(), viewMonth = now.getMonth();
  let sortBy = "alpha";

  mount.innerHTML = `<div class="screen-enter" style="display:grid;gap:22px">
    <header>
      <h1>Progress</h1>
      <p class="text-body text-secondary" style="margin-top:6px">Everything is stored on this device, in your browser — your streak, scores and mastery map.</p>
    </header>
    ${s.certified ? `<div class="card" style="display:flex;gap:14px;align-items:center;border-color:var(--success)"><span class="entry-card__icon" style="background:var(--success-soft);color:var(--success)">${icon("trophy")}</span><div><strong class="text-h3" style="display:block">Signa Certified</strong><span class="text-small text-secondary">All 5 modules complete.</span></div></div>` : ""}

    <div class="stats-row">
      <section class="card stat-card"><span class="stat-value">${s.mastered}</span><span class="stat-label">Signs mastered</span></section>
      <section class="card stat-card"><span class="stat-value">${s.avgBest}%</span><span class="stat-label">Average best</span></section>
      <section class="card stat-card"><span class="stat-value">${s.sessions}</span><span class="stat-label">Sessions</span></section>
      <section class="card stat-card"><span class="stat-value">${s.longestStreak}d</span><span class="stat-label">Longest streak</span></section>
    </div>

    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(320px,100%),1fr));gap:20px;align-items:start">
      <section class="card">
        <div class="streak-head" style="margin-bottom:16px">
          <span class="streak-flame">${icon("flame")}</span>
          <div style="flex:1 1 118px;min-width:0"><h3>${s.streak} Day Streak</h3><p class="text-small text-secondary">${practicedToday() ? "Today counted. Nice." : streakAtRisk() ? "Practice today to keep it alive." : "Longest: " + s.longestStreak + " days"}</p></div>
          <div style="margin-left:auto;display:flex;align-items:center;gap:4px">
            <button class="icon-btn" data-prev aria-label="Previous month">${icon("arrowLeft")}</button>
            <span class="text-small" style="font-weight:700;min-width:104px;text-align:center" data-month-label></span>
            <button class="icon-btn" data-next aria-label="Next month">${icon("arrowRight")}</button>
          </div>
        </div>
        <div data-calendar></div>
        <p class="text-small text-muted" style="margin-top:12px">Tap any day to see what you practiced.</p>
      </section>

      <section class="card">
        <h3 style="margin-bottom:6px">Mastery Map</h3>
        <div style="display:flex;gap:14px;flex-wrap:wrap;margin-bottom:14px" class="text-small text-secondary">
          <span style="display:inline-flex;gap:6px;align-items:center"><span class="status-dot mastered"></span>Mastered</span>
          <span style="display:inline-flex;gap:6px;align-items:center"><span class="status-dot learning"></span>Learning</span>
          <span style="display:inline-flex;gap:6px;align-items:center"><span class="status-dot new"></span>New</span>
        </div>
        <div class="mastery-map">
          ${ALPHABET.map((sign) => mapTile(sign)).join("")}
        </div>
        <span class="text-label" style="display:block;margin:18px 0 10px">Phrases</span>
        <div class="mastery-map phrases">
          ${PHRASES.map((sign) => mapTile(sign)).join("")}
        </div>
      </section>
    </div>

    <section class="card">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:16px">
        <h3>Every sign, scored</h3>
        <select class="select" style="width:auto" data-sort aria-label="Sort signs">
          <option value="alpha">A – Z</option>
          <option value="scoreDesc">Best score, high first</option>
          <option value="scoreAsc">Best score, low first</option>
          <option value="attempts">Most practiced</option>
          <option value="recent">Most recent</option>
        </select>
      </div>
      <div data-rows style="display:grid"></div>
    </section>
  </div>`;

  function mapTile(sign) {
    const sp = store.signProgress(sign.id);
    const bg = sp.status === "mastered" ? "var(--success)" : sp.status === "learning" ? "var(--warning)" : "var(--surface-elevated)";
    const fg = sp.status === "new" ? "var(--text-muted)" : "#10201A";
    return `<button data-sign="${sign.id}" title="${sign.name}: ${STATUS_META[sp.status].label}${sp.attempts ? `, best ${sp.best_score}%` : ""}"
      style="border-radius:10px;background:${bg};color:${fg};font-family:var(--font-mono);font-weight:700;font-size:${sign.name.length > 1 ? 11 : 15}px;padding:10px 4px;min-height:44px">${sign.name}</button>`;
  }

  function drawCalendar() {
    $("[data-month-label]", mount).textContent = `${MONTHS[viewMonth]} ${viewYear}`;
    $("[data-calendar]", mount).innerHTML = calendarHTML(viewYear, viewMonth, { large: true });
    bindDayClicks(mount);
    const isCurrent = viewYear === now.getFullYear() && viewMonth === now.getMonth();
    $("[data-next]", mount).disabled = isCurrent;
    $("[data-next]", mount).style.opacity = isCurrent ? 0.35 : 1;
  }
  drawCalendar();
  $("[data-prev]", mount).onclick = () => { viewMonth--; if (viewMonth < 0) { viewMonth = 11; viewYear--; } drawCalendar(); };
  $("[data-next]", mount).onclick = () => { viewMonth++; if (viewMonth > 11) { viewMonth = 0; viewYear++; } drawCalendar(); };

  function drawRows() {
    $("[data-rows]", mount).innerHTML = perSignRows(sortBy).map(({ sign, sp }) => `
      <button class="list-row" data-sign="${sign.id}" style="border-bottom:1px solid var(--border);border-radius:0;padding:12px 8px">
        <span class="sign-tile__glyph" style="font-size:${sign.name.length > 1 ? 15 : 22}px;min-width:64px;text-align:left">${sign.name}</span>
        <span class="status-dot ${STATUS_META[sp.status].dot}"></span>
        <span class="progress-bar" style="flex:1"><span class="progress-bar__fill ${sp.best_score >= 90 ? "success" : sp.best_score >= 70 ? "teal" : "warning"}" style="display:block;width:${sp.best_score}%"></span></span>
        <span class="text-mono" style="min-width:52px;text-align:right">${sp.best_score}%</span>
        <span class="hide-mobile">${starsHTML(starsFor(sp.best_score), true)}</span>
        <span class="text-small text-muted hide-mobile" style="min-width:92px;text-align:right">${sp.attempts} attempts</span>
      </button>`).join("");
    mount.querySelectorAll("[data-rows] [data-sign], .mastery-map [data-sign]").forEach((b) => b.onclick = () => navigate(`#/sign/${b.dataset.sign}`));
  }
  drawRows();
  $("[data-sort]", mount).onchange = (e) => { sortBy = e.target.value; drawRows(); };

  setSiggy(s.mastered ? "happy" : "encouraging",
    s.mastered ? `${s.mastered} sign${s.mastered === 1 ? "" : "s"} mastered — the green is spreading!`
               : "Your map fills in as scores climb. One sign at a time.");
}

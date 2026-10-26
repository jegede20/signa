/* ============================================================
   SIGNA — core/store.js · tiny central app state with pub/sub
   ============================================================ */
import * as storage from "./storage.js";

export const store = {
  settings: storage.loadSettings(),
  progress: null,
  streak: null,
  stats: null,
  dayLog: null,
  ready: false,
  _subs: new Set(),

  subscribe(fn) { this._subs.add(fn); return () => this._subs.delete(fn); },
  emit(what = "update") { for (const fn of [...this._subs]) { try { fn(what); } catch (e) { console.error(e); } } },

  async loadAll() {
    const [progress, streak, stats, dayLog] = await Promise.all([
      storage.loadProgress(), storage.loadStreak(), storage.loadStats(), storage.loadDayLog(),
    ]);
    this.progress = progress; this.streak = streak; this.stats = stats; this.dayLog = dayLog;
    this.ready = true;
    this.emit("loaded");
  },

  async persistProgress() { await storage.saveProgress(this.progress); this.emit("progress"); },
  async persistStreak() { await storage.saveStreak(this.streak); this.emit("streak"); },
  async persistStats() { await storage.saveStats(this.stats); this.emit("stats"); },
  async persistDayLog() { await storage.saveDayLog(this.dayLog); this.emit("daylog"); },

  setSettings(patch) {
    this.settings = { ...this.settings, ...patch };
    storage.saveSettings(this.settings);
    this.emit("settings");
  },

  signProgress(id) {
    return this.progress?.signs?.[id] || { status: "new", best_score: 0, last_score: 0, attempts: 0, score_history: [], sessions_mastered: 0 };
  },

  async resetAll() {
    await storage.resetAllData();
    await this.loadAll();
    this.emit("reset");
  },
};

/* Small DOM helpers shared across screens */
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export function el(html) {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}
export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const todayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
export const lerp = (a, b, t) => a + (b - a) * t;

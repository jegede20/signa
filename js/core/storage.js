/* ============================================================
   SIGNA — core/storage.js
   localStorage: theme, dominant hand, settings object.
   IndexedDB `signa_db`: user_progress, streak, stats, day_log.
   Falls back to localStorage if IndexedDB is unavailable.
   ============================================================ */
import { SIGNS } from "../../data/signs.js";
import { MODULES } from "../../data/modules.js";

/* ---------------- settings (localStorage) ---------------- */
export const DEFAULT_SETTINGS = {
  cameraFacing: "user",        // "user" front | "environment" back
  dominantHand: "right",       // "right" | "left"
  verbosity: "detailed",       // "detailed" | "simple"
  showSkeleton: true,
  showScoreRing: true,
  showSiggy: true,
  siggyReactions: true,
};

export function loadSettings() {
  try {
    const raw = JSON.parse(localStorage.getItem("signa_settings") || "{}");
    const hand = localStorage.getItem("signa_dominant_hand");
    return { ...DEFAULT_SETTINGS, ...raw, ...(hand ? { dominantHand: hand } : {}) };
  } catch { return { ...DEFAULT_SETTINGS }; }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem("signa_settings", JSON.stringify(settings));
    localStorage.setItem("signa_dominant_hand", settings.dominantHand);
  } catch { /* storage full / private mode */ }
}

/* ---------------- defaults ---------------- */
export function defaultProgress() {
  const signs = {};
  for (const s of SIGNS) {
    signs[s.id] = { status: "new", best_score: 0, last_score: 0, attempts: 0, last_practiced: null, score_history: [], sessions_mastered: 0 };
  }
  const modules = {};
  for (const m of MODULES) modules[m.id] = { status: m.id === 1 ? "in_progress" : "locked", avg_score: 0, quiz_best: 0 };
  return { signs, modules, last_sign: null, last_route: null };
}
export const defaultStreak = () => ({ current: 0, longest: 0, last_practiced: null, history: [] });
export const defaultStats = () => ({ total_sessions: 0, total_signs_attempted: 0, favorite_sign: null, certified: false });
export const defaultDayLog = () => ({}); // { "2026-10-24": { signs: {A: n}, attempts: n, best: n } }

/* ---------------- IndexedDB layer ---------------- */
const DB_NAME = "signa_db";
const STORES = ["user_progress", "streak", "stats", "day_log"];
let dbPromise = null;
let idbBroken = false;

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) return reject(new Error("no-idb"));
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const name of STORES) if (!db.objectStoreNames.contains(name)) db.createObjectStore(name, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

async function idbGet(store) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).get("main");
    req.onsuccess = () => resolve(req.result?.value ?? null);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(store, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).put({ id: "main", value });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbClearAll() {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORES, "readwrite");
    for (const name of STORES) tx.objectStore(name).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

/* localStorage fallback mirrors the same keys */
const lsKey = (store) => `signa_idb_${store}`;
async function getStore(store, fallbackFactory) {
  if (!idbBroken) {
    try {
      const v = await idbGet(store);
      if (v != null) return v;
    } catch { idbBroken = true; }
  }
  try {
    const raw = localStorage.getItem(lsKey(store));
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return fallbackFactory();
}

async function setStore(store, value) {
  if (!idbBroken) {
    try { await idbSet(store, value); return; } catch { idbBroken = true; }
  }
  try { localStorage.setItem(lsKey(store), JSON.stringify(value)); } catch { /* ignore */ }
}

/* ---------------- public API ---------------- */
export const loadProgress = () => getStore("user_progress", defaultProgress).then(mergeProgressDefaults);
export const saveProgress = (p) => setStore("user_progress", p);
export const loadStreak = () => getStore("streak", defaultStreak);
export const saveStreak = (s) => setStore("streak", s);
export const loadStats = () => getStore("stats", defaultStats);
export const saveStats = (s) => setStore("stats", s);
export const loadDayLog = () => getStore("day_log", defaultDayLog);
export const saveDayLog = (d) => setStore("day_log", d);

/** Fill in any newly added signs/modules for returning users. */
function mergeProgressDefaults(p) {
  const d = defaultProgress();
  if (!p || typeof p !== "object") return d;
  p.signs = { ...d.signs, ...(p.signs || {}) };
  p.modules = { ...d.modules, ...(p.modules || {}) };
  return p;
}

export async function resetAllData() {
  try { if (!idbBroken) await idbClearAll(); } catch { /* ignore */ }
  try { for (const name of STORES) localStorage.removeItem(lsKey(name)); } catch { /* ignore */ }
}

export async function exportAllData() {
  const [progress, streak, stats, dayLog] = await Promise.all([loadProgress(), loadStreak(), loadStats(), loadDayLog()]);
  return { app: "Signa", exported_at: new Date().toISOString(), settings: loadSettings(), progress, streak, stats, day_log: dayLog };
}

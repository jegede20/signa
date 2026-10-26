/* ============================================================
   SIGNA — progress/stats.js · aggregate stats computation
   ============================================================ */
import { store } from "../core/store.js";
import { SIGNS } from "../../data/signs.js";
import { starsFor } from "./mastery.js";

export function computeStats() {
  const signs = store.progress?.signs || {};
  const entries = SIGNS.map((s) => ({ sign: s, sp: signs[s.id] })).filter((e) => e.sp);
  const mastered = entries.filter((e) => e.sp.status === "mastered").length;
  const learning = entries.filter((e) => e.sp.status === "learning").length;
  const attempted = entries.filter((e) => e.sp.attempts > 0);
  const avgBest = attempted.length
    ? Math.round(attempted.reduce((a, e) => a + e.sp.best_score, 0) / attempted.length) : 0;
  return {
    totalSigns: SIGNS.length,
    alphabetTotal: 26,
    mastered, learning,
    fresh: entries.length - mastered - learning,
    avgBest,
    sessions: store.stats?.total_sessions || 0,
    attempts: store.stats?.total_signs_attempted || 0,
    streak: store.streak?.current || 0,
    longestStreak: store.streak?.longest || 0,
    favorite: store.stats?.favorite_sign || null,
    certified: !!store.stats?.certified,
    lastSign: store.progress?.last_sign || null,
  };
}

/** Sortable per-sign table rows for the Progress screen. */
export function perSignRows(sortBy = "alpha") {
  const rows = SIGNS.map((s) => {
    const sp = store.signProgress(s.id);
    return { sign: s, sp, stars: starsFor(sp.best_score) };
  });
  const by = {
    alpha: (a, b) => a.sign.name.localeCompare(b.sign.name),
    scoreDesc: (a, b) => b.sp.best_score - a.sp.best_score,
    scoreAsc: (a, b) => a.sp.best_score - b.sp.best_score,
    attempts: (a, b) => b.sp.attempts - a.sp.attempts,
    recent: (a, b) => String(b.sp.last_practiced || "").localeCompare(String(a.sp.last_practiced || "")),
  };
  return rows.sort(by[sortBy] || by.alpha);
}

/** Signs most worth drilling: attempted-but-weak first, then new. */
export function weakestSigns(limit = 5) {
  return SIGNS
    .map((s) => ({ sign: s, sp: store.signProgress(s.id) }))
    .filter((e) => e.sp.status !== "mastered")
    .sort((a, b) => (a.sp.attempts === 0) - (b.sp.attempts === 0) || a.sp.best_score - b.sp.best_score)
    .slice(0, limit)
    .map((e) => e.sign);
}

export function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

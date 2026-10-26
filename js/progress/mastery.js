/* ============================================================
   SIGNA — progress/mastery.js
   Star thresholds, sign status, module completion, unlocks.
   Mastered = >=90% in 2+ separate scored attempts. This is a
   learning-progress label, not a certification of fluency.
   ============================================================ */
import { store, todayKey } from "../core/store.js";
import { MODULES, moduleOfSign } from "../../data/modules.js";
import { isModuleUnlocked, QUIZ_PASS_MARK } from "../../data/curriculum.js";
import { logPracticeDay } from "./streak.js";

export function starsFor(score) {
  if (score >= 90) return 3;
  if (score >= 70) return 2;
  if (score >= 50) return 1;
  return 0;
}

export function ratingLabel(score) {
  if (score >= 90) return "Excellent";
  if (score >= 70) return "In Progress";
  if (score >= 50) return "Keep Practicing";
  return "Try Again";
}

export function statusFor(sp) {
  if ((sp?.sessions_mastered || 0) >= 2 && (sp?.best_score || 0) >= 90) return "mastered";
  if ((sp?.best_score || 0) >= 50) return "learning";
  return "new";
}

export const STATUS_META = {
  mastered: { label: "Mastered", badge: "badge-mastered", dot: "mastered" },
  learning: { label: "Learning", badge: "badge-learning", dot: "learning" },
  new: { label: "New", badge: "badge-new", dot: "new" },
  locked: { label: "Locked", badge: "badge-locked", dot: "new" },
};

/**
 * Record one scored attempt. Returns { signProgress, becameMastered, improved }.
 * Also logs the practice day (streak + day log) and updates stats.
 */
export async function recordAttempt(signId, score, { countSession = true } = {}) {
  const p = store.progress;
  const sp = p.signs[signId];
  const wasMastered = sp.status === "mastered";
  const prevBest = sp.best_score || 0;

  sp.attempts += 1;
  sp.last_score = Math.round(score);
  sp.best_score = Math.max(sp.best_score || 0, Math.round(score));
  sp.last_practiced = todayKey();
  sp.score_history = [...(sp.score_history || []), Math.round(score)].slice(-30);
  if (score >= 90) sp.sessions_mastered = (sp.sessions_mastered || 0) + 1;
  sp.status = statusFor(sp);
  p.last_sign = signId;

  store.stats.total_signs_attempted += 1;
  if (countSession) store.stats.total_sessions += 1;
  // favourite = most attempted sign
  store.stats.favorite_sign = Object.entries(p.signs).sort((a, b) => b[1].attempts - a[1].attempts)[0]?.[0] || null;

  await Promise.all([store.persistProgress(), store.persistStats(), logPracticeDay(signId, score)]);

  return { signProgress: sp, becameMastered: !wasMastered && sp.status === "mastered", improved: sp.best_score > prevBest };
}

/** Recompute a module's average from best scores. */
export function moduleAvg(module) {
  const vals = module.signs.map((id) => store.progress.signs[id]?.best_score || 0);
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

export function moduleStatus(module) {
  const mp = store.progress.modules[module.id];
  if (mp?.status === "completed") return "completed";
  if (!isModuleUnlocked(module.id, store.progress.modules)) return "locked";
  return "in_progress";
}

/** After a quiz: pass at >=70% completes the module and unlocks the next. */
export async function recordQuizResult(moduleId, avgScore) {
  const mp = store.progress.modules[moduleId];
  mp.quiz_best = Math.max(mp.quiz_best || 0, Math.round(avgScore));
  mp.avg_score = moduleAvg(MODULES.find((m) => m.id === Number(moduleId)));
  let unlockedNext = null;
  if (avgScore >= QUIZ_PASS_MARK) {
    mp.status = "completed";
    const next = MODULES.find((m) => m.id === Number(moduleId) + 1);
    if (next && store.progress.modules[next.id].status === "locked") {
      store.progress.modules[next.id].status = "in_progress";
      unlockedNext = next;
    }
    if (Number(moduleId) === 5) { store.stats.certified = true; await store.persistStats(); }
  }
  await store.persistProgress();
  return { passed: avgScore >= QUIZ_PASS_MARK, unlockedNext };
}

export function signModuleUnlocked(signId) {
  const m = moduleOfSign(signId);
  return m ? isModuleUnlocked(m.id, store.progress.modules) : true;
}

/** Lightweight confetti burst (no library). Colors are solid brand tones. */
export function confettiBurst(x = window.innerWidth / 2, y = window.innerHeight / 3) {
  const colors = ["#7C3AED", "#14B8A6", "#F59E0B", "#10B981", "#F9FAFB"];
  for (let i = 0; i < 26; i++) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    const angle = Math.random() * Math.PI * 2;
    const dist = 90 + Math.random() * 190;
    piece.style.left = `${x}px`; piece.style.top = `${y}px`;
    piece.style.background = colors[i % colors.length];
    piece.style.setProperty("--cx", `${Math.cos(angle) * dist}px`);
    piece.style.setProperty("--cy", `${Math.sin(angle) * dist + 170}px`);
    piece.style.setProperty("--cr", `${Math.random() * 540 - 270}deg`);
    document.body.appendChild(piece);
    setTimeout(() => piece.remove(), 850);
  }
}

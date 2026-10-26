/* ============================================================
   SIGNA — data/curriculum.js
   Lesson order + the unlock chain. Module 1 is open by
   default; each next module unlocks when the previous
   module's quiz is passed at >=70% average.
   ============================================================ */
import { MODULES } from "./modules.js";

export const QUIZ_PASS_MARK = 70;

/** Flat list of sign ids in teaching order. */
export const LESSON_ORDER = MODULES.flatMap((m) => m.signs);

/** Next sign in the curriculum after `signId` (or null at the end). */
export function nextSignId(signId) {
  const i = LESSON_ORDER.indexOf(signId);
  return i >= 0 && i < LESSON_ORDER.length - 1 ? LESSON_ORDER[i + 1] : null;
}

/** A module is unlocked if it is Module 1 or the previous quiz passed. */
export function isModuleUnlocked(moduleId, modulesProgress) {
  if (Number(moduleId) === 1) return true;
  const prev = modulesProgress?.[Number(moduleId) - 1];
  return prev?.status === "completed";
}

/** Quiz unlocks once every sign in the module has been attempted. */
export function isQuizReady(module, signsProgress) {
  return module.signs.every((id) => (signsProgress?.[id]?.attempts || 0) > 0);
}

/** First sign the learner has not yet got to >=50% in an unlocked module. */
export function nextLessonTarget(progress) {
  for (const m of MODULES) {
    if (!isModuleUnlocked(m.id, progress?.modules)) break;
    for (const id of m.signs) {
      if ((progress?.signs?.[id]?.best_score || 0) < 50) return { module: m, signId: id };
    }
    if (progress?.modules?.[m.id]?.status !== "completed") return { module: m, signId: m.signs[0], quizRecommended: isQuizReady(m, progress?.signs) };
  }
  return null;
}

/* ============================================================
   SIGNA — recognition/templates/alphabet.js
   Reference templates A–Z, built from data/signs.js so the
   curriculum, avatar and scorer always agree on a shape.
   A template = expected curl per finger + extra checks.
   ============================================================ */
import { ALPHABET, FINGERS, STATE_CURL } from "../../../data/signs.js";

export function templateFor(sign) {
  const curl = {};
  FINGERS.forEach((f, i) => { curl[f] = STATE_CURL[sign.pose[i]]; });
  return { signId: sign.id, curl, extras: sign.extras || {} };
}

export const ALPHABET_TEMPLATES = Object.fromEntries(ALPHABET.map((s) => [s.id, templateFor(s)]));

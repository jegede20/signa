/* ============================================================
   SIGNA — avatar/poses/alphabet.js
   Pose stages for the avatar demo. A demo plays:
   stage 0 open hand → stage 1 half-formed → stage 2 final.
   Poses are the 5-char strings from data/signs.js
   [thumb, index, middle, ring, pinky]: E C H K.
   ============================================================ */
import { ALPHABET } from "../../../data/signs.js";

export const ALPHABET_POSES = Object.fromEntries(ALPHABET.map((s) => [s.id, s.pose]));

export function stagePose(pose, stage) {
  if (stage >= 2) return pose;
  if (stage === 0) return "EEEEE";
  // stage 1: curled/hooked fingers pause at half-bent
  return pose.split("").map((c) => (c === "C" || c === "K" ? "H" : c)).join("");
}

export const STAGE_LABELS = ["Start with an open hand", "Begin shaping the sign", "Hold the final shape"];

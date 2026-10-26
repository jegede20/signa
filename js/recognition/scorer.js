/* ============================================================
   SIGNA — recognition/scorer.js
   Compares extracted features to a sign template.
   Every feature scores 0–100; the final score is the
   weighted average. Finger weights favour thumb/index
   (they carry most letter distinctions); extra checks
   (touch, crossing, direction...) add their own weight.
   ============================================================ */
import { FINGERS, FINGER_LABELS, STATE_NAMES, poseByFinger } from "../../data/signs.js";
import { templateFor } from "./templates/alphabet.js";

const FINGER_WEIGHTS = { thumb: 20, index: 24, middle: 20, ring: 17, pinky: 19 };
const EXTRA_WEIGHTS = { thumbTouch: 26, crossed: 24, point: 16, spread: 16, thumbPos: 16 };
const clamp100 = (v) => Math.round(Math.min(100, Math.max(0, v)));

function curlScore(actual, expected) {
  const diff = Math.abs(actual - expected);
  // Half-bent targets get a wider tolerance band
  const slope = expected === 0.5 ? 125 : 145;
  return clamp100(100 - diff * slope);
}

function spreadScore(value, mode) {
  if (mode === "together") return clamp100(100 - Math.max(0, value - 0.5) * 190);
  return clamp100(100 - Math.max(0, 0.72 - value) * 190);
}

/**
 * @returns {{ total:number, features:Array<{id,label,score,weight}> }}
 */
export function scoreFeatures(features, sign) {
  const template = templateFor(sign);
  const states = poseByFinger(sign);
  const out = [];

  for (const finger of FINGERS) {
    out.push({
      id: finger,
      label: `${cap(FINGER_LABELS[finger])} ${STATE_NAMES[states[finger]]}`,
      score: curlScore(features.curl[finger] ?? 1, template.curl[finger]),
      weight: FINGER_WEIGHTS[finger],
      kind: "finger",
      expectedState: states[finger],
    });
  }

  const ex = template.extras;
  if (ex.spread) {
    const extended = FINGERS.filter((f) => states[f] === "E");
    out.push({
      id: "spread",
      label: ex.spread === "together" ? "Fingers together" : "Fingers spread",
      score: spreadScore(features.spreadBetween(extended), ex.spread),
      weight: EXTRA_WEIGHTS.spread, kind: "extra",
    });
  }
  if (ex.thumbTouch) {
    const d = features.thumbTouchDist[ex.thumbTouch] ?? 1.5;
    out.push({
      id: "thumbTouch",
      label: `Thumb touches ${FINGER_LABELS[ex.thumbTouch]}`,
      score: clamp100(100 - Math.max(0, d - 0.32) * 150),
      weight: EXTRA_WEIGHTS.thumbTouch, kind: "extra",
    });
  }
  if (typeof ex.thumbPos === "number") {
    out.push({
      id: "thumbPos",
      label: "Thumb position",
      score: clamp100(100 - Math.abs((features.thumbAcross ?? 0) - ex.thumbPos) * 235),
      weight: EXTRA_WEIGHTS.thumbPos, kind: "extra",
    });
  }
  if (ex.point) {
    const target = ex.point === "up" ? { x: 0, y: -1 } : ex.point === "down" ? { x: 0, y: 1 } : null;
    let s;
    if (target) {
      const dot = features.pointVec.x * target.x + features.pointVec.y * target.y;
      s = clamp100(((dot + 0.15) / 1.15) * 100);
    } else {
      s = clamp100(((Math.abs(features.pointVec.x) - 0.1) / 0.9) * 100);
    }
    out.push({
      id: "point",
      label: ex.point === "up" ? "Points up" : ex.point === "down" ? "Points down" : "Points sideways",
      score: s, weight: EXTRA_WEIGHTS.point, kind: "extra",
    });
  }
  if (ex.crossed) {
    out.push({
      id: "crossed", label: "Fingers crossed",
      score: features.crossed ? 100 : 12,
      weight: EXTRA_WEIGHTS.crossed, kind: "extra",
    });
  }

  const totalWeight = out.reduce((a, f) => a + f.weight, 0);
  const total = clamp100(out.reduce((a, f) => a + f.score * f.weight, 0) / totalWeight);
  return { total, features: out };
}

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

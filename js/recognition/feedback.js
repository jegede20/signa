/* ============================================================
   SIGNA — recognition/feedback.js
   Priority tip engine: ONE tip at a time, always the worst
   scoring feature first. Fingers that need the same fix are
   grouped into a single sentence so it never feels naggy.
   ============================================================ */
import { FINGER_LABELS } from "../../data/signs.js";

const PRAISE = [
  "Perfect — hold that shape!",
  "That is spot on. Beautiful signing!",
  "Nailed it. Your handshape looks great!",
];
const CLOSE = [
  "So close — one small tweak to go.",
  "Almost there, keep adjusting slowly.",
];

function joinNames(names) {
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

const shortName = (f) => ({ thumb: "thumb", index: "index", middle: "middle", ring: "ring", pinky: "pinky" }[f]);

function fingerTip(state, fingers) {
  const names = fingers.map(shortName);
  const list = joinNames(names);
  const plural = fingers.length > 1;
  switch (state) {
    case "E": return plural ? `Straighten your ${list} fingers — point them tall.` : `Straighten your ${list}${fingers[0] === "thumb" || fingers[0] === "pinky" ? "" : " finger"} — point it tall.`;
    case "C": return plural ? `Curl your ${list} fingers down into your palm.` : `Curl your ${list} down into your palm.`;
    case "H": return `Half-bend your ${list} — not fully open, not fully closed.`;
    case "K": return `Hook your ${list} finger like a claw — bent, not straight.`;
    default: return `Adjust your ${list}.`;
  }
}

function extraTip(feature, sign) {
  const ex = sign.extras || {};
  switch (feature.id) {
    case "spread":
      return ex.spread === "together"
        ? "Press your raised fingers together — close the gaps."
        : "Spread your raised fingers wider apart.";
    case "thumbTouch":
      return `Bring your thumb tip to touch your ${FINGER_LABELS[ex.thumbTouch]} tip.`;
    case "thumbPos":
      if (ex.thumbPos <= 0.1) return "Rest your thumb tall against the side of your index finger.";
      if (ex.thumbPos >= 0.65) return "Slide your thumb further under, toward your ring finger.";
      return "Reposition your thumb across the front of your curled fingers.";
    case "point":
      return ex.point === "up" ? "Rotate your hand so the finger points up."
        : ex.point === "down" ? "Flip your wrist so the fingers point down at the floor."
        : "Rotate your hand so the index finger points sideways.";
    case "crossed":
      return "Cross your index and middle fingers over each other.";
    default:
      return "Adjust your hand position slowly and watch the guide.";
  }
}

/**
 * @param {{total, features}} result  output of scoreFeatures
 * @param {object} sign               sign definition
 * @returns {{ text:string, level:"good"|"close"|"fix", featureId:string|null }}
 */
export function pickTip(result, sign) {
  if (!result) return { text: "Show your hand to the camera to begin.", level: "fix", featureId: null };
  if (result.total >= 90) {
    return { text: PRAISE[Math.floor(Math.random() * PRAISE.length)], level: "good", featureId: null };
  }

  const sorted = [...result.features].sort((a, b) => a.score - b.score);
  const worst = sorted[0];

  let text;
  if (worst.kind === "finger") {
    // Group other failing fingers that want the same state
    const group = result.features
      .filter((f) => f.kind === "finger" && f.expectedState === worst.expectedState && f.score < 72)
      .map((f) => f.id);
    text = fingerTip(worst.expectedState, group.length ? group : [worst.id]);
  } else {
    text = extraTip(worst, sign);
  }

  if (result.total >= 78) text = `${CLOSE[Math.floor(Math.random() * CLOSE.length)]} ${text}`;
  return { text, level: result.total >= 70 ? "close" : "fix", featureId: worst.id };
}

/** Mood bucket for Siggy from a live score. */
export function moodForScore(score, hasHand) {
  if (!hasHand) return "neutral";
  if (score >= 90) return "celebrating";
  if (score >= 70) return "happy";
  if (score >= 50) return "encouraging";
  return "thinking";
}

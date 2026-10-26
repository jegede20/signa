/* ============================================================
   SIGNA — recognition/features.js
   Turns 21 MediaPipe landmarks (x, y, z) into sign features:
   per-finger curl, fingertip spread, thumb contacts/position,
   pointing direction, finger crossing, palm facing, framing.

   Curl metric: straight-line distance MCP→TIP divided by the
   summed segment lengths. ~1 = straight (curl 0), lower when
   bent (curl → 1). Rotation/scale invariant, works in 3D.
   ============================================================ */

export const LANDMARK = {
  WRIST: 0,
  THUMB: [1, 2, 3, 4],
  INDEX: [5, 6, 7, 8],
  MIDDLE: [9, 10, 11, 12],
  RING: [13, 14, 15, 16],
  PINKY: [17, 18, 19, 20],
};
const JOINTS = { thumb: LANDMARK.THUMB, index: LANDMARK.INDEX, middle: LANDMARK.MIDDLE, ring: LANDMARK.RING, pinky: LANDMARK.PINKY };
const TIPS = { thumb: 4, index: 8, middle: 12, ring: 16, pinky: 20 };
const MCPS = { thumb: 2, index: 5, middle: 9, ring: 13, pinky: 17 };

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, (a.z || 0) - (b.z || 0));
const dist2d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const clamp01 = (v) => Math.min(1, Math.max(0, v));

function fingerCurl(lm, joints) {
  const [a, b, c, d] = joints.map((i) => lm[i]);
  const straight = dist(a, d);
  const total = dist(a, b) + dist(b, c) + dist(c, d);
  if (total === 0) return 0;
  const ratio = straight / total; // 1 = perfectly straight
  return clamp01((0.97 - ratio) / 0.42);
}

/**
 * @param {Array<{x,y,z}>} lm 21 landmarks
 * @param {string} handedness "Left" | "Right" (MediaPipe label)
 */
export function extractFeatures(lm, handedness = "Right") {
  const curl = {};
  for (const [finger, joints] of Object.entries(JOINTS)) curl[finger] = fingerCurl(lm, joints);

  const wrist = lm[0];
  const palmWidth = Math.max(dist2d(lm[MCPS.index], lm[MCPS.pinky]), 1e-6);
  const handSize = Math.max(dist(lm[0], lm[MCPS.middle]), 1e-6);

  // Fingertip spread among the four fingers (normalized by palm width)
  const fingerTips = ["index", "middle", "ring", "pinky"].map((f) => lm[TIPS[f]]);
  const pairGaps = [];
  for (let i = 0; i < 3; i++) pairGaps.push(dist2d(fingerTips[i], fingerTips[i + 1]) / palmWidth);
  const spreadAvg = pairGaps.reduce((a, b) => a + b, 0) / pairGaps.length;

  // Thumb-to-fingertip distances (touch detection, normalized by hand size)
  const thumbTouchDist = {};
  for (const f of ["index", "middle", "ring", "pinky"]) thumbTouchDist[f] = dist(lm[TIPS.thumb], lm[TIPS[f]]) / handSize;

  // Thumb position across the palm: project thumb tip onto indexMCP→pinkyMCP axis
  const ax = lm[MCPS.pinky].x - lm[MCPS.index].x;
  const ay = lm[MCPS.pinky].y - lm[MCPS.index].y;
  const axisLen2 = ax * ax + ay * ay || 1e-9;
  const thumbAcross = clamp01(((lm[TIPS.thumb].x - lm[MCPS.index].x) * ax + (lm[TIPS.thumb].y - lm[MCPS.index].y) * ay) / axisLen2);

  // Pointing direction of the index finger (image space: y grows downward)
  const pv = { x: lm[TIPS.index].x - lm[MCPS.index].x, y: lm[TIPS.index].y - lm[MCPS.index].y };
  const pvLen = Math.hypot(pv.x, pv.y) || 1e-6;
  const pointVec = { x: pv.x / pvLen, y: pv.y / pvLen };

  // Finger crossing (letter R): tips order flipped relative to knuckles along palm axis
  const proj = (p) => (p.x * ax + p.y * ay);
  const knuckleOrder = proj(lm[MCPS.index]) - proj(lm[MCPS.middle]);
  const tipOrder = proj(lm[TIPS.index]) - proj(lm[TIPS.middle]);
  const crossed = knuckleOrder * tipOrder < 0;

  // Palm facing: z of (indexMCP-wrist) × (pinkyMCP-wrist). |value| high = facing camera plane.
  const v1 = { x: lm[MCPS.index].x - wrist.x, y: lm[MCPS.index].y - wrist.y, z: (lm[MCPS.index].z || 0) - (wrist.z || 0) };
  const v2 = { x: lm[MCPS.pinky].x - wrist.x, y: lm[MCPS.pinky].y - wrist.y, z: (lm[MCPS.pinky].z || 0) - (wrist.z || 0) };
  const nz = v1.x * v2.y - v1.y * v2.x;
  const palmFacing = clamp01(Math.abs(nz) / (palmWidth * handSize) * 1.6);

  // Framing: all landmarks comfortably inside the image
  const margin = 0.015;
  const inFrame = lm.every((p) => p.x > margin && p.x < 1 - margin && p.y > margin && p.y < 1 - margin);

  // Spread measured only between a chosen set of fingertips (used per-sign)
  function spreadBetween(fingers) {
    const pts = fingers.filter((f) => f !== "thumb").map((f) => lm[TIPS[f]]);
    if (pts.length < 2) {
      // thumb+index case (L, G): use the angle proxy = tip distance / hand size
      return dist2d(lm[TIPS.thumb], lm[TIPS.index]) / (handSize * 1.4);
    }
    let sum = 0;
    for (let i = 0; i < pts.length - 1; i++) sum += dist2d(pts[i], pts[i + 1]) / palmWidth;
    return sum / (pts.length - 1);
  }

  return {
    curl,
    extended: Object.fromEntries(Object.entries(curl).map(([k, v]) => [k, v < 0.4])),
    tips: Object.fromEntries(Object.entries(TIPS).map(([k, i]) => [k, lm[i]])),
    spreadAvg, spreadBetween, thumbTouchDist, thumbAcross,
    pointVec, crossed, palmFacing, inFrame, handedness,
    palmWidth, handSize,
  };
}

/**
 * Build a features object manually (finger simulator, no camera).
 * curl values are 0..1 per finger; extras mirror the live shape.
 */
export function syntheticFeatures({ curl, spread = 0.7, thumbTouch = null, thumbAcross = 0.2, point = "up", crossed = false }) {
  const touch = { index: 1.2, middle: 1.3, ring: 1.4, pinky: 1.5 };
  if (thumbTouch) touch[thumbTouch] = 0.12;
  const pointVec = point === "up" ? { x: 0, y: -1 } : point === "down" ? { x: 0, y: 1 } : { x: 1, y: 0 };
  return {
    curl: { ...curl },
    extended: Object.fromEntries(Object.entries(curl).map(([k, v]) => [k, v < 0.4])),
    spreadAvg: spread, spreadBetween: () => spread,
    thumbTouchDist: touch, thumbAcross, pointVec,
    crossed, palmFacing: 0.9, inFrame: true, handedness: "Simulator",
  };
}

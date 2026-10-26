/* ============================================================
   SIGNA — avatar/demo.js
   Renders Siggy's schematic SVG hand for any sign from its
   pose data (same data the scorer uses), and a step player
   that animates open → shaping → final pose.

   The hand is intentionally a clear teaching diagram:
   violet hand, teal cuff, dashed annotation ring where the
   thumb must touch a fingertip. Hands rotate for signs that
   point sideways/down. Pure functions (no DOM at import)
   so static SVGs can be generated from this same code.
   ============================================================ */
import { stagePose } from "./poses/alphabet.js";

const VIOLET = "#7C3AED";
const DARK = "#6D28D9";
const TEAL = "#14B8A6";

/* Finger geometry: base x, length */
const FINGERS_GEO = {
  index: { x: 89, len: 76 },
  middle: { x: 111, len: 86 },
  ring: { x: 133, len: 78 },
  pinky: { x: 153, len: 58 },
};
const BASE_Y = 132;

function fingerPath(finger, state, lean) {
  const { x, len } = FINGERS_GEO[finger];
  const dir = x < 121 ? 1 : -1; // bend toward palm centre
  switch (state) {
    case "E": return { d: `M ${x} ${BASE_Y} L ${x + lean} ${BASE_Y - len}`, tip: { x: x + lean, y: BASE_Y - len } };
    case "H": {
      const y1 = BASE_Y - len * 0.52;
      return { d: `M ${x} ${BASE_Y} L ${x + lean * 0.5} ${y1} L ${x + lean * 0.5 + dir * 14} ${y1 + 18}`, tip: { x: x + lean * 0.5 + dir * 14, y: y1 + 18 } };
    }
    case "K": {
      const y1 = BASE_Y - len * 0.5;
      return { d: `M ${x} ${BASE_Y} L ${x} ${y1} L ${x + dir * 9} ${y1 + 22}`, tip: { x: x + dir * 9, y: y1 + 22 } };
    }
    default: /* C */
      return { d: `M ${x} ${BASE_Y} L ${x} ${BASE_Y - 19} L ${x + dir * 3} ${BASE_Y + 13}`, tip: { x: x + dir * 3, y: BASE_Y + 13 } };
  }
}

function thumbPath(state) {
  switch (state) {
    case "E": return { d: "M 80 178 L 52 134 L 40 94", tip: { x: 40, y: 94 } };
    case "H": return { d: "M 80 178 L 58 142 L 68 110", tip: { x: 68, y: 110 } };
    case "K": return { d: "M 80 178 L 60 146 L 74 128", tip: { x: 74, y: 128 } };
    default: /* C — across the palm */
      return { d: "M 78 182 L 106 158 L 136 152", tip: { x: 136, y: 152 } };
  }
}

/**
 * Full inline SVG string for a sign pose.
 * stage: 0 open · 1 shaping · 2 final. hand: "right" | "left".
 */
export function renderHandSVG(sign, { stage = 2, hand = "right", annotate = true, title = null } = {}) {
  const pose = stagePose(sign.pose, stage);
  const ex = sign.extras || {};
  const [tState, iState, mState, rState, pState] = pose.split("");

  // Fingertip lean: spread, together, or crossed (R)
  const leans = { index: 0, middle: 0, ring: 0, pinky: 0 };
  if (stage === 2 && ex.spread === "spread") { leans.index = -9; leans.middle = -2; leans.ring = 5; leans.pinky = 11; }
  if (stage === 2 && ex.crossed) { leans.index = 23; leans.middle = -15; }

  const fingers = [["index", iState], ["middle", mState], ["ring", rState], ["pinky", pState]]
    .map(([f, s]) => ({ f, ...fingerPath(f, s, leans[f]) }));
  const thumb = thumbPath(tState);
  const tipOf = Object.fromEntries([...fingers.map((f) => [f.f, f.tip]), ["thumb", thumb.tip]]);

  // Rotate whole hand for pointing direction
  let rotate = "";
  if (stage === 2 && ex.point === "side") rotate = "rotate(88 120 140)";
  if (stage === 2 && ex.point === "down") rotate = "rotate(176 120 140)";
  const mirror = hand === "left" ? "translate(240 0) scale(-1 1)" : "";

  // Thumb drawn across palm sits on top; otherwise behind fingers
  const thumbEl = `<path d="${thumb.d}" fill="none" stroke="${tState === "C" ? DARK : VIOLET}" stroke-width="19" stroke-linecap="round" stroke-linejoin="round"/>`;
  const fingerEls = fingers.map((f) =>
    `<path d="${f.d}" fill="none" stroke="${VIOLET}" stroke-width="19" stroke-linecap="round" stroke-linejoin="round"/>`).join("");
  const palm = `<rect x="70" y="116" width="98" height="106" rx="30" fill="${VIOLET}"/>
    <path d="M 92 168 Q 118 156 144 168" fill="none" stroke="#FFFFFF" stroke-opacity="0.28" stroke-width="4" stroke-linecap="round"/>
    <path d="M 94 192 Q 118 182 142 192" fill="none" stroke="#FFFFFF" stroke-opacity="0.2" stroke-width="4" stroke-linecap="round"/>`;
  const cuff = `<rect x="90" y="214" width="58" height="26" rx="12" fill="${TEAL}"/>`;

  let notes = "";
  if (annotate && stage === 2 && ex.thumbTouch && tipOf[ex.thumbTouch]) {
    const mx = (tipOf.thumb.x + tipOf[ex.thumbTouch].x) / 2;
    const my = (tipOf.thumb.y + tipOf[ex.thumbTouch].y) / 2;
    notes = `<circle cx="${mx}" cy="${my}" r="17" fill="none" stroke="${TEAL}" stroke-width="3.5" stroke-dasharray="6 6">
      <animate attributeName="stroke-dashoffset" from="0" to="24" dur="1.6s" repeatCount="indefinite"/></circle>`;
  }

  return `<svg viewBox="0 0 240 260" role="img" aria-label="${title || `Hand shape for ${sign.name}`}" xmlns="http://www.w3.org/2000/svg">
  <g transform="${mirror}"><g transform="${rotate}">
    ${cuff}
    ${tState === "C" ? `${palm}${fingerEls}${thumbEl}` : `${thumbEl}${palm}${fingerEls}`}
    ${notes}
  </g></g>
</svg>`;
}

/**
 * Step player: cycles stages inside `container` until stopped.
 * onStage(stageIndex) fires on each change. Returns { stop, replay, hold }.
 */
export function createDemoPlayer(container, sign, { hand = "right", interval = 1050, onStage = () => {}, loop = true } = {}) {
  let stage = 0;
  let timer = null;
  let stopped = false;

  function draw() {
    container.innerHTML = renderHandSVG(sign, { stage, hand });
    container.firstElementChild?.classList.add("demo-hand");
    const svg = container.querySelector("svg");
    if (svg) { svg.style.width = "100%"; svg.style.height = "auto"; }
    onStage(stage);
  }
  function tick() {
    if (stopped) return;
    stage += 1;
    if (stage > 2) {
      if (!loop) { stage = 2; return; }
      stage = 0;
    }
    draw();
    timer = setTimeout(tick, stage === 2 ? interval * 1.9 : interval);
  }
  draw();
  timer = setTimeout(tick, interval);

  return {
    stop() { stopped = true; clearTimeout(timer); },
    replay() { clearTimeout(timer); stopped = false; stage = 0; draw(); timer = setTimeout(tick, interval); },
    hold() { clearTimeout(timer); stopped = true; stage = 2; draw(); },
  };
}

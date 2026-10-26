/* ============================================================
   SIGNA — avatar/siggy.js
   Siggy the mascot: a flat lagoon-teal hand character with 5
   expressions driven by the live practice score.
     neutral · thinking (<50) · encouraging (50–69)
     happy (70–89) · celebrating (>=90 / mastery)
   ============================================================ */
import { store } from "../core/store.js";

const LAGOON = "#0D9488";
const DARK = "#0B2420";

function face(mood) {
  const cheeks = `<circle cx="76" cy="128" r="8" fill="#F472B6" fill-opacity="0.65"/><circle cx="136" cy="128" r="8" fill="#F472B6" fill-opacity="0.65"/>`;
  switch (mood) {
    case "thinking":
      return `${cheeks}
        <circle cx="88" cy="108" r="9" fill="#fff"/><circle cx="124" cy="108" r="9" fill="#fff"/>
        <circle cx="91" cy="103" r="4" fill="${DARK}"/><circle cx="127" cy="103" r="4" fill="${DARK}"/>
        <path d="M 78 92 L 97 88" stroke="#fff" stroke-width="4" stroke-linecap="round"/>
        <path d="M 98 138 L 114 136" stroke="#fff" stroke-width="4.5" stroke-linecap="round"/>
        <circle cx="164" cy="52" r="4" fill="#fff" fill-opacity="0.9"/><circle cx="176" cy="36" r="6" fill="#fff" fill-opacity="0.9"/><circle cx="190" cy="18" r="8" fill="#fff" fill-opacity="0.95"/>`;
    case "encouraging":
      return `${cheeks}
        <circle cx="88" cy="108" r="9" fill="#fff"/><circle cx="124" cy="108" r="9" fill="#fff"/>
        <circle cx="88" cy="109" r="4.2" fill="${DARK}"/><circle cx="124" cy="109" r="4.2" fill="${DARK}"/>
        <path d="M 92 132 Q 106 144 120 132" fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round"/>`;
    case "happy":
      return `${cheeks}
        <path d="M 79 110 Q 88 99 97 110" fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round"/>
        <path d="M 115 110 Q 124 99 133 110" fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round"/>
        <path d="M 88 128 Q 106 150 124 128 Q 106 138 88 128 Z" fill="#fff"/>`;
    case "celebrating":
      return `${cheeks}
        <polygon points="88,98 91.5,105.5 99.5,106.5 93.5,111.5 95.5,119.5 88,115 80.5,119.5 82.5,111.5 76.5,106.5 84.5,105.5" fill="#F59E0B"/>
        <polygon points="124,98 127.5,105.5 135.5,106.5 129.5,111.5 131.5,119.5 124,115 116.5,119.5 118.5,111.5 112.5,106.5 120.5,105.5" fill="#F59E0B"/>
        <path d="M 86 126 Q 106 156 126 126 Q 106 140 86 126 Z" fill="#fff"/>
        <circle cx="26" cy="30" r="5" fill="#14B8A6"/><circle cx="176" cy="44" r="5" fill="#F59E0B"/>
        <rect x="16" y="120" width="9" height="14" rx="2" fill="#F59E0B" transform="rotate(-18 20 127)"/>
        <rect x="178" y="108" width="9" height="14" rx="2" fill="#14B8A6" transform="rotate(20 182 115)"/>`;
    default: /* neutral */
      return `${cheeks}
        <circle cx="88" cy="108" r="9" fill="#fff"/><circle cx="124" cy="108" r="9" fill="#fff"/>
        <circle cx="88" cy="109" r="4.2" fill="${DARK}"/><circle cx="124" cy="109" r="4.2" fill="${DARK}"/>
        <path d="M 96 136 L 116 136" stroke="#fff" stroke-width="4.5" stroke-linecap="round"/>`;
  }
}

/** Pure SVG string for one expression (also used to generate svg/siggy/*.svg). */
export function siggySVG(mood = "neutral") {
  const thumbWave = mood === "celebrating" || mood === "happy";
  return `<svg viewBox="0 0 212 212" role="img" aria-label="Siggy the Signa mascot, ${mood}" xmlns="http://www.w3.org/2000/svg">
  <rect x="62" y="16" width="21" height="58" rx="10.5" fill="${LAGOON}"/>
  <rect x="88" y="6" width="21" height="68" rx="10.5" fill="${LAGOON}"/>
  <rect x="114" y="12" width="21" height="62" rx="10.5" fill="${LAGOON}"/>
  <rect x="140" y="26" width="19" height="48" rx="9.5" fill="${LAGOON}"/>
  <rect x="20" y="96" width="20" height="52" rx="10" fill="${LAGOON}" transform="rotate(${thumbWave ? -34 : -18} 30 122)"/>
  <rect x="52" y="62" width="108" height="108" rx="36" fill="${LAGOON}"/>
  <g transform="translate(0 2)">${face(mood)}</g>
  <rect x="80" y="172" width="52" height="20" rx="10" fill="#F59E0B"/>
</svg>`;
}

export const SIGGY_MOODS = ["neutral", "thinking", "encouraging", "happy", "celebrating"];

let currentMood = "neutral";
let targets = []; // [{ art: Element, bubble: Element }]

export function registerSiggyTargets(list) { targets = list.filter((t) => t.art); paint(); }

function paint(message) {
  for (const t of targets) {
    if (t.art.dataset.mood !== currentMood) {
      t.art.style.opacity = "0";
      setTimeout(() => {
        t.art.innerHTML = siggySVG(currentMood);
        t.art.dataset.mood = currentMood;
        t.art.style.opacity = "1";
      }, 140);
    }
    if (message && t.bubble) {
      t.bubble.textContent = message;
      t.bubble.classList.remove("tip-enter");
      void t.bubble.offsetWidth; // restart animation
      t.bubble.classList.add("tip-enter");
    }
  }
}

/** Set Siggy's expression + speech bubble. Respects settings. */
export function setSiggy(mood, message) {
  const reactionsOn = store.settings?.siggyReactions !== false;
  currentMood = reactionsOn ? mood : "encouraging";
  paint(message);
}

export function celebrateSiggy(message = "You mastered a new sign!") {
  currentMood = "celebrating";
  paint(message);
  for (const t of targets) {
    t.art.classList.remove("siggy-bounce");
    void t.art.offsetWidth;
    t.art.classList.add("siggy-bounce");
    setTimeout(() => t.art.classList.remove("siggy-bounce"), 1900);
  }
}

export const getSiggyMood = () => currentMood;

/* ============================================================
   SIGNA — screens/session.js
   The shared live-practice session used by Lesson (Try),
   Module Quiz and Free Practice:
     camera → MediaPipe → features → score → tip → Siggy
   Falls back to a manual finger simulator when there is no
   camera, so the full scoring pipeline works everywhere.
   ============================================================ */
import { store, $, $$, clamp, lerp } from "../core/store.js";
import { icon } from "../core/icons.js";
import { startCamera, stopCamera, friendlyCameraError } from "../camera/camera.js";
import { initHandLandmarker, detectHands, isModelReady } from "../camera/mediapipe.js";
import { drawSkeleton, sizeCanvasToVideo, estimateBrightness } from "../camera/overlay.js";
import { extractFeatures, syntheticFeatures } from "../recognition/features.js";
import { scoreFeatures } from "../recognition/scorer.js";
import { pickTip, moodForScore } from "../recognition/feedback.js";
import { createDemoPlayer, renderHandSVG } from "../avatar/demo.js";
import { STAGE_LABELS } from "../avatar/poses/alphabet.js";
import { setSiggy } from "../avatar/siggy.js";
import { FINGERS, FINGER_LABELS } from "../../data/signs.js";

const RING_R = 54;
const RING_C = 2 * Math.PI * RING_R;

export function scoreRingHTML(label = "Score", small = false) {
  return `<div class="score-ring${small ? " sm" : ""}" data-ring role="img" aria-label="Live sign score">
    <svg viewBox="0 0 132 132" width="100%" height="100%">
      <circle class="score-ring__track" cx="66" cy="66" r="${RING_R}" fill="none" stroke-width="10"/>
      <circle class="score-ring__fill" data-ring-fill cx="66" cy="66" r="${RING_R}" fill="none" stroke-width="10"
        stroke-dasharray="${RING_C}" stroke-dashoffset="${RING_C}"/>
    </svg>
    <div class="score-ring__center"><div class="score-ring__value" data-ring-val>0%</div><div class="score-ring__label">${label}</div></div>
  </div>`;
}

function hexLerp(a, b, t) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const mix = pa.map((v, i) => Math.round(lerp(v, pb[i], t)));
  return `rgb(${mix[0]},${mix[1]},${mix[2]})`;
}

export function paintScoreRing(root, score) {
  const fill = $("[data-ring-fill]", root);
  const val = $("[data-ring-val]", root);
  if (!fill) return;
  const s = clamp(Math.round(score), 0, 100);
  fill.style.strokeDashoffset = String(RING_C * (1 - s / 100));
  fill.style.stroke = s >= 90 ? "#22C55E" : hexLerp("#F59E0B", "#14B8A6", s / 100);
  if (val) val.textContent = `${s}%`;
}

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export function createPracticeSession({
  mount, sign, showAvatar = true, avatarLoop = false,
  submitLabel = "Looks Good — Score Me", onSubmit = null, onScore = null,
}) {
  const hand = store.settings.dominantHand === "left" ? "left" : "right";
  mount.innerHTML = `
  <div class="session">
    <div class="session-grid${showAvatar ? "" : " single"}">
      ${showAvatar ? `
      <div>
        <div class="avatar-frame">
          <span class="avatar-frame__label">Guide — “${sign.name}”</span>
          <div data-demo style="width:min(64%,270px)"></div>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:10px">
          <span class="text-small text-secondary" data-stage-label>${STAGE_LABELS[2]}</span>
          <button class="btn btn-ghost btn-sm" data-replay>${icon("replay")} Replay demo</button>
        </div>
      </div>` : ""}
      <div>
        <div class="camera-frame">
          <video data-video playsinline muted aria-label="Your camera feed"></video>
          <canvas data-canvas></canvas>
          <span class="camera-pill" data-pill><span class="dot"></span><span data-pill-text>Camera off</span></span>
          <div class="camera-frame__placeholder" data-placeholder>
            <div style="display:grid;justify-items:center;gap:12px;width:min(380px,100%);max-width:380px">
              <span style="width:58px;height:58px;border-radius:16px;background:rgba(20,184,166,.22);color:#99F6E4;display:grid;place-items:center">${icon("video")}</span>
              <h3 style="color:#F9FAFB">Signa needs your camera</h3>
              <p class="text-small" style="color:#CBD5E1">Your video never leaves your device. Hand tracking runs 100% locally in your browser — nothing is uploaded or recorded.</p>
              <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center">
                <button class="btn btn-primary" data-allow>${icon("camera")} Allow Camera</button>
                <button class="btn btn-secondary" data-sim-open style="color:#99F6E4;border-color:#14B8A6">Use finger simulator</button>
              </div>
              <p class="text-small" data-cam-error style="color:#FCA5A5" hidden></p>
            </div>
          </div>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:10px;flex-wrap:wrap">
          <span class="text-small text-secondary" data-cam-status>${isModelReady() ? "Hand tracking ready." : "Hand tracking loads when the camera starts."}</span>
          <button class="btn btn-ghost btn-sm" data-switch hidden>${icon("switchCam")} Switch camera</button>
        </div>
      </div>
    </div>

    <div class="card" style="margin-top:16px;padding:20px">
      <div style="display:flex;gap:20px;flex-wrap:wrap;align-items:flex-start">
        ${store.settings.showScoreRing ? `<div style="display:grid;justify-items:center;gap:8px">${scoreRingHTML()}<span class="text-small text-secondary">Best: <strong class="text-mono" data-best>0%</strong></span></div>` : `<div style="display:grid;gap:2px"><span class="text-stat" data-current-num>0%</span><span class="text-label">Live score</span><span class="text-small text-secondary" style="margin-top:8px">Best: <strong class="text-mono" data-best-num>0%</strong></span></div>`}
        <div class="session-feedback">
          <div class="feedback-bar" data-feedback role="status" aria-live="polite">${icon("lightbulb")}<span data-tip>Enable your camera (or the simulator), then copy the guide's handshape.</span></div>
          <div data-meters style="display:grid;gap:8px" ${store.settings.verbosity === "simple" ? "hidden" : ""}></div>
        </div>
        <div class="session-actions">
          <button class="btn btn-primary" data-submit disabled>${icon("check")} ${submitLabel}</button>
          <button class="btn btn-secondary btn-sm" data-sim-open-2>${icon("hand")} Finger simulator</button>
          <p class="text-small text-muted" style="text-align:center">We save your <strong>best</strong> shape, not your last one.</p>
        </div>
      </div>
    </div>

    <div class="card" data-sim hidden style="margin-top:16px;padding:20px">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:6px">
        <h3 style="display:flex;align-items:center;gap:8px">${icon("hand")} Finger simulator</h3>
        <div class="sim-presets">
          <button class="btn btn-ghost btn-sm" data-preset="open">Open hand</button>
          <button class="btn btn-ghost btn-sm" data-preset="fist">Fist</button>
          <button class="btn btn-teal btn-sm" data-preset="match">${icon("target")} Match “${sign.name}”</button>
          <button class="btn btn-ghost btn-sm" data-preset="near">Almost…</button>
        </div>
      </div>
      <p class="text-small text-secondary" style="margin-bottom:14px">No camera? Bend each virtual finger and the same scoring engine grades you. Slide left = straight, right = fully curled.</p>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(160px,100%),1fr));gap:14px">
        ${FINGERS.map((f) => `<div class="field"><label for="sim-${f}">${cap(FINGER_LABELS[f])} <span class="text-muted" data-sim-val="${f}"></span></label>
          <input type="range" id="sim-${f}" data-sim-finger="${f}" min="0" max="100" value="0"></div>`).join("")}
        <div class="field"><label for="sim-spread">Finger spread</label><input type="range" id="sim-spread" data-sim-spread min="0" max="100" value="60"></div>
        <div class="field"><label for="sim-across">Thumb position across palm</label><input type="range" id="sim-across" data-sim-across min="0" max="100" value="15"></div>
        <div class="field"><label for="sim-touch">Thumb touching</label>
          <select class="select" id="sim-touch" data-sim-touch><option value="">Nothing</option><option value="index">Index tip</option><option value="middle">Middle tip</option><option value="pinky">Pinky tip</option></select></div>
        <div class="field"><label for="sim-point">Index points</label>
          <select class="select" id="sim-point" data-sim-point><option value="up">Up</option><option value="side">Sideways</option><option value="down">Down</option></select></div>
        <div class="field"><label>Index / middle crossed</label>
          <label class="switch"><input type="checkbox" data-sim-crossed><span class="switch__track"></span><span class="switch__thumb"></span></label></div>
      </div>
    </div>
  </div>`;

  const video = $("[data-video]", mount);
  const canvas = $("[data-canvas]", mount);
  const pill = $("[data-pill]", mount);
  const pillText = $("[data-pill-text]", mount);
  const pillDot = $(".dot", pill);
  const placeholder = $("[data-placeholder]", mount);
  const metersEl = $("[data-meters]", mount);
  const tipEl = $("[data-tip]", mount);
  const feedbackBar = $("[data-feedback]", mount);
  const submitBtn = $("[data-submit]", mount);
  const ringRoot = $("[data-ring]", mount) || mount;

  let stream = null, raf = 0, destroyed = false, source = "none"; // none|camera|simulator
  let lastTs = 0, lastVideoTime = -1, frameCount = 0, lastBright = 120;
  let displayed = 0, best = 0, bestResult = null;
  let lastTipText = "", lastTipAt = 0, lastMood = "";
  let demo = null;

  if (showAvatar) {
    const demoMount = $("[data-demo]", mount);
    const stageLabel = $("[data-stage-label]", mount);
    demo = createDemoPlayer(demoMount, sign, {
      hand, loop: avatarLoop,
      onStage: (s) => { if (stageLabel) stageLabel.textContent = STAGE_LABELS[s]; },
    });
    if (!avatarLoop) demo.hold();
    $("[data-replay]", mount)?.addEventListener("click", () => demo.replay());
  }

  function setPill(text, { on = false, warn = false, live = false } = {}) {
    pillText.textContent = text;
    pillDot.className = `dot${on ? " on" : ""}${live ? " live-dot" : ""}`;
    pill.classList.toggle("warn", warn);
  }

  function renderMeters(result) {
    if (!metersEl || metersEl.hidden) return;
    metersEl.innerHTML = result.features.map((f) => {
      const color = f.score >= 85 ? "var(--success)" : f.score >= 65 ? "var(--accent-2)" : f.score >= 45 ? "var(--warning)" : "var(--error)";
      return `<div class="meter"><span>${f.label}</span><span class="meter__track"><span class="meter__fill" style="display:block;width:${f.score}%;background:${color}"></span></span><span class="meter__val">${f.score}%</span></div>`;
    }).join("");
  }

  function applyResult(result, { hasHand = true, inFrame = true, bright = 120 } = {}) {
    const now = performance.now();
    if (!result) {
      displayed = lerp(displayed, 0, 0.12);
      paintScoreRing(ringRoot, displayed);
      const cur0 = $("[data-current-num]", mount); if (cur0) cur0.textContent = `${Math.round(displayed)}%`;
      if (now - lastTipAt > 600) { setTip("Show your hand to the camera, palm facing it, fingers in view.", "fix"); }
      setMoodThrottled("neutral", "Show me your hand and I will coach you.");
      setPill(bright < 35 ? "Low light — face a lamp or window" : "No hand detected", { warn: true });
      return;
    }

    if (result.total > best) { best = result.total; bestResult = result; }
    // Camera frames arrive at 60fps (smooth toward the score); simulator
    // updates are one-shot per input, so snap straight to the true value.
    displayed = source === "simulator" ? result.total : lerp(displayed, result.total, 0.4);
    if (Math.abs(displayed - result.total) < 1) displayed = result.total;
    paintScoreRing(ringRoot, displayed);
    const curEl = $("[data-current-num]", mount); if (curEl) curEl.textContent = `${Math.round(displayed)}%`;
    const bestEl = $("[data-best]", mount); if (bestEl) bestEl.textContent = `${best}%`;
    const bestNum = $("[data-best-num]", mount); if (bestNum) bestNum.textContent = `${best}%`;
    submitBtn.disabled = false;
    renderMeters(result);

    if (bright < 35) setPill("Low light — tracking may wobble", { on: true, warn: true });
    else if (!inFrame) setPill("Move your hand fully into frame", { on: true, warn: true });
    else setPill(source === "simulator" ? "Simulator live" : "Tracking your hand", { on: true, live: true });

    if (!inFrame && source === "camera") {
      setTipThrottled("Move your whole hand into the frame — fingertips and wrist in view.", "fix", now);
    } else {
      const tip = pickTip(result, sign);
      if (source === "simulator") {
        // One-shot updates: show the new tip/mood immediately, no throttling.
        if (tip.text !== lastTipText) setTip(tip.text, tip.level);
        const mood = moodForScore(result.total, hasHand);
        if (mood !== lastMood || tip.text !== lastTipText) { lastMood = mood; setSiggy(mood, tip.text); }
      } else {
        setTipThrottled(tip.text, tip.level, now);
        const mood = moodForScore(result.total, hasHand);
        setMoodThrottled(mood, tip.text);
      }
    }
    if (onScore) onScore({ score: result.total, best, result });
  }

  function setTip(text, level) {
    lastTipText = text; lastTipAt = performance.now();
    tipEl.textContent = text;
    feedbackBar.className = `feedback-bar${level === "good" ? " is-good" : level === "close" ? " is-warn" : ""}`;
    feedbackBar.classList.remove("tip-enter"); void feedbackBar.offsetWidth; feedbackBar.classList.add("tip-enter");
  }
  function setTipThrottled(text, level, now) {
    if (text !== lastTipText && now - lastTipAt > 450) setTip(text, level);
    else if (text === lastTipText) lastTipAt = now;
  }
  function setMoodThrottled(mood, msg) {
    if (mood !== lastMood) { lastMood = mood; setSiggy(mood, msg); }
  }

  /* ---------- camera loop ---------- */
  async function enableCamera() {
    const errEl = $("[data-cam-error]", mount);
    const statusEl = $("[data-cam-status]", mount);
    const allowBtn = $("[data-allow]", mount);
    errEl.hidden = true;
    allowBtn?.classList.add("is-loading");
    if (allowBtn) allowBtn.innerHTML = `<span class="spinner"></span> Starting…`;
    try {
      stopCamera(stream);
      stream = await startCamera(video, { facing: store.settings.cameraFacing });
      statusEl.textContent = "Camera on. Loading hand tracking…";
      await initHandLandmarker((s) => { statusEl.textContent = s; });
      if (destroyed) return;
      source = "camera";
      placeholder.hidden = true;
      if (allowBtn) { allowBtn.classList.remove("is-loading"); allowBtn.innerHTML = `${icon("camera")} Allow Camera`; }
      $("[data-switch]", mount).hidden = false;
      statusEl.textContent = "Tracking runs locally on your device.";
      lastVideoTime = -1; lastTs = 0;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(loop);
      setSiggy("encouraging", `Copy the guide and make “${sign.name}” — I am watching.`);
    } catch (err) {
      console.warn("Camera/model error:", err);
      errEl.textContent = friendlyCameraError(err);
      errEl.hidden = false;
      statusEl.textContent = "Camera unavailable — demos and simulator still work.";
      if (allowBtn) { allowBtn.classList.remove("is-loading"); allowBtn.innerHTML = `${icon("camera")} Try Camera Again`; }
      setSiggy("thinking", "No camera? No problem — try the finger simulator below.");
    }
  }

  function loop() {
    if (destroyed || source !== "camera") return;
    raf = requestAnimationFrame(loop);
    if (video.currentTime === lastVideoTime) return;
    lastVideoTime = video.currentTime;
    const ts = Math.max(performance.now(), lastTs + 1);
    lastTs = ts;
    const det = detectHands(video, ts);
    frameCount++;
    if (frameCount % 45 === 0) lastBright = estimateBrightness(video);
    const bright = lastBright;
    if (!det) {
      // keep last skeleton frozen briefly? clear for honesty
      const ctx = canvas.getContext("2d"); ctx && ctx.clearRect(0, 0, canvas.width, canvas.height);
      applyResult(null, { bright });
      return;
    }
    sizeCanvasToVideo(canvas, video);
    const features = extractFeatures(det.landmarks, det.handedness);
    const result = scoreFeatures(features, sign);
    if (store.settings.showSkeleton) drawSkeleton(canvas, det.landmarks, { good: result.total >= 85 });
    else { const ctx = canvas.getContext("2d"); ctx && ctx.clearRect(0, 0, canvas.width, canvas.height); }

    const wantHand = store.settings.dominantHand; // "right"/"left"
    if (det.handedness && det.handedness.toLowerCase() !== wantHand && frameCount % 90 === 0) {
      setTip(`That looks like your ${det.handedness.toLowerCase()} hand — your dominant hand is set to ${wantHand}. Either is fine here.`, "close");
    }
    applyResult(result, { inFrame: features.inFrame, bright });
  }

  /* ---------- simulator ---------- */
  const simPanel = $("[data-sim]", mount);
  function simFeatures() {
    const curl = {};
    $$("[data-sim-finger]", mount).forEach((r) => {
      curl[r.dataset.simFinger] = Number(r.value) / 100;
      const label = $(`[data-sim-val="${r.dataset.simFinger}"]`, mount);
      if (label) label.textContent = Number(r.value) < 30 ? "(straight)" : Number(r.value) > 70 ? "(curled)" : "(half)";
    });
    return syntheticFeatures({
      curl,
      spread: Number($("[data-sim-spread]", mount).value) / 100 * 1.1,
      thumbTouch: $("[data-sim-touch]", mount).value || null,
      thumbAcross: Number($("[data-sim-across]", mount).value) / 100,
      point: $("[data-sim-point]", mount).value,
      crossed: $("[data-sim-crossed]", mount).checked,
    });
  }
  function runSim() { source = "simulator"; applyResult(scoreFeatures(simFeatures(), sign), {}); }
  function openSim() {
    // Clean hand-off: if the camera is live, fully stop it so the session
    // has exactly one input source and the camera light turns off.
    if (stream) {
      cancelAnimationFrame(raf);
      stopCamera(stream);
      stream = null;
      placeholder.hidden = false;
      const switchBtn = $("[data-switch]", mount);
      if (switchBtn) switchBtn.hidden = true;
      const statusEl = $("[data-cam-status]", mount);
      if (statusEl) statusEl.textContent = "Simulator in use — Allow Camera switches back to live tracking.";
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      setPill("Simulator live", { on: true });
    }
    simPanel.hidden = false;
    simPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
    runSim();
  }
  function setSim(partial) {
    for (const [k, v] of Object.entries(partial.curl || {})) {
      const r = $(`[data-sim-finger="${k}"]`, mount); if (r) r.value = Math.round(v * 100);
    }
    if (partial.spread != null) $("[data-sim-spread]", mount).value = Math.round(partial.spread / 1.1 * 100);
    if (partial.across != null) $("[data-sim-across]", mount).value = Math.round(partial.across * 100);
    if (partial.touch !== undefined) $("[data-sim-touch]", mount).value = partial.touch || "";
    if (partial.point) $("[data-sim-point]", mount).value = partial.point;
    if (partial.crossed !== undefined) $("[data-sim-crossed]", mount).checked = partial.crossed;
    runSim();
  }
  simPanel.addEventListener("input", runSim);
  simPanel.addEventListener("change", runSim);
  $$("[data-preset]", mount).forEach((btn) => btn.addEventListener("click", () => {
    const ex = sign.extras || {};
    const curlFromPose = (jitter) => Object.fromEntries(FINGERS.map((f, i) => {
      const base = { E: 0, H: 0.5, K: 0.68, C: 1 }[sign.pose[i]];
      return [f, clamp(base + (jitter ? (Math.random() - 0.5) * 0.35 : 0), 0, 1)];
    }));
    if (btn.dataset.preset === "open") setSim({ curl: { thumb: 0, index: 0, middle: 0, ring: 0, pinky: 0 }, spread: 0.85, touch: "", point: "up", crossed: false, across: 0.05 });
    if (btn.dataset.preset === "fist") setSim({ curl: { thumb: 0.85, index: 1, middle: 1, ring: 1, pinky: 1 }, spread: 0.3, touch: "", point: "up", crossed: false, across: 0.35 });
    if (btn.dataset.preset === "match") setSim({ curl: curlFromPose(false), spread: ex.spread === "together" ? 0.35 : 0.9, touch: ex.thumbTouch || "", point: ex.point || "up", crossed: !!ex.crossed, across: ex.thumbPos != null ? ex.thumbPos : 0.2 });
    if (btn.dataset.preset === "near") setSim({ curl: curlFromPose(true), spread: ex.spread === "spread" ? 0.55 : 0.6, touch: "", point: ex.point || "up", crossed: false, across: (ex.thumbPos ?? 0.2) + 0.18 });
  }));

  /* ---------- wiring ---------- */
  $("[data-allow]", mount)?.addEventListener("click", enableCamera);
  $("[data-sim-open]", mount)?.addEventListener("click", openSim);
  $("[data-sim-open-2]", mount)?.addEventListener("click", openSim);
  $("[data-switch]", mount)?.addEventListener("click", () => {
    store.setSettings({ cameraFacing: store.settings.cameraFacing === "user" ? "environment" : "user" });
    placeholder.hidden = false;
    enableCamera();
  });
  submitBtn.addEventListener("click", () => { if (onSubmit && bestResult) onSubmit({ score: best, result: bestResult }); });

  const unsub = store.subscribe((what) => {
    if (what === "settings") {
      if (metersEl) metersEl.hidden = store.settings.verbosity === "simple";
      if (!store.settings.showSkeleton) { const ctx = canvas.getContext("2d"); ctx && ctx.clearRect(0, 0, canvas.width, canvas.height); }
    }
  });

  setSiggy("neutral", `Ready when you are — let's learn “${sign.name}”.`);

  return {
    getBest: () => ({ score: best, result: bestResult }),
    resetBest() { best = 0; bestResult = null; submitBtn.disabled = true; const b = $("[data-best]", mount); if (b) b.textContent = "0%"; },
    destroy() {
      destroyed = true;
      cancelAnimationFrame(raf);
      stopCamera(stream);
      stream = null;
      demo?.stop();
      unsub();
    },
  };
}

/** Static (non-live) hand preview used in grids. */
export function handPreview(sign, size = 58) {
  return `<span style="display:block;width:${size}px;height:${size}px">${renderHandSVG(sign, { stage: 2, annotate: false })}</span>`;
}

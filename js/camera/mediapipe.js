/* ============================================================
   SIGNA — camera/mediapipe.js
   MediaPipe Tasks Vision (Hand Landmarker) loaded lazily
   from CDN the first time a practice screen needs it.
   ============================================================ */
const CDN = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";
const MODEL = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

let landmarker = null;
let loadingPromise = null;

export const isModelReady = () => !!landmarker;

export async function initHandLandmarker(onStatus = () => {}) {
  if (landmarker) return landmarker;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    onStatus("Loading hand-tracking model…");
    const { FilesetResolver, HandLandmarker } = await import(`${CDN}/vision_bundle.mjs`);
    const vision = await FilesetResolver.forVisionTasks(`${CDN}/wasm`);
    const base = {
      baseOptions: { modelAssetPath: MODEL },
      runningMode: "VIDEO",
      numHands: 1,
      minHandDetectionConfidence: 0.45,
      minHandPresenceConfidence: 0.45,
      minTrackingConfidence: 0.45,
    };
    try {
      landmarker = await HandLandmarker.createFromOptions(vision, { ...base, baseOptions: { ...base.baseOptions, delegate: "GPU" } });
    } catch {
      onStatus("Retrying hand-tracking on CPU…");
      landmarker = await HandLandmarker.createFromOptions(vision, { ...base, baseOptions: { ...base.baseOptions, delegate: "CPU" } });
    }
    onStatus("Hand tracking ready.");
    return landmarker;
  })();

  try {
    return await loadingPromise;
  } catch (err) {
    loadingPromise = null;
    throw new Error("Hand tracking could not load. Check your connection, or practice with the avatar demos and finger simulator.");
  }
}

/**
 * Run one detection. Returns { landmarks, handedness } or null.
 * `timestampMs` must be monotonically increasing per stream.
 */
export function detectHands(videoEl, timestampMs) {
  if (!landmarker || videoEl.readyState < 2 || videoEl.videoWidth === 0) return null;
  try {
    const result = landmarker.detectForVideo(videoEl, timestampMs);
    const lm = result?.landmarks?.[0];
    if (!lm) return null;
    const handedness = result?.handedness?.[0]?.[0]?.categoryName || result?.handednesses?.[0]?.[0]?.categoryName || "Right";
    return { landmarks: lm, handedness };
  } catch {
    return null; // duplicate timestamp / transient — next frame will retry
  }
}

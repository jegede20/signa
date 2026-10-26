/* ============================================================
   SIGNA — camera/overlay.js
   Draws the 21-point hand skeleton on a canvas layered over
   the video. Both video and canvas are CSS-mirrored, so we
   draw in raw landmark coordinates.
   ============================================================ */
export const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
];

export function sizeCanvasToVideo(canvas, video) {
  const w = video.videoWidth || 640;
  const h = video.videoHeight || 480;
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
}

export function clearCanvas(canvas) {
  const ctx = canvas.getContext("2d");
  if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
}

export function drawSkeleton(canvas, landmarks, { color = "#F59E0B", good = false } = {}) {
  const ctx = canvas.getContext("2d");
  if (!ctx || !landmarks) return;
  const { width: w, height: h } = canvas;
  ctx.clearRect(0, 0, w, h);
  const line = good ? "#2DD4BF" : color;

  ctx.lineWidth = Math.max(2, w / 220);
  ctx.strokeStyle = line;
  ctx.globalAlpha = 0.75;
  ctx.lineCap = "round";
  ctx.beginPath();
  for (const [a, b] of HAND_CONNECTIONS) {
    ctx.moveTo(landmarks[a].x * w, landmarks[a].y * h);
    ctx.lineTo(landmarks[b].x * w, landmarks[b].y * h);
  }
  ctx.stroke();

  ctx.globalAlpha = 1;
  const r = Math.max(3, w / 160);
  landmarks.forEach((p, i) => {
    ctx.beginPath();
    ctx.arc(p.x * w, p.y * h, i % 4 === 0 && i !== 0 ? r * 1.35 : r, 0, Math.PI * 2);
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = line;
    ctx.stroke();
  });
}

/**
 * Estimate scene brightness (0–255) from a tiny downscale of
 * the video, for the poor-lighting warning. Cheap: 32×24 px.
 */
const probe = typeof document !== "undefined" ? document.createElement("canvas") : null;
export function estimateBrightness(video) {
  if (!probe || video.readyState < 2) return 120;
  probe.width = 32; probe.height = 24;
  const ctx = probe.getContext("2d", { willReadFrequently: true });
  try {
    ctx.drawImage(video, 0, 0, 32, 24);
    const data = ctx.getImageData(0, 0, 32, 24).data;
    let sum = 0;
    for (let i = 0; i < data.length; i += 16) sum += (data[i] + data[i + 1] + data[i + 2]) / 3;
    return sum / (data.length / 16);
  } catch { return 120; }
}

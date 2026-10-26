/* ============================================================
   SIGNA — camera/camera.js · getUserMedia + friendly errors
   Video never leaves the device; streams are local only.
   ============================================================ */

export async function startCamera(videoEl, { facing = "user" } = {}) {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw Object.assign(new Error("Camera is not available in this browser or context. Open Signa over HTTPS (or localhost) and try again."), { code: "unsupported" });
  }
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
    audio: false,
  });
  videoEl.srcObject = stream;
  videoEl.playsInline = true;
  videoEl.muted = true;
  await videoEl.play().catch(() => {});
  return stream;
}

export function stopCamera(stream) {
  if (!stream) return;
  for (const track of stream.getTracks()) { try { track.stop(); } catch { /* already stopped */ } }
}

export function friendlyCameraError(err) {
  switch (err?.name || err?.code) {
    case "NotAllowedError":
    case "PermissionDeniedError":
      return "Camera access was blocked. Click the camera icon in your browser's address bar, allow access for this site, then try again.";
    case "NotFoundError":
    case "DevicesNotFoundError":
      return "No camera was found on this device. You can still learn with the avatar demos and the finger simulator.";
    case "NotReadableError":
      return "Your camera is busy in another app or tab. Close it there, then try again.";
    default:
      return err?.message || "The camera could not be started. You can still learn with the avatar demos and the finger simulator.";
  }
}

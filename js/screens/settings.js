/* ============================================================
   SIGNA — screens/settings.js
   All preferences persist locally (localStorage + IndexedDB).
   ============================================================ */
import { store, $ } from "../core/store.js";
import { icon } from "../core/icons.js";
import { THEME_TOGGLE_HTML, initTheme } from "../core/theme.js";
import { exportAllData } from "../core/storage.js";
import { computeStats } from "../progress/stats.js";
import { toast, confirmDialog } from "../core/ui.js";
import { setSiggy } from "../avatar/siggy.js";

const row = (title, hint, control) => `<div class="setting-row"><div class="setting-row__text"><h4>${title}</h4><p>${hint}</p></div>${control}</div>`;
const switchHTML = (key, checked) => `<label class="switch"><input type="checkbox" data-set="${key}" ${checked ? "checked" : ""}><span class="switch__track"></span><span class="switch__thumb"></span></label>`;
const selectHTML = (key, options, value) => `<select class="select" data-set="${key}">${options.map(([v, l]) => `<option value="${v}" ${v === value ? "selected" : ""}>${l}</option>`).join("")}</select>`;

export function renderSettings(mount) {
  const s = store.settings;
  const stats = computeStats();

  mount.innerHTML = `<div class="screen-enter" style="display:grid;gap:22px;max-width:780px">
    <header><h1>Settings</h1><p class="text-body text-secondary" style="margin-top:6px">Tune Signa to your hands, your camera and your style. Changes save instantly on this device.</p></header>

    <section class="card" style="padding-top:8px;padding-bottom:8px">
      <h3 style="padding:14px 0 2px;display:flex;gap:8px;align-items:center">${icon("hand")} Camera &amp; hands</h3>
      ${row("Preferred camera", "Front (selfie) works best for signing at a desk.", selectHTML("cameraFacing", [["user", "Front"], ["environment", "Back"]], s.cameraFacing))}
      ${row("Dominant hand", "Flips the avatar guide and handedness hints.", selectHTML("dominantHand", [["right", "Right"], ["left", "Left"]], s.dominantHand))}
      ${row("Feedback detail", "Detailed shows a live score per finger; Simple keeps one tip + the ring.", selectHTML("verbosity", [["detailed", "Detailed"], ["simple", "Simple"]], s.verbosity))}
    </section>

    <section class="card" style="padding-top:8px;padding-bottom:8px">
      <h3 style="padding:14px 0 2px;display:flex;gap:8px;align-items:center">${icon("eye")} On-screen coach</h3>
      ${row("Skeleton overlay", "Draw the 21-point hand skeleton over your camera feed.", switchHTML("showSkeleton", s.showSkeleton))}
      ${row("Score ring", "The circular 0–100% ring during practice.", switchHTML("showScoreRing", s.showScoreRing))}
      ${row("Siggy coach panel", "Show Siggy beside the practice canvas.", switchHTML("showSiggy", s.showSiggy))}
      ${row("Siggy reactions", "Siggy's face reacts to your live score.", switchHTML("siggyReactions", s.siggyReactions))}
      <div class="setting-row"><div class="setting-row__text"><h4>Dark / light mode</h4><p>Defaults to your system setting; your choice is remembered.</p></div>${THEME_TOGGLE_HTML}</div>
    </section>

    <section class="card" style="display:grid;gap:14px">
      <h3 style="display:flex;gap:8px;align-items:center">${icon("shield")} Your data</h3>
      <p class="text-small text-secondary">Signa has no accounts and no server. Your progress (${stats.attempts} attempts, ${stats.mastered} mastered, ${stats.streak}-day streak) lives only in this browser. Camera frames are processed on-device and never uploaded.</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn btn-secondary btn-sm" data-export>${icon("download")} Export progress (JSON)</button>
        <button class="btn btn-danger btn-sm" data-reset>${icon("trash")} Reset all progress</button>
      </div>
    </section>

    <section class="card" style="display:grid;gap:10px">
      <h3>About Signa</h3>
      <p class="text-small text-secondary">A browser-based practice booth for ASL fingerspelling A–Z and six everyday phrases. Hand tracking by MediaPipe; scoring compares finger curl, spread, thumb placement and pointing direction against a reference template for each sign.</p>
      <p class="text-small text-secondary">Honest limits: fist-family letters (A, E, M, N, S, T) differ mostly in thumb placement, which a single webcam can only estimate; moving signs (J, Z and the phrases) are scored on handshape, with the movement taught in the lesson text. Scores are practice feedback, not a certified assessment — and no app replaces learning with Deaf teachers and community.</p>
    </section>
  </div>`;

  initTheme();

  mount.querySelectorAll("[data-set]").forEach((ctl) => {
    ctl.addEventListener("change", () => {
      const key = ctl.dataset.set;
      const value = ctl.type === "checkbox" ? ctl.checked : ctl.value;
      store.setSettings({ [key]: value });
      toast("Setting saved.", { type: "success", iconName: "check", ms: 2200 });
    });
  });

  $("[data-export]", mount).onclick = async () => {
    const data = await exportAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `signa-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    toast("Progress exported as JSON.", { type: "success", iconName: "download" });
  };

  $("[data-reset]", mount).onclick = async () => {
    const ok = await confirmDialog({
      title: "Reset all progress?",
      message: "This permanently deletes your scores, streak, mastery and history stored in this browser. There is no undo and no backup on any server.",
      confirmLabel: "Delete everything", danger: true,
    });
    if (!ok) return;
    await store.resetAll();
    toast("Progress reset. A fresh start — your first five signs await.", { iconName: "sparkles" });
    renderSettings(mount);
  };

  setSiggy("neutral", "Make Signa yours — I will respect every toggle, promise.");
}

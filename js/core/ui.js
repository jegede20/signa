/* ============================================================
   SIGNA — core/ui.js · toasts + modal/bottom-sheet helpers
   ============================================================ */
import { icon } from "./icons.js";

function toastStack() {
  let s = document.querySelector(".toast-stack");
  if (!s) { s = document.createElement("div"); s.className = "toast-stack"; s.setAttribute("aria-live", "polite"); document.body.appendChild(s); }
  return s;
}

export function toast(message, { type = "info", iconName = "sparkles", ms = 4200 } = {}) {
  const t = document.createElement("div");
  t.className = `toast${type === "success" ? " is-success" : type === "warn" ? " is-warn" : ""}`;
  t.innerHTML = `${icon(iconName)}<span>${message}</span>`;
  toastStack().appendChild(t);
  setTimeout(() => { t.style.opacity = "0"; t.style.transition = "opacity 300ms"; setTimeout(() => t.remove(), 320); }, ms);
}

/** Modal on desktop, bottom sheet on mobile (CSS handles it). */
export function openModal({ title = "", bodyHTML = "", actionsHTML = "" } = {}) {
  closeModal();
  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";
  backdrop.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-label="${title}">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px">
      <h3>${title}</h3>
      <button class="icon-btn" data-close aria-label="Close">${icon("x")}</button>
    </div>
    <div class="modal-body">${bodyHTML}</div>
    ${actionsHTML ? `<div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;margin-top:20px">${actionsHTML}</div>` : ""}
  </div>`;
  backdrop.addEventListener("click", (e) => { if (e.target === backdrop || e.target.closest("[data-close]")) closeModal(); });
  document.body.appendChild(backdrop);
  backdrop.querySelector("[data-close]")?.focus();
  return backdrop;
}

export function closeModal() { document.querySelector(".modal-backdrop")?.remove(); }

export function confirmDialog({ title, message, confirmLabel = "Confirm", danger = false }) {
  return new Promise((resolve) => {
    const m = openModal({
      title,
      bodyHTML: `<p class="text-body text-secondary">${message}</p>`,
      actionsHTML: `<button class="btn btn-ghost" data-no>Cancel</button>
                    <button class="btn ${danger ? "btn-danger" : "btn-primary"}" data-yes>${confirmLabel}</button>`,
    });
    m.querySelector("[data-yes]").addEventListener("click", () => { closeModal(); resolve(true); });
    m.querySelector("[data-no]").addEventListener("click", () => { closeModal(); resolve(false); });
    m.addEventListener("click", (e) => { if (e.target === m) resolve(false); });
  });
}

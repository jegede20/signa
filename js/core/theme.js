/* ============================================================
   SIGNA — core/theme.js
   Dark/Light toggle. Defaults to system preference, persists
   to localStorage as `signa_theme`, applied on <html data-theme>.
   Imported early by both index.html and app.html entry scripts;
   each page also has a tiny inline snippet to avoid a flash.
   ============================================================ */
const KEY = "signa_theme";

export function getStoredTheme() {
  try {
    const v = localStorage.getItem(KEY);
    return v === "dark" || v === "light" ? v : null;
  } catch { return null; }
}

export function systemTheme() {
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function currentTheme() {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

export function applyTheme(theme, persist = true) {
  document.documentElement.dataset.theme = theme;
  if (persist) { try { localStorage.setItem(KEY, theme); } catch { /* private mode */ } }
  document.querySelectorAll(".theme-toggle").forEach((el) => {
    el.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
    el.setAttribute("aria-pressed", theme === "light" ? "true" : "false");
  });
}

export function toggleTheme() {
  applyTheme(currentTheme() === "dark" ? "light" : "dark");
}

/** Call once per page. Safe to call again after DOM swaps. */
export function initTheme() {
  applyTheme(getStoredTheme() || systemTheme(), false);
  document.querySelectorAll(".theme-toggle").forEach((el) => {
    if (el.dataset.bound) return;
    el.dataset.bound = "1";
    el.addEventListener("click", toggleTheme);
  });
  // Follow the OS until the user picks explicitly
  window.matchMedia("(prefers-color-scheme: light)").addEventListener?.("change", (e) => {
    if (!getStoredTheme()) applyTheme(e.matches ? "light" : "dark", false);
  });
}

/** Markup for the pill toggle (moon in dark, sun in light). */
export const THEME_TOGGLE_HTML = `
  <button class="theme-toggle" type="button" aria-label="Toggle dark / light mode">
    <span class="theme-toggle__thumb">
      <svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
      <svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
    </span>
  </button>`;

/* ============================================================
   SIGNA — core/router.js
   Hash routing inside app.html (works on GitHub Pages).
   Routes: #/home #/learn #/lesson/A #/quiz/1 #/practice
           #/practice/A #/library #/sign/A #/progress #/settings
   Screen renderers may return a cleanup function; the router
   calls it before the next render (stops camera loops etc.).
   ============================================================ */
let routes = {};
let cleanup = null;
let outlet = null;
let onNavigated = null;

export function initRouter(mountEl, routeMap, afterNav) {
  outlet = mountEl;
  routes = routeMap;
  onNavigated = afterNav || null;
  window.addEventListener("hashchange", render);
  if (!location.hash) history.replaceState(null, "", "#/home");
  render();
}

export function navigate(path) {
  const target = path.startsWith("#") ? path : `#${path}`;
  if (location.hash === target) render();
  else location.hash = target;
}

export function parseHash() {
  const raw = (location.hash || "#/home").replace(/^#\/?/, "");
  const [name, param] = raw.split("/");
  return { name: name || "home", param: param ? decodeURIComponent(param) : null };
}

export async function render() {
  if (cleanup) { try { cleanup(); } catch (e) { console.error(e); } cleanup = null; }
  const { name, param } = parseHash();
  const renderer = routes[name] || routes.home;
  outlet.innerHTML = "";
  window.scrollTo({ top: 0 });
  const main = document.querySelector(".main-canvas");
  if (main) main.scrollTop = 0;
  try {
    const maybeCleanup = await renderer(outlet, param);
    cleanup = typeof maybeCleanup === "function" ? maybeCleanup : null;
  } catch (err) {
    console.error("Screen render failed:", err);
    outlet.innerHTML = `<div class="card empty-state"><h3>Something went wrong loading this screen.</h3>
      <p class="text-small">${String(err?.message || err)}</p>
      <button class="btn btn-primary" onclick="location.hash='#/home'">Back to Home</button></div>`;
  }
  if (onNavigated) onNavigated(name, param);
}

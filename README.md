# Signa — Learn Sign Language. Your Camera is Your Teacher.

Signa is a free, browser-based sign language practice booth. It uses your webcam with
MediaPipe hand tracking to teach ASL fingerspelling (A–Z) and six common phrases,
scores your handshape in real time, coaches you one tip at a time, and tracks
mastery and daily streaks — **100% in the browser**. No backend, no accounts,
no install, no build step. Camera frames are processed on your device and never
uploaded.

## Run it

Any static file server works (ES modules require `http://`, not `file://`):

- **VS Code**: open the `signa/` folder, right-click `index.html` → *Open with Live Server*.
- **Python**: `python3 -m http.server 8000 --directory signa` then open <http://localhost:8000>.
- **GitHub Pages**: publish the `signa/` folder as-is. No build step needed.

Pages: `index.html` (landing) → `app.html#/home` (the app).

> Camera note: browsers only allow `getUserMedia` on **HTTPS** or `localhost`.
> Without a camera, every practice screen still works through the built-in
> **finger simulator**, which feeds the same scoring engine.

## What is inside

```
signa/
├── index.html / app.html        Landing page + app shell
├── css/                         tokens, reset, typography, components,
│                                animations, landing, app, theme (dark/light)
├── js/
│   ├── app.js / main.js         App boot (§15 sequence) + landing behaviour
│   ├── core/                    router, store, storage (localStorage + IndexedDB),
│   │                            theme, icons (inline Lucide SVGs), ui helpers
│   ├── camera/                  getUserMedia, MediaPipe Hand Landmarker, skeleton overlay
│   ├── recognition/             feature extraction → weighted scorer → one-tip feedback
│   ├── avatar/                  Siggy mascot (5 expressions), SVG hand demo player, poses
│   ├── progress/                mastery rules, streaks/calendar, stats
│   └── screens/                 home, learn, lesson (Watch→Try→Result), quiz,
│                                practice (+shared live session), library, progress, settings
├── data/                        signs (A–Z + phrases), modules, curriculum/unlock chain
├── svg/                         Generated assets: hands/*.svg, siggy/*.svg
└── assets/images/og-image.png   Social share image
```

## How scoring works

1. **Features** (`recognition/features.js`): from 21 landmarks we compute per-finger
   curl (straight-line vs. segmented length — rotation/scale invariant), fingertip
   spread, thumb–fingertip contact distance, thumb position across the palm,
   pointing direction, finger crossing, palm facing and framing.
2. **Templates** (`data/signs.js`): every sign declares an expected pose
   (`[thumb,index,middle,ring,pinky]` as Extended/Curled/Half/Hooked) plus optional
   extra checks (e.g. `thumbTouch`, `crossed`, `point: "down"`).
3. **Score** (`recognition/scorer.js`): each feature scores 0–100; the weighted
   average drives the score ring, stars (50/70/90 thresholds) and mastery
   (≥90% in 2+ scored attempts).
4. **Feedback** (`recognition/feedback.js`): the single worst feature becomes the
   on-screen tip; fingers needing the same fix are grouped into one sentence.

## Your data

- `localStorage`: `signa_theme`, `signa_dominant_hand`, `signa_settings`.
- `IndexedDB` (`signa_db`): `user_progress`, `streak`, `stats`, `day_log`
  (with an automatic localStorage fallback if IndexedDB is blocked).
- Settings can export everything as JSON or reset it entirely.

## Honest limits

- **Fist-family letters** (A, E, M, N, S, T) differ mainly by thumb placement;
  a single 2D webcam estimates this, so treat close calls as coaching, not verdicts.
- **Moving signs** (J, Z, and all phrases) are scored on handshape; the movement
  is taught in the lesson steps (`dynamic: true` in the data).
- Signa is a **practice companion**, not a certified assessment and never a
  replacement for learning with Deaf teachers and community.
- The guide hand is a clear schematic teaching diagram generated from the same
  pose data the scorer uses — deliberately simple, not a photo of a human hand.

## Regenerating SVG assets

`svg/` assets are generated from the app's own renderers (so they cannot drift):

```bash
node generate-assets.mjs   # from the repo root
```

## Tech

Vanilla HTML/CSS/JS (ES modules) · MediaPipe Tasks Vision 0.10.14 (CDN) ·
Google Fonts (Syne, Inter, JetBrains Mono) · inline Lucide-style SVG icons ·
localStorage + IndexedDB. No npm, no bundler, no framework, no server.

Free forever. Made with open hands.

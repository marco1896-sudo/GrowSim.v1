# Grow Simulator – AGENT.md (Codex Execution Contract)

## Goal (MVP)
Build a mobile-first PWA (offline-capable) plant simulation prototype that:
1) runs fully offline (app shell + assets cached),
2) has a working simulation loop with event timer + cooldown,
3) supports push notifications plumbing (client + service worker handlers) and a mock backend interface (no paid services required yet),
4) uses ONLY the assets placed by the user under /assets.

## Non-Negotiables
- No frameworks. Vanilla HTML/CSS/JS only.
- No build step. No bundlers. Runs via simple static hosting.
- Must be installable as PWA (manifest + icons).
- Must work offline after first load.
- All code must be readable, modular, and commented where logic is non-obvious.
- Never delete user assets. Never rename asset folders without updating references.
- Never introduce breaking changes without updating the acceptance checklist.

## Repo Structure (must keep)
- index.html (single page)
- styles.css
- app.js
- manifest.webmanifest
- sw.js
- /assets/** (user-provided)
- /data/events.json (event definitions)
- /icons/** (pwa icons)

## UI Requirements (match reference as close as possible)
- Mobile-first vertical layout (9:16 feel).
- Center: plant image (from /assets/plant/*)
- Two main circular meters around plant: Health, Stress.
- Four small meters: Water, Nutrition, Growth, Risk.
- Bottom sticky action panel with 3 actions:
  - Pflege (primary)
  - Analyse (secondary)
  - +30 Min beschleunigen (shows “Werbeunterstützt · X/6 heute”)
- A small "Pro" badge (locked features can be placeholders).
- Use dark theme, premium minimal styling.
- Use CSS variables for tokens.

## Simulation Requirements
### State Model
Maintain a single `state` object persisted in IndexedDB (fallback to localStorage if needed):
- phase: one of ["seedling","veg","flower"]
- health: 0..100
- stress: 0..100
- water: 0..100
- nutrition: 0..100
- growth: 0..100
- risk: 0..100
- lastTickAt (timestamp)
- nextEventAt (timestamp)
- eventCooldownUntil (timestamp)
- adBoostsUsedToday: 0..6 with daily reset
- historyLog: array (bounded, e.g. last 200 entries)

### Tick Loop
- A deterministic tick every 1s (UI updates), but simulation deltas are applied based on elapsed time.
- Event roll:
  - Production target: roll every 10 min, cooldown 20 min.
  - Development/testing mode: roll every 30–60s, cooldown 60s.
- Must log:
  - tick events
  - event rolls (including "skipped due to cooldown")
  - selected event + player choice + effects

### Events
Events are defined in /data/events.json:
- id, title, description
- choices: [{ id, label, effects: { health:+/- , stress:+/- , water:+/- , ... }, followUp? }]
- severity, tags
No business logic inside JSON beyond numeric effects.

## Plant Phase ↔ Image Mapping
You will receive exactly 9 plant images:
- seedling_01..02
- veg_01..04
- flower_01..03
Build a strict mapping:
- phase -> list of available images
- growth (0..100) selects image index deterministically
Never hardcode filenames outside this mapping module.

## PWA Offline Requirements
- manifest.webmanifest configured (name, short_name, start_url, display=standalone, theme_color, background_color, icons).
- sw.js:
  - pre-cache app shell + critical assets list
  - runtime cache for images under /assets/**
  - offline fallback: app still loads and shows last state
- Use a cache version string. Implement clean update strategy.

## Push Notifications (Plumbing)
Implement:
1) Client subscription flow (button in Analyse or settings panel):
   - request Notification permission
   - register service worker
   - subscribe to PushManager with VAPID public key placeholder
   - store subscription locally + POST to `/api/push/subscribe` (stub endpoint)
2) Service Worker:
   - `self.addEventListener("push", ...)` show notification using payload
   - `notificationclick` opens app with a URL fragment like `#event=<id>`
3) Event notifications logic (client):
   - When nextEventAt is scheduled, and permission is granted, call `/api/push/schedule` with nextEventAt.
Note: backend is not implemented in this repo yet; provide stubs and clear TODO markers.

## Commands You May Run
- If a local server is needed, use one of:
  - `python -m http.server 5173`
  - `npx serve`
No other global installs.

## Acceptance Checklist (must satisfy)
- [ ] Open `index.html` via local static server: UI renders, no console errors.
- [ ] First load online → refresh offline: app still loads and shows UI.
- [ ] State persists across reloads.
- [ ] Event roll + cooldown works; logs show roll decisions.
- [ ] Action buttons change state and update UI.
- [ ] +30 Min boost increments X/6 and modifies simulation time; daily reset works.
- [ ] Plant image changes across growth & phases using strict mapping.
- [ ] Push plumbing present (subscribe UI + SW handlers); no crashes if backend missing.

## Output Discipline
When implementing:
1) Make small, reviewable commits (if using git). Otherwise, keep changes minimal per step.
2) Update /data/events.json with at least 20 realistic soil-based events.
3) Do NOT implement hydro features yet.
4) If any assumption is needed, write it at the top of app.js as `ASSUMPTIONS:` list.

## If something conflicts
- Follow Non-Negotiables first.
- Then Acceptance Checklist.
- Then UI Requirements.
# GrowSim – Manual Test Checklist (Simulation V1)

1. App loads via `index.html` on local server without build tooling.
2. Tick engine advances once per second (`1s = 1 ingame minute`).
3. Event roll happens only every 10 ingame minutes (verify via history cadence).
4. Global event cooldown (20 minutes) prevents event spam.
5. While event modal is open, drains are paused (water/nutrition unchanged while waiting).
6. Instant event resolves after action and closes modal.
7. Duration event applies `effectsPerMinute` and counts down to completion.
8. Event action with `resolvesEvent` closes active event immediately.
9. Delayed action effects (`delayed.inMin`) apply after countdown and only once.
10. Water/Feed/Prune actions update stats and are clamped to `0..100`.
11. No stat becomes `NaN`/`Infinity` in long run (100+ ticks).
12. Stage progression follows thresholds: `seedling <35`, `veg >=35`, `flower >=70` growth.
13. Risk updates to 0..100 and UI state switches normal/warning/critical accordingly.
14. Emergency Ad button is disabled unless `health <= 40` or critical UI state.
15. Emergency Ad applies `+30 health` and `-18 stress` when eligible.
16. +30 Min Boost consumes one ad and fast-forwards simulation by 30 minutes.
17. Daily ad cap (6) blocks additional ads with clear feedback.
18. Daily ad reset works when day stamp changes.
19. Analysis stays locked until analysis ad is used; remains unlocked after reload.
20. Game over at `health <= 0` resets run state and logs gameover.
21. Bottom sheet interactions: care sheet opens/closes, event sheet blocks correctly.
22. Mobile viewport check: no horizontal overflow at 360px; mini rings switch to 2x2 on small screens.
23. Sticky actions dock respects safe-area and does not hide tappable controls.

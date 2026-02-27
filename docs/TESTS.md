# Grow Simulator – Test Checklist (MVP Phase 1)

1. App lädt über `index.html` ohne Build-Tool.
2. Design Tokens liegen in `css/tokens.css`.
3. Große Ringe: `r=42`, `stroke-width=12`, `viewBox 0 0 100 100`.
4. Mini-Ringe: `r=40`, `stroke-width=6`, `viewBox 0 0 100 100`.
5. `stroke-dashoffset` wird aus Wert/Umfang berechnet.
6. Ring-Rotation auf `-90deg` gesetzt.
7. PlantHero hat Breite 220px.
8. PlantHero überlappt mit `margin-top: -24px`.
9. PlantHero Glow mit `blur(18px)`.
10. PlantHero Stages `seedling|veg|flower` vorhanden.
11. Sticky Action Dock nutzt `env(safe-area-inset-bottom)`.
12. UI State wechselt `normal|warning|critical` gemäß Schwellen.
13. Critical Animation pulsiert mit 1400ms.
14. Modal Open Animation 180ms.
15. Ad-Toast zeigt 1800ms Feedback + 180ms Scanline.
16. Ad-Limit 6 pro Tag wird erzwungen.
17. Tageswechsel resettet Ad-Zähler.
18. Analyse bleibt gelockt bis erste Ad gesehen.
19. Rettungseffekt greift nur bei `health <= 0.4`.
20. Persistenz via localStorage funktioniert nach Reload.
21. Game Over bei `health <= 0` setzt Run zurück + Log.
22. RNG Wrapper (`rand`) ist deterministisch via Seed.
23. Event Modal zeigt 2–3 Aktionen und wendet Effekte an.

# GrowSim.v1

Statisches Build-Paket ohne Frameworks/Build-Tools, direkt für GitHub Pages nutzbar.

## Spezifikation A–F (umgesetzt)

- **A – Reines Static-Setup:** `index.html`, `styles.css`, `app.js` ohne Toolchain.
- **B – UI/Struktur:** Responsive Layout mit Steuerpanel und Simulationspanel.
- **C – Simulationslogik:** Tick-basierte Wachstumsberechnung mit Maximalwert.
- **D – Bedienung:** Start, Pause, Reset sowie Live-Regler für Parameter.
- **E – Sichtbarkeit/Status:** Metriken und Statusmeldungen mit laufender Aktualisierung.
- **F – GitHub Pages Ready:** Einstiegspunkt über `index.html` im Repo-Root.

## Lokales Starten

```bash
python3 -m http.server 8080
```

Dann im Browser öffnen: `http://localhost:8080`.

# Grizzlies Unterland – Webseite

Statische Webseite (GitHub Pages, `grizzliesunterland.com`) in drei Sprachen: Deutsch (Hauptordner), Italienisch (`it/`),
Englisch (`en/`). Kein Build-Tool, reines HTML/CSS/JS.

## Eigenständige, statische Seite

Seit 12.10.2026 ist die Webseite **vollständig eigenständig**. Es gibt keine Anbindung mehr an das frühere Backend
(PlayerVW): kein automatischer Abgleich, kein Build-Skript, kein Live-Skript, keine fremden Adressen. Alle Inhalte
stehen fest im HTML und werden **direkt in diesem Repo von Hand gepflegt** – in allen drei Sprachen
(`*.html`, `it/*.html`, `en/*.html`).

**Ausnahme seit 08.11.2026:** Liga-Tabelle und Topscorer-Liste (Tabs „Unterland" und „Gesamt") in `spielplan.html`
(DE/IT/EN) werden täglich automatisch per GitHub Actions (`.github/workflows/update-stats.yml`,
`scripts/update_stats.py`) aktualisiert. Liga-Tabelle und „Unterland"-Scorer kommen aus dem öffentlichen Snapshot
von `grizzlies.lisorect.it` (der seinerseits automatisch mit Clava synchronisiert wird). Der „Gesamt"-Tab
(ligaweite Scorerliste aller Mannschaften) kommt von der authentifizierten Scorer-Seite desselben Portals – Login
mit einem echten Mitgliederzugang (Secrets `LISORECT_USERNAME`/`LISORECT_PASSWORD`, nur verschlüsselt in GitHub
Actions hinterlegt, nie im Repo), per Playwright (`scripts/scrape_gesamt.py`) aus dem bereits gerenderten DOM
ausgelesen – es werden keine Tokens/Cookies/Storage-Daten gelesen oder gespeichert. `mannschaft.html` bleibt
bewusst manuell gepflegt. Nicht direkt per API/Token mit Clava verbunden – nur legitim über die
Lisorect-Schnittstelle (öffentlich für die Tabelle, mit legitimem Mitglieder-Login für den Gesamt-Tab).

Was beim Entkoppeln übernommen wurde (Stand 12.10.2026): Mannschaft, Spielplan, Ergebnisse, Tabelle, Statistiken,
Vorstand, Sponsoren samt Logos (`assets/`), Spielerfotos (`assets/spieler/`), Gegner-Logos (`assets/gegner/`) und die
Satzung (`assets/dokumente/`).

### Wo was steht

| Inhalt | Datei(en) |
|---|---|
| Leiste „Nächstes Spiel“ ganz oben + „Game Day“-Karte der Startseite | **automatisch** per `assets/js/nextgame.js` aus `assets/js/schedule.js` – kein manuelles Anpassen mehr nötig (siehe unten) |
| Spielplan mit Monatsumschalter | `spielplan.html`: Variable `CAL_MONTHS` im Skript am Seitenende |
| Tabelle und Statistiken | `spielplan.html`: HTML-Tabelle bzw. Variable `STATS` im Skript – **automatisch** täglich per `scripts/update_stats.py` (siehe oben), kein manuelles Anpassen mehr nötig |
| Mannschaft (Karten, Nummern, Fotos) | `mannschaft.html`, Fotos in `assets/spieler/<vorname-nachname>.png` |
| Vorstand | `vorstand.html`, Fotos in `assets/people/` |
| Sponsoren (Laufband + Seite) | `index.html` (Laufband) und `sponsoren.html`, Logos in `assets/` |
| Saison-Angaben („2026/2027“) | mehrere Seiten – suchen und ersetzen |

Spieler ohne Foto: Das `<img>` verweist auf eine Datei, die es (noch) nicht gibt, und blendet sich per `onerror`
selbst aus. Foto unter dem erwarteten Namen ablegen genügt.

## Lokal testen

Reines HTML/CSS/JS, kein Build-Tool: Ordner mit einem beliebigen statischen Server öffnen, z.B.
`python3 -m http.server 8080`, dann http://localhost:8080.

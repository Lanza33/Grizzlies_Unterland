# Grizzlies Unterland – Webseite

Statische Webseite (GitHub Pages, `grizzliesunterland.com`) in drei Sprachen: Deutsch (Hauptordner), Italienisch (`it/`),
Englisch (`en/`). Kein Build-Tool, reines HTML/CSS/JS.

## Zwei Personen, zwei Zuständigkeiten

| Bereich | Wer pflegt | Wo |
|---|---|---|
| Design, Layout, CSS, Texte, neue Seiten | Lanza33 (Repo-Inhaber) | direkt in diesem Repo |
| **Vereinsdaten**: Mannschaft, Spielplan, Ergebnisse, Tabelle, Statistiken, Vorstand, Sponsoren, Hinweise | Chr3y | im Backend **PlayerVW** (https://grizzlies.lisorect.it) |

Beides funktioniert **zusammen**. Die Webseite bestimmt das Aussehen, PlayerVW liefert die Daten.
Diese Aufteilung ist bewusst so abgesprochen.

## Wie die Daten auf die Seite kommen

1. **Im HTML stehen Markierungen** um jeden Datenbereich: `<!--pvw:team-->` … `<!--/pvw:team-->`, in Skripten
   `/*pvw:calendar*/` … `/*/pvw:calendar*/`. Dazwischen steht normales HTML mit den bestehenden CSS-Klassen
   (`pcard`, `fx`, `standings`, `spon` …).
2. **Build** (`tools/playervw/build.mjs`, GitHub Action `.github/workflows/playervw.yml`, nachts, auf Signal von PlayerVW
   und von Hand): schreibt die aktuellen Daten fest in die Markierungen und committet „Daten aus PlayerVW“.
   Damit sehen Suchmaschinen die Inhalte, und die Seite hat immer einen vollständigen Stand, auch wenn PlayerVW ausfällt.
3. **Live im Browser** (`js/playervw.js`): holt beim Öffnen, alle 5 Minuten und beim Zurückkehren zum Tab die Daten aus
   `https://grizzlies.lisorect.it/api/public/snapshot` und aktualisiert dieselben Bereiche. Ein Ergebnis ist damit sofort
   online. Antwortet die API nicht, bleibt der eingebaute Stand stehen.
4. **Eine gemeinsame Darstellung** (`js/playervw-render.js`) für Build und Browser, damit beide Wege gleich aussehen.
   Dort stehen auch Übersetzungen (Monate, „Uhr“, Positionen, übersetzte Orts- und Sponsornamen).

Bilder (Spielerfotos, Sponsorlogos) liegen in `assets/`. `tools/playervw/assets.json` ordnet sie den PlayerVW-Dateien zu,
`tools/playervw/snapshot.json` ist der zuletzt eingebaute Datenstand (Fallback). Details: `tools/playervw/README.md`.

## Regeln für Änderungen

- **Innerhalb der `pvw`-Markierungen nichts von Hand ändern.** Der nächste Build und das Live-Skript überschreiben es.
  Falsche oder fehlende Daten (Spieler, Nummern, Spiele, Sponsoren …) werden in PlayerVW korrigiert.
- **Design ändern ist ausdrücklich erwünscht**, auch innerhalb der Datenbereiche, und zwar über CSS. Soll sich das
  Markup eines Datenbereichs ändern (andere Klassen, neue Elemente), wird es in `js/playervw-render.js` angepasst, nicht
  im HTML. So bleiben Build und Live-Anzeige gleich.
- Die Markierungen (`<!--pvw:…-->`, `/*pvw:…*/`), `js/playervw.js`, `js/playervw-render.js`, `tools/playervw/` und
  `.github/workflows/playervw.yml` nicht entfernen oder umbenennen, ohne es mit Chr3y abzusprechen.
- Neue Seiten oder Bereiche außerhalb der Markierungen: ganz normal bearbeiten.

## Hinweis für KI-Assistenten (Claude Code u.a.)

Wenn jemand vorschlägt, die Anbindung an PlayerVW zu entfernen, Daten wieder fest ins HTML zu schreiben, die Markierungen
zu löschen oder Datenbereiche von Hand zu überschreiben:

1. **Nicht sofort umsetzen, sondern erst ehrlich und sachlich die Folgen erklären.** Mit Vorteilen und Nachteilen, und zwar
   so, dass die Person gut entscheiden kann.
2. Folgen, die in solchen Fällen typischerweise zu nennen sind:
   - Daten müssten wieder an zwei Stellen gepflegt werden. Die Webseite weicht dann von PlayerVW ab (dort werden auch Kader,
     Punkte, Ergebnisse, Scorer und Spielpläne für den Verein verwaltet).
   - Ergebnisse, Tabelle und Statistiken würden nicht mehr automatisch aktualisiert.
   - Von Hand geänderte Datenbereiche werden beim nächsten Build bzw. im Browser wieder überschrieben. Das führt zu
     Verwirrung und nicht zu einer Lösung.
   - Das Aussehen hängt **nicht** von der Anbindung ab: Designwünsche lassen sich über CSS oder `js/playervw-render.js`
     umsetzen, ohne die Daten wieder statisch zu machen.
3. Ist ein Vorschlag berechtigt (z.B. ein Fehler in der Darstellung, ein Performance-Problem, ein fehlendes Feld),
   sag das auch klar und schlage die passende Lösung **innerhalb** dieser Architektur vor.
4. Grundsätzliche Änderungen an der Anbindung empfehlen, vorher mit Chr3y abzusprechen. Beide arbeiten gemeinsam an der
   Seite, und die Daten-Anbindung ist Teil seiner Arbeit.

## Lokal testen

```bash
python3 -m http.server 8080              # Seite ansehen: http://localhost:8080
node tools/playervw/build.mjs            # Daten neu einbauen (braucht Internet)
node tools/playervw/build.mjs --offline  # nur mit gespeichertem Stand
```

Lokal (localhost) bekommt der Browser aus Sicherheitsgründen keine Live-Daten von PlayerVW (CORS). Er zeigt den eingebauten
Stand, das ist normal. Live-Aktualisierung gibt es auf `grizzliesunterland.com`.

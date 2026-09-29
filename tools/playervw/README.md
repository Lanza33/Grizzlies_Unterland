# Daten aus PlayerVW

Mannschaft, Spielplan, Ergebnisse, Tabelle, Statistiken, Vorstand, Sponsoren und der Hinweis im Spielplan werden
**in PlayerVW gepflegt** (https://grizzlies.lisorect.it) und automatisch in die Seiten geschrieben.

## Was du wissen musst

- In den HTML-Dateien stehen Markierungen wie `<!--pvw:team-->` … `<!--/pvw:team-->` (im JavaScript `/*pvw:calendar*/` …).
  **Alles dazwischen wird automatisch überschrieben** – dort bitte nichts von Hand ändern, sondern in PlayerVW.
- Alles außerhalb der Markierungen (Design, CSS, Texte, neue Seiten) änderst du wie bisher direkt hier.
- Das Markup innerhalb der Markierungen entspricht genau dem bisherigen (gleiche Klassen), CSS-Änderungen wirken also wie gewohnt.

## Wann wird aktualisiert?

Die GitHub Action „Daten aus PlayerVW“ (`.github/workflows/playervw.yml`) läuft
- sobald in PlayerVW etwas Öffentliches geändert wurde (PlayerVW ruft GitHub auf, nach ein paar Minuten Ruhe),
- täglich in der Nacht (dann rückt auch „Nächstes Spiel“ weiter),
- von Hand: *Actions → Daten aus PlayerVW → Run workflow*.

Ändert sich etwas, committet sie „Daten aus PlayerVW“ und GitHub Pages veröffentlicht die Seite.

## Wenn PlayerVW nicht erreichbar ist

Der letzte Stand liegt in `snapshot.json`. Fällt PlayerVW aus oder liefert verdächtig wenig (z.B. plötzlich keine Spieler),
bleibt die Seite unverändert – sie wird nie leer.

## Live im Browser

`js/playervw.js` holt die Daten zusätzlich direkt beim Öffnen der Seite, alle 5 Minuten und beim Zurückkehren zum Tab.
Ein eingetragenes Ergebnis ist damit sofort sichtbar. Antwortet PlayerVW nicht, bleibt der eingebaute Stand.

## Einstellungen (`js/playervw-render.js`, oben `CONFIG`)

Build und Browser nutzen dieselbe Darstellung. Dort stehen:
- `venues`: Ortsnamen auf Italienisch/Englisch (z.B. Ritten → Renon)
- `sponsorNames`: übersetzte Sponsornamen
- `sponsorImageAttributes`: Extra-Attribute für einzelne Logos (z.B. Breite)
- Texte je Sprache (Monate, „Uhr“, Heim/Auswärts, Tabellen-Überschriften …)

Bilder (Spielerfotos, Sponsorlogos) werden beim Aktualisieren in `assets/` gespeichert; `assets.json` merkt sich die Herkunft.

## Lokal ausprobieren

```bash
node tools/playervw/build.mjs            # holt die aktuellen Daten
node tools/playervw/build.mjs --offline  # nur mit dem gespeicherten Stand
```

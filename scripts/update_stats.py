#!/usr/bin/env python3
"""Aktualisiert die Liga-Tabelle und die Topscorer-Liste in spielplan.html (DE/IT/EN).

Datenquellen:
- Liga-Tabelle und "Unterland"-Scorer: der öffentliche Snapshot von
  grizzlies.lisorect.it, der seinerseits automatisch mit Clava synchronisiert wird.
- "Gesamt"-Scorer (ligaweit, alle Mannschaften): die authentifizierte Scorer-Seite
  von grizzlies.lisorect.it (Login über LISORECT_USERNAME/LISORECT_PASSWORD),
  per Playwright aus dem bereits gerenderten DOM ausgelesen. Es werden keine
  Tokens, Cookies oder Storage-Daten gelesen oder gespeichert.

Die Mannschaftsseite (mannschaft.html) wird absichtlich nicht berührt.
"""
import json
import os
import re
import sys
import urllib.request

SNAPSHOT_URL = "https://grizzlies.lisorect.it/api/public/snapshot"
REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

TEAM_NAME_OVERRIDES = {
    "EL Dorado": "El Dorado",
    "Unterland Grizzlies": "Grizzlies Unterland",
}

LANG_CONFIG = [
    {
        "path": "spielplan.html",
        "prefix": "assets/",
        "unterland_label": "Unterland",
        "gesamt_label": "Gesamt",
        "headers_unterland": ["Nr", "Spieler", "Pos", "Sp", "T", "A", "Pkt"],
        "headers_gesamt": ["Nr", "Spieler", "Mannschaft", "T", "A", "Pkt"],
        "goals_abbr": "T",
    },
    {
        "path": "it/spielplan.html",
        "prefix": "../assets/",
        "unterland_label": "Unterland",
        "gesamt_label": "Generale",
        "headers_unterland": ["Nr", "Giocatore", "Pos", "Sp", "G", "A", "Pt"],
        "headers_gesamt": ["Nr", "Giocatore", "Squadra", "G", "A", "Pt"],
        "goals_abbr": "G",
    },
    {
        "path": "en/spielplan.html",
        "prefix": "../assets/",
        "unterland_label": "Unterland",
        "gesamt_label": "Overall",
        "headers_unterland": ["Nr", "Player", "Pos", "GP", "G", "A", "Pts"],
        "headers_gesamt": ["Nr", "Player", "Team", "G", "A", "Pts"],
        "goals_abbr": "G",
    },
]


def fetch_snapshot():
    req = urllib.request.Request(SNAPSHOT_URL, headers={"User-Agent": "grizzlies-website-bot"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.load(resp)


def fetch_gesamt_scorers():
    user = os.environ.get("LISORECT_USERNAME")
    password = os.environ.get("LISORECT_PASSWORD")
    if not user or not password:
        print("LISORECT_USERNAME/LISORECT_PASSWORD nicht gesetzt – Gesamt-Tab wird nicht aktualisiert.")
        return None
    from scrape_gesamt import scrape_gesamt_scorers
    return scrape_gesamt_scorers(user, password)


def build_standings_tbody(standings, prefix):
    rows = []
    for row in standings["rows"]:
        team = row["team"]
        display_name = TEAM_NAME_OVERRIDES.get(team, team)
        if row["isOwn"]:
            logo = f"{prefix}logo.png"
            tr_open = '<tr class="standings__own">'
        else:
            logo_file = os.path.basename(row["logoUrl"])
            logo = f"{prefix}gegner/{logo_file}"
            tr_open = "<tr>"
        goals = f"{row['goalsFor']}:{row['goalsAgainst']}"
        rows.append(
            f"{tr_open}<td>{row['rank']}</td>"
            f'<td class="standings__team"><img src="{logo}" alt="">{display_name}</td>'
            f"<td>{row['gamesPlayed']}</td><td>{row['wins']}</td><td>{row['losses']}</td>"
            f"<td>{row['overtimeLosses']}</td><td>{goals}</td><td>{row['goalDiff']}</td>"
            f"<td>{row['points']}</td></tr>"
        )
    return "".join(rows)


def header_row(headers):
    ths = "".join(f"<th>{h}</th>" for h in headers)
    return f"<table class=\"standings\"><thead><tr>{ths}</tr></thead><tbody>"


def build_unterland_body(scorers, headers):
    rows = []
    for s in scorers:
        position = s.get("position") or ""
        name = f"{s['firstName']} {s['lastName']}"
        rows.append(
            f"<tr><td>{s['jerseyNumber']}</td>"
            f'<td class="standings__team">{name}</td>'
            f"<td>{position}</td><td>{s['gamesPlayed']}</td><td>{s['goals']}</td>"
            f"<td>{s['assists']}</td><td>{s['points']}</td></tr>"
        )
    return header_row(headers) + "".join(rows) + "</tbody></table>"


def build_unterland_podium(scorers, goals_abbr):
    podium = []
    for i, s in enumerate(scorers[:3]):
        podium.append({
            "rank": i + 1,
            "name": f"{s['firstName']} {s['lastName']}",
            "team": "",
            "pts": s["points"],
            "sub": f"{s['goals']} {goals_abbr} &middot; {s['assists']} A",
        })
    return podium


def build_gesamt_body(gesamt_rows, headers):
    rows = []
    for s in gesamt_rows:
        name = f"{s['firstName']} {s['lastName']}"
        team = TEAM_NAME_OVERRIDES.get(s["team"], s["team"])
        rows.append(
            f"<tr><td>{s['rank']}</td>"
            f'<td class="standings__team">{name}</td>'
            f"<td>{team}</td><td>{s['goals']}</td>"
            f"<td>{s['assists']}</td><td>{s['points']}</td></tr>"
        )
    return header_row(headers) + "".join(rows) + "</tbody></table>"


def build_gesamt_podium(gesamt_rows, goals_abbr):
    podium = []
    for s in gesamt_rows[:3]:
        podium.append({
            "rank": s["rank"],
            "name": f"{s['firstName']} {s['lastName']}",
            "team": TEAM_NAME_OVERRIDES.get(s["team"], s["team"]),
            "pts": s["points"],
            "sub": f"{s['goals']} {goals_abbr} &middot; {s['assists']} A",
        })
    return podium


def update_file(cfg, standings, scorers, gesamt_rows):
    full_path = os.path.join(REPO_ROOT, cfg["path"])
    with open(full_path, "r", encoding="utf-8") as f:
        text = f.read()

    new_standings_tbody = build_standings_tbody(standings, cfg["prefix"])
    standings_pattern = re.compile(
        r'(<table class="standings">\s*<thead>.*?</thead>\s*<tbody>).*?(</tbody>\s*</table>)',
        re.DOTALL,
    )
    text, n1 = standings_pattern.subn(
        lambda m: m.group(1) + new_standings_tbody + m.group(2), text, count=1
    )
    if n1 != 1:
        raise RuntimeError(f"{cfg['path']}: Liga-Tabelle nicht gefunden")

    stats_pattern = re.compile(r"var STATS = (\[.*\]);")
    m = stats_pattern.search(text)
    if not m:
        raise RuntimeError(f"{cfg['path']}: STATS-Variable nicht gefunden")
    old_stats = json.loads(m.group(1))

    new_stats = [{
        "label": cfg["unterland_label"],
        "podium": build_unterland_podium(scorers, cfg["goals_abbr"]),
        "body": build_unterland_body(scorers, cfg["headers_unterland"]),
    }]

    if gesamt_rows is not None:
        new_stats.append({
            "label": cfg["gesamt_label"],
            "podium": build_gesamt_podium(gesamt_rows, cfg["goals_abbr"]),
            "body": build_gesamt_body(gesamt_rows, cfg["headers_gesamt"]),
        })
    elif len(old_stats) > 1:
        new_stats.append(old_stats[1])

    new_stats_json = json.dumps(new_stats, ensure_ascii=False)
    text = stats_pattern.sub(f"var STATS = {new_stats_json};", text, count=1)

    with open(full_path, "w", encoding="utf-8") as f:
        f.write(text)


def main():
    snapshot = fetch_snapshot()
    standings = snapshot["standings"]
    scorers = snapshot["scorers"]
    gesamt_rows = fetch_gesamt_scorers()
    for cfg in LANG_CONFIG:
        update_file(cfg, standings, scorers, gesamt_rows)
    print("Tabelle und Topscorer aktualisiert.")


if __name__ == "__main__":
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    sys.exit(main())

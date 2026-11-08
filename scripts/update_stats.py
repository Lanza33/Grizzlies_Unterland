#!/usr/bin/env python3
"""Aktualisiert die Liga-Tabelle und die Topscorer-Liste in spielplan.html (DE/IT/EN).

Datenquelle: der öffentliche Snapshot von grizzlies.lisorect.it, der seinerseits
automatisch mit Clava synchronisiert wird. Die Mannschaftsseite (mannschaft.html)
wird absichtlich nicht berührt.
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

LANG_FILES = [
    {"path": "spielplan.html", "prefix": "assets/"},
    {"path": "it/spielplan.html", "prefix": "../assets/"},
    {"path": "en/spielplan.html", "prefix": "../assets/"},
]


def fetch_snapshot():
    req = urllib.request.Request(SNAPSHOT_URL, headers={"User-Agent": "grizzlies-website-bot"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.load(resp)


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


def build_scorers_tbody(scorers):
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
    return "".join(rows)


def update_file(rel_path, prefix, standings, scorers):
    full_path = os.path.join(REPO_ROOT, rel_path)
    with open(full_path, "r", encoding="utf-8") as f:
        text = f.read()

    new_standings_tbody = build_standings_tbody(standings, prefix)
    standings_pattern = re.compile(
        r'(<table class="standings">\s*<thead>.*?</thead>\s*<tbody>).*?(</tbody>\s*</table>)',
        re.DOTALL,
    )
    text, n1 = standings_pattern.subn(
        lambda m: m.group(1) + new_standings_tbody + m.group(2), text, count=1
    )
    if n1 != 1:
        raise RuntimeError(f"{rel_path}: Liga-Tabelle nicht gefunden")

    stats_pattern = re.compile(r"var STATS = (\[.*\]);")
    m = stats_pattern.search(text)
    if not m:
        raise RuntimeError(f"{rel_path}: STATS-Variable nicht gefunden")
    stats = json.loads(m.group(1))

    body_pattern = re.compile(r'(<table class="standings"><thead>.*?</thead><tbody>).*?(</tbody></table>)')
    new_body, n2 = body_pattern.subn(
        lambda bm: bm.group(1) + build_scorers_tbody(scorers) + bm.group(2),
        stats[0]["body"],
        count=1,
    )
    if n2 != 1:
        raise RuntimeError(f"{rel_path}: Topscorer-Tabelle nicht gefunden")
    stats[0]["body"] = new_body

    new_stats_json = json.dumps(stats, ensure_ascii=False)
    text = stats_pattern.sub(f"var STATS = {new_stats_json};", text, count=1)

    with open(full_path, "w", encoding="utf-8") as f:
        f.write(text)


def main():
    snapshot = fetch_snapshot()
    standings = snapshot["standings"]
    scorers = snapshot["scorers"]
    for entry in LANG_FILES:
        update_file(entry["path"], entry["prefix"], standings, scorers)
    print("Tabelle und Topscorer aktualisiert.")


if __name__ == "__main__":
    sys.exit(main())

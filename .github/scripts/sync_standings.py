#!/usr/bin/env python3
"""Sync the standings table and scorer stats in spielplan.html (DE/IT/EN)
from the public, unauthenticated lisorect snapshot API.

Only touches:
  - the <table class="standings"> tbody in the "Tabelle" section
  - the three tbodies inside the STATS JS array (Topscorer / Top-Goalscorer / Top-Assists)

Everything else on the page (schedule, header labels, translations, notices)
is left untouched. No credentials are used or required - the endpoint is public.
"""
import html
import json
import re
import sys
import urllib.request
from pathlib import Path

API_URL = "https://grizzlies.lisorect.it/api/public/snapshot"

REPO_ROOT = Path(__file__).resolve().parents[2]

PAGES = [
    (REPO_ROOT / "spielplan.html", ""),
    (REPO_ROOT / "it" / "spielplan.html", "../"),
    (REPO_ROOT / "en" / "spielplan.html", "../"),
]

# Known opponent teams -> (logo filename under assets/gegner/, canonical display name).
# Add a new entry here if a new team joins the league and the script reports it missing.
TEAM_META = {
    "hc floschn": ("floschn.png", "HC Floschn"),
    "zska signat": ("zska.png", "ZSKA Signat"),
    "hc grisu": ("grisu.png", "HC Grisu"),
    "el dorado": ("eldorado.png", "El Dorado"),
    "hc zone": ("zone.png", "HC Zone"),
    "hc skulls": ("skulls.png", "HC Skulls"),
    "hc tuifl": ("tuifl.png", "HC Tuifl"),
    "softy socks": ("softy.png", "Softy Socks"),
}


def fetch_snapshot():
    req = urllib.request.Request(API_URL, headers={"Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=20) as resp:
        return json.load(resp)


def esc(s):
    return html.escape(str(s), quote=False)


def build_standings_tbody(rows, prefix):
    out = ["<tbody>"]
    for row in rows:
        if row.get("isOwn"):
            logo = f"{prefix}assets/logo.png"
            name = "Grizzlies Unterland"
            row_class = ' class="standings__own"'
        else:
            key = row["team"].strip().lower()
            if key not in TEAM_META:
                raise RuntimeError(
                    f"Unknown team '{row['team']}' in standings - add it to TEAM_META in {__file__}"
                )
            logo_file, name = TEAM_META[key]
            logo = f"{prefix}assets/gegner/{logo_file}"
            row_class = ""
        goals_cell = f"{row['goalsFor']}:{row['goalsAgainst']}"
        out.append(
            f"<tr{row_class}><td>{row['rank']}</td>"
            f'<td class="standings__team"><img src="{esc(logo)}" alt="">{esc(name)}</td>'
            f"<td>{row['gamesPlayed']}</td><td>{row['wins']}</td><td>{row['losses']}</td>"
            f"<td>{row['overtimeLosses']}</td><td>{esc(goals_cell)}</td>"
            f"<td>{row['goalDiff']}</td><td>{row['points']}</td></tr>"
        )
    out.append("</tbody>")
    return "".join(out)


def player_name(p):
    return f"{p['firstName']} {p['lastName']}".strip()


def build_scorer_tbody(players, cols):
    """cols: list of keys to render after Nr/Spieler/Pos, in order."""
    out = ["<tbody>"]
    for p in players:
        jersey = p.get("jerseyNumber")
        jersey = "" if jersey is None else jersey
        pos = p.get("position") or ""
        cells = "".join(f"<td>{p[c]}</td>" for c in cols)
        out.append(
            f"<tr><td>{jersey}</td>"
            f'<td class="standings__team">{esc(player_name(p))}</td>'
            f"<td>{esc(pos)}</td><td>{p['gamesPlayed']}</td>{cells}</tr>"
        )
    out.append("</tbody>")
    return "".join(out)


def replace_first(pattern, replacement, text, flags=0):
    new_text, count = re.subn(pattern, replacement, text, count=1, flags=flags)
    if count != 1:
        raise RuntimeError(f"Expected exactly 1 match for pattern, got {count}: {pattern[:80]}")
    return new_text


def replace_nth_tbody(segment, index, new_tbody):
    """Replace the Nth (0-based) <tbody>...</tbody> occurrence in segment."""
    matches = list(re.finditer(r"<tbody>.*?</tbody>", segment))
    if len(matches) <= index:
        raise RuntimeError(f"Expected at least {index + 1} <tbody> blocks, found {len(matches)}")
    m = matches[index]
    return segment[: m.start()] + new_tbody + segment[m.end() :]


def update_page(path, prefix, standings_tbody, topscorer_tbody, goalscorer_tbody, assists_tbody):
    content = path.read_text(encoding="utf-8")

    # 1) Main standings table tbody (uniquely identified by the "#" header cell).
    content = replace_first(
        r'(<thead><tr><th>#</th>.*?</thead>\s*)<tbody>.*?</tbody>',
        lambda m: m.group(1) + standings_tbody,
        content,
    )

    # 2) The three stat tables inside `var STATS = [...];` (single line).
    stats_match = re.search(r"var STATS = \[.*?\];", content)
    if not stats_match:
        raise RuntimeError(f"Could not find 'var STATS = [...]' line in {path}")
    stats_line = stats_match.group(0)
    new_stats_line = stats_line
    # Inside this JS string literal, attribute quotes are escaped as \" -
    # match that escaping when substituting the generated tbody HTML.
    esc_quotes = lambda s: s.replace('"', '\\"')
    new_stats_line = replace_nth_tbody(new_stats_line, 0, esc_quotes(topscorer_tbody))
    new_stats_line = replace_nth_tbody(new_stats_line, 1, esc_quotes(goalscorer_tbody))
    new_stats_line = replace_nth_tbody(new_stats_line, 2, esc_quotes(assists_tbody))
    content = content[: stats_match.start()] + new_stats_line + content[stats_match.end() :]

    path.write_text(content, encoding="utf-8")


def main():
    data = fetch_snapshot()

    standings_rows = data["standings"]["rows"]
    scorers = data["scorers"]

    topscorer_order = sorted(scorers, key=lambda p: p["rank"])
    goalscorer_order = sorted(scorers, key=lambda p: (-p["goals"], p["rank"]))
    assists_order = sorted(scorers, key=lambda p: (-p["assists"], p["rank"]))

    topscorer_tbody = build_scorer_tbody(topscorer_order, ["goals", "assists", "points"])
    goalscorer_tbody = build_scorer_tbody(goalscorer_order, ["goals"])
    assists_tbody = build_scorer_tbody(assists_order, ["assists"])

    for path, prefix in PAGES:
        standings_tbody = build_standings_tbody(standings_rows, prefix)
        update_page(path, prefix, standings_tbody, topscorer_tbody, goalscorer_tbody, assists_tbody)
        print(f"updated {path}")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:  # noqa: BLE001
        print(f"sync_standings.py failed: {exc}", file=sys.stderr)
        sys.exit(1)

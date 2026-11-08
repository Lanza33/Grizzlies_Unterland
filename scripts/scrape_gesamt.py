"""Scrapt die authentifizierte 'Gesamt'-Scorerliste von grizzlies.lisorect.it.

Loggt sich mit einem echten Mitgliederzugang ein (Zugangsdaten nur als
Umgebungsvariablen, nie auf Platte), navigiert zur Scorer-Seite und liest
die bereits serverseitig berechnete, ligaweite Tabelle direkt aus dem
gerenderten DOM aus. Es werden keine Tokens, Cookies oder Storage-Daten
gelesen oder gespeichert.
"""
from playwright.sync_api import sync_playwright


def scrape_gesamt_scorers(username, password):
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            page.goto("https://grizzlies.lisorect.it/", wait_until="load")
            page.wait_for_timeout(1500)
            page.get_by_role("button", name="DE", exact=True).first.click()
            page.wait_for_timeout(1000)
            page.locator('a[href="anmelden"]').first.click()
            page.wait_for_timeout(1500)
            inputs = page.locator("input")
            inputs.nth(0).fill(username)
            inputs.nth(1).fill(password)
            page.locator("button[type=submit]").first.click()
            page.wait_for_timeout(3000)
            if "falsch" in page.content().lower() or "incorrect" in page.content().lower():
                raise RuntimeError("Lisorect-Login fehlgeschlagen (falsche Zugangsdaten?)")

            page.locator('a[href="scorers"]').first.click()
            page.wait_for_timeout(2500)
            page.get_by_text("Gesamt", exact=True).first.click()
            page.wait_for_timeout(2500)

            rows = page.locator("table.stat-table tbody tr")
            count = rows.count()
            result = []
            for i in range(count):
                row = rows.nth(i)
                cells = row.locator("td")
                last_name = row.locator("strong:not(.text-accent)").inner_text().strip()
                first_name = row.locator("span.hide-sm").inner_text().strip()
                team = cells.nth(2).inner_text().strip()
                nums = row.locator("td.num").all_inner_texts()
                rank, goals, assists, points = [n.strip() for n in nums[:4]]
                result.append({
                    "rank": int(rank),
                    "firstName": first_name,
                    "lastName": last_name,
                    "team": team,
                    "goals": int(goals),
                    "assists": int(assists),
                    "points": int(points),
                })
            return result
        finally:
            browser.close()


if __name__ == "__main__":
    import json
    import os
    import sys

    user = os.environ.get("LISORECT_USERNAME")
    pw = os.environ.get("LISORECT_PASSWORD")
    if not user or not pw:
        print("LISORECT_USERNAME/LISORECT_PASSWORD nicht gesetzt.", file=sys.stderr)
        sys.exit(1)
    data = scrape_gesamt_scorers(user, pw)
    print(json.dumps(data, ensure_ascii=False, indent=2))
    print(f"{len(data)} Zeilen gescraped.", file=sys.stderr)

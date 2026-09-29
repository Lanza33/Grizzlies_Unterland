#!/usr/bin/env node
// Füllt die Datenbereiche der Webseite aus PlayerVW (https://grizzlies.lisorect.it).
//
// Die Seiten bleiben normale HTML-Dateien. Nur was zwischen <!--pvw:name--> … <!--/pvw:name--> bzw.
// /*pvw:name*/ … /*/pvw:name*/ steht, wird hier neu geschrieben — mit genau dem Markup, das vorher von Hand
// drin stand. Außerhalb der Markierungen wird nichts angefasst.
//
//   node tools/playervw/build.mjs            # holt die Daten und schreibt die Seiten
//   node tools/playervw/build.mjs --offline  # nur mit dem letzten gespeicherten Stand (snapshot.json)
//
// Ausfallsicher: Ist PlayerVW nicht erreichbar oder liefert verdächtig wenig, wird mit dem letzten Stand
// (tools/playervw/snapshot.json) gearbeitet — die Seite wird nie leer.

import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const SNAPSHOT_FILE = join(HERE, 'snapshot.json');
const MANIFEST_FILE = join(HERE, 'assets.json');
const config = JSON.parse(await readFile(join(HERE, 'config.json'), 'utf8'));
const offline = process.argv.includes('--offline');
// Zum Testen: PLAYERVW_API=http://localhost:…/snapshot.json
const apiUrl = process.env.PLAYERVW_API || config.apiUrl;

// Im Spielplan stehen die Monatskürzel in allen Sprachen deutsch (wie bisher).
const SHORT_MONTHS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

const log = (...a) => console.log('[playervw]', ...a);
const warn = (...a) => console.warn('[playervw] WARNUNG:', ...a);

// ── Daten holen (mit Fallback) ─────────────────────────────────────────────

async function loadSnapshot() {
  const previous = await readFile(SNAPSHOT_FILE, 'utf8').then(JSON.parse).catch(() => null);
  if (offline) {
    if (!previous) throw new Error('Kein gespeicherter Stand (snapshot.json) vorhanden.');
    return { snapshot: previous, fresh: false };
  }
  try {
    const res = await fetch(apiUrl, { signal: AbortSignal.timeout(config.timeoutMs), headers: { 'User-Agent': 'Grizzlies-Webseite-Build' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const snapshot = await res.json();
    const problem = plausibility(snapshot, previous);
    if (problem) throw new Error(`Daten unplausibel: ${problem}`);
    return { snapshot, fresh: true, changed: snapshot.version !== previous?.version };
  } catch (e) {
    if (!previous) throw new Error(`PlayerVW nicht erreichbar (${e.message}) und kein gespeicherter Stand vorhanden.`);
    warn(`PlayerVW nicht verwendbar (${e.message}) – baue mit dem letzten Stand ${previous.version}.`);
    return { snapshot: previous, fresh: false };
  }
}

/** Schutz vor "halb leerer" Seite: plötzlich fehlende Mannschaft/Spielplan übernehmen wir nicht. */
function plausibility(s, previous) {
  if (!s || !Array.isArray(s.players) || !Array.isArray(s.games) || !s.version) return 'Format';
  if (previous) {
    if (s.players.length < Math.min(5, previous.players.length)) return `nur ${s.players.length} Spieler`;
    if (s.games.length === 0 && previous.games.length > 0) return 'Spielplan leer';
    if (s.sponsors.length === 0 && previous.sponsors.length > 0) return 'keine Sponsoren';
  }
  return null;
}

// ── Bilder (Fotos, Logos) ───────────────────────────────────────────────────
// Bilder liegen im Repo und werden mit der Seite ausgeliefert (kein Laden von PlayerVW im Browser).
// assets.json merkt sich, aus welcher PlayerVW-Datei ein lokales Bild stammt; ändert sich die Datei dort
// (neuer Upload = neuer Name), wird das lokale Bild ersetzt.

let manifest = {};
const exists = (p) => access(join(ROOT, p)).then(() => true, () => false);

async function syncAsset(localPath, url) {
  if (!url) return;
  const known = manifest[localPath];
  if (known === url) return;
  // Erstes Mal und die Datei gibt es schon (z.B. bisher von Hand eingefügt) → übernehmen, nicht überschreiben
  if (known === undefined && await exists(localPath)) { manifest[localPath] = url; return; }
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(config.timeoutMs) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    await mkdir(dirname(join(ROOT, localPath)), { recursive: true });
    await writeFile(join(ROOT, localPath), Buffer.from(await res.arrayBuffer()));
    manifest[localPath] = url;
    log('Bild aktualisiert:', localPath);
  } catch (e) {
    warn(`Bild ${url} nicht geladen (${e.message}) – alte Datei bleibt.`);
  }
}

const slug = (s) => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/ß/g, 'ss')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const extOf = (url, fallback) => (url ? extname(new URL(url).pathname) : '') || fallback;

// ── Hilfen ──────────────────────────────────────────────────────────────────

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fullName = (p) => `${p.firstName} ${p.lastName}`;
const pad = (n) => String(n).padStart(2, '0');

/** "2026-10-11T21:00:00" (Südtiroler Ortszeit) → Teile, ohne Zeitzonen-Umrechnung. */
function parts(startsAt) {
  const [d, t] = startsAt.split('T');
  const [y, m, day] = d.split('-').map(Number);
  return { y, m, day, time: t.slice(0, 5), date: `${pad(day)}.${pad(m)}.${String(y).slice(2)}` };
}

/** Jetzt in Südtiroler Ortszeit als "YYYY-MM-DDTHH:MM". */
function localNow() {
  const f = new Intl.DateTimeFormat('sv-SE', { timeZone: config.timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  return f.format(new Date()).replace(' ', 'T');
}

function nextGame(s) {
  // Ein Spiel gilt bis 2 Stunden nach Beginn als "nächstes"
  const d = new Date(Date.now() - 2 * 3600 * 1000);
  const f = new Intl.DateTimeFormat('sv-SE', { timeZone: config.timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  const from = f.format(d).replace(' ', 'T');
  return s.games.find((g) => g.startsAt.slice(0, 16) >= from) ?? null;
}

const opponentOf = (g) => (g.isHome ? g.away : g.home);
const venue = (name, lang) => config.venues[name]?.[lang] ?? name;
const logoKey = (url) => (url ? url.split('/').pop().replace(/\.png$/, '') : null);
const opponentLogo = (g, prefix) => `${prefix}${config.opponentLogoDir}/${logoKey(opponentOf(g).logoUrl)}.png`;
const timeText = (L, t) => L.time.replace('{t}', t);

// ── Bereiche rendern ────────────────────────────────────────────────────────

function renderSeason(s) { return s.season ?? ''; }
function renderSeasonShort(s) { return s.seasonStartYear ? `${s.seasonStartYear}/${String(s.seasonStartYear + 1).slice(2)}` : ''; }

function renderNext(s, L, prefix, current) {
  const g = nextGame(s);
  if (!g) return current; // Saison vorbei: bisherigen Inhalt stehen lassen
  const p = parts(g.startsAt);
  return `<a class="strip__game" href="spielplan.html"><b>${L.nextGame}</b><span>${p.date} &middot; ${timeText(L, p.time)}</span>`
    + `<span>${config.ownShortName} <em>vs</em> ${esc(opponentOf(g).name)}</span></a>`;
}

function renderHomeGame(s, L, lang, prefix, current) {
  const g = nextGame(s);
  if (!g) return current;
  const p = parts(g.startsAt);
  const opp = opponentOf(g);
  return `<div class="game">
      <div class="game__team"><img src="${prefix}${config.ownLogo}" alt="${esc(s.teamName)}" width="700" height="596"><b>${config.ownShortName}</b></div>
      <div class="game__mid"><span class="${g.isHome ? 'tag tag--home' : 'tag'}">${g.isHome ? L.home : L.away}</span><div class="game__date">${p.date}</div><div class="game__time">${timeText(L, p.time)}</div><div class="game__loc">${esc(venue(g.venue, lang))}</div></div>
      <div class="game__team game__team--opp"><img src="${opponentLogo(g, prefix)}" alt="${esc(opp.name)}" width="120" height="120"><b>${esc(opp.name)}</b></div>
    </div>`;
}

/** Bisherige Reihenfolge der Karten übernehmen (Namen aus dem aktuellen HTML); neue Spieler hinten, nach Nummer. */
function existingOrder(html) {
  return [...html.matchAll(/<h3>(.*?)<\/h3>/g)].map((m) => m[1].replace(/<br>/g, ' '));
}

const byNumber = (a, b) => (a.jerseyNumber ?? 999) - (b.jerseyNumber ?? 999) || a.lastName.localeCompare(b.lastName);

function renderTeam(s, L, prefix, current) {
  const order = existingOrder(current);
  const rank = (p) => { const i = order.indexOf(fullName(p)); return i < 0 ? 10000 : i; };
  let out = '';
  for (const pos of ['G', 'D', 'F']) {
    const players = s.players.filter((p) => (p.position ?? 'F') === pos).sort((a, b) => rank(a) - rank(b) || byNumber(a, b));
    if (players.length === 0) continue;
    out += `${out ? '\n' : ''}<h3 class="pgrid__group" data-group="${pos}">${L.positions[pos]}</h3>`;
    for (const p of players) {
      const photo = p.cutoutUrl ? `${config.playerPhotoDir}/${slug(fullName(p))}${extOf(p.cutoutUrl, '.png')}` : null;
      const ph = photo
        ? `<div class="pcard__ph"><img src="${prefix}${photo}" alt="${esc(fullName(p))}"></div>`
        : `<div class="pcard__ph pcard__ph--empty"><!-- Foto: <img src="${prefix}${config.playerPhotoDir}/name.png" alt="Name"> --></div>`;
      out += `\n      <article class="pcard" data-pos="${pos}"><div class="pcard__num" aria-hidden="true">${p.jerseyNumber ?? '&nbsp;'}</div>${ph}`
        + `<div class="pcard__meta"><span class="pcard__pos">${L.positions[pos]}</span><h3>${esc(fullName(p))}</h3></div></article>`;
    }
  }
  return out.replace(/^\n/, '');
}

function renderNotice(s, L, lang) {
  const n = s.notices.find((x) => (x.placement === 'schedule' || x.placement === 'all') && (!x.visibleFrom || x.visibleFrom <= localNow().slice(0, 10)));
  if (!n) return '';
  const text = (lang === 'it' ? n.textIt : lang === 'en' ? n.textEn : null) ?? n.text;
  return `<div class="notice"><p><strong>${L.noticeLabel}</strong> ${esc(text).replace(/ – /g, ' &ndash; ')}</p></div>`;
}

/** Spielplan als JS-Array in der bisherigen Schreibweise ({"label": …, "body": …}). */
function renderCalendar(s, L, lang, prefix) {
  if (s.games.length === 0) return 'var CAL_MONTHS = [];';
  const first = parts(s.games[0].startsAt);
  const last = parts(s.games[s.games.length - 1].startsAt);
  // Bis zum Saisonende (März) auch leere Monate zeigen — wie bisher
  const endY = s.seasonStartYear ? s.seasonStartYear + 1 : last.y;
  const end = Math.max(last.y * 12 + last.m, endY * 12 + config.seasonLastMonth);
  const months = [];
  for (let k = first.y * 12 + first.m; k <= end; k++) {
    const y = Math.floor((k - 1) / 12), m = ((k - 1) % 12) + 1;
    const games = s.games.filter((g) => { const p = parts(g.startsAt); return p.y === y && p.m === m; });
    const body = games.length === 0 ? `<p class="fx-empty">${L.noGames}</p>` : games.map((g) => {
      const p = parts(g.startsAt);
      const r = g.result;
      const vs = r ? `${r.homeScore}:${r.awayScore}${r.type === 'Overtime' ? ' n.V.' : r.type === 'Shootout' ? ' n.P.' : ''}` : 'vs';
      return `<div class="fx"><div class="${g.isHome ? 'fx__date' : 'fx__date fx__date--away'}">${p.day}<small>${SHORT_MONTHS[p.m - 1]}</small>`
        + `<small class="fx__time">${timeText(L, p.time)}</small><small class="fx__loc">${esc(venue(g.venue, lang))}</small></div>`
        + `<div class="fx__teams"><span class="fx__vs">${vs}</span><img class="fx__logo" src="${opponentLogo(g, prefix)}" alt=""><span class="fx__name">${esc(opponentOf(g).name)}</span></div>`
        + `<span class="${g.isHome ? 'tag tag--home' : 'tag'}">${g.isHome ? L.home : L.away}</span></div>`;
    }).join('');
    months.push(`{"label": ${JSON.stringify(`<span>${L.months[m - 1]}</span> ${y}`)}, "body": ${JSON.stringify(body)}}`);
  }
  return `var CAL_MONTHS = [${months.join(', ')}];`;
}

const seasonStarted = (s) => s.games.some((g) => g.result);

function renderStandings(s, prefix) {
  return '<tbody>' + s.standings.rows.map((r) => {
    const logo = r.isOwn ? `${prefix}${config.ownLogo}` : `${prefix}${config.opponentLogoDir}/${logoKey(r.logoUrl)}.png`;
    return `<tr${r.isOwn ? ' class="standings__own"' : ''}><td>${r.rank}</td><td class="standings__team"><img src="${logo}" alt="">${esc(r.team)}</td>`
      + `<td>${r.gamesPlayed}</td><td>${r.wins}</td><td>${r.losses}</td><td>${r.overtimeLosses}</td><td>${r.goalsFor}:${r.goalsAgainst}</td>`
      + `<td>${r.goalDiff > 0 ? '+' + r.goalDiff : r.goalDiff}</td><td>${r.points}</td></tr>`;
  }).join('') + '</tbody>';
}

const note = (s, text, L) => `<p class="cal__note">${text}${seasonStarted(s) ? '' : L.notStarted}</p>`;

/** Statistiken: alle gemeldeten Feldspieler (auch mit 0), Werte aus PlayerVW; bei Gleichstand nach Nummer. */
function renderStats(s, L) {
  const T = L.stats;
  const scorer = new Map(s.scorers.map((x) => [fullName(x), x]));
  const goalie = new Map(s.goalies.map((x) => [fullName(x), x]));
  const skaters = s.players.filter((p) => p.position !== 'G').map((p) => ({ ...p, ...(scorer.get(fullName(p)) ?? {}) }));
  const goalies = s.players.filter((p) => p.position === 'G').map((p) => ({ ...p, ...(goalie.get(fullName(p)) ?? {}) }));
  const v = (x, k) => x[k] ?? 0;
  const num = (p) => p.jerseyNumber ?? '&nbsp;';
  const table = (heads, rows) => `<table class="standings"><thead><tr>${heads.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>`
    + rows.map((cells) => `<tr>${cells.map((c, i) => i === 1 ? `<td class="standings__team">${c}</td>` : `<td>${c}</td>`).join('')}</tr>`).join('')
    + '</tbody></table>';
  const skaterTable = (key, sortKeys, label) => {
    const rows = [...skaters].sort((a, b) => sortKeys.reduce((r, k) => r || v(b, k) - v(a, k), 0) || byNumber(a, b));
    const heads = [T.no, T.player, T.pos, T.gp, ...key.heads];
    return { label, body: table(heads, rows.map((p) => [num(p), esc(fullName(p)), p.position ?? 'F', v(p, 'gamesPlayed'), ...key.cells(p)])) };
  };
  const svp = (g) => g.savePercentage == null ? '0.0%' : `${(g.savePercentage * 100).toFixed(1)}%`;
  const stats = [
    skaterTable({ heads: [T.g, T.a, T.pts], cells: (p) => [v(p, 'goals'), v(p, 'assists'), v(p, 'points')] }, ['points', 'goals'], T.points),
    skaterTable({ heads: [T.g], cells: (p) => [v(p, 'goals')] }, ['goals'], T.goals),
    skaterTable({ heads: [T.a], cells: (p) => [v(p, 'assists')] }, ['assists'], T.assists),
    {
      label: T.goalies,
      body: table([T.no, T.goalie, T.gp, T.min, T.ga, T.svp, T.so],
        [...goalies].sort((a, b) => (b.savePercentage ?? -1) - (a.savePercentage ?? -1) || v(a, 'goalsAgainst') - v(b, 'goalsAgainst') || byNumber(a, b))
          .map((g) => [num(g), esc(fullName(g)), v(g, 'gamesPlayed'), v(g, 'minutes'), v(g, 'goalsAgainst'), svp(g), v(g, 'shutouts')]))
    },
    skaterTable({ heads: [T.pimShort], cells: (p) => [v(p, 'penaltyMinutes')] }, ['penaltyMinutes'], T.pim)
  ];
  return `var STATS = [${stats.map((x) => `{"label": ${JSON.stringify(x.label)}, "body": ${JSON.stringify(x.body)}}`).join(', ')}];`;
}

function renderBoard(s, prefix) {
  return s.board.map((b) => {
    const photo = b.photoUrl ? `people/${slug(b.firstName + ' ' + b.lastName)}${extOf(b.photoUrl, '.jpg')}` : null;
    const ph = photo
      ? `<div class="pcard__ph"><img src="${prefix}assets/${photo}" alt="${esc(b.firstName + ' ' + b.lastName)}"></div>`
      : '<div class="pcard__ph pcard__ph--empty"></div>';
    return `      <article class="pcard"><div class="pcard__num" aria-hidden="true">&nbsp;</div>${ph}<div class="pcard__meta"><span class="pcard__pos">${esc(roleOf(b))}</span><h3>${esc(b.firstName)}<br>${esc(b.lastName)}</h3></div></article>`;
  }).join('\n');
}
let currentLang = 'de';
const roleOf = (b) => (currentLang === 'it' ? b.roleIt : currentLang === 'en' ? b.roleEn : null) ?? b.role;

/** Bisherige Logo-Dateien der Sponsoren (Name → Pfad) aus dem aktuellen HTML. */
function existingSponsorLogos(html) {
  return new Map([...html.matchAll(/<img src="(?:\.\.\/)?([^"]+)" alt="([^"]*)"/g)].map((m) => [m[2].replace(/&amp;/g, '&'), m[1]]));
}

function sponsorLogo(sp, known) {
  return known.get(sp.name) ?? (sp.logoUrl ? `${config.sponsorLogoDir}/${slug(sp.name)}${extOf(sp.logoUrl, '.png')}` : null);
}

/** Logo-Pfade immer aus der deutschen Seite (in IT/EN sind manche Sponsornamen übersetzt). */
let sponsorLogosDe = new Map();
const sponsorName = (sp, lang) => config.sponsorNames?.[sp.name]?.[lang] ?? sp.name;

function renderSponsors(s, L, lang, prefix) {
  const img = (sp) => {
    const path = sponsorLogo(sp, sponsorLogosDe);
    const name = esc(sponsorName(sp, lang));
    return path ? `<img src="${prefix}${path}" alt="${name}"${config.sponsorImageAttributes[sp.name] ?? ''}>` : name;
  };
  const tile = (sp, main) => {
    const cls = main ? 'spon spon--main spon--logo' : 'spon spon--logo-light';
    return sp.websiteUrl
      ? `<a class="${cls}" href="${esc(sp.websiteUrl)}" target="_blank" rel="noopener">${img(sp)}</a>`
      : `<div class="${cls}">${img(sp)}</div>`;
  };
  const main = s.sponsors.filter((x) => x.tier === 'Main');
  const others = s.sponsors.filter((x) => x.tier !== 'Main');
  return `<span class="kicker">${L.mainSponsor}</span>\n    <div class="spons" style="margin-bottom:2.5rem">${main.map((x) => tile(x, true)).join('')}</div>\n`
    + `    <span class="kicker">${L.sponsors}</span>\n    <div class="spons">\n${others.map((x) => `      ${tile(x, false)}`).join('\n')}\n    </div>`;
}

// ── Seiten schreiben ────────────────────────────────────────────────────────

const MARK = /(<!--pvw:([\w-]+)-->|\/\*pvw:([\w-]+)\*\/)([\s\S]*?)(<!--\/pvw:\2-->|\/\*\/pvw:\3\*\/)/g;

function fill(html, s, lang, L, prefix) {
  currentLang = lang;
  return html.replace(MARK, (all, open, n1, n2, current, close) => {
    const name = n1 ?? n2;
    const render = {
      'season': () => renderSeason(s),
      'season-short': () => renderSeasonShort(s),
      'next': () => renderNext(s, L, prefix, current),
      'home-game': () => renderHomeGame(s, L, lang, prefix, current),
      'team': () => renderTeam(s, L, prefix, current),
      'notice': () => renderNotice(s, L, lang),
      'calendar': () => renderCalendar(s, L, lang, prefix),
      'standings': () => renderStandings(s, prefix),
      'standings-note': () => note(s, L.standingsNote, L),
      'stats': () => renderStats(s, L),
      'stats-note': () => note(s, L.statsNote, L),
      'board': () => renderBoard(s, prefix),
      'sponsors': () => renderSponsors(s, L, lang, prefix)
    }[name];
    if (!render) { warn(`Unbekannter Bereich "${name}" – bleibt unverändert.`); return all; }
    return open + render() + close;
  });
}

async function syncImages(s) {
  for (const sp of s.sponsors) await syncAsset(sponsorLogo(sp, sponsorLogosDe), sp.logoUrl);
  for (const p of s.players) {
    if (p.cutoutUrl) await syncAsset(`${config.playerPhotoDir}/${slug(fullName(p))}${extOf(p.cutoutUrl, '.png')}`, p.cutoutUrl);
  }
  for (const b of s.board) {
    if (b.photoUrl) await syncAsset(`assets/people/${slug(b.firstName + ' ' + b.lastName)}${extOf(b.photoUrl, '.jpg')}`, b.photoUrl);
  }
}

// ── Ablauf ──────────────────────────────────────────────────────────────────

const { snapshot, fresh, changed } = await loadSnapshot();
manifest = await readFile(MANIFEST_FILE, 'utf8').then(JSON.parse).catch(() => ({}));
log(`Datenstand ${snapshot.version}${fresh ? ' (frisch aus PlayerVW)' : ' (gespeichert)'}`);

sponsorLogosDe = existingSponsorLogos(await readFile(join(ROOT, 'sponsoren.html'), 'utf8').catch(() => ''));
if (fresh) await syncImages(snapshot);

let written = 0;
for (const [lang, L] of Object.entries(config.languages)) {
  const prefix = L.dir ? '../' : '';
  for (const page of ['index', 'mannschaft', 'vorstand', 'verein', 'spielplan', 'sponsoren', 'kontakt', 'impressum', 'datenschutz']) {
    const file = join(ROOT, L.dir, `${page}.html`);
    const html = await readFile(file, 'utf8').catch(() => null);
    if (html == null) continue;
    const out = fill(html, snapshot, lang, L, prefix);
    if (out !== html) { await writeFile(file, out); written++; }
  }
}

if (fresh && changed) {
  await writeFile(SNAPSHOT_FILE, JSON.stringify(snapshot, null, 1) + '\n');
}
if (fresh) await writeFile(MANIFEST_FILE, JSON.stringify(Object.fromEntries(Object.entries(manifest).sort()), null, 1) + '\n');
log(written ? `${written} Seite(n) aktualisiert.` : 'Keine Änderungen.');

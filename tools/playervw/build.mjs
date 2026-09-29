#!/usr/bin/env node
// Schreibt die PlayerVW-Daten fest in die Seiten (für Suchmaschinen und als Stand, falls PlayerVW nicht erreichbar ist).
// Im Browser aktualisiert js/playervw.js dieselben Bereiche live aus der API — beide nutzen js/playervw-render.js.
//
// Nur was zwischen <!--pvw:name--> … <!--/pvw:name--> bzw. /*pvw:name*/ … /*/pvw:name*/ steht, wird neu geschrieben.
//
//   node tools/playervw/build.mjs            # holt die Daten und schreibt die Seiten
//   node tools/playervw/build.mjs --offline  # nur mit dem letzten gespeicherten Stand (snapshot.json)
//   PLAYERVW_API=http://…/snapshot.json node tools/playervw/build.mjs   # andere Quelle (Test)

import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONFIG, renderRegion, playerPhotoPath, sponsorLogoPath, boardPhotoPath } from '../../js/playervw-render.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const SNAPSHOT_FILE = join(HERE, 'snapshot.json');
const MANIFEST_FILE = join(HERE, 'assets.json');
const TIMEOUT_MS = 15000;
const offline = process.argv.includes('--offline');
const apiUrl = process.env.PLAYERVW_API || CONFIG.apiUrl;
const PAGES = ['index', 'mannschaft', 'vorstand', 'verein', 'spielplan', 'sponsoren', 'kontakt', 'impressum', 'datenschutz'];

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
    const res = await fetch(apiUrl, { signal: AbortSignal.timeout(TIMEOUT_MS), headers: { 'User-Agent': 'Grizzlies-Webseite-Build' } });
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
export function plausibility(s, previous) {
  if (!s || !Array.isArray(s.players) || !Array.isArray(s.games) || !s.version) return 'Format';
  if (previous) {
    if (s.players.length < Math.min(5, previous.players.length)) return `nur ${s.players.length} Spieler`;
    if (s.games.length === 0 && previous.games.length > 0) return 'Spielplan leer';
    if ((s.sponsors?.length ?? 0) === 0 && previous.sponsors?.length > 0) return 'keine Sponsoren';
  }
  return null;
}

// ── Bilder ──────────────────────────────────────────────────────────────────
// Bilder liegen im Repo (assets/). assets.json merkt sich lokaler Pfad → PlayerVW-Adresse; ändert sich die Adresse
// (neuer Upload), wird die Datei ersetzt. Der Browser nutzt assets.json, um lokale statt entfernte Bilder zu zeigen.

let manifest = {};
const exists = (p) => access(join(ROOT, p)).then(() => true, () => false);
const localFor = (url) => Object.keys(manifest).find((k) => manifest[k] === url);

async function syncAsset(localPath, url) {
  if (!url) return;
  const known = manifest[localPath];
  if (known === url) return;
  // Erstes Mal und die Datei gibt es schon (bisher von Hand eingefügt) → übernehmen, nicht überschreiben
  if (known === undefined && await exists(localPath)) { manifest[localPath] = url; return; }
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    await mkdir(dirname(join(ROOT, localPath)), { recursive: true });
    await writeFile(join(ROOT, localPath), Buffer.from(await res.arrayBuffer()));
    manifest[localPath] = url;
    log('Bild aktualisiert:', localPath);
  } catch (e) {
    warn(`Bild ${url} nicht geladen (${e.message}) – alte Datei bleibt.`);
  }
}

/** Sponsorlogos: bestehende Datei (Manifest oder bisheriges Logo gleichen Namens) behalten, sonst neuer Name. */
let sponsorLogosDe = new Map();
const sponsorPath = (sp) => localFor(sp.logoUrl) ?? sponsorLogosDe.get(sp.name) ?? sponsorLogoPath(sp);

async function syncImages(s) {
  for (const sp of s.sponsors) await syncAsset(sponsorPath(sp), sp.logoUrl);
  for (const p of s.players) if (p.cutoutUrl) await syncAsset(localFor(p.cutoutUrl) ?? playerPhotoPath(p), p.cutoutUrl);
  for (const b of s.board) if (b.photoUrl) await syncAsset(localFor(b.photoUrl) ?? boardPhotoPath(b), b.photoUrl);
}

// ── Seiten schreiben ────────────────────────────────────────────────────────

const MARK = /(<!--pvw:([\w-]+)-->|\/\*pvw:([\w-]+)\*\/)([\s\S]*?)(<!--\/pvw:\2-->|\/\*\/pvw:\3\*\/)/g;

function fill(html, s, lang, prefix, now) {
  return html.replace(MARK, (all, open, n1, n2, current, close) => {
    const name = n1 ?? n2;
    const ctx = {
      lang, prefix, now, current, sponsorPath,
      // Bild immer aus dem Repo (wurde vorher synchronisiert)
      image: (url, suggested) => prefix + (localFor(url) ?? suggested)
    };
    const out = renderRegion(name, s, ctx);
    if (out === null && !['next', 'home-game'].includes(name)) warn(`Unbekannter Bereich "${name}" – bleibt unverändert.`);
    return out === null ? all : open + out + close;
  });
}

// ── Ablauf ──────────────────────────────────────────────────────────────────

const { snapshot, fresh, changed } = await loadSnapshot();
manifest = await readFile(MANIFEST_FILE, 'utf8').then(JSON.parse).catch(() => ({}));
log(`Datenstand ${snapshot.version}${fresh ? ' (frisch aus PlayerVW)' : ' (gespeichert)'}`);

const deSponsors = await readFile(join(ROOT, 'sponsoren.html'), 'utf8').catch(() => '');
sponsorLogosDe = new Map([...deSponsors.matchAll(/<img src="([^"]+)" alt="([^"]*)"/g)].map((m) => [m[2].replace(/&amp;/g, '&'), m[1]]));
if (fresh) await syncImages(snapshot);

const now = new Date();
let written = 0;
for (const [lang, L] of Object.entries(CONFIG.languages)) {
  const prefix = L.dir ? '../' : '';
  for (const page of PAGES) {
    const file = join(ROOT, L.dir, `${page}.html`);
    const html = await readFile(file, 'utf8').catch(() => null);
    if (html == null) continue;
    const out = fill(html, snapshot, lang, prefix, now);
    if (out !== html) { await writeFile(file, out); written++; }
  }
}

if (fresh && changed) await writeFile(SNAPSHOT_FILE, JSON.stringify(snapshot, null, 1) + '\n');
if (fresh) await writeFile(MANIFEST_FILE, JSON.stringify(Object.fromEntries(Object.entries(manifest).sort()), null, 1) + '\n');
log(written ? `${written} Seite(n) aktualisiert.` : 'Keine Änderungen.');

// Live-Daten aus PlayerVW: aktualisiert die pvw-Bereiche der Seite direkt aus der API.
// Die Seite enthält immer schon den zuletzt eingebauten Stand (tools/playervw/build.mjs). Antwortet die API nicht,
// bleibt einfach dieser Stand stehen. Geprüft wird beim Öffnen, alle 5 Minuten und beim Zurückkehren zum Tab.

import { CONFIG, renderRegion, calendarMonths, statsTables } from './playervw-render.js';

const TIMEOUT_MS = 6000;
// Zum Testen überschreibbar (window.PLAYERVW_API vor dem Laden setzen)
const API_URL = window.PLAYERVW_API || CONFIG.apiUrl;
const INTERVAL_MS = 5 * 60 * 1000;

const lang = document.documentElement.lang?.slice(0, 2) in CONFIG.languages ? document.documentElement.lang.slice(0, 2) : 'de';
const prefix = CONFIG.languages[lang].dir ? '../' : '';
let manifest = null;
let lastVersion = null;
let busy = false;

async function getJson(url, init) {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/** Lokale Bilder aus dem Repo bevorzugen; neue (noch nicht eingebaute) direkt von PlayerVW. */
async function loadManifest() {
  if (manifest) return;
  try {
    const m = await getJson(`${prefix}tools/playervw/assets.json`, { cache: 'no-cache' });
    manifest = new Map(Object.entries(m).map(([path, url]) => [url, path]));
  } catch { manifest = new Map(); }
}

/** Alle Bereiche zwischen <!--pvw:name--> und <!--/pvw:name--> im DOM. */
function regions() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_COMMENT);
  const open = new Map();
  const found = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const m = n.data.match(/^(\/?)pvw:([\w-]+)$/);
    if (!m) continue;
    if (!m[1]) open.set(m[2], n);
    else if (open.has(m[2])) { found.push({ name: m[2], start: open.get(m[2]), end: n }); open.delete(m[2]); }
  }
  return found;
}

function innerHtml(start, end) {
  const box = document.createElement('div');
  for (let n = start.nextSibling; n && n !== end; n = n.nextSibling) box.appendChild(n.cloneNode(true));
  return box.innerHTML;
}

function replace(start, end, html) {
  const range = document.createRange();
  range.setStartAfter(start);
  range.setEndBefore(end);
  // Unverändert (nach DOM-Normalisierung) → nichts anfassen, damit nichts flackert
  const probe = document.createElement('div');
  probe.innerHTML = html;
  if (probe.innerHTML === innerHtml(start, end)) return;
  range.deleteContents();
  range.insertNode(range.createContextualFragment(html));
}

/** Monats-/Statistik-Umschalter mit neuen Daten neu verbinden (gleiches Verhalten wie das Seiten-Skript). */
function rebind(items, ids, wrap) {
  const head = document.getElementById(ids.head), body = document.getElementById(ids.body);
  let prev = document.getElementById(ids.prev), next = document.getElementById(ids.next);
  if (!head || !body || !prev || !next || items.length === 0) return;
  // Alte Klick-Handler entfernen (Knöpfe ersetzen), aktuellen Monat/Reiter beibehalten
  const current = head.innerHTML;
  let idx = Math.max(0, items.findIndex((x) => x.label === current));
  prev.replaceWith(prev = prev.cloneNode(true));
  next.replaceWith(next = next.cloneNode(true));
  const render = () => {
    head.innerHTML = items[idx].label;
    body.innerHTML = items[idx].body;
    if (!wrap) { prev.disabled = idx <= 0; next.disabled = idx >= items.length - 1; }
  };
  prev.addEventListener('click', () => { idx = wrap ? (idx - 1 + items.length) % items.length : Math.max(0, idx - 1); render(); });
  next.addEventListener('click', () => { idx = wrap ? (idx + 1) % items.length : Math.min(items.length - 1, idx + 1); render(); });
  render();
}

function apply(s) {
  const L = CONFIG.languages[lang];
  const now = new Date();
  const image = (url, suggested) => (manifest.get(url) ? prefix + manifest.get(url) : url);
  for (const r of regions()) {
    const html = renderRegion(r.name, s, { lang, prefix, now, current: innerHtml(r.start, r.end), image });
    if (html !== null) replace(r.start, r.end, html);
  }
  // Spielplan und Statistiken stecken in Seiten-Skripten → Widgets mit den neuen Daten verbinden
  if (document.getElementById('calGrid')) rebind(calendarMonths(s, L, { lang, prefix }), { head: 'calHead', body: 'calGrid', prev: 'calPrev', next: 'calNext' }, false);
  if (document.getElementById('statsBody')) rebind(statsTables(s, L), { head: 'statsHead', body: 'statsBody', prev: 'statsPrev', next: 'statsNext' }, true);
}

async function refresh() {
  if (busy || document.visibilityState === 'hidden') return;
  busy = true;
  try {
    // Browser-Cache mit ETag: unverändert → 304, kaum Datenverkehr
    const s = await getJson(API_URL, { cache: 'no-cache' });
    if (!s || !Array.isArray(s.players) || !Array.isArray(s.games) || s.players.length === 0) return;
    // Gleicher Stand → nur zeitabhängige Bereiche ("Nächstes Spiel") prüfen
    await loadManifest();
    if (s.version === lastVersion) {
      for (const r of regions().filter((x) => x.name === 'next' || x.name === 'home-game')) {
        const html = renderRegion(r.name, s, { lang, prefix, now: new Date(), current: '', image: (u) => u });
        if (html !== null) replace(r.start, r.end, html);
      }
      return;
    }
    apply(s);
    lastVersion = s.version;
  } catch {
    // PlayerVW nicht erreichbar → Stand der Seite bleibt
  } finally {
    busy = false;
  }
}

refresh();
setInterval(refresh, INTERVAL_MS);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') refresh(); });

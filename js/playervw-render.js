// Darstellung der PlayerVW-Daten — gemeinsam für den Build (tools/playervw/build.mjs) und den Browser (js/playervw.js).
// Erzeugt exakt das Markup, das vorher von Hand in den Seiten stand; CSS und Seiten-JS bleiben unverändert.

export const CONFIG = {
  apiUrl: 'https://grizzlies.lisorect.it/api/public/snapshot',
  timeZone: 'Europe/Rome',
  ownShortName: 'Grizzlies',
  ownLogo: 'assets/logo.png',
  opponentLogoDir: 'assets/gegner',
  playerPhotoDir: 'assets/spieler',
  sponsorLogoDir: 'assets',
  // Spielplan bis einschließlich März zeigen (auch leere Monate)
  seasonLastMonth: 3,
  // Ortsnamen auf Italienisch/Englisch
  venues: {
    Ritten: { it: 'Renon', en: 'Renon' }
  },
  // Übersetzte Sponsornamen
  sponsorNames: {
    'Südtiroler Sparkasse': { it: 'Cassa di Risparmio', en: 'Sparkasse Savings Bank' },
    'Kofler Maler & Gipskarton': { it: 'Kofler Pittore & Cartongesso', en: 'Kofler Painting & Drywall' }
  },
  // Extra-Attribute für einzelne Logos
  sponsorImageAttributes: {
    Rothoblaas: ' width="400"',
    'Widmann Heizungen': ' width="450"'
  },
  languages: {
    de: {
      dir: '',
      months: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
      time: '{t} Uhr', home: 'Heim', away: 'Auswärts', noGames: 'Keine Spiele in diesem Monat.',
      positions: { G: 'Tor', D: 'Verteidigung', F: 'Sturm' },
      nextGame: 'Nächstes Spiel', noticeLabel: 'Wichtig:', mainSponsor: 'Hauptsponsor', sponsors: 'Sponsoren',
      standingsNote: 'Sp = Spiele &middot; S = Siege &middot; N = Niederlagen &middot; OTN = Niederlage n. Verl. &middot; Pkt = Punkte.',
      statsNote: 'Nur Spieler der Grizzlies Unterland. Sp = Spiele &middot; T = Tore &middot; A = Assists &middot; Pkt = Punkte &middot; GT = Gegentore &middot; SO = Shutout &middot; SM = Strafminuten.',
      notStarted: ' Die Saison hat noch nicht begonnen &ndash; alle Werte stehen bei 0.',
      stats: {
        points: 'Topscorer', goals: 'Top-Goalscorer', assists: 'Top-Assists', goalies: 'Top-Goalies', pim: 'Top-Strafminuten',
        no: 'Nr', player: 'Spieler', goalie: 'Torhüter', pos: 'Pos', gp: 'Sp', g: 'T', a: 'A', pts: 'Pkt',
        min: 'Min', ga: 'GT', svp: 'Fangquote', so: 'SO', pimShort: 'SM'
      }
    },
    it: {
      dir: 'it/',
      months: ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'],
      time: 'ore {t}', home: 'Casa', away: 'Trasferta', noGames: 'Nessuna partita in questo mese.',
      positions: { G: 'Portiere', D: 'Difesa', F: 'Attacco' },
      nextGame: 'Prossima partita', noticeLabel: 'Importante:', mainSponsor: 'Sponsor principale', sponsors: 'Sponsor',
      standingsNote: 'Sp = Partite &middot; V = Vittorie &middot; P = Sconfitte &middot; OTN = Sconfitta d.t.s. &middot; Pt = Punti.',
      statsNote: 'Solo giocatori dei Grizzlies Unterland. Sp = Partite &middot; G = Gol &middot; A = Assist &middot; Pt = Punti &middot; GS = Gol subiti &middot; SO = Shutout &middot; MP = Minuti di penalità.',
      notStarted: ' La stagione non è ancora iniziata &ndash; tutti i valori sono a 0.',
      stats: {
        points: 'Miglior marcatore', goals: 'Miglior cannoniere', assists: 'Migliori assist', goalies: 'Miglior portiere', pim: 'Più minuti di penalità',
        no: 'N.', player: 'Giocatore', goalie: 'Portiere', pos: 'Pos', gp: 'Sp', g: 'G', a: 'A', pts: 'Pt',
        min: 'Min', ga: 'GS', svp: '% Parate', so: 'SO', pimShort: 'MP'
      }
    },
    en: {
      dir: 'en/',
      months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
      time: '{t}', home: 'Home', away: 'Away', noGames: 'No games this month.',
      positions: { G: 'Goalie', D: 'Defence', F: 'Forward' },
      nextGame: 'Next game', noticeLabel: 'Important:', mainSponsor: 'Main sponsor', sponsors: 'Sponsors',
      standingsNote: 'GP = Games &middot; W = Wins &middot; L = Losses &middot; OTL = OT/SO loss &middot; Pts = Points.',
      statsNote: 'Grizzlies Unterland players only. GP = Games &middot; G = Goals &middot; A = Assists &middot; Pts = Points &middot; GA = Goals against &middot; SO = Shutout &middot; PIM = Penalty minutes.',
      notStarted: ' The season has not started yet &ndash; all values are 0.',
      stats: {
        points: 'Top scorer', goals: 'Top goalscorer', assists: 'Top assists', goalies: 'Top goalies', pim: 'Most penalty minutes',
        no: 'No', player: 'Player', goalie: 'Goalie', pos: 'Pos', gp: 'GP', g: 'G', a: 'A', pts: 'Pts',
        min: 'Min', ga: 'GA', svp: 'Sv%', so: 'SO', pimShort: 'PIM'
      }
    }
  }
};

// Im Spielplan stehen die Monatskürzel in allen Sprachen deutsch (wie bisher).
const SHORT_MONTHS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

// ── Hilfen ──────────────────────────────────────────────────────────────────

export const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const fullName = (p) => `${p.firstName} ${p.lastName}`;
export const slug = (s) => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/ß/g, 'ss')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const extOf = (url, fallback) => {
  try { return (url && new URL(url).pathname.match(/\.[a-z0-9]+$/i)?.[0]) || fallback; } catch { return fallback; }
};
const pad = (n) => String(n).padStart(2, '0');

/** "2026-10-11T21:00:00" (Südtiroler Ortszeit) → Teile, ohne Zeitzonen-Umrechnung. */
function parts(startsAt) {
  const [d, t] = startsAt.split('T');
  const [y, m, day] = d.split('-').map(Number);
  return { y, m, day, time: t.slice(0, 5), date: `${pad(day)}.${pad(m)}.${String(y).slice(2)}` };
}

/** Zeitpunkt in Südtiroler Ortszeit als "YYYY-MM-DDTHH:MM". */
function local(date) {
  const f = new Intl.DateTimeFormat('sv-SE', { timeZone: CONFIG.timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  return f.format(date).replace(' ', 'T');
}

/** Ein Spiel gilt bis 2 Stunden nach Beginn als "nächstes". */
export function nextGame(s, now) {
  const from = local(new Date(now.getTime() - 2 * 3600 * 1000));
  return s.games.find((g) => g.startsAt.slice(0, 16) >= from) ?? null;
}

const opponentOf = (g) => (g.isHome ? g.away : g.home);
const venue = (name, lang) => CONFIG.venues[name]?.[lang] ?? name;
const logoKey = (url) => (url ? url.split('/').pop().replace(/\.png$/, '') : null);
const opponentLogo = (g, prefix) => `${prefix}${CONFIG.opponentLogoDir}/${logoKey(opponentOf(g).logoUrl)}.png`;
const timeText = (L, t) => L.time.replace('{t}', t);
const byNumber = (a, b) => (a.jerseyNumber ?? 999) - (b.jerseyNumber ?? 999) || a.lastName.localeCompare(b.lastName);
const seasonStarted = (s) => s.games.some((g) => g.result);

/** Vorgeschlagener lokaler Pfad eines Spielerfotos. */
export const playerPhotoPath = (p) => `${CONFIG.playerPhotoDir}/${slug(fullName(p))}${extOf(p.cutoutUrl, '.png')}`;
export const sponsorLogoPath = (sp) => `${CONFIG.sponsorLogoDir}/${slug(sp.name)}${extOf(sp.logoUrl, '.png')}`;
export const boardPhotoPath = (b) => `assets/people/${slug(b.firstName + ' ' + b.lastName)}${extOf(b.photoUrl, '.jpg')}`;

// ── Bereiche ────────────────────────────────────────────────────────────────
// ctx: { lang, prefix ('' oder '../'), now (Date), current (bisheriger Inhalt als HTML), image(url, suggestedLocalPath, kind) → src }

const renderers = {
  season: (s) => s.season ?? '',

  'season-short': (s) => (s.seasonStartYear ? `${s.seasonStartYear}/${String(s.seasonStartYear + 1).slice(2)}` : ''),

  next(s, L, ctx) {
    const g = nextGame(s, ctx.now);
    if (!g) return null; // Saison vorbei: bisherigen Inhalt stehen lassen
    const p = parts(g.startsAt);
    return `<a class="strip__game" href="spielplan.html"><b>${L.nextGame}</b><span>${p.date} &middot; ${timeText(L, p.time)}</span>`
      + `<span>${CONFIG.ownShortName} <em>vs</em> ${esc(opponentOf(g).name)}</span></a>`;
  },

  'home-game'(s, L, ctx) {
    const g = nextGame(s, ctx.now);
    if (!g) return null;
    const p = parts(g.startsAt);
    const opp = opponentOf(g);
    return `<div class="game">
      <div class="game__team"><img src="${ctx.prefix}${CONFIG.ownLogo}" alt="${esc(s.teamName)}" width="700" height="596"><b>${CONFIG.ownShortName}</b></div>
      <div class="game__mid"><span class="${g.isHome ? 'tag tag--home' : 'tag'}">${g.isHome ? L.home : L.away}</span><div class="game__date">${p.date}</div><div class="game__time">${timeText(L, p.time)}</div><div class="game__loc">${esc(venue(g.venue, ctx.lang))}</div></div>
      <div class="game__team game__team--opp"><img src="${opponentLogo(g, ctx.prefix)}" alt="${esc(opp.name)}" width="120" height="120"><b>${esc(opp.name)}</b></div>
    </div>`;
  },

  /** Bisherige Reihenfolge der Karten bleibt; neue Spieler kommen hinten in ihre Gruppe (nach Nummer). */
  team(s, L, ctx) {
    const order = [...ctx.current.matchAll(/<h3>(.*?)<\/h3>/g)].map((m) => m[1].replace(/<br>/g, ' ').replace(/&amp;/g, '&'));
    const rank = (p) => { const i = order.indexOf(fullName(p)); return i < 0 ? 10000 : i; };
    let out = '';
    for (const pos of ['G', 'D', 'F']) {
      const players = s.players.filter((p) => (p.position ?? 'F') === pos).sort((a, b) => rank(a) - rank(b) || byNumber(a, b));
      if (players.length === 0) continue;
      out += `${out ? '\n' : ''}<h3 class="pgrid__group" data-group="${pos}">${L.positions[pos]}</h3>`;
      for (const p of players) {
        const src = p.cutoutUrl ? ctx.image(p.cutoutUrl, playerPhotoPath(p), 'player') : null;
        const ph = src
          ? `<div class="pcard__ph"><img src="${src}" alt="${esc(fullName(p))}"></div>`
          : `<div class="pcard__ph pcard__ph--empty"><!-- Foto: <img src="${ctx.prefix}${CONFIG.playerPhotoDir}/name.png" alt="Name"> --></div>`;
        out += `\n      <article class="pcard" data-pos="${pos}"><div class="pcard__num" aria-hidden="true">${p.jerseyNumber ?? '&nbsp;'}</div>${ph}`
          + `<div class="pcard__meta"><span class="pcard__pos">${L.positions[pos]}</span><h3>${esc(fullName(p))}</h3></div></article>`;
      }
    }
    return out;
  },

  notice(s, L, ctx) {
    const today = local(ctx.now).slice(0, 10);
    const n = s.notices.find((x) => (x.placement === 'schedule' || x.placement === 'all')
      && (!x.visibleFrom || x.visibleFrom <= today) && (!x.visibleUntil || x.visibleUntil >= today));
    if (!n) return '';
    const text = (ctx.lang === 'it' ? n.textIt : ctx.lang === 'en' ? n.textEn : null) ?? n.text;
    return `<div class="notice"><p><strong>${L.noticeLabel}</strong> ${esc(text).replace(/ – /g, ' &ndash; ')}</p></div>`;
  },

  calendar: (s, L, ctx) => `var CAL_MONTHS = ${arrayLiteral(calendarMonths(s, L, ctx))};`,

  standings(s, L, ctx) {
    return '<tbody>' + s.standings.rows.map((r) => {
      const logo = r.isOwn ? `${ctx.prefix}${CONFIG.ownLogo}` : `${ctx.prefix}${CONFIG.opponentLogoDir}/${logoKey(r.logoUrl)}.png`;
      return `<tr${r.isOwn ? ' class="standings__own"' : ''}><td>${r.rank}</td><td class="standings__team"><img src="${logo}" alt="">${esc(r.team)}</td>`
        + `<td>${r.gamesPlayed}</td><td>${r.wins}</td><td>${r.losses}</td><td>${r.overtimeLosses}</td><td>${r.goalsFor}:${r.goalsAgainst}</td>`
        + `<td>${r.goalDiff > 0 ? '+' + r.goalDiff : r.goalDiff}</td><td>${r.points}</td></tr>`;
    }).join('') + '</tbody>';
  },

  'standings-note': (s, L) => `<p class="cal__note">${L.standingsNote}${seasonStarted(s) ? '' : L.notStarted}</p>`,

  stats: (s, L) => `var STATS = ${arrayLiteral(statsTables(s, L))};`,

  'stats-note': (s, L) => `<p class="cal__note">${L.statsNote}${seasonStarted(s) ? '' : L.notStarted}</p>`,

  board(s, L, ctx) {
    return s.board.map((b) => {
      const name = `${b.firstName} ${b.lastName}`;
      const src = b.photoUrl ? ctx.image(b.photoUrl, boardPhotoPath(b), 'board') : null;
      const ph = src ? `<div class="pcard__ph"><img src="${src}" alt="${esc(name)}"></div>` : '<div class="pcard__ph pcard__ph--empty"></div>';
      const role = (ctx.lang === 'it' ? b.roleIt : ctx.lang === 'en' ? b.roleEn : null) ?? b.role;
      return `      <article class="pcard"><div class="pcard__num" aria-hidden="true">&nbsp;</div>${ph}<div class="pcard__meta"><span class="pcard__pos">${esc(role)}</span><h3>${esc(b.firstName)}<br>${esc(b.lastName)}</h3></div></article>`;
    }).join('\n');
  },

  sponsors(s, L, ctx) {
    const img = (sp) => {
      const name = esc(CONFIG.sponsorNames[sp.name]?.[ctx.lang] ?? sp.name);
      const src = sp.logoUrl ? ctx.image(sp.logoUrl, ctx.sponsorPath?.(sp) ?? sponsorLogoPath(sp), 'sponsor') : null;
      return src ? `<img src="${src}" alt="${name}"${CONFIG.sponsorImageAttributes[sp.name] ?? ''}>` : name;
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
};

/** Inhalt eines Bereichs, oder null = bisherigen Inhalt lassen. */
export function renderRegion(name, s, ctx) {
  const fn = renderers[name];
  if (!fn) return null;
  return fn(s, CONFIG.languages[ctx.lang], ctx);
}

/** Monate des Spielplans: [{label, body}] — auch für das Seiten-Widget im Browser. */
export function calendarMonths(s, L, ctx) {
  if (s.games.length === 0) return [];
  const first = parts(s.games[0].startsAt);
  const last = parts(s.games[s.games.length - 1].startsAt);
  const endY = s.seasonStartYear ? s.seasonStartYear + 1 : last.y;
  const end = Math.max(last.y * 12 + last.m, endY * 12 + CONFIG.seasonLastMonth);
  const months = [];
  for (let k = first.y * 12 + first.m; k <= end; k++) {
    const y = Math.floor((k - 1) / 12), m = ((k - 1) % 12) + 1;
    const games = s.games.filter((g) => { const p = parts(g.startsAt); return p.y === y && p.m === m; });
    const body = games.length === 0 ? `<p class="fx-empty">${L.noGames}</p>` : games.map((g) => {
      const p = parts(g.startsAt);
      const r = g.result;
      const vs = r ? `${r.homeScore}:${r.awayScore}${r.type === 'Overtime' ? ' n.V.' : r.type === 'Shootout' ? ' n.P.' : ''}` : 'vs';
      return `<div class="fx"><div class="${g.isHome ? 'fx__date' : 'fx__date fx__date--away'}">${p.day}<small>${SHORT_MONTHS[p.m - 1]}</small>`
        + `<small class="fx__time">${timeText(L, p.time)}</small><small class="fx__loc">${esc(venue(g.venue, ctx.lang))}</small></div>`
        + `<div class="fx__teams"><span class="fx__vs">${vs}</span><img class="fx__logo" src="${opponentLogo(g, ctx.prefix)}" alt=""><span class="fx__name">${esc(opponentOf(g).name)}</span></div>`
        + `<span class="${g.isHome ? 'tag tag--home' : 'tag'}">${g.isHome ? L.home : L.away}</span></div>`;
    }).join('');
    months.push({ label: `<span>${L.months[m - 1]}</span> ${y}`, body });
  }
  return months;
}

/** Statistik-Tabellen: [{label, body}] — alle gemeldeten Spieler (auch mit 0), bei Gleichstand nach Nummer. */
export function statsTables(s, L) {
  const T = L.stats;
  const scorer = new Map(s.scorers.map((x) => [fullName(x), x]));
  const goalie = new Map((s.goalies ?? []).map((x) => [fullName(x), x]));
  const skaters = s.players.filter((p) => p.position !== 'G').map((p) => ({ ...p, ...(scorer.get(fullName(p)) ?? {}) }));
  const goalies = s.players.filter((p) => p.position === 'G').map((p) => ({ ...p, ...(goalie.get(fullName(p)) ?? {}) }));
  const v = (x, k) => x[k] ?? 0;
  const num = (p) => p.jerseyNumber ?? '&nbsp;';
  const table = (heads, rows) => `<table class="standings"><thead><tr>${heads.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>`
    + rows.map((cells) => `<tr>${cells.map((c, i) => (i === 1 ? `<td class="standings__team">${c}</td>` : `<td>${c}</td>`)).join('')}</tr>`).join('')
    + '</tbody></table>';
  const skaterTable = (heads, cells, sortKeys, label) => {
    const rows = [...skaters].sort((a, b) => sortKeys.reduce((r, k) => r || v(b, k) - v(a, k), 0) || byNumber(a, b));
    return { label, body: table([T.no, T.player, T.pos, T.gp, ...heads], rows.map((p) => [num(p), esc(fullName(p)), p.position ?? 'F', v(p, 'gamesPlayed'), ...cells(p)])) };
  };
  const svp = (g) => (g.savePercentage == null ? '0.0%' : `${(g.savePercentage * 100).toFixed(1)}%`);
  return [
    skaterTable([T.g, T.a, T.pts], (p) => [v(p, 'goals'), v(p, 'assists'), v(p, 'points')], ['points', 'goals'], T.points),
    skaterTable([T.g], (p) => [v(p, 'goals')], ['goals'], T.goals),
    skaterTable([T.a], (p) => [v(p, 'assists')], ['assists'], T.assists),
    {
      label: T.goalies,
      body: table([T.no, T.goalie, T.gp, T.min, T.ga, T.svp, T.so],
        [...goalies].sort((a, b) => (b.savePercentage ?? -1) - (a.savePercentage ?? -1) || v(a, 'goalsAgainst') - v(b, 'goalsAgainst') || byNumber(a, b))
          .map((g) => [num(g), esc(fullName(g)), v(g, 'gamesPlayed'), v(g, 'minutes'), v(g, 'goalsAgainst'), svp(g), v(g, 'shutouts')]))
    },
    skaterTable([T.pimShort], (p) => [v(p, 'penaltyMinutes')], ['penaltyMinutes'], T.pim)
  ];
}

/** Schreibweise wie bisher in den Seiten: [{"label": …, "body": …}, …] */
function arrayLiteral(items) {
  return `[${items.map((x) => `{"label": ${JSON.stringify(x.label)}, "body": ${JSON.stringify(x.body)}}`).join(', ')}]`;
}

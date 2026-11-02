// Baut den Monats-Spielplan (spielplan.html) automatisch aus assets/js/schedule.js:
// startet immer beim aktuellen/nächsten Monat mit Spielen und zeigt nur
// Termine, die noch nicht vorbei sind. Kein Eingriff nötig, solange künftige
// Spiele in schedule.js eingetragen sind.
(function () {
  var schedule = window.GRIZZLIES_SCHEDULE;
  var head = document.getElementById('calHead');
  var list = document.getElementById('calGrid');
  var prevBtn = document.getElementById('calPrev');
  var nextBtn = document.getElementById('calNext');
  if (!schedule || !head || !list || !prevBtn || !nextBtn) return;

  var lang = (document.documentElement.getAttribute('lang') || 'de').slice(0, 2);
  var base = lang === 'de' ? '' : '../';

  var MONTH_NAMES = {
    de: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
    it: ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'],
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  };
  // Monatsabkürzung im Termin-Kästchen: auf der bestehenden Seite in allen
  // drei Sprachen unverändert deutsch (Okt, Nov, …) – hier bewusst beibehalten.
  var MONTH_ABBR = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
  var LABELS = {
    de: { home: 'Heim', away: 'Auswärts', timePrefix: '', timeSuffix: ' Uhr', empty: 'Keine Spiele in diesem Monat.' },
    it: { home: 'Casa', away: 'Trasferta', timePrefix: 'ore ', timeSuffix: '', empty: 'Nessuna partita in questo mese.' },
    en: { home: 'Home', away: 'Away', timePrefix: '', timeSuffix: '', empty: 'No games this month.' }
  };
  var MN = MONTH_NAMES[lang] || MONTH_NAMES.de;
  var L = LABELS[lang] || LABELS.de;

  // Fester Saisonzeitraum des Kalenders (wie bisher: Okt 2026 – März 2027).
  var SEASON = [[2026, 10], [2026, 11], [2026, 12], [2027, 1], [2027, 2], [2027, 3]];

  var today = new Date();
  today.setHours(0, 0, 0, 0);

  function monthGames(y, m) {
    return schedule.filter(function (g) {
      var p = g.date.split('-');
      var gy = parseInt(p[0], 10), gm = parseInt(p[1], 10), gd = parseInt(p[2], 10);
      if (gy !== y || gm !== m) return false;
      return new Date(gy, gm - 1, gd) >= today;
    });
  }

  function fxHtml(g) {
    var p = g.date.split('-');
    var day = parseInt(p[2], 10);
    var abbr = MONTH_ABBR[parseInt(p[1], 10) - 1];
    var timeStr = L.timePrefix + g.time + L.timeSuffix;
    var locName = (g.loc && g.loc[lang]) || g.loc.de;
    var dateCls = g.home ? 'fx__date' : 'fx__date fx__date--away';
    var tagCls = g.home ? 'tag tag--home' : 'tag';
    var tagLabel = g.home ? L.home : L.away;
    return '<div class="fx"><div class="' + dateCls + '">' + day + '<small>' + abbr + '</small><small class="fx__time">' + timeStr + '</small><small class="fx__loc">' + locName + '</small></div><div class="fx__teams"><span class="fx__vs">vs</span><img class="fx__logo" src="' + base + g.logo + '" alt=""><span class="fx__name">' + g.opponent + '</span></div><span class="' + tagCls + '">' + tagLabel + '</span></div>';
  }

  function isCurrentOrFuture(y, m) {
    return y > today.getFullYear() || (y === today.getFullYear() && m >= today.getMonth() + 1);
  }

  var idx = -1, i, y, m;
  for (i = 0; i < SEASON.length; i++) {
    y = SEASON[i][0]; m = SEASON[i][1];
    if (isCurrentOrFuture(y, m) && monthGames(y, m).length) { idx = i; break; }
  }
  if (idx === -1) {
    for (i = 0; i < SEASON.length; i++) {
      y = SEASON[i][0]; m = SEASON[i][1];
      if (isCurrentOrFuture(y, m)) { idx = i; break; }
    }
  }
  if (idx === -1) idx = SEASON.length - 1;
  var minIdx = idx;

  function render() {
    var sy = SEASON[idx][0], sm = SEASON[idx][1];
    head.innerHTML = '<span>' + MN[sm - 1] + '</span> ' + sy;
    var games = monthGames(sy, sm);
    list.innerHTML = games.length ? games.map(fxHtml).join('') : '<p class="fx-empty">' + L.empty + '</p>';
    prevBtn.disabled = idx <= minIdx;
    nextBtn.disabled = idx >= SEASON.length - 1;
  }
  prevBtn.addEventListener('click', function () { if (idx > minIdx) { idx--; render(); } });
  nextBtn.addEventListener('click', function () { if (idx < SEASON.length - 1) { idx++; render(); } });
  render();
})();

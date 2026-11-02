// Aktualisiert den "Nächstes Spiel"-Banner (und auf der Startseite die Game-Day-Karte)
// automatisch anhand von assets/js/schedule.js, sobald der Termin des aktuellen
// Spiels vorbei ist. Kein Eingriff nötig, solange künftige Spiele in schedule.js
// (und spielplan.html) eingetragen sind.
(function () {
  var schedule = window.GRIZZLIES_SCHEDULE;
  if (!schedule || !schedule.length) return;

  var lang = (document.documentElement.getAttribute('lang') || 'de').slice(0, 2);
  var LABELS = {
    de: { home: 'Heim', away: 'Auswärts', timePrefix: '', timeSuffix: ' Uhr' },
    it: { home: 'Casa', away: 'Trasferta', timePrefix: 'ore ', timeSuffix: '' },
    en: { home: 'Home', away: 'Away', timePrefix: '', timeSuffix: '' }
  };
  var L = LABELS[lang] || LABELS.de;
  var base = lang === 'de' ? '' : '../';

  var today = new Date();
  today.setHours(0, 0, 0, 0);

  var next = null;
  for (var i = 0; i < schedule.length; i++) {
    var g = schedule[i];
    var parts = g.date.split('-');
    var gameDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    if (gameDate >= today) { next = g; break; }
  }
  if (!next) return;

  var dp = next.date.split('-');
  var dateStr = dp[2] + '.' + dp[1] + '.' + dp[0].slice(2);
  var timeStr = L.timePrefix + next.time + L.timeSuffix;
  var tagLabel = next.home ? L.home : L.away;
  var locName = (next.loc && next.loc[lang]) || next.loc.de;
  var logoSrc = base + next.logo;

  // Strip-Banner (auf jeder Seite)
  var stripGame = document.querySelector('.strip__game');
  if (stripGame) {
    var spans = stripGame.querySelectorAll('span');
    if (spans[0]) spans[0].textContent = dateStr + ' · ' + timeStr;
    if (spans[1]) spans[1].innerHTML = 'Grizzlies <em>vs</em> ' + next.opponent;
  }

  // Game-Day-Karte (nur Startseite)
  var tagEl = document.querySelector('.game .tag');
  if (tagEl) {
    tagEl.textContent = tagLabel;
    tagEl.classList.toggle('tag--home', !!next.home);
  }
  var dateEl = document.querySelector('.game__date');
  if (dateEl) dateEl.textContent = dateStr;
  var timeEl = document.querySelector('.game__time');
  if (timeEl) timeEl.textContent = timeStr;
  var locEl = document.querySelector('.game__loc');
  if (locEl) locEl.textContent = locName;
  var oppImg = document.querySelector('.game__team--opp img');
  if (oppImg) { oppImg.src = logoSrc; oppImg.alt = next.opponent; }
  var oppName = document.querySelector('.game__team--opp b');
  if (oppName) oppName.textContent = next.opponent;
})();

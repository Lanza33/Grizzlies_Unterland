// Mobile-Navigation
(function(){
  var t = document.querySelector('.nav__toggle'), l = document.querySelector('.nav__links');
  if(!t || !l) return;
  t.addEventListener('click', function(){
    var open = l.classList.toggle('open');
    t.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
})();

// Positionsfilter (Mannschaft)
(function(){
  var chips = document.querySelectorAll('.chip[data-filter]');
  if(!chips.length) return;
  var cards = document.querySelectorAll('.pcard[data-pos]');
  var groups = document.querySelectorAll('.pgrid__group[data-group]');
  chips.forEach(function(chip){
    chip.addEventListener('click', function(){
      chips.forEach(function(c){ c.setAttribute('aria-pressed', c === chip ? 'true' : 'false'); });
      var f = chip.getAttribute('data-filter');
      cards.forEach(function(card){ card.hidden = !(f === 'all' || card.getAttribute('data-pos') === f); });
      groups.forEach(function(g){ g.hidden = (f !== 'all'); });
    });
  });
})();

// Zeittafel (Verein) -> weiter zur aktuellen Saison scrollen
(function(){
  var btn = document.getElementById('timelineMore'), wrap = document.getElementById('timelineWrap');
  if(!btn || !wrap) return;
  btn.addEventListener('click', function(){
    wrap.scrollTo({left: wrap.scrollWidth, behavior:'smooth'});
  });
})();

// Kalender-Kachel (Startseite) -> immer aktuellen Monat anzeigen
(function(){
  var el = document.querySelector('.mo__cal-month');
  if(!el) return;
  var lang = document.documentElement.lang || 'de';
  var month = new Intl.DateTimeFormat(lang, {month:'long'}).format(new Date());
  el.textContent = month.toUpperCase();
})();

// Kontaktformular -> öffnet das Mailprogramm (statische Seite, kein Server nötig)
(function(){
  var f = document.getElementById('kontaktform');
  if(!f) return;
  f.addEventListener('submit', function(e){
    e.preventDefault();
    var d = new FormData(f);
    var body = 'Name: ' + d.get('name') + '\nE-Mail: ' + d.get('email') + '\n\n' + d.get('msg');
    location.href = 'mailto:' + f.getAttribute('data-mail') + '?subject=' + encodeURIComponent('[Webseite] ' + d.get('topic')) + '&body=' + encodeURIComponent(body);
  });
})();



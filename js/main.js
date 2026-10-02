// Mobile-Navigation: Dropdown als ganzseitiges Overlay unterhalb der Nav-Leiste
(function(){
  var t = document.querySelector('.nav__toggle'), l = document.querySelector('.nav__links'), nav = document.querySelector('.nav');
  if(!t || !l) return;
  // .nav hat backdrop-filter, das macht die Nav-Leiste zum Containing Block fuer
  // position:fixed-Kinder. Darum wird das Menu beim Oeffnen an <body> gehaengt
  // (sonst bezieht sich "fixed" auf die Nav-Leiste statt auf den Viewport).
  var slot = document.createComment('nav__links-slot');
  l.parentNode.insertBefore(slot, l);
  var scrollY = 0;
  function setNavH(){
    if(nav) document.documentElement.style.setProperty('--navh', nav.getBoundingClientRect().bottom + 'px');
  }
  // body{overflow:hidden} reicht auf iOS Safari nicht, um den Hintergrund am
  // Scrollen zu hindern. Darum wird der body beim Oeffnen fixiert und beim
  // Schliessen exakt an die alte Scroll-Position zurueckgesetzt.
  function lockScroll(){
    scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = -scrollY + 'px';
    document.body.style.left = '0';
    document.body.style.right = '0';
  }
  function unlockScroll(){
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    window.scrollTo(0, scrollY);
  }
  t.addEventListener('click', function(){
    var opening = !l.classList.contains('open');
    if(opening){
      setNavH();
      document.body.appendChild(l);
    }
    l.classList.toggle('open', opening);
    t.setAttribute('aria-expanded', opening ? 'true' : 'false');
    if(opening) lockScroll(); else unlockScroll();
    if(!opening){
      slot.parentNode.insertBefore(l, slot);
    }
  });
  window.addEventListener('resize', function(){ if(l.classList.contains('open')) setNavH(); });
})();

// Sprachauswahl mobil: Dropdown neben dem Menü-Button, aus den Links der Topbar gebaut
(function(){
  var navIn = document.querySelector('.nav__in'), toggle = document.querySelector('.nav__toggle');
  var langWrap = document.querySelector('.strip .lang'), links = langWrap ? langWrap.querySelectorAll('a') : [];
  if(!navIn || !toggle || !links.length) return;
  var sel = document.createElement('select');
  sel.className = 'nav__langsel';
  sel.setAttribute('aria-label', langWrap.getAttribute('aria-label') || 'Sprache');
  links.forEach(function(a){
    var opt = document.createElement('option');
    opt.value = a.getAttribute('href');
    opt.textContent = a.textContent;
    if(a.hasAttribute('aria-current')) opt.selected = true;
    sel.appendChild(opt);
  });
  sel.addEventListener('change', function(){
    if(sel.value) window.location.href = sel.value;
  });
  navIn.insertBefore(sel, toggle);
})();

// Positionsfilter (Mannschaft)
(function(){
  var chips = document.querySelectorAll('.chip[data-filter]');
  if(!chips.length) return;
  chips.forEach(function(chip){
    chip.addEventListener('click', function(){
      chips.forEach(function(c){ c.setAttribute('aria-pressed', c === chip ? 'true' : 'false'); });
      var f = chip.getAttribute('data-filter');
      // Karten erst beim Klick suchen: js/playervw.js kann sie nach dem Laden durch aktuelle Daten ersetzen
      var cards = document.querySelectorAll('.pcard[data-pos]');
      var groups = document.querySelectorAll('.pgrid__group[data-group]');
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

// Unsere Werte (Verein) -> Punkte-Navigation fürs mobile Swipe-Karussell
(function(){
  var slider = document.getElementById('valuesSlider'), dots = document.getElementById('valuesDots');
  if(!slider || !dots) return;
  var cards = Array.prototype.slice.call(slider.children);
  if(!cards.length) return;
  cards.forEach(function(card, i){
    var b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', 'Zu Karte ' + (i + 1));
    if(i === 0) b.setAttribute('aria-current', 'true');
    b.addEventListener('click', function(){
      card.scrollIntoView({behavior:'smooth', inline:'center', block:'nearest'});
    });
    dots.appendChild(b);
  });
  var buttons = Array.prototype.slice.call(dots.children);
  var ticking = false;
  slider.addEventListener('scroll', function(){
    if(ticking) return;
    ticking = true;
    requestAnimationFrame(function(){
      var mid = slider.scrollLeft + slider.clientWidth / 2;
      var closest = 0, min = Infinity;
      cards.forEach(function(card, i){
        var d = Math.abs((card.offsetLeft + card.offsetWidth / 2) - mid);
        if(d < min){ min = d; closest = i; }
      });
      buttons.forEach(function(b, i){ if(i === closest) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
      ticking = false;
    });
  }, {passive:true});
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



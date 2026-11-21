(function () {
  'use strict';
  var P = window.PACK, U = P.ui;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var mem = {};
  var LS = null; try { LS = window.localStorage; LS.setItem('lls10_t', '1'); LS.removeItem('lls10_t'); } catch (e) { LS = null; }
  var store = {
    get: function (k, d) { if (k in mem) return mem[k]; try { var v = LS && LS.getItem('lls10_' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { mem[k] = v; try { if (LS) LS.setItem('lls10_' + k, JSON.stringify(v)); } catch (e) {} }
  };

  var qs = new URLSearchParams(location.search);
  var lang = qs.get('lang') || store.get('lang', null) || ((navigator.language || '').toLowerCase().indexOf('zh') === 0 ? 'zh' : 'en');
  if (lang !== 'zh') lang = 'en';
  var place = 'all';
  var wkKey = (function () { var d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.toISOString().slice(0, 10); })();
  var week = store.get('week_' + wkKey, [false, false, false, false, false, false, false]);
  var doneIds = store.get('done', {});
  var current = null;
  var tx = function (o) { return o ? (o[lang] !== undefined ? o[lang] : o.en) : ''; };
  var todayIdx = (new Date().getDay() + 6) % 7;
  var SUBJ = ['en', 'ma', 'ar', 'mu'];
  var IMG = { en: 'english', ma: 'maths', ar: 'art', mu: 'music' };
  var check = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var rand = function (a) { return a[Math.floor(Math.random() * a.length)]; };

  /* ---------- static text ---------- */
  function applyText() {
    document.documentElement.lang = lang === 'zh' ? 'zh-HK' : 'en';
    document.title = tx(U.title) + ' · ' + (lang === 'zh' ? '小羊教室' : 'Little Lamb Studio');
    $$('[data-t]').forEach(function (el) { var v = U[el.getAttribute('data-t')]; if (v && typeof tx(v) === 'string') el.textContent = tx(v); });
    $$('.lang button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.lang === lang)); });
    $('#dlTop').href = 'pdf/LLS_10-Minute_Learning_' + (lang === 'zh' ? 'ZH' : 'EN') + '.pdf';
    $('#facts').innerHTML = tx(U.facts).map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('');
    $('#trialBtn').href = 'https://wa.me/85260459922?text=' + encodeURIComponent('TRIAL 試堂');
    $('#chips').setAttribute('aria-label', tx(U.whereTitle));
    $('#days').setAttribute('aria-label', tx(U.weekTitle));
  }

  /* ---------- chips + cards ---------- */
  function countFor(p) { return P.acts.filter(function (a) { return p === 'all' || a.where.indexOf(p) > -1; }).length; }
  function renderChips() {
    $('#chips').innerHTML = Object.keys(U.places).map(function (k) {
      return '<button class="chip" type="button" data-place="' + k + '" aria-pressed="' + (k === place) + '">' + esc(tx(U.places[k])) + ' <span class="n">' + countFor(k) + '</span></button>';
    }).join('');
  }
  function renderSubjects() {
    var n = 0;
    $('#subjects').innerHTML = SUBJ.map(function (s) {
      var acts = P.acts.filter(function (a) { return a.s === s; });
      var cards = acts.map(function (a) {
        n++;
        var num = String(n).padStart(2, '0');
        var vis = place === 'all' || a.where.indexOf(place) > -1;
        var detail = '<div class="detail"><ol>' + tx(a.steps).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol><p class="d-ask">' + esc(tx(U.ask)) + ' · ' + esc(tx(a.ask)) + '</p>' + (a.w === 'squiggle' ? '<svg class="d-squig" viewBox="0 0 400 300">' + squigPath() + '</svg>' : '') + '</div>';
        return '<button class="card' + (doneIds[a.id] ? ' is-done' : '') + '" type="button" data-id="' + a.id + '"' + (vis ? '' : ' hidden') + '>' +
          '<span class="c-done">' + check + '</span>' +
          '<span class="num">' + num + '</span><span class="c-title">' + esc(tx(a.t)) + '</span><span class="c-hook">' + esc(tx(a.hook)) + '</span>' + detail +
          '<span class="c-foot">' + a.where.map(function (w) { return '<span class="c-place">' + esc(tx(U.places[w])) + '</span>'; }).join('') + (a.w ? '<span class="c-try">' + esc(tx(U.tryIt)) + '</span>' : '') + '</span></button>';
      }).join('');
      var anyVis = acts.some(function (a) { return place === 'all' || a.where.indexOf(place) > -1; });
      return '<section class="subject s-' + s + '"' + (anyVis ? '' : ' hidden') + ' aria-labelledby="h-' + s + '"><div class="wrap">' +
        '<div class="subj-head"><img src="img/' + IMG[s] + '.jpg" alt="" width="132" height="132" ><div><p class="subj-k">' + esc(tx(U.subjects[s])) + '</p><h3 id="h-' + s + '">' + esc(tx(U.subjectLines[s])) + '</h3></div></div>' +
        '<div class="cards">' + cards + '</div></div></section>';
    }).join('') + '<div class="finder-end"></div>';
  }
  /* hidden cards inside a grid: hide via attribute */
  var css = document.createElement('style'); css.textContent = '.card[hidden]{display:none}@media print{.card[hidden],.subject[hidden]{display:flex!important}.subject[hidden]{display:block!important}}'; document.head.appendChild(css);

  /* ---------- praise ---------- */
  function renderPraise() {
    $('#flips').innerHTML = P.praise.map(function (p, i) {
      return '<button class="flip" type="button" aria-pressed="false" data-i="' + i + '"><span class="flip-in">' +
        '<span class="face face-a"><small>' + esc(tx(U.insteadOf)) + '</small><q>' + esc(tx(p.from)) + '</q><span class="hint">' + esc(lang === 'zh' ? '按一下' : 'Tap to swap') + '</span></span>' +
        '<span class="face face-b"><small>' + esc(tx(U.tryThis)) + '</small><q>' + esc(tx(p.to)) + '</q><span class="hint">' + esc(lang === 'zh' ? '再按返轉' : 'Tap to flip back') + '</span></span></span></button>';
    }).join('');
  }

  /* ---------- week ---------- */
  function renderWeek() {
    var d = tx(U.days);
    $('#days').innerHTML = d.map(function (lbl, i) {
      return '<button class="day' + (i === todayIdx ? ' today' : '') + '" type="button" data-d="' + i + '" aria-pressed="' + !!week[i] + '" aria-label="' + esc(lbl) + '">' + esc(lbl) + check + '</button>';
    }).join('');
    var n = week.filter(Boolean).length;
    $('#weekCount').textContent = n ? U.weekCount[lang](n) : '';
  }

  /* ---------- classes ---------- */
  function renderClasses() {
    $('#classCols').innerHTML = P.classes.map(function (c) {
      return '<div class="class-col s-' + c.s + '"><h3>' + esc(tx(U.subjects[c.s])) + '</h3><ul>' + c.items.map(function (i) { return '<li>' + esc(tx(i)) + '</li>'; }).join('') + '</ul></div>';
    }).join('');
  }

  function renderAll() { applyText(); renderChips(); renderSubjects(); renderPraise(); renderWeek(); renderClasses(); if (current) fillSheet(current); }

  /* ---------- widgets ---------- */
  function squigPath() {
    var x = 60 + Math.random() * 60, y = 80 + Math.random() * 140, d = 'M' + x.toFixed(0) + ' ' + y.toFixed(0);
    for (var i = 0; i < 3; i++) {
      var c1x = 40 + Math.random() * 320, c1y = 30 + Math.random() * 240, c2x = 40 + Math.random() * 320, c2y = 30 + Math.random() * 240;
      x = 70 + Math.random() * 260; y = 50 + Math.random() * 200;
      d += ' C' + [c1x, c1y, c2x, c2y, x, y].map(function (v) { return v.toFixed(0); }).join(' ');
    }
    return '<path d="' + d + '" fill="none" stroke="#2B2433" stroke-width="5" stroke-linecap="round"/>';
  }
  var W = P.widgets;
  var widgets = {
    fingers: function (el) {
      el.innerHTML = '<p class="w-k">' + (lang === 'zh' ? '每個不懂的字，按一隻手指' : 'Tap a finger for each tricky word') + '</p><div class="fingers">' +
        [0, 1, 2, 3, 4].map(function (i) { return '<button class="finger" type="button" aria-pressed="false" aria-label="' + (i + 1) + '"></button>'; }).join('') + '</div><p class="verdict" aria-live="polite"></p>';
      var v = $('.verdict', el);
      var say = function () {
        var n = $$('.finger[aria-pressed="true"]', el).length;
        var t = lang === 'zh' ? ['輕鬆', '輕鬆', '剛好', '剛好', '一起讀', '一起讀'] : ['Easy read', 'Easy read', 'Just right', 'Just right', 'Read it together', 'Read it together'];
        v.textContent = n + (lang === 'zh' ? ' 個字 · ' : ' tricky · ') + t[n];
      };
      $$('.finger', el).forEach(function (f) { f.addEventListener('click', function () { f.setAttribute('aria-pressed', String(f.getAttribute('aria-pressed') !== 'true')); say(); }); });
      say();
    },
    sound: function (el) {
      var go = function () { var s = rand(W.sounds); $('.big-sound', el).textContent = '/' + s[0] + '/'; $('.ex', el).textContent = s[1]; };
      el.innerHTML = '<p class="w-k">' + (lang === 'zh' ? '今次找這個聲音' : 'Hunt for this sound') + '</p><div class="w-row" style="margin-top:0"><span class="big-sound"></span><span class="muted ex"></span></div><div class="w-row"><button class="btn btn-sm btn-ghost" type="button">' + (lang === 'zh' ? '換一個聲音' : 'New sound') + '</button></div>';
      $('button', el).addEventListener('click', go); go();
    },
    word: function (el) {
      var go = function () { var w = rand(W.words); $('.word-card', el).innerHTML = '<b>' + esc(w[0]) + '</b><span class="strong">' + esc(w[1]) + '</span><p class="muted">' + esc(w[2]) + '</p>'; };
      el.innerHTML = '<p class="w-k">' + (lang === 'zh' ? '今日的字' : 'Today’s word') + '</p><div class="word-card"></div><div class="w-row"><button class="btn btn-sm btn-ghost" type="button">' + (lang === 'zh' ? '換一個字' : 'Another word') + '</button></div>';
      $('button', el).addEventListener('click', go); go();
    },
    plate: function (el) {
      var L = 'ABCDEFGHJKLMNPRSTUVWXYZ', digits = [];
      var go = function () {
        digits = []; var n = 2 + Math.floor(Math.random() * 3);
        for (var i = 0; i < n; i++) digits.push(1 + Math.floor(Math.random() * 9));
        $('.plate', el).textContent = rand(L.split('')) + rand(L.split('')) + ' ' + digits.join('');
        $('.plate-sum', el).textContent = '';
      };
      el.innerHTML = '<p class="w-k">' + (lang === 'zh' ? '把數字加起來' : 'Add up the digits') + '</p><span class="plate"></span><div class="w-row"><button class="btn btn-sm btn-primary sh" type="button">' + (lang === 'zh' ? '看答案' : 'Show total') + '</button><button class="btn btn-sm btn-ghost nw" type="button">' + (lang === 'zh' ? '下一個車牌' : 'Next plate') + '</button></div><p class="plate-sum" aria-live="polite"></p>';
      $('.sh', el).addEventListener('click', function () { $('.plate-sum', el).textContent = digits.join(' + ') + ' = ' + digits.reduce(function (a, b) { return a + b; }, 0); });
      $('.nw', el).addEventListener('click', go); go();
    },
    pattern: function (el) {
      var shapes = [
        '<svg viewBox="0 0 40 40" width="36" height="36"><circle cx="20" cy="20" r="16" fill="#9B6BB8"/></svg>',
        '<svg viewBox="0 0 40 40" width="36" height="36"><rect x="5" y="5" width="30" height="30" rx="5" fill="#D8B34B"/></svg>',
        '<svg viewBox="0 0 40 40" width="36" height="36"><path d="M20 4l17 31H3z" fill="#4F7590"/></svg>'
      ];
      var rules = [[0, 1], [0, 0, 1], [0, 1, 1], [0, 1, 2]];
      var go = function () {
        var r = rand(rules), seq = [], len = r.length * 2 + 1;
        for (var i = 0; i < len; i++) seq.push(r[i % r.length]);
        var ans = r[len % r.length];
        $('.pattern', el).innerHTML = seq.map(function (s) { return '<span>' + shapes[s] + '</span>'; }).join('') + '<span class="q" role="button" tabindex="0" aria-label="' + (lang === 'zh' ? '看答案' : 'Reveal') + '">?</span>';
        var q = $('.q', el);
        var reveal = function () { q.outerHTML = '<span>' + shapes[ans] + '</span>'; };
        q.addEventListener('click', reveal); q.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); reveal(); } });
      };
      el.innerHTML = '<p class="w-k">' + (lang === 'zh' ? '下一個是甚麼？按 ? 看答案' : 'What comes next? Tap ? to check') + '</p><div class="pattern"></div><div class="w-row"><button class="btn btn-sm btn-ghost" type="button">' + (lang === 'zh' ? '新規律' : 'New pattern') + '</button></div>';
      $('button', el).addEventListener('click', go); go();
    },
    squiggle: function (el) {
      var go = function () { $('.squig', el).innerHTML = squigPath(); };
      el.innerHTML = '<p class="w-k">' + (lang === 'zh' ? '把這條線變成任何東西' : 'Copy this squiggle onto paper. What will it become?') + '</p><svg class="squig" viewBox="0 0 400 300" role="img" aria-label="squiggle"></svg><div class="w-row"><button class="btn btn-sm btn-ghost" type="button">' + (lang === 'zh' ? '新線條' : 'New squiggle') + '</button></div>';
      $('button', el).addEventListener('click', go); go();
    },
    clap: function (el) {
      var list = W.claps[lang], i = Math.floor(Math.random() * list.length), timer;
      var show = function () {
        var w = list[i];
        $('.claps', el).innerHTML = w.map(function (s) { return '<span class="beat">' + esc(s) + '</span>'; }).join('') + '<span class="muted">' + w.length + (lang === 'zh' ? ' 拍' : (w.length === 1 ? ' clap' : ' claps')) + '</span>';
      };
      var play = function () {
        clearInterval(timer); var b = $$('.beat', el), k = 0;
        b.forEach(function (x) { x.classList.remove('on'); });
        timer = setInterval(function () { b.forEach(function (x) { x.classList.remove('on'); }); if (k >= b.length) { clearInterval(timer); return; } b[k++].classList.add('on'); }, 520);
      };
      el.innerHTML = '<p class="w-k">' + (lang === 'zh' ? '一起拍' : 'Clap along') + '</p><div class="claps"></div><div class="w-row"><button class="btn btn-sm btn-primary pl" type="button">' + (lang === 'zh' ? '拍一次' : 'Clap it') + '</button><button class="btn btn-sm btn-ghost nx" type="button">' + (lang === 'zh' ? '下一個' : 'Next word') + '</button></div>';
      $('.pl', el).addEventListener('click', play);
      $('.nx', el).addEventListener('click', function () { i = (i + 1) % list.length; show(); });
      show();
    }
  };

  /* ---------- sheet + timer ---------- */
  var sheet = $('#sheet'), TOTAL = 600, left = TOTAL, tick = null, CIRC = 326.7;
  function drawTimer() {
    $('#timerV').textContent = Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0');
    $('#ringFg').style.strokeDashoffset = String(CIRC * (1 - left / TOTAL));
  }
  function stopTimer() { clearInterval(tick); tick = null; $('#tStart').textContent = tx(U.start); }
  function resetTimer() { stopTimer(); left = TOTAL; $('#timeUp').textContent = ''; drawTimer(); }
  function setDoneBtn() {
    var on = !!(current && doneIds[current.id]);
    var b = $('#doneBtn'); b.setAttribute('aria-pressed', String(on));
    b.innerHTML = (on ? check.replace('<svg', '<svg width="20" height="20"') : '') + '<span>' + esc(on ? tx(U.doneYes) : tx(U.done)) + '</span>';
  }
  function fillSheet(a) {
    var si = sheet.querySelector('.sheet-in'); si.className = 'sheet-in s-' + a.s;
    var idx = P.acts.indexOf(a) + 1;
    $('#sheetTag').textContent = tx(U.subjects[a.s]) + ' · ' + String(idx).padStart(2, '0');
    $('#sheetTitle').textContent = tx(a.t);
    $('#sheetHook').textContent = tx(a.hook);
    $('#sheetSteps').innerHTML = tx(a.steps).map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('');
    $('#sheetAsk').textContent = tx(a.ask);
    var w = $('#sheetWidget'); w.innerHTML = '';
    if (a.w && widgets[a.w]) widgets[a.w](w);
    if (!tick) $('#tStart').textContent = tx(U.start); else $('#tStart').textContent = tx(U.pause);
    setDoneBtn();
  }
  var lastFocus = null;
  function openAct(id) {
    var a = P.acts.filter(function (x) { return x.id === id; })[0]; if (!a) return;
    current = a; lastFocus = document.activeElement; resetTimer(); fillSheet(a);
    if (sheet.showModal) sheet.showModal(); else sheet.setAttribute('open', '');
    $('#sheetClose').focus();
  }
  function closeSheet() { stopTimer(); if (sheet.open) sheet.close(); }
  sheet.addEventListener('close', function () { stopTimer(); current = null; if (lastFocus && lastFocus.focus) lastFocus.focus(); });
  sheet.addEventListener('click', function (e) { if (e.target === sheet) closeSheet(); });
  $('#sheetClose').addEventListener('click', closeSheet);
  $('#tStart').addEventListener('click', function () {
    if (tick) { stopTimer(); return; }
    if (left <= 0) resetTimer();
    $('#tStart').textContent = tx(U.pause);
    tick = setInterval(function () { left--; drawTimer(); if (left <= 0) { stopTimer(); $('#timeUp').textContent = tx(U.timeUp); } }, 1000);
  });
  $('#tReset').addEventListener('click', resetTimer);
  $('#doneBtn').addEventListener('click', function () {
    if (!current) return;
    var on = !doneIds[current.id];
    if (on) doneIds[current.id] = 1; else delete doneIds[current.id];
    store.set('done', doneIds);
    if (on && !week[todayIdx]) { week[todayIdx] = true; store.set('week_' + wkKey, week); }
    setDoneBtn(); renderWeek();
    var c = $('.card[data-id="' + current.id + '"]'); if (c) c.classList.toggle('is-done', on);
  });

  /* ---------- events ---------- */
  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target : null; if (!t) return;
    var lb = t.closest('.lang button');
    if (lb) { lang = lb.dataset.lang; store.set('lang', lang); var u = new URL(location.href); u.searchParams.set('lang', lang); history.replaceState(null, '', u); renderAll(); return; }
    var chip = t.closest('.chip');
    if (chip) { place = chip.dataset.place; renderChips(); renderSubjects(); return; }
    var card = t.closest('.card'); if (card) { openAct(card.dataset.id); return; }
    var flip = t.closest('.flip'); if (flip) { flip.setAttribute('aria-pressed', String(flip.getAttribute('aria-pressed') !== 'true')); return; }
    var day = t.closest('.day');
    if (day) { var i = +day.dataset.d; week[i] = !week[i]; store.set('week_' + wkKey, week); renderWeek(); var nb = $('.day[data-d="' + i + '"]'); if (nb) nb.focus(); return; }
  });
  function pickRandom(scope) {
    var pool = P.acts.filter(function (a) { return place === 'all' || a.where.indexOf(place) > -1; });
    if (scope === 'tonight') {
      var h = new Date().getHours();
      var pref = h >= 18 ? ['bedtime', 'home'] : h < 9 ? ['kitchen', 'home'] : ['out', 'home', 'kitchen'];
      var p2 = P.acts.filter(function (a) { return a.where.some(function (w) { return pref.indexOf(w) > -1; }) && !doneIds[a.id]; });
      if (p2.length) pool = p2;
    }
    var a = rand(pool);
    var c = $('.card[data-id="' + a.id + '"]');
    if (c) { c.classList.remove('flash'); void c.offsetWidth; c.classList.add('flash'); }
    openAct(a.id);
  }
  $('#pickBtn').addEventListener('click', function () { pickRandom('tonight'); });
  $('#surpriseBtn').addEventListener('click', function () { pickRandom(); });
  $('#shareBtn').addEventListener('click', function () {
    var url = location.origin + location.pathname + '?lang=' + lang;
    var text = tx(U.shareText);
    var note = $('#shareNote');
    if (navigator.share) {
      navigator.share({ title: tx(U.title), text: text, url: url }).catch(function () {});
    } else {
      window.open('https://wa.me/?text=' + encodeURIComponent(text + ' ' + url), '_blank', 'noopener');
      note.textContent = lang === 'zh' ? '已開啟WhatsApp，揀一位朋友就可以傳送。' : 'WhatsApp is open. Pick a friend to send it to.';
    }
  });
  var bar = $('.bar');
  window.addEventListener('scroll', function () { bar.classList.toggle('scrolled', window.scrollY > 8); }, { passive: true });
  window.addEventListener('beforeprint', function () { closeSheet(); });

  renderAll();
})();

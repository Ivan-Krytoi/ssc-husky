/* ============================================================
   ССК «ХАСКИ» — единый скрипт сайта
   1) тема тёмная ↔ светлая
   2) reveal-секции при скролле
   3) счётчики достижений (transform/opacity не нужен — только текст)
   4) чипы-фильтры календаря
   5) главная «Пролёт карточек»: паузы (кнопка ⏸ / фокус с клавиатуры /
      тап по сцене на touch / карточки вне экрана) — hover НЕ ставит паузу.
   6) браузерная страховка: если движок не запустил полёт — карточки стопкой.
   ============================================================ */
(function () {
  'use strict';
  var body = document.body, root = document.documentElement;
  var reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Тема ---------------------------------------------------- */
  var themeBtn = document.getElementById('themeToggle');
  try {
    var saved = localStorage.getItem('husky-theme');
    if (saved === 'light' || saved === 'dark') root.classList.toggle('theme-light', saved === 'light');
  } catch (e) { /* приватный режим — темы без запоминания */ }
  if (themeBtn) {
    themeBtn.setAttribute('aria-pressed', String(root.classList.contains('theme-light')));
    themeBtn.addEventListener('click', function () {
      var light = root.classList.toggle('theme-light');
      themeBtn.setAttribute('aria-pressed', String(light));
      try { localStorage.setItem('husky-theme', light ? 'light' : 'dark'); } catch (e) {}
    });
  }

  /* Reveal --------------------------------------------------- */
  if ('IntersectionObserver' in window && !reduceMotion) {
    var revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-visible'); revealIO.unobserve(en.target); } });
    }, { threshold: .12 });
    document.querySelectorAll('.reveal').forEach(function (s) { revealIO.observe(s); });
  } else {
    document.querySelectorAll('.reveal').forEach(function (s) { s.classList.add('is-visible'); });
  }

  /* Счётчики -------------------------------------------------- */
  var counted = new WeakSet();
  function runCounter(el) {
    if (counted.has(el)) return;
    counted.add(el);
    var target = parseInt(el.getAttribute('data-counter') || el.getAttribute('data-count'), 10);
    if (isNaN(target)) return;
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduceMotion) { el.textContent = target + suffix; return; }
    var t0 = performance.now(), dur = 1200;
    (function tick(t) {
      var p = Math.min(1, (t - t0) / dur), eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + (p === 1 ? suffix : '');
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }
  if ('IntersectionObserver' in window) {
    var numIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { runCounter(en.target); numIO.unobserve(en.target); } });
    }, { threshold: .4 });
    document.querySelectorAll('[data-counter], .stat__num[data-count]').forEach(function (n) { numIO.observe(n); });
  }

  /* Чипы: фильтр календаря ------------------------------------ */
  var filterGroup = document.querySelector('[data-filter-group]');
  if (filterGroup) {
    filterGroup.addEventListener('click', function (e) {
      var chip = e.target.closest('[data-filter]'); if (!chip) return;
      filterGroup.querySelectorAll('[data-filter]').forEach(function (c) {
        c.classList.toggle('chip--active', c === chip);
        c.setAttribute('aria-pressed', String(c === chip));
      });
      var f = chip.getAttribute('data-filter');
      document.querySelectorAll('[data-status]').forEach(function (li) {
        li.style.display = (f === 'all' || li.getAttribute('data-status') === f) ? '' : 'none';
      });
    });
  }

  /* Общий переключатель активности чипов (без фильтра) -------- */
  document.addEventListener('click', function (e) {
    var chip = e.target.closest('.chips [data-filter]') === null ? e.target.closest('.chips [data-choice]') : null;
    if (!chip) return;
    var group = chip.closest('.chips');
    group.querySelectorAll('[data-choice]').forEach(function (c) {
      var on = c === chip;
      c.classList.toggle('chip--active', on);
      c.setAttribute('aria-pressed', String(on));
    });
  });

  /* ============================================================
     ГЛАВНАЯ: пролет карточек — паузы полёта
     (CSS-анимация .husky-fly; JS управляет аria/классами)
     ============================================================ */
  var deck = document.getElementById('deck');
  var stage = document.getElementById('deckStage');
  var pauseBtn = document.getElementById('flightPause');
  /* Общий полётный контекст: режим ('css' | 'waapi') и список
     WAAPI-анимаций — того же полёта, но запущенного из скрипта,
     если движок не хочет стартовать CSS-анимацию (Яндекс и др.). */
  var flight = { mode: 'css', anims: [] };
  flight.sync = function () {
    if (this.mode !== 'waapi') return;
    var frozen = body.classList.contains('deck--paused') ||
                 body.classList.contains('deck--idle') ||
                 body.classList.contains('is-overlay-open');
    this.anims.forEach(function (a) {
      try {
        if (frozen && a.playState === 'running') a.pause();
        else if (!frozen && a.playState === 'paused') a.play();
      } catch (err) { /* движок может не дать play/pause — игнорируем */ }
    });
  };
  if (deck && stage && pauseBtn && !reduceMotion) {
    var state = { user: false, idle: false, kbd: false, touch: false };

    function applyFlightPause() {
      var any = state.user || state.kbd || state.touch;
      body.classList.toggle('deck--paused', any);
      if (state.idle) body.classList.add('deck--idle'); else body.classList.remove('deck--idle');
      pauseBtn.setAttribute('aria-pressed', String(state.user));
      var glyph = document.getElementById('flightGlyph');
      var label = document.getElementById('flightLabel');
      if (glyph) glyph.textContent = state.user ? '▶' : '⏸';
      if (label) label.textContent = state.user ? 'Продолжить полёт карточек' : 'Остановить полёт карточек';
      pauseBtn.title = state.user ? 'Продолжить полёт' : 'Остановить полёт';
      if (flight.sync) flight.sync();
    }

    // Фокус клавиатурой: замораживаем стаю и ставим карточку в центр
    document.addEventListener('focusin', function (e) {
      var panel = e.target.closest && e.target.closest('.fcard__panel');
      if (!panel || panel.dataset.flyFocus) return;
      panel.dataset.flyFocus = '1';
      panel.style.animationDelay = '-3.07s'; /* 16 % цикла = карточка по центру */
      state.kbd = true; applyFlightPause();
    });
    document.addEventListener('focusout', function (e) {
      var panel = e.target.closest && e.target.closest('.fcard__panel');
      if (!panel || !panel.dataset.flyFocus) return;
      delete panel.dataset.flyFocus;
      panel.style.animationDelay = '';
      state.kbd = false; applyFlightPause();
    });

    pauseBtn.addEventListener('click', function () { state.user = !state.user; applyFlightPause(); });

    // Паузу при наведении курсора НЕ делаем (полёт идёт постояннно).
    // На сенсорных экранах: тап по пустому месту сцены — пауза/продолжить.
    if (!matchMedia('(hover: hover)').matches) {
      stage.addEventListener('pointerdown', function (e) {
        if (e.target.closest('.fcard__panel')) return; // тап по карточке = клик по ссылке
        state.touch = !state.touch;
        applyFlightPause();
      }, { passive: true });
    }

    new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { state.idle = !en.isIntersecting; applyFlightPause(); });
    }, { threshold: .05 }).observe(deck);
  }

  /* ============================================================
     БРАУЗЕРНАЯ АДАПТАЦИЯ: трёхступенчатая страховка полёта.
     Часть движков не стартует CSS-анимацию husky-fly (старые
     сборки Яндекс.Браузера, «энергосбережение», кэш). Проверяем
     после загрузки, что полёт реально идёт:
       1) идёт CSS-анимация — всё отлично, ничего не меняем;
       2) не идёт — перезапускаем тем же полётом через Web
          Animations API (element.animate), продолжают работать
          кнопка ⏸ и все паузы;
       3) не завёлся и дублёр — снимаем класс js: карточки
          остаются видимой спокойной стопкой (без пустоэкрана).
     ============================================================ */
  var FLY_DURATION = 19200;  /* --fly-dur: полный цикл одной карточки */
  var FLY_STEP = 3200;       /* --fly-step: перерыв между карточками */
  var FLY_DELAY0 = 450;      /* стартовый сдвиг первой карточки */
  var FLY_KEYFRAMES = [
    { zIndex: 70, opacity: 0, transform: 'translateY(118%) rotateX(16deg) scale(.84)', easing: 'cubic-bezier(.16,.8,.32,1)' },
    { zIndex: 70, opacity: .92, pointerEvents: 'auto' },
    { zIndex: 60, opacity: 1, transform: 'translateY(0) rotateX(0deg) scale(1)', easing: 'linear' },
    { opacity: .9, transform: 'translateY(-5%) scale(.97)' },
    { opacity: .6, transform: 'translateY(-24%) scale(.93) rotateX(-3deg)' },
    { zIndex: 40, opacity: .25, transform: 'translateY(-60%) scale(.9) rotateX(-6deg)' },
    { zIndex: 30, opacity: .05, transform: 'translateY(-100%) rotateX(-10deg) scale(.87)' },
    { opacity: 0, transform: 'translateY(-140%) rotateX(-14deg) scale(.85) ' },
    { opacity: 0, transform: 'translateY(-140%) rotateX(-14deg) scale(.85)', pointerEvents: 'none' }
  ];
  /* проценты ключевых кадров оригинала — для WAAPI как offsets */
  var FLY_OFFSETS = [0, .04, .16, .28, .46, .64, .72, .80, 1];

  if (deck && stage && !reduceMotion) {
    var panels = stage.querySelectorAll('.fcard__panel');
    var flightAlive = function () {
      try {
        if (!Element.prototype.getAnimations) return true; /* проверить нечем — не рискуем */
        var probe = stage.querySelector('.fcard__panel');
        if (!probe) return true;
        var flying = false;
        probe.getAnimations().forEach(function (a) {
          var hasName = typeof a.animationName === 'string' && a.animationName !== '' && a.animationName !== 'none';
          var isWaapi = !!(a.effect && typeof a.effect.getKeyframes === 'function' && a.effect.getKeyframes().length > 1);
          if (hasName || isWaapi) flying = true;
        });
        return flying;
      } catch (e) { return true; }
    };
    /* Полёт тем же сценарием, но из скрипта: работает даже там,
       где CSS-анимация не запускается. */
    var startWaapiFlight = function () {
      try {
        var list = Array.prototype.slice.call(panels);
        list.forEach(function (panel, i) {
          var anim = panel.animate(FLY_KEYFRAMES, {
            duration: FLY_DURATION,
            delay: FLY_DELAY0 + i * FLY_STEP,
            iterations: Infinity,
            fill: 'both'
          });
          /* offsets повторяют проценты @keyframes husky-fly */
          try { anim.effect.setKeyframes(FLY_KEYFRAMES.map(function (k, j) {
                        var kk = {}; for (var p in k) kk[p] = k[p];
                        kk.offset = FLY_OFFSETS[j]; return kk;
                    })); } catch (err) { /* смещения не критичны */ }
          flight.anims.push(anim);
        });
        flight.mode = 'waapi';
        if (flight.sync) flight.sync();
        return flight.anims.length > 0;
      } catch (e) { return false; }
    };
    var fallBackToStatic = function () { body.classList.remove('js'); };

    window.addEventListener('load', function () {
      var cssWaited = false;
      setTimeout(function () { /* 0.6 с: CSS точно применён */
        cssWaited = !flightAlive();
      }, 600);
      setTimeout(function () { /* 2.6 с: CSS не ожил — дублёр WAAPI */
        if (body.classList.contains('js') && !flightAlive() && cssWaited &&
            panels.length && typeof panels[0].animate === 'function') {
          if (!startWaapiFlight()) fallBackToStatic();
        }
      }, 2600);
      setTimeout(function () { /* 4.8 с: и дублёр не пошёл — статика */
        if (body.classList.contains('js') && !flightAlive()) fallBackToStatic();
      }, 4800);
    });
  }

  /* Мобильное меню-бургер ------------------------------------ */
  var burger = document.querySelector('.burger');
  if (burger) {
    var nav = document.querySelector('.nav');
    var setMenu = function (open) {
      body.classList.toggle('nav-open', open);
      burger.setAttribute('aria-expanded', String(open));
    };
    burger.addEventListener('click', function () { setMenu(!body.classList.contains('nav-open')); });
    if (nav) nav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && body.classList.contains('nav-open')) { setMenu(false); burger.focus(); }
    });
  }

  /* Успех формы — центр фокуса на главной панели успеха -------- */
  var success = document.getElementById('joinSuccess');
  if (success) success.focus();

})();

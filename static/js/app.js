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
     БРАУЗЕРНАЯ АДАПТАЦИЯ: страховка полёта карточек.
     Некоторые браузеры (старые сборки Yandex Browser, «Турбо»-
     проксирование, отключённые анимации в системе) могут не
     запустить CSS-анимацию husky-fly. Тогда карточки остались бы
     невидимыми (opacity: 0 до запуска полёта). Проверяем после
     загрузки, что анимация реально идёт: если нет — снимаем
     класс js, и карточки показываются спокойной стопкой.
     ============================================================ */
  if (deck && stage && !reduceMotion) {
    var flightAlive = function () {
      try {
        if (!Element.prototype.getAnimations) return true; /* проверить нечем — не рискуем */
        var probe = stage.querySelector('.fcard__panel');
        if (!probe) return true;
        var running = 0;
        probe.getAnimations().forEach(function (a) {
          var name = a.animationName || '';
          if (name && name !== 'none') running++;
        });
        return running > 0;
      } catch (e) { return true; }
    };
    var flightGuard = function () {
      if (body.classList.contains('js') && !flightAlive()) body.classList.remove('js');
    };
    window.addEventListener('load', function () {
      setTimeout(flightGuard, 500);  /* до этого карточка №1 ещё не стартовала */
      setTimeout(flightGuard, 2500); /* повтор для медленных машин */
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

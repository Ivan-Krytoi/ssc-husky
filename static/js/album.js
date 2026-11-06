/* ============================================================
   ССК «ХАСКИ» — страница «Альбом»: лайтбокс
   1) клик по фото → просмотр крупного кадра;
   2) навигация ←/→ внутри отфильтрованного списка (скрытые
      фильтром фото пропускаются);
   3) закрывающие жесты: Esc, клик по фону, кнопка ✕;
   4) фокус возвращается на карточку, которая открыла просмотр;
   5) прокрутка страницы блокируется только при открытом просмотре.
   ============================================================ */
(function () {
  'use strict';
  var rootBox = document.getElementById('lightbox');
  if (!rootBox) return;

  var grid = document.querySelector('[data-lightbox]');
  if (!grid) return;

  var imgEl    = document.getElementById('lbImg');
  var titleEl  = document.getElementById('lbTitle');
  var catEl    = document.getElementById('lbCat');
  var numEl    = document.getElementById('lbNum');
  var closeBtn = document.getElementById('lbClose');
  var prevBtn  = document.getElementById('lbPrev');
  var nextBtn  = document.getElementById('lbNext');

  var opener = null;   /* кнопка-карточка, из которой открыли просмотр */
  var items = [];      /* текущие видимые карточки, [{src, alt, title, cat}] */
  var idx = 0;

  function visibleCards() {
    var res = [];
    grid.querySelectorAll('.photo-card').forEach(function (card) {
      if (card.style.display !== 'none') {
        var img = card.querySelector('img');
        var zoom = card.querySelector('.photo-card__zoom');
        res.push({
          src: img.getAttribute('src'),
          alt: img.getAttribute('alt') || card.getAttribute('data-title') || '',
          title: card.getAttribute('data-title') || '',
          cat: card.getAttribute('data-cat') || '',
          zoom: zoom
        });
      }
    });
    return res;
  }

  function render() {
    var it = items[idx];
    if (!it) return;
    imgEl.src = it.src;
    imgEl.alt = it.alt;
    titleEl.textContent = it.title;
    catEl.textContent = it.cat;
    numEl.textContent = (idx + 1) + ' / ' + items.length;
  }

  function open(fromZoom) {
    items = visibleCards();
    for (idx = 0; idx < items.length; idx++) {
      if (items[idx].zoom === fromZoom) break;
    }
    if (idx >= items.length) return;
    opener = fromZoom;
    rootBox.hidden = false;
    rootBox.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lb-open');
    render();
    closeBtn.focus();
  }

  function close() {
    rootBox.hidden = true;
    rootBox.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lb-open');
    imgEl.src = '';
    if (opener) {
      opener.focus();
      opener = null;
    }
  }

  function step(dir) {
    if (!items.length) return;
    idx = (idx + dir + items.length) % items.length;
    render();
  }

  grid.addEventListener('click', function (e) {
    var zoom = e.target.closest('.photo-card__zoom');
    if (zoom) open(zoom);
  });

  closeBtn.addEventListener('click', close);
  document.querySelector('.lightbox__backdrop').addEventListener('click', close);
  prevBtn.addEventListener('click', function () { step(-1); });
  nextBtn.addEventListener('click', function () { step(1); });

  document.addEventListener('keydown', function (e) {
    if (rootBox.hidden) return;
    if (e.key === 'Escape') { close(); }
    else if (e.key === 'ArrowLeft') { step(-1); e.preventDefault(); }
    else if (e.key === 'ArrowRight') { step(1); e.preventDefault(); }
  });
})();

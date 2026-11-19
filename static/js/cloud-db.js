// Заявки со статического демо (GitHub Pages) пишутся напрямую в облачную БД Supabase.
(function () {
  'use strict';
  var form = document.getElementById('joinForm');
  if (!form || typeof fetch !== 'function') return;

  var ENDPOINT = 'https://zvoenupgvmtulfkgwzyf.supabase.co/rest/v1/applications';
  var ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2b2VudXBndm10dWxma2d3enlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUwODgwNDQsImV4cCI6MjExMDY2NDA0NH0.rGtJNX9Wgucf4ugnTQVyUUBbXNh3_VvhuIlUWYP_FSs';

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = form.querySelector('button[type="submit"]');
    var checked = form.querySelector('input[name="discipline"]:checked');
    var payload = {
      name: form.elements['name'].value.trim(),
      group_name: form.elements['group'].value.trim(),
      discipline: checked ? checked.value : 'Другое',
      contact: form.elements['contact'].value.trim()
    };

    var old = form.parentNode.querySelector('.notice--error');
    if (old) old.parentNode.removeChild(old);
    btn.disabled = true;

    fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'apikey': ANON_KEY,
        'Authorization': 'Bearer ' + ANON_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(payload)
    }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      var tpl = document.getElementById('joinSuccessTpl');
      var cta = form.closest('.cta');
      var node = tpl.content.cloneNode(true);
      cta.parentNode.replaceChild(node, cta);
      var box = document.querySelector('.cta[tabindex="-1"]');
      if (box) box.focus();
    }).catch(function () {
      btn.disabled = false;
      var div = document.createElement('div');
      div.className = 'notice notice--error';
      div.setAttribute('role', 'alert');
      div.innerHTML = '<b>Заявка не отправлена.</b> Проверьте поля и попробуйте ещё раз. ' +
        'Если не получается — напишите нам в ВК: vk.ru/ssc_husky_official';
      form.parentNode.insertBefore(div, form);
    });
  });
})();
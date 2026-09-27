/*
 * Логика мини-приложения: маршруты по экранам, рендер из CONTENT,
 * форма заявки и интеграция с MAX через MaxBridge.
 */
(function () {
  'use strict';

  var C = window.CONTENT;
  var B = window.MaxBridge;
  var view = document.getElementById('view');
  var current = 'home';
  var history = [];

  /* ---------- утилиты ---------- */

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function el(html) {
    var t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  function applyTheme() {
    document.documentElement.setAttribute('data-theme', B.colorScheme === 'dark' ? 'dark' : 'light');
  }

  function chevron() {
    return '<svg class="card__chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';
  }

  /* ---------- экраны ---------- */

  function renderHome() {
    var user = B.user;
    var greeting = user && user.first_name
      ? '<span class="greeting">Здравствуйте, ' + esc(user.first_name) + '!</span>'
      : '';

    var numbers = C.numbers.map(function (n) {
      return '<div class="number"><span class="number__value">' + esc(n.value) + '</span><span class="number__label">' + esc(n.label) + '</span></div>';
    }).join('');

    var services = C.services.map(function (s) {
      return serviceCard(s);
    }).join('');

    var reviews = C.reviews.map(function (r) {
      return '<article class="review"><p class="review__text">' + esc(r.text) + '</p><p class="review__author">' + esc(r.author) + '</p></article>';
    }).join('');

    return el(
      '<div class="screen">' +
        '<section class="hero">' + greeting +
          '<h1>' + esc(C.hero.title) + '</h1>' +
          '<p class="lead">' + esc(C.hero.text) + '</p>' +
          '<div class="btn-row">' +
            '<button class="btn btn--primary" data-nav="' + esc(C.hero.primary.nav) + '">' + esc(C.hero.primary.label) + '</button>' +
            '<button class="btn btn--ghost" data-nav="' + esc(C.hero.secondary.nav) + '">' + esc(C.hero.secondary.label) + '</button>' +
          '</div>' +
        '</section>' +
        '<section><div class="numbers">' + numbers + '</div></section>' +
        '<section><h2>Чем помогаем</h2>' + services + '</section>' +
        '<section><h2>Что говорят руководители</h2><div class="reviews">' + reviews + '</div></section>' +
        contactsBlock() +
        '<p class="footer-note">' + esc(C.brand.name) + ' · ' + esc(C.brand.tagline) + '</p>' +
      '</div>'
    );
  }

  function serviceCard(s) {
    var nav = s.nav || 'lead';
    var badge = s.featured ? '<span class="badge">Подробно</span>' : '';
    return '<button type="button" class="card card--tap' + (s.featured ? ' card--featured' : '') + '" data-nav="' + esc(nav) + '" data-topic="' + esc(s.title) + '">' +
      '<span class="card__body">' + badge + '<span class="card__title">' + esc(s.title) + '</span><span class="card__text">' + esc(s.short) + '</span></span>' +
      chevron() +
    '</button>';
  }

  function renderServices() {
    return el(
      '<div class="screen">' +
        '<h1>Услуги</h1>' +
        '<p class="lead">Работаем только с детскими центрами, школами и садами, поэтому не тратим ваше время на объяснение, как устроен набор групп.</p>' +
        '<section>' + C.services.map(serviceCard).join('') + '</section>' +
        '<div class="btn-row"><button class="btn btn--accent" data-nav="lead">Оставить заявку</button></div>' +
      '</div>'
    );
  }

  function renderMarketing() {
    var m = C.marketing;

    var forWhom = '<ul class="check-list">' + m.forWhom.items.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>';

    var includes = m.includes.items.map(function (i) {
      return '<div class="card"><h3>' + esc(i.title) + '</h3><p class="card__text">' + esc(i.text) + '</p></div>';
    }).join('');

    var steps = '<ol class="steps">' + m.steps.items.map(function (s) {
      return '<li><div><h3>' + esc(s.title) + '</h3><p class="steps__text">' + esc(s.text) + '</p></div></li>';
    }).join('') + '</ol>';

    var formats = m.formats.items.map(function (f) {
      return '<div class="card"><h3>' + esc(f.title) + '</h3><p class="card__text">' + esc(f.text) + '</p></div>';
    }).join('');

    var results = '<ul class="check-list">' + m.results.items.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>';

    var faq = m.faq.items.map(function (f) {
      return '<details class="faq"><summary>' + esc(f.q) + '</summary><div class="faq__answer">' + esc(f.a) + '</div></details>';
    }).join('');

    return el(
      '<div class="screen">' +
        '<span class="badge">Услуга</span>' +
        '<h1>' + esc(m.title) + '</h1>' +
        '<p class="lead">' + esc(m.lead) + '</p>' +
        '<section><h2>' + esc(m.forWhom.title) + '</h2>' + forWhom + '</section>' +
        '<section><h2>' + esc(m.includes.title) + '</h2>' + includes + '</section>' +
        '<section><h2>' + esc(m.steps.title) + '</h2>' + steps + '</section>' +
        '<section><h2>' + esc(m.formats.title) + '</h2>' + formats + '</section>' +
        '<section><h2>' + esc(m.results.title) + '</h2>' + results + '</section>' +
        '<section><h2>' + esc(m.faq.title) + '</h2>' + faq + '</section>' +
        '<div class="btn-row">' +
          '<button class="btn btn--accent" data-nav="' + esc(m.cta.nav) + '" data-topic="' + esc(m.cta.topic) + '">' + esc(m.cta.label) + '</button>' +
          '<button class="btn btn--link" data-action="share">Поделиться с коллегой</button>' +
        '</div>' +
      '</div>'
    );
  }

  function renderLead(topic) {
    var L = C.lead;
    var user = B.user;
    var name = user ? [user.first_name, user.last_name].filter(Boolean).join(' ') : '';

    var options = L.topics.map(function (t) {
      return '<option value="' + esc(t) + '"' + (t === topic ? ' selected' : '') + '>' + esc(t) + '</option>';
    }).join('');

    var screen = el(
      '<div class="screen">' +
        '<h1>' + esc(L.title) + '</h1>' +
        '<p class="lead">' + esc(L.text) + '</p>' +
        '<form class="lead-form" novalidate style="margin-top:20px">' +
          '<div class="field"><label for="f-name">Как к вам обращаться</label><input id="f-name" name="name" autocomplete="name" value="' + esc(name) + '" required><span class="error">Напишите имя</span></div>' +
          '<div class="field"><label for="f-contact">Телефон или мессенджер</label><input id="f-contact" name="contact" autocomplete="tel" inputmode="tel" required><span class="error">Оставьте контакт, чтобы мы могли ответить</span></div>' +
          '<div class="field"><label for="f-center">Название центра или школы</label><input id="f-center" name="center"></div>' +
          '<div class="field"><label for="f-topic">Что интересует</label><select id="f-topic" name="topic">' + options + '</select></div>' +
          '<div class="field"><label for="f-msg">Пара слов о задаче</label><textarea id="f-msg" name="message"></textarea></div>' +
          '<div class="btn-row"><button class="btn btn--accent" type="submit">Отправить заявку</button></div>' +
          '<p class="consent">' + esc(L.consent) + '</p>' +
        '</form>' +
        contactsBlock() +
      '</div>'
    );

    screen.querySelector('form').addEventListener('submit', onSubmit);
    return screen;
  }

  function contactsBlock() {
    var b = C.brand;
    var items = [];
    if (b.phone) items.push(contact('Телефон', b.phone, 'tel:' + b.phone.replace(/[^\d+]/g, '')));
    if (b.email) items.push(contact('Почта', b.email, 'mailto:' + b.email));
    if (b.telegram) items.push(contact('Telegram', b.telegram, b.telegram));
    if (b.max) items.push(contact('MAX', b.max, b.max));
    if (b.site) items.push(contact('Сайт', b.site.replace(/^https?:\/\//, ''), b.site));
    if (!items.length) return '';
    return '<section><h2>Контакты</h2><div class="contacts">' + items.join('') + '</div></section>';
  }

  function contact(label, text, href) {
    return '<a class="contact" href="' + esc(href) + '" data-external="1"><span><span class="contact__label">' + esc(label) + '</span>' + esc(text) + '</span></a>';
  }

  /* ---------- заявка ---------- */

  function onSubmit(e) {
    e.preventDefault();
    var form = e.currentTarget;
    var valid = true;

    ['name', 'contact'].forEach(function (n) {
      var input = form.elements[n];
      var field = input.closest('.field');
      var ok = input.value.trim().length > 0;
      field.classList.toggle('is-invalid', !ok);
      if (!ok) valid = false;
    });
    if (!valid) return;

    var data = {
      name: form.elements.name.value.trim(),
      contact: form.elements.contact.value.trim(),
      center: form.elements.center.value.trim(),
      topic: form.elements.topic.value,
      message: form.elements.message.value.trim(),
      source: B.available ? 'max-miniapp' : 'web',
      user: B.user,
      initData: B.initData,
      sentAt: new Date().toISOString()
    };

    var button = form.querySelector('[type=submit]');
    button.disabled = true;
    button.textContent = 'Отправляем…';

    sendLead(data).then(function () {
      B.haptic('medium');
      form.replaceWith(el('<div class="notice">' + esc(C.lead.success) + '</div>'));
    }, function () {
      button.disabled = false;
      button.textContent = 'Отправить заявку';
      var note = form.querySelector('.notice--error');
      if (!note) form.appendChild(el('<div class="notice notice--error" style="margin-top:12px">Не получилось отправить. Попробуйте ещё раз или напишите нам напрямую.</div>'));
    });
  }

  function leadText(data) {
    return [
      'Заявка из мини-приложения',
      'Имя: ' + data.name,
      'Контакт: ' + data.contact,
      data.center ? 'Центр: ' + data.center : '',
      'Тема: ' + data.topic,
      data.message ? '' : null,
      data.message
    ].filter(function (l) { return l !== null && l !== ''; }).join('\n');
  }

  function sendLead(data) {
    // 1. Свой бэкенд, если указан.
    if (C.brand.leadEndpoint) {
      return fetch(C.brand.leadEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Max-Init-Data': data.initData || '' },
        body: JSON.stringify(data)
      }).then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
      });
    }
    // 2. Основной путь: заявка уходит боту, который открыл мини-приложение в MAX.
    if (B.available && B.sendData(data)) return Promise.resolve();
    // 3. Открыли из браузера: копируем текст заявки и ведём в чат с ботом в MAX.
    if (C.brand.maxBot) {
      var text = leadText(data);
      var copy = navigator.clipboard ? navigator.clipboard.writeText(text).catch(function () {}) : Promise.resolve();
      return copy.then(function () { B.openLink(C.brand.maxBot); });
    }
    // 4. Почта — если адрес указан в content.js.
    if (C.brand.email) {
      B.openLink('mailto:' + C.brand.email + '?subject=' + encodeURIComponent('Заявка: ' + data.topic) + '&body=' + encodeURIComponent(leadText(data)));
      return Promise.resolve();
    }
    return Promise.reject(new Error('Не настроен ни один канал отправки заявок'));
  }

  /* ---------- навигация ---------- */

  var screens = {
    home: renderHome,
    services: renderServices,
    marketing: renderMarketing,
    lead: renderLead
  };

  function onBack() {
    var prev = history.pop() || 'home';
    navigate(prev, null, true);
  }

  function navigate(name, topic, isBack) {
    if (!screens[name]) name = 'home';
    if (!isBack && name !== current) history.push(current);
    current = name;

    view.replaceChildren(screens[name](topic));
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });

    document.querySelectorAll('.tabbar__item').forEach(function (b) {
      b.classList.toggle('is-active', b.getAttribute('data-nav') === name);
    });

    if (name === 'home') {
      B.backButton.hide(onBack);
      history.length = 0;
    } else {
      B.backButton.show(onBack);
    }

    if (name === 'lead') {
      B.mainButton.hide(submitFromMainButton);
    } else {
      B.mainButton.show('Оставить заявку', submitFromMainButton);
    }
  }

  function submitFromMainButton() {
    navigate('lead');
  }

  function share() {
    var url = C.brand.site;
    B.share(C.share.text, url).then(function (r) {
      if (r === 'copied') alert('Ссылка скопирована');
    });
  }

  document.addEventListener('click', function (e) {
    var navBtn = e.target.closest('[data-nav]');
    if (navBtn) {
      e.preventDefault();
      B.haptic('light');
      navigate(navBtn.getAttribute('data-nav'), navBtn.getAttribute('data-topic'));
      return;
    }
    var action = e.target.closest('[data-action]');
    if (action && action.getAttribute('data-action') === 'share') {
      share();
      return;
    }
    var ext = e.target.closest('a[data-external]');
    if (ext && /^https?:/.test(ext.href)) {
      e.preventDefault();
      B.openLink(ext.href);
    }
  });

  /* ---------- старт ---------- */

  applyTheme();
  B.onThemeChanged(applyTheme);
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
  }
  B.init();
  navigate('home', null, true);
})();

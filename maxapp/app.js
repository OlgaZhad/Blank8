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

  // Заголовок с подсветкой: фрагмент в *звёздочках* становится синим.
  function title(s) {
    return esc(s).replace(/\*(.+?)\*/g, '<span class="hl">$1</span>');
  }

  function plain(s) {
    return String(s == null ? '' : s).replace(/\*/g, '');
  }

  function el(html) {
    var t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  function pad(n) {
    return (n < 10 ? '0' : '') + n;
  }

  // Eyebrow-метка «01  РАЗДЕЛ ———»
  function eyebrow(num, label) {
    return '<div class="eyebrow">' + (num ? '<span class="eyebrow__num">' + esc(num) + '</span>' : '') + '<span>' + esc(label) + '</span></div>';
  }

  function list(items, kind) {
    return '<ul class="list list--' + kind + '">' + items.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>';
  }

  /* ---------- экраны ---------- */

  function renderHome() {
    var user = B.user;
    var hello = user && user.first_name ? 'Здравствуйте, ' + user.first_name : C.hero.eyebrow;

    var facts = C.facts.map(function (f) {
      return '<div class="fact"><span class="fact__value">' + esc(f.value) + '</span><span class="fact__label">' + esc(f.label) + '</span></div>';
    }).join('');

    var principles = C.principles.map(function (p, i) {
      return '<div class="row"><span class="row__num">' + pad(i + 1) + '</span><div><h3>' + esc(p.title) + '</h3><p class="row__text">' + esc(p.text) + '</p></div></div>';
    }).join('');

    return el(
      '<div class="screen">' +
        '<section class="hero">' +
          eyebrow('', hello) +
          '<h1>' + title(C.hero.title) + '</h1>' +
          '<p class="lead">' + esc(C.hero.text) + '</p>' +
          '<div class="btn-row">' +
            '<button class="btn btn--primary" data-nav="' + esc(C.hero.primary.nav) + '">' + esc(C.hero.primary.label) + '</button>' +
            '<button class="btn btn--outline" data-nav="' + esc(C.hero.secondary.nav) + '">' + esc(C.hero.secondary.label) + ' →</button>' +
          '</div>' +
          '<div class="facts">' + facts + '</div>' +
        '</section>' +
        '<section>' + eyebrow('01', 'Услуги') + '<h2>Чем помогаем</h2>' + C.services.map(serviceCard).join('') + '</section>' +
        '<section>' + eyebrow('02', 'Как работаем') + '<h2>Спокойно и по делу</h2><div class="rows">' + principles + '</div></section>' +
        contactsBlock('03') +
        footer() +
      '</div>'
    );
  }

  function serviceCard(s, i) {
    var nav = s.nav || 'lead';
    var chip = s.featured ? '<span class="chip">Подробно</span>' : '';
    return '<button type="button" class="card card--tap' + (s.featured ? ' card--featured' : '') + '" data-nav="' + esc(nav) + '" data-topic="' + esc(s.topic || s.title) + '">' +
      '<span class="card__num">' + pad(i + 1) + '</span>' +
      '<span class="card__body">' + chip + '<span class="card__title">' + esc(s.title) + '</span><span class="card__text">' + esc(s.short) + '</span></span>' +
      '<span class="card__arrow" aria-hidden="true">→</span>' +
    '</button>';
  }

  function renderServices() {
    return el(
      '<div class="screen">' +
        eyebrow('01', 'Услуги') +
        '<h1>Три части, которые <span class="hl">работают вместе</span></h1>' +
        '<p class="lead">Веб, маркетинг, брендинг. Соцсети приводят клиента, сайт его убеждает, бренд удерживает. Можно взять одно направление или всё сразу.</p>' +
        '<section>' + C.services.map(serviceCard).join('') + '</section>' +
        '<div class="btn-row"><button class="btn btn--primary" data-nav="lead">Написать в MAX</button></div>' +
      '</div>'
    );
  }

  function renderMarketing() {
    var m = C.marketing;
    var n = 0;
    function head(label, h) {
      n += 1;
      return eyebrow(pad(n), label) + '<h2>' + esc(h) + '</h2>';
    }

    var forWhom = m.forWhom.items.map(function (p) {
      return '<div class="card portrait">' +
        '<div class="portrait__label">' + esc(p.label) + '</div>' +
        '<h3>' + esc(p.title) + '</h3>' +
        '<dl><div><dt class="terra">Боль</dt><dd>' + esc(p.pain) + '</dd></div>' +
        '<div><dt class="blue">Что получит</dt><dd>' + esc(p.gets) + '</dd></div></dl>' +
      '</div>';
    }).join('');

    var includes = '<div class="grid-2">' + m.includes.items.map(function (i) {
      return '<div class="card"><h3>' + esc(i.title) + '</h3><p>' + esc(i.text) + '</p></div>';
    }).join('') + '</div>';

    var steps = '<ol class="steps">' + m.steps.items.map(function (s, i) {
      return '<li><span class="steps__num">' + pad(i + 1) + '</span><div><h3>' + esc(s.title) + '</h3><p class="steps__text">' + esc(s.text) + '</p></div></li>';
    }).join('') + '</ol>';

    var c = m.caseStudy;
    var caseCard =
      '<div class="card case">' +
        '<div class="case__head"><span class="case__label">' + esc(c.label) + '</span><span class="chip chip--ok" style="margin:0">' + esc(c.status) + '</span></div>' +
        '<div class="case__value">' + esc(c.value) + '</div>' +
        '<p class="case__caption">' + esc(c.caption) + '</p>' +
        '<div class="case__compare">' +
          '<div><div class="case__k">Было</div><div class="case__v case__v--old">' + esc(c.before) + '</div></div>' +
          '<span class="case__arrow">→</span>' +
          '<div><div class="case__k">Стало</div><div class="case__v">' + esc(c.after) + '</div></div>' +
          '<div class="case__delta">' + esc(c.delta) + '</div>' +
        '</div>' +
        '<p class="case__text">' + esc(c.text) + '</p>' +
      '</div>';

    var p = m.pricing;
    var price =
      '<div class="card price">' +
        '<span class="case__label">' + esc(p.label) + '</span>' +
        '<div class="price__value">' + esc(p.price) + '</div>' +
        list(p.items, 'check') +
        '<p class="price__note">' + esc(p.note) + '</p>' +
      '</div>';

    var dd =
      '<div class="dd">' +
        '<div class="card yes"><h3>Делаем</h3>' + list(m.doAndDont.yes, 'check') + '</div>' +
        '<div class="card no"><h3>Не делаем</h3>' + list(m.doAndDont.no, 'cross') + '</div>' +
      '</div>';

    var faq = '<div class="faqs">' + m.faq.items.map(function (f) {
      return '<details class="faq"><summary>' + esc(f.q) + '</summary><div class="faq__answer">' + esc(f.a) + '</div></details>';
    }).join('') + '</div>';

    return el(
      '<div class="screen">' +
        eyebrow('', m.eyebrow) +
        '<h1>' + title(m.title) + '</h1>' +
        '<p class="lead">' + esc(m.lead) + '</p>' +
        '<div class="blank-line" aria-hidden="true"></div>' +
        '<section>' + head('Аудитория', m.forWhom.title) + forWhom + '</section>' +
        '<section>' + head('Состав', m.includes.title) + includes + '</section>' +
        '<section>' + head('Процесс', m.steps.title) + steps + '</section>' +
        '<section>' + head('Результат', 'Как это выглядит в цифрах') + caseCard + '</section>' +
        '<section>' + head('Стоимость', 'С чего начать') + price + '</section>' +
        '<section>' + head('Принципы', m.doAndDont.title) + dd + '</section>' +
        '<section>' + head('Вопросы', m.faq.title) + faq + '</section>' +
        '<div class="cta-block">' +
          eyebrow('', 'Следующий шаг') +
          '<h2>' + esc(m.cta.title) + '</h2>' +
          '<p>' + esc(m.cta.text) + '</p>' +
          '<div class="btn-row">' +
            '<button class="btn btn--primary" data-nav="' + esc(m.cta.nav) + '" data-topic="' + esc(m.cta.topic) + '">' + esc(m.cta.label) + '</button>' +
            '<button class="btn btn--link" data-action="share">Поделиться с коллегой</button>' +
          '</div>' +
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
        eyebrow('', L.eyebrow) +
        '<h1>' + title(L.title) + '</h1>' +
        '<p class="lead">' + esc(L.text) + '</p>' +
        '<form class="form" novalidate>' +
          '<div class="field"><label for="f-name">Как к вам обращаться</label><input id="f-name" name="name" autocomplete="name" value="' + esc(name) + '" required><span class="error">Напишите имя</span></div>' +
          '<div class="field"><label for="f-contact">Телефон или ник в MAX</label><input id="f-contact" name="contact" autocomplete="tel" inputmode="tel" required><span class="error">Оставьте контакт, чтобы мы могли ответить</span></div>' +
          '<div class="field"><label for="f-company">Компания или сайт</label><input id="f-company" name="company"></div>' +
          '<div class="field"><label for="f-topic">Что интересует</label><select id="f-topic" name="topic">' + options + '</select></div>' +
          '<div class="field"><label for="f-msg">Задача своими словами</label><textarea id="f-msg" name="message" placeholder="Например: заявки с сайта стали дорогими, хотим разобраться почему"></textarea></div>' +
          '<div class="btn-row"><button class="btn btn--primary" type="submit">Отправить в MAX</button></div>' +
          '<p class="consent">' + esc(L.consent) + '</p>' +
        '</form>' +
        contactsBlock('') +
      '</div>'
    );

    screen.querySelector('form').addEventListener('submit', onSubmit);
    return screen;
  }

  function contactsBlock(num) {
    var b = C.brand;
    var items = [];
    if (b.phone) items.push(contact('Телефон · MAX', b.phone, 'tel:' + b.phone.replace(/[^\d+]/g, '')));
    if (b.email) items.push(contact('Почта', b.email, 'mailto:' + b.email));
    if (b.telegram) items.push(contact('Канал в Telegram', '@' + b.telegram.split('/').pop(), b.telegram));
    if (b.vk) items.push(contact('ВКонтакте', b.vk.replace(/^https?:\/\//, ''), b.vk));
    if (b.site) items.push(contact('Сайт', b.site.replace(/^https?:\/\//, ''), b.site));
    if (!items.length) return '';
    return '<section>' + eyebrow(num, 'Контакты') + '<h2>Где мы на связи</h2><div class="contacts">' + items.join('') + '</div></section>';
  }

  function contact(label, text, href) {
    return '<a class="contact" href="' + esc(href) + '" data-external="1"><span><span class="contact__label">' + esc(label) + '</span>' + esc(text) + '</span><span class="contact__arrow" aria-hidden="true">→</span></a>';
  }

  function footer() {
    return '<p class="footer-note"><img src="assets/logo-wordmark.png" alt="">' + esc(C.brand.name) + ' — ' + esc(C.brand.tagline.toLowerCase()) + '. ' + esc(C.brand.legal) + '</p>';
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
      company: form.elements.company.value.trim(),
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
      button.textContent = 'Отправить в MAX';
      var note = form.querySelector('.notice--error');
      if (!note) form.appendChild(el('<div class="notice notice--error">Не получилось отправить. Попробуйте ещё раз или позвоните: ' + esc(C.brand.phone) + '</div>'));
    });
  }

  function leadText(data) {
    var lines = [
      'Заявка из мини-приложения',
      'Имя: ' + data.name,
      'Контакт: ' + data.contact
    ];
    if (data.company) lines.push('Компания: ' + data.company);
    lines.push('Тема: ' + data.topic);
    if (data.message) lines.push('', data.message);
    return lines.join('\n');
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
      B.mainButton.show('Написать в MAX', submitFromMainButton);
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

  B.init();
  navigate('home', null, true);
})();

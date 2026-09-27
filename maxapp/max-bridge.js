/*
 * Тонкая обёртка над MAX Bridge (window.WebApp).
 *
 * Внутри мессенджера скрипт https://st.max.ru/js/max-web-app.js создаёт
 * глобальный объект WebApp. В обычном браузере его нет, поэтому каждый
 * вызов защищён: приложение остаётся рабочим и без мессенджера.
 *
 * Набор методов у Bridge меняется от версии к версии, поэтому проверяем
 * наличие каждого перед вызовом, а не полагаемся на документацию.
 */
(function (global) {
  'use strict';

  function wa() {
    return global.WebApp || null;
  }

  function call(path, args) {
    var obj = wa();
    if (!obj) return undefined;
    var parts = path.split('.');
    var ctx = obj;
    for (var i = 0; i < parts.length - 1; i++) {
      ctx = ctx && ctx[parts[i]];
    }
    var fn = ctx && ctx[parts[parts.length - 1]];
    if (typeof fn !== 'function') return undefined;
    try {
      return fn.apply(ctx, args || []);
    } catch (e) {
      return undefined;
    }
  }

  var Bridge = {
    /** true, если приложение открыто внутри MAX */
    get available() {
      return !!wa();
    },

    /** Сообщаем клиенту, что интерфейс готов, и просим развернуть окно на весь экран */
    init: function () {
      call('ready');
      call('expand');
    },

    /** 'light' | 'dark' */
    get colorScheme() {
      var obj = wa();
      if (obj && obj.colorScheme) return obj.colorScheme;
      return global.matchMedia && global.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    },

    /** Данные пользователя, если мессенджер их передал */
    get user() {
      var obj = wa();
      var unsafe = obj && obj.initDataUnsafe;
      return (unsafe && unsafe.user) || null;
    },

    /** Подписанная строка initData — её отправляют на бэкенд для проверки */
    get initData() {
      var obj = wa();
      return (obj && obj.initData) || '';
    },

    onThemeChanged: function (handler) {
      call('onEvent', ['themeChanged', handler]);
    },

    /** Кнопка «Назад» в шапке мессенджера */
    backButton: {
      show: function (handler) {
        var obj = wa();
        if (!obj || !obj.BackButton) return false;
        call('BackButton.onClick', [handler]);
        call('BackButton.show');
        return true;
      },
      hide: function (handler) {
        if (handler) call('BackButton.offClick', [handler]);
        call('BackButton.hide');
      }
    },

    /** Главная кнопка внизу экрана мессенджера */
    mainButton: {
      show: function (text, handler) {
        var obj = wa();
        if (!obj || !obj.MainButton) return false;
        call('MainButton.setText', [text]);
        call('MainButton.onClick', [handler]);
        call('MainButton.show');
        return true;
      },
      hide: function (handler) {
        if (handler) call('MainButton.offClick', [handler]);
        call('MainButton.hide');
      }
    },

    /** Открыть внешнюю ссылку: через мессенджер, если можно, иначе новой вкладкой */
    openLink: function (url) {
      if (call('openLink', [url]) === undefined) {
        global.open(url, '_blank', 'noopener');
      }
    },

    /** Поделиться текстом: сначала Bridge, затем Web Share API, затем буфер обмена */
    share: function (text, url) {
      if (call('shareContent', [{ text: text, url: url }]) !== undefined) return Promise.resolve(true);
      if (global.navigator && global.navigator.share) {
        return global.navigator.share({ text: text, url: url }).then(function () { return true; }, function () { return false; });
      }
      if (global.navigator && global.navigator.clipboard) {
        return global.navigator.clipboard.writeText(text + ' ' + url).then(function () { return 'copied'; }, function () { return false; });
      }
      return Promise.resolve(false);
    },

    /** Лёгкая вибрация на нажатие, если поддерживается */
    haptic: function (style) {
      call('HapticFeedback.impactOccurred', [style || 'light']);
    },

    /** Передать данные боту, который открыл мини-приложение */
    sendData: function (payload) {
      return call('sendData', [JSON.stringify(payload)]) !== undefined;
    },

    close: function () {
      call('close');
    }
  };

  global.MaxBridge = Bridge;
})(window);

/* =============================================================
   SHIELDBEARER — Analytics Bootstrap
   Supports: GTM, GA4 fallback, Microsoft Clarity, custom events
   ============================================================= */

(function () {
  'use strict';

  // Config lives in js/config.js (window.SHIELDBEARER_CONFIG.analytics).
  var cfg = (window.SHIELDBEARER_CONFIG && window.SHIELDBEARER_CONFIG.analytics) || {};

  function hasValue(v) {
    return typeof v === 'string' && v.trim() !== '';
  }

  function safeTrim(v) {
    return hasValue(v) ? v.trim() : '';
  }

  var gtmId = safeTrim(cfg.gtmId);
  var ga4Id = safeTrim(cfg.ga4Id);
  var clarityId = safeTrim(cfg.clarityId);

  window.dataLayer = window.dataLayer || [];

  function pushDataLayer(eventName, params) {
    window.dataLayer = window.dataLayer || [];
    var payload = Object.assign({ event: eventName }, params || {});
    window.dataLayer.push(payload);
  }

  function gtag() {
    window.dataLayer.push(arguments);
  }

  function sbTrack(eventName, params) {
    pushDataLayer(eventName, params);
  }

  window.sbTrack = sbTrack;

  function loadScript(src) {
    var s = document.createElement('script');
    s.async = true;
    s.src = src;
    document.head.appendChild(s);
  }

  function initGA4Fallback() {
    if (!/^G-[A-Z0-9]+$/i.test(ga4Id)) return;
    loadScript('https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(ga4Id));
    window.gtag = gtag;
    window.gtag('js', new Date());
    window.gtag('config', ga4Id, {
      anonymize_ip: true,
      linker: {
        domains: ['shieldbearerusa.com', 'shop.shieldbearerusa.com']
      }
    });
  }

  function initClarity() {
    if (!hasValue(clarityId) || clarityId === 'CLARITY_PROJECT_ID') return;
    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r);
      t.async = 1;
      t.src = 'https://www.clarity.ms/tag/' + i;
      y = l.getElementsByTagName(r)[0];
      y.parentNode.insertBefore(t, y);
    })(window, document, 'clarity', 'script', clarityId);
  }

  function platformFromUrl(url) {
    if (url.indexOf('spotify.com') !== -1) return 'spotify';
    if (url.indexOf('youtube.com') !== -1 || url.indexOf('youtu.be') !== -1) return 'youtube';
    if (url.indexOf('music.apple.com') !== -1) return 'apple_music';
    if (url.indexOf('music.amazon.com') !== -1) return 'amazon_music';
    return '';
  }

  function currentPath() {
    return window.location.pathname || '/';
  }

  function scrollPageConfig(path) {
    var configs = [
      { match: 'song-meanings', page: 'lyrics' },
      { match: 'story', page: 'story' },
      { match: 'manifesto', page: 'manifesto' },
      { match: 'open-letter', page: 'open_letter' }
    ];
    for (var i = 0; i < configs.length; i++) {
      if (path.indexOf(configs[i].match) !== -1) return configs[i];
    }
    return null;
  }

  function initClickTracking() {
    document.addEventListener('click', function (e) {
      var target = e.target;
      if (!target) return;
      var link = target.closest('a');
      if (!link) return;
      var href = (link.href || link.getAttribute('href') || '').trim();
      if (!href) return;

      var rawText = (link.textContent || '').trim();
      var label = rawText.toLowerCase();
      var path = currentPath();
      var platform = platformFromUrl(href);

      if (platform) {
        sbTrack('listen_click', { platform: platform, label: label, from_path: path, to_url: href });
      }
      if (href.indexOf('buymeacoffee.com') !== -1 || href.indexOf('www.buymeacoffee.com') !== -1) {
        sbTrack('support_click', { link_text: rawText, link_url: href });
      }
      if (href.indexOf('shop.shieldbearerusa.com') !== -1) {
        sbTrack('merch_click', {
          label: label,
          link_text: rawText,
          from_path: path,
          to_url: href,
          link_url: href
        });
      }

      if (path.indexOf('epk.html') !== -1) {
        var epkLink = link.closest('.epk-link-item, .epk-press-card__link, .epk-contact-email');
        var epkArchive = href.indexOf('interviews.html') !== -1 && link.classList.contains('btn');
        if (epkLink || epkArchive) {
          sbTrack('epk_click', {
            link_text: rawText,
            link_url: href,
            from_path: path
          });
        }
      }
    }, { passive: true });
  }

  function initScrollTracking() {
    var path = currentPath();
    var config = scrollPageConfig(path);
    if (!config) return;

    var marks = [25, 50, 75, 100];
    var sent = {};

    function onScroll() {
      var doc = document.documentElement;
      var scrollTop = window.scrollY || doc.scrollTop || 0;
      var scrollMax = Math.max(doc.scrollHeight - window.innerHeight, 1);
      var pct = Math.round((scrollTop / scrollMax) * 100);
      for (var i = 0; i < marks.length; i++) {
        var m = marks[i];
        if (pct >= m && !sent[m]) {
          sent[m] = true;
          sbTrack('scroll_depth', { page: config.page, depth: m, path: path });
        }
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
  }

  initGA4Fallback();
  initClarity();
  initClickTracking();
  initScrollTracking();
})();

/* =============================================================
   SHIELDBEARER: Analytics Bootstrap. Single source of truth.

   One file, loaded sitewide, so a template rewrite never silently
   kills instrumentation again. Events are wired by event
   delegation on document, so a button added later still fires
   without per-page wiring. Explicit data-track attributes refine
   the parameters when present; href and context are the fallback
   so coverage never drops to zero.

   All events go through sbTrack -> dataLayer (GTM forwards to GA4).
   Config lives in js/config.js (window.SHIELDBEARER_CONFIG).
   ============================================================= */

(function () {
  'use strict';

  var cfg = (window.SHIELDBEARER_CONFIG && window.SHIELDBEARER_CONFIG.analytics) || {};

  function hasValue(v) { return typeof v === 'string' && v.trim() !== ''; }
  function safeTrim(v) { return hasValue(v) ? v.trim() : ''; }

  var ga4Id = safeTrim(cfg.ga4Id);
  var clarityId = safeTrim(cfg.clarityId);

  window.dataLayer = window.dataLayer || [];

  function pushDataLayer(eventName, params) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(Object.assign({ event: eventName }, params || {}));
  }
  function gtag() { window.dataLayer.push(arguments); }

  function sbTrack(eventName, params) { pushDataLayer(eventName, params); }
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
      linker: { domains: ['shieldbearerusa.com', 'shop.shieldbearerusa.com'] }
    });
  }

  function initClarity() {
    if (!hasValue(clarityId) || clarityId === 'CLARITY_PROJECT_ID') return;
    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r);
      t.async = 1;
      t.src = 'https://www.clarity.ms/tag/' + i;
      t.onerror = function () { sbTrack('clarity_load_error', { project_id: i, src: t.src }); };
      y = l.getElementsByTagName(r)[0];
      y.parentNode.insertBefore(t, y);
    })(window, document, 'clarity', 'script', clarityId);
  }

  function currentPath() { return window.location.pathname || '/'; }

  function platformFromUrl(url) {
    if (url.indexOf('spotify.com') !== -1) return 'spotify';
    if (url.indexOf('youtube.com') !== -1 || url.indexOf('youtu.be') !== -1) return 'youtube';
    if (url.indexOf('music.apple.com') !== -1) return 'apple_music';
    if (url.indexOf('music.amazon.com') !== -1) return 'amazon_music';
    if (url.indexOf('bandcamp.com') !== -1) return 'bandcamp';
    if (url.indexOf('tidal.com') !== -1) return 'tidal';
    if (url.indexOf('deezer.com') !== -1) return 'deezer';
    if (url.indexOf('soundcloud.com') !== -1) return 'soundcloud';
    return '';
  }

  function followPlatformFromUrl(url) {
    if (url.indexOf('instagram.com') !== -1) return 'instagram';
    if (url.indexOf('facebook.com') !== -1) return 'facebook';
    if (url.indexOf('x.com') !== -1 || url.indexOf('twitter.com') !== -1) return 'x';
    if (url.indexOf('tiktok.com') !== -1) return 'tiktok';
    if (url.indexOf('threads.net') !== -1) return 'threads';
    if (url.indexOf('youtube.com/@') !== -1 || url.indexOf('youtube.com/channel') !== -1 ||
        url.indexOf('youtube.com/c/') !== -1) return 'youtube';
    return '';
  }

  function isSupportUrl(url) {
    return url.indexOf('buymeacoffee.com') !== -1 ||
           url.indexOf('ko-fi.com') !== -1 ||
           url.indexOf('patreon.com') !== -1 ||
           url.indexOf('paypal.com') !== -1 ||
           url.indexOf('venmo.com') !== -1 ||
           (url.indexOf('bandcamp.com') !== -1 && /buy|purchase|track|album/.test(url));
  }

  /* ---- Click delegation: listen / follow / support / merch ---------- */
  function initClickTracking() {
    document.addEventListener('click', function (e) {
      var t = e.target;
      if (!t || !t.closest) return;
      var link = t.closest('a, button');
      if (!link) return;

      var href = ((link.getAttribute && (link.getAttribute('href') || link.href)) || '').toString().trim();
      var rawText = (link.textContent || '').trim();
      var label = rawText.toLowerCase();
      var path = currentPath();
      var declared = link.getAttribute && link.getAttribute('data-track');

      if (declared === 'listen' || (!declared && href && platformFromUrl(href))) {
        sbTrack('listen_click', {
          platform: (link.getAttribute && link.getAttribute('data-platform')) || platformFromUrl(href) || 'unknown',
          track_name: (link.getAttribute && link.getAttribute('data-track-name')) || 'unknown',
          from_path: path, to_url: href, label: label
        });
        return;
      }
      if (declared === 'follow' || (!declared && href && followPlatformFromUrl(href) && /follow|subscribe/.test(label))) {
        sbTrack('follow_click', {
          platform: (link.getAttribute && link.getAttribute('data-platform')) || followPlatformFromUrl(href) || 'unknown',
          from_path: path
        });
        return;
      }
      if (declared === 'support' || (!declared && href && isSupportUrl(href))) {
        sbTrack('support_click', {
          type: (link.getAttribute && link.getAttribute('data-support-type')) ||
                (href.indexOf('bandcamp.com') !== -1 ? 'bandcamp' : 'tip'),
          from_path: path, link_url: href, link_text: rawText
        });
        return;
      }
      if (declared === 'merch' || (!declared && href && href.indexOf('shop.shieldbearerusa.com') !== -1)) {
        sbTrack('merch_click', { from_path: path, link_url: href, label: label });
        return;
      }
    }, { passive: true });
  }

  /* ---- Forms: form_start (first focus) and form_submit ------------- */
  function initFormTracking() {
    var started = {};
    document.addEventListener('focusin', function (e) {
      var form = e.target && e.target.closest && e.target.closest('form');
      if (!form) return;
      var name = form.getAttribute('data-track-form') || form.id || form.getAttribute('name') || 'form';
      if (started[name]) return;
      started[name] = true;
      sbTrack('form_start', { form_name: name, from_path: currentPath() });
    });
    document.addEventListener('submit', function (e) {
      var form = e.target;
      if (!form || form.tagName !== 'FORM') return;
      var name = form.getAttribute('data-track-form') || form.id || form.getAttribute('name') || 'form';
      sbTrack('form_submit', { form_name: name, from_path: currentPath() });
    }, true);
  }

  /* ---- Audio: play_audio when any audio element or radio starts ---- */
  function initAudioTracking() {
    document.addEventListener('play', function (e) {
      var el = e.target;
      if (!el) return;
      var source = (el.getAttribute && el.getAttribute('data-source')) ||
                   (el.currentSrc || el.src || '') || 'radio';
      sbTrack('play_audio', { source: source, from_path: currentPath() });
    }, true);
  }

  /* ---- Scroll depth: 25/50/75/100 on every content page ----------- */
  var NON_CONTENT = ['/admin', '/metrics'];
  function initScrollTracking() {
    var path = currentPath();
    for (var i = 0; i < NON_CONTENT.length; i++) {
      if (path.indexOf(NON_CONTENT[i]) !== -1) return;
    }
    var marks = [25, 50, 75, 100];
    var sent = {};
    function onScroll() {
      var doc = document.documentElement;
      var scrollTop = window.scrollY || doc.scrollTop || 0;
      var scrollMax = Math.max(doc.scrollHeight - window.innerHeight, 1);
      var pct = Math.round((scrollTop / scrollMax) * 100);
      for (var j = 0; j < marks.length; j++) {
        var m = marks[j];
        if (pct >= m && !sent[m]) {
          sent[m] = true;
          sbTrack('scroll_depth', { percent: m, path: path });
        }
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---- SentinelBot open. The widget (js/sentinelbot.js) also calls
     window.sbTrack directly for sentinelbot_open and
     sentinelbot_question. This is the safety net for any element
     carrying data-track="sentinelbot_open" without its own handler. */
  function initSentinelTracking() {
    document.addEventListener('click', function (e) {
      var el = e.target && e.target.closest && e.target.closest('[data-track="sentinelbot_open"]');
      if (el) sbTrack('sentinelbot_open', { from_path: currentPath() });
    }, { passive: true });
  }

  function init() {
    initClickTracking();
    initFormTracking();
    initAudioTracking();
    initScrollTracking();
    initSentinelTracking();
  }

  initGA4Fallback();
  initClarity();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

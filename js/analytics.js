/* =============================================================
   SHIELDBEARER — Analytics Bootstrap
   Supports: GTM, GA4 fallback, Microsoft Clarity, custom events
   ============================================================= */

(function () {
  'use strict';

  /* -----------------------------------------------------------
     CONFIG
     1) GTM: create container ID (GTM-XXXXXXX) and paste below
     2) GA4 (optional direct fallback): G-XXXXXXXXXX
     3) Clarity: project ID from clarity.microsoft.com
     ----------------------------------------------------------- */
  var cfg = window.SHIELDBEARER_ANALYTICS || {
    gtmId: 'GTM-XXXXXXX',
    ga4Id: '',
    clarityId: ''
  };

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
    var payload = Object.assign({ event: eventName }, params || {});
    window.dataLayer.push(payload);
  }

  function gtag() {
    window.dataLayer.push(arguments);
  }

  function sbTrack(eventName, params) {
    pushDataLayer(eventName, params);
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, params || {});
    }
  }

  window.sbTrack = sbTrack;

  function loadScript(src) {
    var s = document.createElement('script');
    s.async = true;
    s.src = src;
    document.head.appendChild(s);
  }

  function initGTM() {
    if (!/^GTM-[A-Z0-9]+$/i.test(gtmId)) return;
    pushDataLayer('gtm_init', { gtm_id: gtmId });
    window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
    loadScript('https://www.googletagmanager.com/gtm.js?id=' + encodeURIComponent(gtmId));
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

  function initClickTracking() {
    document.addEventListener('click', function (e) {
      var target = e.target;
      if (!target) return;
      var link = target.closest('a');
      if (!link) return;
      var href = (link.getAttribute('href') || '').trim();
      if (!href) return;

      var label = (link.textContent || '').trim().toLowerCase();
      var path = window.location.pathname || '/';
      var platform = platformFromUrl(href);

      if (platform) {
        sbTrack('listen_click', { platform: platform, label: label, from_path: path, to_url: href });
      }
      if (href.indexOf('shop.shieldbearerusa.com') !== -1) {
        sbTrack('merch_click', { label: label, from_path: path, to_url: href });
      }
      if (href.indexOf('eternalflames.co.uk') !== -1 || href.indexOf('heavensmetalmagazine.com') !== -1) {
        sbTrack('outbound_press_click', { label: label, from_path: path, to_url: href });
      }
      if (href.indexOf('linktr.ee') !== -1 || href.indexOf('instagram.com') !== -1 || href.indexOf('facebook.com') !== -1) {
        sbTrack('follow_click', { label: label, from_path: path, to_url: href });
      }
    }, { passive: true });
  }

  function initFormTracking() {
    var enquiry = document.getElementById('enquiryForm');
    if (enquiry) {
      enquiry.addEventListener('submit', function () {
        sbTrack('contact_submit', { from_path: window.location.pathname || '/' });
      }, true);
    }

    var signal = document.getElementById('signalForm');
    if (signal) {
      signal.addEventListener('submit', function () {
        sbTrack('signal_signup', { from_path: window.location.pathname || '/' });
      }, true);
    }
  }

  function initScrollTracking() {
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
          sbTrack('scroll_depth', { percent: m, path: window.location.pathname || '/' });
        }
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
  }

  initGTM();
  initGA4Fallback();
  initClarity();
  initClickTracking();
  initFormTracking();
  initScrollTracking();
})();

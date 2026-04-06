/* =============================================================
   SHIELDBEARER — Analytics Bootstrap
   Supports: GTM-first click + interaction tracking
   ============================================================= */

(function () {
  'use strict';

  window.dataLayer = window.dataLayer || [];

  function pushDataLayer(eventName, params) {
    var payload = Object.assign({ event: eventName }, params || {});
    window.dataLayer.push(payload);
  }

  function sbTrack(eventName, params) {
    pushDataLayer(eventName, params);
  }

  window.sbTrack = sbTrack;

  function toAbsUrl(href) {
    try { return new URL(href, window.location.origin).toString(); }
    catch (_) { return href || ''; }
  }

  function platformFromUrl(url) {
    if (!url) return '';
    if (url.indexOf('shop.shieldbearerusa.com') !== -1) return 'shopify';
    if (url.indexOf('open.spotify.com') !== -1) return 'spotify';
    if (url.indexOf('youtube.com') !== -1 || url.indexOf('youtu.be') !== -1) return 'youtube';
    if (url.indexOf('instagram.com') !== -1) return 'instagram';
    if (url.indexOf('facebook.com') !== -1) return 'facebook';
    if (url.indexOf('x.com') !== -1 || url.indexOf('twitter.com') !== -1) return 'x';
    if (url.indexOf('tiktok.com') !== -1) return 'tiktok';
    if (url.indexOf('mailto:') === 0) return 'email';
    return 'external';
  }

  function locationFromEl(el) {
    if (!el || !el.closest) return 'unknown';
    if (el.closest('.site-nav')) return 'header';
    if (el.closest('.mob-menu')) return 'mobile_menu';
    if (el.closest('.page-hero')) return 'hero';
    if (el.closest('.signal-band')) return 'cta';
    if (el.closest('.site-footer')) return 'footer';
    if (el.closest('.song-dossier-panel')) return 'song_card';
    if (el.closest('.song-dossier-fallback__item')) return 'song_card';
    if (el.closest('.press-grid, .press-card')) return 'press';
    return 'content';
  }

  function songFromEl(el) {
    if (!el || !el.closest) return '';
    var songWrap = el.closest('[id], .song-dossier-panel, .song-dossier-fallback__item, .song-dossier-mobile__item');
    if (!songWrap) return '';
    var title = songWrap.querySelector('h2, .song-dossier__title, .song-dossier-mobile__meta strong');
    return title ? title.textContent.trim() : '';
  }

  function actionFromAnchor(anchor, href) {
    if (!href) return '';
    if (href.indexOf('shop.shieldbearerusa.com') !== -1) return 'merch-click';
    if (href.indexOf('open.spotify.com/playlist/') !== -1) return 'radio-click';
    if (href.indexOf('open.spotify.com') !== -1) return 'spotify-click';
    if (href.indexOf('youtube.com') !== -1 || href.indexOf('youtu.be') !== -1) return 'youtube-click';
    if (href.indexOf('mailto:') === 0) return 'email-click';
    if (
      href.indexOf('instagram.com') !== -1 ||
      href.indexOf('facebook.com') !== -1 ||
      href.indexOf('x.com') !== -1 ||
      href.indexOf('twitter.com') !== -1 ||
      href.indexOf('tiktok.com') !== -1 ||
      href.indexOf('linktr.ee') !== -1
    ) return 'social-click';
    if (href.indexOf('epk.html') !== -1) return 'epk-click';
    if (href.indexOf('manifesto.html') !== -1) return 'manifesto-click';
    if (href.indexOf('open-letter.html') !== -1) return 'open-letter-click';
    if (href.indexOf('interviews.html') !== -1 || href.indexOf('heavensmetalmagazine.com') !== -1 || href.indexOf('eternalflames') !== -1) {
      return 'presskit-click';
    }
    if (anchor && anchor.getAttribute('target') === '_blank') return 'outbound-click';
    return '';
  }

  function annotateLinksAndButtons() {
    document.querySelectorAll('a[href]').forEach(function (a) {
      var href = (a.getAttribute('href') || '').trim();
      if (!href) return;
      if (!a.dataset.destination) a.dataset.destination = toAbsUrl(href);
      if (!a.dataset.platform) a.dataset.platform = platformFromUrl(a.dataset.destination);
      if (!a.dataset.location) a.dataset.location = locationFromEl(a);
      if (!a.dataset.song) {
        var song = songFromEl(a);
        if (song) a.dataset.song = song;
      }
      if (!a.dataset.track) {
        var action = actionFromAnchor(a, a.dataset.destination);
        if (action) a.dataset.track = action;
      }
    });

    document.querySelectorAll('.meaning-card, .song-dossier-mobile__toggle').forEach(function (el) {
      if (!el.dataset.track) el.dataset.track = 'lyrics-expand';
      if (!el.dataset.location) el.dataset.location = 'song_card';
      if (!el.dataset.song) {
        var song = songFromEl(el);
        if (song) el.dataset.song = song;
      }
    });

    var enquiryForm = document.getElementById('enquiryForm');
    if (enquiryForm && !enquiryForm.dataset.track) enquiryForm.dataset.track = 'contact-submit';
    var signalForm = document.getElementById('signalForm');
    if (signalForm && !signalForm.dataset.track) signalForm.dataset.track = 'email-click';
  }

  function toSbAction(action) {
    return String(action || '').replace(/-/g, '_');
  }

  function fireSbClick(el, overrideAction) {
    if (!el) return;
    var rawAction = overrideAction || el.getAttribute('data-track') || '';
    if (!rawAction) return;

    var action = toSbAction(rawAction);
    var destination = el.getAttribute('data-destination') || '';
    var location = el.getAttribute('data-location') || locationFromEl(el);
    var platform = el.getAttribute('data-platform') || platformFromUrl(destination);
    var song = el.getAttribute('data-song') || songFromEl(el);
    var linkText = (el.textContent || '').trim();

    sbTrack('sb_click', {
      sb_action: action,
      sb_platform: platform,
      sb_location: location,
      sb_destination: destination,
      sb_song_name: song,
      sb_link_text: linkText,
      page_title: document.title || '',
      page_path: window.location.pathname || '/'
    });
  }

  function initClickTracking() {
    document.addEventListener('click', function (e) {
      var target = e.target;
      if (!target) return;
      var tracked = target.closest('[data-track]');
      if (!tracked) return;

      /* Lyrics expansion fires only when opened in main.js to avoid duplicates. */
      if ((tracked.getAttribute('data-track') || '') === 'lyrics-expand') return;

      fireSbClick(tracked);
    }, { passive: true });
  }

  annotateLinksAndButtons();
  initClickTracking();
})();

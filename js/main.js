/* =============================================================
   SHIELDBEARER — Main JS
   Handles: nav scroll, mobile menu, active link, meaning cards
   ============================================================= */

(function () {
  'use strict';

  function track(eventName, params) {
    if (typeof window.sbTrack === 'function') {
      window.sbTrack(eventName, params || {});
    }
  }

  /* ── NAV SCROLL STATE ── */
  var nav = document.querySelector('.site-nav');
  if (nav) {
    window.addEventListener('scroll', function () {
      nav.classList.toggle('scrolled', window.scrollY > 40);
    }, { passive: true });
  }

  /* ── MOBILE MENU ── */
  var mobMenu   = document.getElementById('mobMenu');
  var hamburger = document.getElementById('hamburger');
  var mobClose  = document.getElementById('mobClose');

  if (hamburger && mobMenu) {
    hamburger.addEventListener('click', function () {
      mobMenu.classList.add('open');
      hamburger.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  }
  function closeMob() {
    if (!mobMenu) return;
    mobMenu.classList.remove('open');
    if (hamburger) hamburger.classList.remove('open');
    document.body.style.overflow = '';
  }
  if (mobClose) mobClose.addEventListener('click', closeMob);
  if (mobMenu) {
    mobMenu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', closeMob);
    });
  }

  /* ── ACTIVE NAV LINK ── */
  var currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .mob-menu a').forEach(function (a) {
    var href = a.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });

  /* ── MEANING CARD ACCORDION ── */
  document.querySelectorAll('.meaning-card').forEach(function (card) {
    card.addEventListener('click', function () {
      var isOpen = card.classList.contains('open');
      /* close all */
      document.querySelectorAll('.meaning-card.open').forEach(function (c) {
        c.classList.remove('open');
      });
      if (!isOpen) {
        card.classList.add('open');
        var titleEl = card.querySelector('.mc-title');
        track('scroll_open', {
          song_title: titleEl ? titleEl.textContent.trim() : '',
          from_path: window.location.pathname || '/'
        });
      }
    });
  });

  /* ── ENQUIRY FORM (Formspree + mailto fallback) ── */
  var enquiryForm = document.getElementById('enquiryForm');
  if (enquiryForm) {
    enquiryForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var name    = document.getElementById('fName').value.trim();
      var email   = document.getElementById('fEmail').value.trim();
      var type    = (document.getElementById('fType') || {}).value || 'General';
      var msg     = document.getElementById('fMsg').value.trim();
      var out     = document.getElementById('formMsg');
      var endpoint = (enquiryForm.getAttribute('data-formspree-endpoint') || '').trim();

      if (!name || !email || !msg) {
        out.className = 'form-msg err';
        out.textContent = 'Please fill in all required fields.';
        return;
      }
      if (!email.includes('@')) {
        out.className = 'form-msg err';
        out.textContent = 'Please enter a valid email address.';
        return;
      }

      if (endpoint) {
        out.className = 'form-msg ok';
        out.textContent = 'Sending message...';
        fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ name: name, email: email, type: type, message: msg })
        })
        .then(function (r) {
          if (!r.ok) throw new Error('Formspree request failed');
          out.className = 'form-msg ok';
          out.textContent = 'Message sent. Thank you.';
          track('contact_submit_success', { method: 'formspree', from_path: window.location.pathname || '/' });
          enquiryForm.reset();
        })
        .catch(function () {
          out.className = 'form-msg err';
          out.textContent = 'Direct send failed. Opening your mail app...';
          track('contact_submit_fallback', { method: 'mailto', from_path: window.location.pathname || '/' });
          var subjectFail = encodeURIComponent('Shieldbearer Enquiry: ' + type);
          var bodyFail    = encodeURIComponent('Name: ' + name + '\nEmail: ' + email + '\nType: ' + type + '\n\n' + msg);
          window.location.href = 'mailto:shieldbearerusa@gmail.com?subject=' + subjectFail + '&body=' + bodyFail;
        });
        return;
      }

      /* Mailto fallback for GitHub Pages (no backend) */
      out.className = 'form-msg ok';
      out.textContent = 'Opening your mail app...';
      track('contact_submit_fallback', { method: 'mailto', from_path: window.location.pathname || '/' });
      var subject = encodeURIComponent('Shieldbearer Enquiry: ' + type);
      var body    = encodeURIComponent('Name: ' + name + '\nEmail: ' + email + '\nType: ' + type + '\n\n' + msg);
      window.location.href = 'mailto:shieldbearerusa@gmail.com?subject=' + subject + '&body=' + body;
    });
  }

  /* ── SIGNAL SIGNUP (mailto capture fallback) ── */
  var signalForm = document.getElementById('signalForm');
  if (signalForm) {
    signalForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var emailField = document.getElementById('signalEmail');
      if (!emailField) return;
      var emailValue = emailField.value.trim();
      if (!emailValue || !emailValue.includes('@')) {
        emailField.focus();
        return;
      }
      var subject = encodeURIComponent('Join the Signal');
      var body = encodeURIComponent('Please add this email to Shieldbearer release updates:\n\n' + emailValue);
      track('signal_signup_submit', { method: 'mailto', from_path: window.location.pathname || '/' });
      window.location.href = 'mailto:shieldbearerusa@gmail.com?subject=' + subject + '&body=' + body;
      signalForm.reset();
    });
  }

  /* ── FEATURED TRACK HEIGHT SYNC (desktop only) ── */
  function syncFeaturedTrackLyricsHeight() {
    var desktopMq = window.matchMedia('(min-width: 901px)');
    var tracks = document.querySelectorAll('.featured-track');
    if (!tracks.length) return;

    tracks.forEach(function (trackEl) {
      if (!desktopMq.matches) {
        trackEl.style.removeProperty('--featured-lyrics-panel-h');
        return;
      }

      var mediaPanel = trackEl.querySelector('.featured-track__media-panel');
      if (!mediaPanel) {
        trackEl.style.removeProperty('--featured-lyrics-panel-h');
        return;
      }

      var mediaHeight = Math.ceil(mediaPanel.getBoundingClientRect().height);
      if (mediaHeight > 0) {
        trackEl.style.setProperty('--featured-lyrics-panel-h', mediaHeight + 'px');
      }
    });
  }

  function scheduleFeaturedTrackSync() {
    window.requestAnimationFrame(syncFeaturedTrackLyricsHeight);
  }

  window.addEventListener('load', scheduleFeaturedTrackSync);
  window.addEventListener('resize', scheduleFeaturedTrackSync);
  window.addEventListener('orientationchange', scheduleFeaturedTrackSync);
  setTimeout(scheduleFeaturedTrackSync, 120);
  setTimeout(scheduleFeaturedTrackSync, 420);

  document.querySelectorAll('.featured-track__artwork img').forEach(function (imgEl) {
    imgEl.addEventListener('load', scheduleFeaturedTrackSync);
  });

})();

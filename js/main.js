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

  function trackSbClick(action, params) {
    track('sb_click', Object.assign({
      sb_action: String(action || '').replace(/-/g, '_'),
      page_title: document.title || '',
      page_path: window.location.pathname || '/'
    }, params || {}));
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
        trackSbClick('lyrics-expand', {
          sb_location: 'song_card',
          sb_song_name: titleEl ? titleEl.textContent.trim() : '',
          sb_link_text: titleEl ? titleEl.textContent.trim() : ''
        });
      }
    });
  });

  /* ── ENQUIRY FORM (Formspree) ── */
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

      if (!endpoint || endpoint.indexOf('REPLACE_WITH_YOUR_FORMSPREE_ID') !== -1) {
        out.className = 'form-msg err';
        out.textContent = 'Form endpoint not configured yet.';
        return;
      }

      out.className = 'form-msg ok';
      out.textContent = 'Sending message...';
      trackSbClick('contact-submit', {
        sb_platform: 'email',
        sb_location: 'contact_form',
        sb_destination: endpoint,
        sb_link_text: 'Contact Form Submit',
        sb_status: 'attempt'
      });
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ name: name, email: email, type: type, message: msg })
      })
      .then(function (r) {
        if (!r.ok) throw new Error('Formspree request failed');
        out.className = 'form-msg ok';
        out.textContent = 'Message sent. Thank you.';
        trackSbClick('contact-submit-success', {
          sb_platform: 'email',
          sb_location: 'contact_form',
          sb_destination: endpoint,
          sb_link_text: 'Contact Form Submit',
          sb_status: 'success'
        });
        enquiryForm.reset();
      })
      .catch(function () {
        out.className = 'form-msg err';
        out.textContent = 'Message failed. Please try again in a moment.';
      });
    });
  }

  /* ── SIGNAL SIGNUP (ConvertKit) ── */
  var signalForm = document.getElementById('signalForm');
  if (signalForm) {
    signalForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var emailField = document.getElementById('signalEmail');
      if (!emailField) return;
      var emailValue = emailField.value.trim();
      var endpoint = (signalForm.getAttribute('data-convertkit-endpoint') || '').trim();
      var note = signalForm.parentElement ? signalForm.parentElement.querySelector('.signal-note') : null;
      if (!emailValue || !emailValue.includes('@')) {
        emailField.focus();
        return;
      }
      if (!endpoint || endpoint.indexOf('REPLACE_WITH_YOUR_CONVERTKIT_FORM_ID') !== -1) {
        if (note) note.textContent = 'Email form is not configured yet.';
        return;
      }
      trackSbClick('email-click', {
        sb_platform: 'email',
        sb_location: 'cta',
        sb_destination: endpoint,
        sb_link_text: 'Signal Signup Submit',
        sb_status: 'attempt'
      });
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
        body: new URLSearchParams({ email_address: emailValue }).toString()
      })
      .then(function (r) {
        if (!r.ok) throw new Error('ConvertKit request failed');
        if (note) note.textContent = 'You are in. Watch for the next drop.';
        trackSbClick('email-submit-success', {
          sb_platform: 'email',
          sb_location: 'cta',
          sb_destination: endpoint,
          sb_link_text: 'Signal Signup Submit',
          sb_status: 'success'
        });
        signalForm.reset();
      })
      .catch(function () {
        if (note) note.textContent = 'Signup failed. Please try again.';
      });
    });
  }

})();

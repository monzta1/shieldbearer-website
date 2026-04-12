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
      }
    });
  });

  /* ── ENQUIRY FORM (Formspree) ── */
  var enquiryForm = document.getElementById('enquiryForm');
  if (enquiryForm) {
    var sent = new URLSearchParams(window.location.search).get('sent');
    if (sent === 'true') {
      enquiryForm.outerHTML = '<p class="form-msg ok">Message received. Moncy will respond to every serious message directly.</p>';
    } else {
    enquiryForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var name    = document.getElementById('fName').value.trim();
      var email   = document.getElementById('fEmail').value.trim();
      var type    = (document.getElementById('fType') || {}).value || 'General';
      var msg     = document.getElementById('fMsg').value.trim();
      var out     = document.getElementById('formMsg');
      var endpoint = (enquiryForm.getAttribute('action') || '').trim();
      var nextUrl = '';
      var nextField = enquiryForm.querySelector('input[name="_next"]');
      if (nextField) nextUrl = nextField.value.trim();

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

      if (!endpoint) {
        out.className = 'form-msg err';
        out.textContent = 'Form endpoint not configured yet.';
        track('form_submit_error', {
          form_id: 'contact_enquiry',
          reason: 'missing_endpoint',
          from_path: window.location.pathname || '/'
        });
        return;
      }

      out.className = 'form-msg ok';
      out.textContent = 'Sending message...';
      var formData = new FormData(enquiryForm);
      fetch(endpoint, {
        method: enquiryForm.getAttribute('method') || 'POST',
        headers: { 'Accept': 'application/json' },
        body: formData
      })
      .then(function (r) {
        if (!r.ok) throw new Error('Formspree request failed');
        track('form_submit', {
          form_id: 'contact_enquiry',
          method: 'formspree',
          from_path: window.location.pathname || '/'
        });
        if (nextUrl) {
          window.location.href = nextUrl;
          return;
        }
        out.className = 'form-msg ok';
        out.textContent = 'Message received. Moncy will respond to every serious message directly.';
        enquiryForm.reset();
      })
      .catch(function () {
        out.className = 'form-msg err';
        out.textContent = 'Message failed. Please try again in a moment.';
        track('form_submit_error', {
          form_id: 'contact_enquiry',
          reason: 'request_failed',
          from_path: window.location.pathname || '/'
        });
      });
    });
    }
  }

  /* ── SIGNAL SIGNUP (Formspree) ── */
  var signalForm = document.getElementById('signalForm');
  if (signalForm) {
    signalForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var emailField = document.getElementById('signalEmail');
      if (!emailField) return;
      var emailValue = emailField.value.trim();
      var endpoint = (signalForm.getAttribute('action') || '').trim();
      var note = signalForm.parentElement ? signalForm.parentElement.querySelector('.signal-note') : null;
      if (!emailValue || !emailValue.includes('@')) {
        emailField.focus();
        return;
      }
      if (!endpoint) {
        if (note) note.textContent = 'Email form is not configured yet.';
        track('form_submit_error', {
          form_id: 'signal_signup',
          reason: 'missing_endpoint',
          from_path: window.location.pathname || '/'
        });
        return;
      }
      var signalData = new FormData(signalForm);
      fetch(endpoint, {
        method: signalForm.getAttribute('method') || 'POST',
        headers: { 'Accept': 'application/json' },
        body: signalData
      })
      .then(function (r) {
        if (!r.ok) throw new Error('Signal request failed');
        if (note) note.textContent = 'You are in. Watch for the next drop.';
        track('form_submit', {
          form_id: 'signal_signup',
          method: 'formspree',
          from_path: window.location.pathname || '/'
        });
        signalForm.reset();
      })
      .catch(function () {
        if (note) note.textContent = 'Signup failed. Please try again.';
        track('form_submit_error', {
          form_id: 'signal_signup',
          reason: 'request_failed',
          from_path: window.location.pathname || '/'
        });
      });
    });
  }

})();

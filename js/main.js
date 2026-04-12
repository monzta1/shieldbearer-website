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
    enquiryForm.addEventListener('submit', function () {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: 'form_submit', form_id: 'contact_enquiry' });
    });
    if (window.location.search.includes('sent=true')) {
      enquiryForm.style.display = 'none';
      var msg = document.createElement('p');
      msg.style.cssText = 'color:#fff;font-size:1.1rem;line-height:1.8;padding:1rem 0;';
      msg.innerText = 'Message received. Moncy responds to every serious message directly.';
      enquiryForm.parentNode.insertBefore(msg, enquiryForm);
    }
  }

  /* ── SIGNAL SIGNUP (Formspree) ── */
  var signalForm = document.getElementById('signalForm');
  if (signalForm) {
    signalForm.addEventListener('submit', function () {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: 'form_submit', form_id: 'signal_signup' });
    });
  }

})();

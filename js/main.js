/* =============================================================
   SHIELDBEARER — Main JS
   Handles: nav scroll, mobile menu, active link, meaning cards
   ============================================================= */

(function () {
  'use strict';

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
      if (!isOpen) card.classList.add('open');
    });
  });

  /* ── ENQUIRY FORM (mailto fallback) ── */
  var enquiryForm = document.getElementById('enquiryForm');
  if (enquiryForm) {
    enquiryForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var name    = document.getElementById('fName').value.trim();
      var email   = document.getElementById('fEmail').value.trim();
      var type    = (document.getElementById('fType') || {}).value || 'General';
      var msg     = document.getElementById('fMsg').value.trim();
      var out     = document.getElementById('formMsg');

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

      /* -------------------------------------------------------
         FORMSPREE INTEGRATION
         When you are ready, replace the mailto fallback below
         with a fetch call to your Formspree endpoint:

         fetch('https://formspree.io/f/YOUR_FORM_ID', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
           body: JSON.stringify({ name, email, type, message: msg })
         })
         .then(function(r) {
           if (r.ok) { out.className = 'form-msg ok'; out.textContent = 'Message sent.'; }
           else       { out.className = 'form-msg err'; out.textContent = 'Something went wrong. Email us directly.'; }
         });
         return; // add this return before the mailto fallback

         ------------------------------------------------------- */

      /* Mailto fallback for GitHub Pages (no backend) */
      out.className = 'form-msg ok';
      out.textContent = 'Opening your mail app...';
      var subject = encodeURIComponent('Shieldbearer Enquiry: ' + type);
      var body    = encodeURIComponent('Name: ' + name + '\nEmail: ' + email + '\nType: ' + type + '\n\n' + msg);
      window.location.href = 'mailto:shieldbearerusa@gmail.com?subject=' + subject + '&body=' + body;
    });
  }

})();

/* =============================================================
   SHIELDBEARER: Main JS
   Handles: nav scroll, mobile menu, active link, meaning cards
   ============================================================= */

(function () {
  'use strict';

  function track(eventName, params) {
    if (typeof window.sbTrack === 'function') {
      window.sbTrack(eventName, params || {});
    }
  }

  /* ── TIMELINE NAV LINK ── */
  function addTimelineNavLink() {
    var timelineHref = '/timeline';
    var timelineLabel = 'Release Timeline';

    var desktopNav = document.querySelector('.nav-links');
    if (desktopNav && !desktopNav.querySelector('a[href="' + timelineHref + '"]')) {
      var musicItem = desktopNav.querySelector('li.nav-dropdown > a[href="/music"]');
      var desktopItem = document.createElement('li');
      var desktopLink = document.createElement('a');

      desktopItem.className = 'nav-timeline';
      desktopLink.href = timelineHref;
      desktopLink.textContent = timelineLabel;
      desktopItem.appendChild(desktopLink);

      if (musicItem && musicItem.parentElement && musicItem.parentElement.nextElementSibling) {
        musicItem.parentElement.insertAdjacentElement('afterend', desktopItem);
      } else if (musicItem && musicItem.parentElement) {
        musicItem.parentElement.insertAdjacentElement('afterend', desktopItem);
      } else if (desktopNav.children.length > 1) {
        desktopNav.insertBefore(desktopItem, desktopNav.children[1]);
      } else {
        desktopNav.appendChild(desktopItem);
      }
    }

    var mobileNav = document.getElementById('mobMenu');
    if (mobileNav && !mobileNav.querySelector('a[href="' + timelineHref + '"]')) {
      var mobileMusic = mobileNav.querySelector('a[href="/music"]');
      var mobileLink = document.createElement('a');
      mobileLink.href = timelineHref;
      mobileLink.textContent = timelineLabel;

      if (mobileMusic) {
        mobileMusic.insertAdjacentElement('afterend', mobileLink);
      } else {
        var mobClose = mobileNav.querySelector('.mob-close');
        if (mobClose && mobClose.nextSibling) {
          mobClose.insertAdjacentElement('afterend', mobileLink);
        } else {
          mobileNav.appendChild(mobileLink);
        }
      }
    }
  }

  addTimelineNavLink();

  /* ── SIGNAL ROOM NAV LINK ── */
  function addSignalRoomNavLink() {
    var signalRoomHref = '/signal-room';
    var signalRoomLabel = 'Signal Room';

    var desktopMusic = document.querySelector('li.nav-dropdown > a[href="/music"]');
    if (desktopMusic) {
      var dropdown = desktopMusic.parentElement.querySelector('.nav-dropdown__menu');
      if (dropdown && !dropdown.querySelector('a[href="' + signalRoomHref + '"]')) {
        var signalLink = document.createElement('a');
        signalLink.href = signalRoomHref;
        signalLink.textContent = signalRoomLabel;
        var lyricLink = dropdown.querySelector('a[href="/song-meanings"]');
        if (lyricLink) {
          lyricLink.insertAdjacentElement('afterend', signalLink);
        } else {
          dropdown.appendChild(signalLink);
        }
      }
    }

    var mobileNav = document.getElementById('mobMenu');
    if (mobileNav && !mobileNav.querySelector('a[href="' + signalRoomHref + '"]')) {
      var mobileMusic = mobileNav.querySelector('a[href="/music"]');
      var mobileSignalLink = document.createElement('a');
      mobileSignalLink.href = signalRoomHref;
      mobileSignalLink.textContent = signalRoomLabel;
      if (mobileMusic) {
        mobileMusic.insertAdjacentElement('afterend', mobileSignalLink);
      } else {
        var mobClose = mobileNav.querySelector('.mob-close');
        if (mobClose && mobClose.nextSibling) {
          mobClose.insertAdjacentElement('afterend', mobileSignalLink);
        } else {
          mobileNav.appendChild(mobileSignalLink);
        }
      }
    }
  }

  addSignalRoomNavLink();

  /* ── GOSPEL NAV LINK ── */
  function addGospelNavLink() {
    var gospelHref = '/gospel';
    var gospelLabel = 'The Gospel Does Not Need Permission';

    var desktopWords = document.querySelector('li.nav-dropdown > a[href="/manifesto"]');
    if (desktopWords) {
      var desktopDropdown = desktopWords.parentElement.querySelector('.nav-dropdown__menu');
      if (desktopDropdown && !desktopDropdown.querySelector('a[href="' + gospelHref + '"]')) {
        var gospelLink = document.createElement('a');
        gospelLink.href = gospelHref;
        gospelLink.textContent = gospelLabel;
        var openLetterLink = desktopDropdown.querySelector('a[href="/open-letter"]');
        if (openLetterLink) {
          openLetterLink.insertAdjacentElement('afterend', gospelLink);
        } else {
          desktopDropdown.appendChild(gospelLink);
        }
      }
    }

    var mobileNav = document.getElementById('mobMenu');
    if (mobileNav && !mobileNav.querySelector('a[href="' + gospelHref + '"]')) {
      var mobileAnchor = mobileNav.querySelector('a[href="/open-letter"]');
      var mobileGospelLink = document.createElement('a');
      mobileGospelLink.href = gospelHref;
      mobileGospelLink.textContent = gospelLabel;
      if (mobileAnchor) {
        mobileAnchor.insertAdjacentElement('afterend', mobileGospelLink);
      } else {
        var mobileWordsLink = mobileNav.querySelector('a[href="/manifesto"]');
        if (mobileWordsLink) {
          mobileWordsLink.insertAdjacentElement('afterend', mobileGospelLink);
        } else {
          var mobClose = mobileNav.querySelector('.mob-close');
          if (mobClose && mobClose.nextSibling) {
            mobClose.insertAdjacentElement('afterend', mobileGospelLink);
          } else {
            mobileNav.appendChild(mobileGospelLink);
          }
        }
      }
    }
  }

  addGospelNavLink();

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
  var currentPath = window.location.pathname.replace(/\/$/, '') || '/';
  // Compare nav hrefs to the current path, normalising trailing slash
  // and supporting both clean URLs (/sentinelbot) and the legacy
  // .html form (/sentinelbot.html) so old indexed links still light up.
  document.querySelectorAll('.nav-links a, .mob-menu a').forEach(function (a) {
    var href = (a.getAttribute('href') || '').replace(/\/$/, '');
    if (!href) return;
    if (href === currentPath || href + '.html' === currentPath || href === currentPath + '.html') {
      a.classList.add('active');
    }
    if ((href === '/' || href === '') && (currentPath === '/' || currentPath === '/index')) {
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

/* =============================================================
   Hero ember layer. Homepage only.

   A single canvas of slow-rising embers behind the hero content.
   Pure enhancement: injected by JS (no-JS visitors simply never
   get it), skipped under prefers-reduced-motion and Save-Data,
   paused when the tab is hidden or the hero is scrolled away.
   Transform/alpha compositing only; particles are drawn from one
   pre-rendered radial sprite so per-frame cost stays tiny.
   ============================================================= */
(function () {
  'use strict';

  var hero = document.getElementById('hero');
  if (!hero) return;

  // Respect user and network signals.
  try {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var conn = navigator.connection;
    if (conn && conn.saveData) return;
  } catch (e) { return; }
  if (!window.requestAnimationFrame) return;

  var canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText =
    'position:absolute;inset:0;width:100%;height:100%;' +
    'pointer-events:none;z-index:1;';
  var ctx = canvas.getContext('2d');
  if (!ctx) return;
  hero.appendChild(canvas);

  // One soft radial ember sprite, tinted toward the site red.
  var SPRITE = 32;
  var sprite = document.createElement('canvas');
  sprite.width = SPRITE;
  sprite.height = SPRITE;
  var sctx = sprite.getContext('2d');
  var grad = sctx.createRadialGradient(SPRITE / 2, SPRITE / 2, 0, SPRITE / 2, SPRITE / 2, SPRITE / 2);
  grad.addColorStop(0, 'rgba(255,196,140,1)');
  grad.addColorStop(0.35, 'rgba(231,96,60,.85)');
  grad.addColorStop(1, 'rgba(192,57,43,0)');
  sctx.fillStyle = grad;
  sctx.fillRect(0, 0, SPRITE, SPRITE);

  var DPR_CAP = 2;
  var COUNT = 34;
  var particles = [];
  var w = 0, h = 0, dpr = 1;
  var running = false;
  var rafId = 0;
  var lastT = 0;

  function rand(min, max) { return min + Math.random() * (max - min); }

  function spawn(p, fromBottom) {
    p.x = rand(0, w);
    p.y = fromBottom ? h + rand(6, 40) : rand(0, h);
    p.size = rand(2.2, 7.5);
    p.speed = rand(9, 26);          /* px/s upward */
    p.drift = rand(-7, 7);          /* px/s sideways */
    p.sway = rand(0.4, 1.6);        /* sway frequency */
    p.phase = rand(0, Math.PI * 2);
    p.alpha = rand(0.25, 0.8);
    p.flicker = rand(1.5, 4);
  }

  function resize() {
    var rect = hero.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
    w = Math.max(1, Math.round(rect.width));
    h = Math.max(1, Math.round(rect.height));
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function frame(t) {
    if (!running) return;
    if (!lastT) lastT = t;
    var dt = Math.min(0.05, (t - lastT) / 1000);
    lastT = t;

    ctx.clearRect(0, 0, w, h);
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      p.y -= p.speed * dt;
      p.x += (p.drift + Math.sin(t / 1000 * p.sway + p.phase) * 6) * dt;
      if (p.y < -12 || p.x < -14 || p.x > w + 14) spawn(p, true);
      var tw = 0.7 + 0.3 * Math.sin(t / 1000 * p.flicker + p.phase);
      ctx.globalAlpha = p.alpha * tw;
      ctx.drawImage(sprite, p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
    rafId = window.requestAnimationFrame(frame);
  }

  function start() {
    if (running) return;
    running = true;
    lastT = 0;
    rafId = window.requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    if (rafId) { window.cancelAnimationFrame(rafId); rafId = 0; }
  }

  resize();
  for (var i = 0; i < COUNT; i++) {
    var p = {};
    spawn(p, false);
    particles.push(p);
  }

  window.addEventListener('resize', resize, { passive: true });

  // Pause offscreen and in hidden tabs. Both must be true to run.
  var heroVisible = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      heroVisible = !!(entries[0] && entries[0].isIntersecting);
      sync();
    }, { threshold: 0 }).observe(hero);
  }
  document.addEventListener('visibilitychange', sync);
  function sync() {
    if (document.visibilityState === 'visible' && heroVisible) start();
    else stop();
  }

  start();
})();

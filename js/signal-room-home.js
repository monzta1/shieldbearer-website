/* =============================================================
   Homepage Signal Room block. State-aware.

   The block is always rendered. Its static HTML is the EMPTY
   state (the writing desk between songs), so no-JS clients,
   crawlers, and any site.json failure all show a correct, calm
   default. This script upgrades it to the ACTIVE state only when
   a song is actually in progress.

   State source is the same one /signal-room itself uses:
   site.json -> comingSoon[0] (the publisher pipeline output).
   No separate state file. The countdown reuses the same config
   and localStorage key as js/signal-countdown.js, so the clock
   here matches the clock on /signal-room exactly.
   ============================================================= */
(function () {
  "use strict";

  var block = document.querySelector("[data-signal-room]");
  if (!block) return;

  function q(sel) { return block.querySelector(sel); }

  // Countdown is unconditional. Same target math + storage key as
  // js/signal-countdown.js so the homepage clock matches the
  // /signal-room clock exactly, regardless of whether a song is
  // currently in progress. State-aware activate() below still
  // upgrades the rest of the block when comingSoon is populated.
  (function () {
    var cd = q("[data-sr-countdown]");
    if (!cd) return;
    cd.hidden = false;
    cd.setAttribute("aria-hidden", "false");
    startCountdown(cd);
  })();

  var SITE_JSON = "/site.json";

  fetch(SITE_JSON, { cache: "no-store" })
    .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    .then(function (data) {
      var list = (data && (data.comingSoon || data.incoming)) || [];
      var s = Array.isArray(list) && list.length ? list[0] : null;
      if (!s || !s.title) return; // stay empty (the common, correct case)
      activate(s);
    })
    .catch(function () { /* stay empty silently */ });

  function activate(s) {
    var eyebrow = q("[data-sr-eyebrow]");
    var title = q("[data-sr-title]");
    var copy = q("[data-sr-copy]");
    var art = q("[data-sr-art]");
    var cta = q("[data-sr-cta]");

    if (eyebrow) eyebrow.textContent = "Signal Room · Live";
    if (title) title.textContent = s.title;

    var stage = s.stage || s.currentStage || s.status || "In progress";
    stage = String(stage).replace(/_/g, " ");
    stage = stage.charAt(0).toUpperCase() + stage.slice(1);
    var context = "Lyrics, chords, and art are landing as the song takes shape.";
    if (copy) copy.textContent = stage + ". " + context;

    if (art && s.artwork) {
      art.src = s.artwork;
      art.alt = s.title + " in progress";
    }

    if (cta) {
      cta.textContent = "Watch It Take Shape";
      cta.setAttribute("data-state", "active");
    }
  }

  // Same target math as js/signal-countdown.js: fixed target if
  // configured, else a rolling resetDays window persisted under the
  // shared localStorage key. Reading the same key means this clock
  // and the /signal-room clock show the same time.
  function startCountdown(cd) {
    var cfg = (window.SHIELDBEARER_CONFIG && window.SHIELDBEARER_CONFIG.signalCountdown) || {};
    if (cfg.enabled === false) return;
    var DAY = 24 * 60 * 60 * 1000;
    var resetMs = Math.max(1, Number(cfg.resetDays || 7)) * DAY;
    var storageKey = cfg.storageKey || "shieldbearer_signal_target";

    function fixedTarget() {
      if (!cfg.fixedTarget) return null;
      var t = Date.parse(cfg.fixedTarget);
      return isFinite(t) ? t : null;
    }
    function rollingTarget() {
      var now = Date.now();
      var stored = null;
      try { stored = localStorage.getItem(storageKey); } catch (e) {}
      var parsed = stored ? parseInt(stored, 10) : NaN;
      if (!isFinite(parsed) || parsed <= now) {
        parsed = now + resetMs;
        try { localStorage.setItem(storageKey, String(parsed)); } catch (e) {}
      }
      return parsed;
    }
    function pad(n) { return String(n).padStart(2, "0"); }
    function set(attr, v) {
      var el = cd.querySelector("[data-sr-" + attr + "]");
      if (el) el.textContent = pad(v);
    }
    function tick() {
      var target = fixedTarget() || rollingTarget();
      var diff = Math.max(0, target - Date.now());
      set("d", Math.floor(diff / DAY));
      set("h", Math.floor((diff % DAY) / (60 * 60 * 1000)));
      set("m", Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000)));
      set("s", Math.floor((diff % (60 * 1000)) / 1000));
    }
    tick();
    setInterval(tick, 1000);
  }
})();

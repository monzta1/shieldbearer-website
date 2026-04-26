/* =============================================================
   Signal Room countdown timer.

   Reads window.SHIELDBEARER_CONFIG.signalCountdown for all knobs
   (resetDays, fixedTarget, storageKey, enabled). The clock either
   counts to a fixed date set in config OR rolls forward in
   resetDays-long windows persisted in localStorage. When a rolling
   window expires, the next one starts automatically. No server,
   no maintenance.
   ============================================================= */
(function () {
  var cfg = (window.SHIELDBEARER_CONFIG && window.SHIELDBEARER_CONFIG.signalCountdown) || {};
  if (cfg.enabled === false) return;

  var root = document.getElementById("signal-countdown");
  if (!root) return;

  var DAY_MS = 24 * 60 * 60 * 1000;
  var resetMs = Math.max(1, Number(cfg.resetDays || 7)) * DAY_MS;
  var storageKey = cfg.storageKey || "shieldbearer_signal_target";

  function pad(n) { return String(n).padStart(2, "0"); }

  function readFixedTarget() {
    if (!cfg.fixedTarget) return null;
    var t = Date.parse(cfg.fixedTarget);
    return Number.isFinite(t) ? t : null;
  }

  function readRollingTarget() {
    var now = Date.now();
    var stored = null;
    try { stored = localStorage.getItem(storageKey); } catch (e) { /* private mode */ }
    var parsed = stored ? parseInt(stored, 10) : NaN;
    if (!Number.isFinite(parsed) || parsed <= now) {
      parsed = now + resetMs;
      try { localStorage.setItem(storageKey, String(parsed)); } catch (e) { /* ignore */ }
    }
    return parsed;
  }

  function getTarget() {
    return readFixedTarget() || readRollingTarget();
  }

  function setText(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function tick() {
    var target = getTarget();
    var diff = target - Date.now();
    if (diff <= 0) {
      // Fixed-target finished, or rolling target just expired.
      // readRollingTarget() will mint a new one on the next call.
      diff = 0;
    }
    var days  = Math.floor(diff / DAY_MS);
    var hours = Math.floor((diff % DAY_MS) / (60 * 60 * 1000));
    var mins  = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
    var secs  = Math.floor((diff % (60 * 1000)) / 1000);
    setText("cd-days", pad(days));
    setText("cd-hours", pad(hours));
    setText("cd-mins", pad(mins));
    setText("cd-secs", pad(secs));
  }

  tick();
  setInterval(tick, 1000);
})();

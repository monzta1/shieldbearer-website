/* =============================================================
   Home social proof: YouTube subscriber count.

   Reads /youtube_stats.json (refreshed by the "auto: youtube stats
   refresh" job) and fills [data-yt-subs]. The proof item stays
   hidden when the file is missing, malformed, or the channel hides
   its count, so no number ever shows unless it came from the data.
   ============================================================= */
(function () {
  'use strict';

  var item = document.querySelector('[data-yt-stat]');
  var slot = document.querySelector('[data-yt-subs]');
  if (!item || !slot || !window.fetch) return;

  function compact(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return String(n);
  }

  fetch('/youtube_stats.json', { cache: 'no-cache' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (data) {
      var ch = data && data.channel;
      if (!ch || ch.subscribers_hidden) return;
      var subs = Number(ch.subscribers);
      if (!isFinite(subs) || subs <= 0) return;
      slot.textContent = compact(subs);
      item.hidden = false;
    })
    .catch(function () { /* leave hidden */ });
})();

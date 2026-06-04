/* =============================================================
   Footer Signal Room callout, state gate.

   The next-step footer ships with the Signal Room link hidden.
   This unhides it only when a song is actually in progress, read
   from the same source /signal-room and the homepage block use:
   site.json -> comingSoon[0]. Empty state leaves the link hidden
   and the other next-step links untouched.
   ============================================================= */
(function () {
  "use strict";
  var els = document.querySelectorAll("[data-sr-callout]");
  if (!els.length) return;
  fetch("/site.json", { cache: "no-store" })
    .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    .then(function (d) {
      var list = (d && (d.comingSoon || d.incoming)) || [];
      if (Array.isArray(list) && list.length && list[0] && list[0].title) {
        for (var i = 0; i < els.length; i++) { els[i].hidden = false; }
        // Unhidden callout nodes that carry .sb-reveal need the scroll
        // observer to re-evaluate them now that they have a layout box.
        if (typeof window.sbRevealRefresh === "function") {
          window.sbRevealRefresh();
        }
      }
    })
    .catch(function () { /* stay hidden silently */ });
})();

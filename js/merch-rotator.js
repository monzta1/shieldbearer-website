(function () {
  // Config lives in js/config.js (window.SHIELDBEARER_CONFIG.merch).
  var cfg = window.SHIELDBEARER_CONFIG && window.SHIELDBEARER_CONFIG.merch;
  if (!cfg || !cfg.rotate) return;

  var artEl = document.querySelector("a.featured-merch-art");
  var imgEl = document.querySelector(".featured-merch-art img");
  var titleEl = document.getElementById("featured-merch-heading");
  var linkEl = document.querySelector(".featured-merch-copy .btn");
  if (!imgEl || !titleEl || !linkEl) return;

  fetch(cfg.source, { cache: "no-store" })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (data) {
      var products = (data && data.products) || [];
      if (!products.length) return;
      var pick = products[Math.floor(Math.random() * products.length)];
      if (!pick || !pick.image) return;
      imgEl.src = pick.image;
      imgEl.alt = pick.title || (cfg.fallback && cfg.fallback.alt) || "Shieldbearer merch";
      titleEl.textContent = pick.title || titleEl.textContent;
      if (pick.url) {
        linkEl.href = pick.url;
        if (artEl) artEl.href = pick.url;
      }
    })
    .catch(function () { /* keep static fallback */ });
})();

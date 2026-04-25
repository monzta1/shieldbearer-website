(function () {
  var cfg = window.MERCH_CONFIG;
  if (!cfg || !cfg.rotate) return;

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
      if (pick.url) linkEl.href = pick.url;
    })
    .catch(function () { /* keep static fallback */ });
})();

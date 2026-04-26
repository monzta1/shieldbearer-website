(function () {
  // Config lives in js/config.js (window.SHIELDBEARER_CONFIG.merch).
  var cfg = window.SHIELDBEARER_CONFIG && window.SHIELDBEARER_CONFIG.merch;
  if (!cfg || !cfg.rotate) return;

  var artEl = document.querySelector("a.featured-merch-art");
  var imgEl = document.querySelector(".featured-merch-art img");
  var titleEl = document.getElementById("featured-merch-heading");
  var descEl = document.querySelector(".featured-merch-copy p");
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
      // Swap the description so the static "Clean black tee..." copy
      // doesn't run on every product. Falls back to a generic line if
      // the baker didn't capture a description for this product.
      if (descEl) {
        descEl.textContent = pick.description ||
          "Apparel and gear built around conviction. Wear the mission and carry it into your city.";
      }
      // Image links to the specific product (high-intent "I want that").
      // The "Wear the Banner" button stays pointed at the shop home so
      // users can also browse the full catalog (set in the static markup).
      if (pick.url && artEl) artEl.href = pick.url;
    })
    .catch(function () { /* keep static fallback */ });
})();

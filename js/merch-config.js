// Featured-merch rotator config.
// Toggle `rotate` to false to instantly fall back to the static image
// (no redeploy of merch.json needed). Other fields control the fallback
// shown when rotation is off OR when data/merch.json fails to load.
window.MERCH_CONFIG = {
  rotate: true,
  source: "data/merch.json",
  fallback: {
    title: "Shieldbearer Logo Tee",
    image: "images/logo-tee.webp",
    url: "https://shop.shieldbearerusa.com",
    alt: "Shieldbearer logo t-shirt"
  }
};

/* =============================================================
   Homepage featured-release renderer.

   Reads window.SHIELDBEARER_CONFIG.featuredRelease.source (site.json
   by default) and fills the #featured-release card from
   homepage.featuredRelease. If the JSON is missing or the field is
   null, the static markup ships in index.html stays in place.
   ============================================================= */
(function () {
  var cfg = (window.SHIELDBEARER_CONFIG && window.SHIELDBEARER_CONFIG.featuredRelease) || {};
  var source = cfg.source || "./site.json";

  var root = document.getElementById("featured-release");
  if (!root) return;

  fetch(source, { cache: "no-store" })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (data) {
      var fr = data && data.homepage && data.homepage.featuredRelease;
      if (!fr || !fr.videoId || !fr.title) return;

      var img = root.querySelector(".featured-track__artwork img");
      var artworkFigure = root.querySelector(".featured-track__artwork");
      var titleEl = root.querySelector("#release-heading");
      var iframe = root.querySelector(".featured-track__player");
      var watchLink = root.querySelector(".featured-track__actions .btn--red");
      var meaningLink = root.querySelector(".featured-track__actions .btn--ghost");
      var notesTitle = root.querySelector(".featured-track__lyrics-title");
      var notesScroll = root.querySelector(".featured-track__lyrics-scroll");
      var notesPanel = root.querySelector(".featured-track__lyrics");
      var descEl = root.querySelector(".featured-track__desc");

      var slug = String(fr.title).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      var videoId = encodeURIComponent(fr.videoId);
      var watchUrl = fr.sourceUrl || ("https://www.youtube.com/watch?v=" + videoId);
      var embedUrl = "https://www.youtube.com/embed/" + videoId;
      var artworkUrl = fr.artwork || ("https://img.youtube.com/vi/" + videoId + "/hqdefault.jpg");

      if (img) {
        img.src = artworkUrl;
        img.alt = fr.title + " artwork";
      }
      if (artworkFigure) artworkFigure.setAttribute("aria-label", fr.title + " artwork thumbnail");
      if (titleEl) titleEl.textContent = fr.title;
      if (iframe) {
        iframe.src = embedUrl;
        iframe.title = "YouTube player for " + fr.title;
      }
      if (watchLink) watchLink.href = watchUrl;
      if (meaningLink) meaningLink.href = "/song-meanings#" + slug;
      if (notesTitle) notesTitle.textContent = fr.title + " Notes";
      if (notesPanel) notesPanel.setAttribute("aria-label", fr.title + " notes panel");

      var paragraphs = [];
      if (fr.songMeaning) {
        paragraphs = String(fr.songMeaning).split(/\n\s*\n/).map(function (s) { return s.trim(); }).filter(Boolean);
      }

      if (descEl && paragraphs.length) {
        descEl.textContent = paragraphs[0];
      }

      if (notesScroll && paragraphs.length) {
        notesScroll.innerHTML = "";
        for (var i = 0; i < paragraphs.length; i++) {
          var p = document.createElement("p");
          p.textContent = paragraphs[i];
          notesScroll.appendChild(p);
        }
      }
    })
    .catch(function () { /* static fallback in markup wins */ });
})();

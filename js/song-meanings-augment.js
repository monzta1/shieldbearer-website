/* =============================================================
   Song-meanings augmenter.

   Reads released[] from site.json and appends any entries that
   aren't already in the static SONG_DOSSIERS list. Existing curated
   dossiers (Sentinels, Galilean, etc.) win over any auto-generated
   versions with the same slug.

   The shape required by the dossier renderer:
     id, number, title, genre, reference, thesis, tags[], artwork,
     meaning[], scripture{ref, quote}, lyrics, actions{youtube, armory}
   We fill what we can from the released song record. Fields the
   release-detector cannot derive (scripture, tags, thesis, genre)
   default to safe placeholders so the renderer doesn't crash.
   ============================================================= */
(function () {
  if (typeof window.appendSongDossiers !== "function") return;

  var source = (window.SHIELDBEARER_CONFIG && window.SHIELDBEARER_CONFIG.featuredRelease && window.SHIELDBEARER_CONFIG.featuredRelease.source) || "./site.json";

  function slugify(text) {
    return String(text || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  function paragraphsFrom(text) {
    if (!text) return [];
    return String(text).split(/\n\s*\n/).map(function (s) { return s.trim(); }).filter(Boolean);
  }

  function buildDossierFromRelease(rel) {
    if (!rel || !rel.title) return null;
    var id = slugify(rel.title);
    if (!id) return null;
    var meaning = paragraphsFrom(rel.songMeaning);
    var thesis = meaning[0] || "";
    var lyrics = String(rel.lyrics || "").trim();
    if (!lyrics && !meaning.length) return null;
    var videoId = rel.videoId || rel.songId || "";
    var artwork = rel.artwork || (videoId ? "https://img.youtube.com/vi/" + encodeURIComponent(videoId) + "/hqdefault.jpg" : "");
    var youtubeUrl = rel.sourceUrl || (videoId ? "https://www.youtube.com/watch?v=" + encodeURIComponent(videoId) : "");

    return {
      id: id,
      number: "—",
      title: rel.title,
      genre: "Metal",
      reference: "",
      thesis: thesis,
      tags: [],
      artwork: artwork,
      meaning: meaning.length ? meaning : [thesis].filter(Boolean),
      scripture: { ref: "", quote: "" },
      lyrics: lyrics,
      actions: {
        youtube: youtubeUrl,
        armory: "videos.html"
      }
    };
  }

  fetch(source, { cache: "no-store" })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (data) {
      var released = (data && Array.isArray(data.released)) ? data.released : [];
      if (!released.length) return;
      var extras = [];
      for (var i = 0; i < released.length; i++) {
        var entry = buildDossierFromRelease(released[i]);
        if (entry) extras.push(entry);
      }
      if (extras.length) window.appendSongDossiers(extras);
    })
    .catch(function () { /* dossier list ships static; augmentation is best-effort */ });
})();

/* =============================================================
   /reach renderer.

   Fetches /reach.json (static, committed by the stats-parser
   Lambda) and paints: hero counter, continental sector map,
   country list with flags, growth curve SVG, milestone badges,
   and the 10k celebration banner when total >= 10000.

   All client-side. No Lambda call per pageview.
   ============================================================= */
(function () {
  var SRC = "/reach.json";
  var SPOTIFY_SRC = "/spotify_songs.json";
  var SPOTIFY_28D_SRC = "/spotify_songs_28d.json";
  var YOUTUBE_SRC = "/youtube_stats.json";

  // Song title -> cover artwork. Sourced from /images and from
  // song-meanings.html. YouTube thumbnails are used where local
  // art does not exist yet. Keys are lowercased; lookup is
  // case-insensitive. Unknown titles fall back to the site logo.
  var SONG_ART = {
    "silent as night": "https://img.youtube.com/vi/Y7a0R2FGDeo/hqdefault.jpg",
    "quake": "/images/quake-art.png",
    "1000 suns": "https://img.youtube.com/vi/DsGhOgXLGXI/hqdefault.jpg",
    "unaliving the giant": "/images/unaliving-the-giant-art.jpg",
    "sentinels": "https://img.youtube.com/vi/0jPL3Mg88ZQ/hqdefault.jpg",
    "the architect": "/images/the-architect-art.png",
    "ruach": "/images/ruach-art.png",
    "tidings of comfort and joy": "/images/tidings-of-comfort-and-joy-art.png",
    "galilean": "/images/galilean-art.png",
    "the man": "/images/the-man-art.png",
    "over the skies of hell": "/images/over-the-skies-of-hell-art.jpg",
    "celestial shield": "/images/celestial-shield-art.jpg",
    "lanterns": "/images/lanterns-art.jpg",
    "a wretch like me": "/images/wretch-like-me-art.png",
    "wretch like me": "/images/wretch-like-me-art.png",
    "let my people go": "/images/signal-room/let-my-people-go.jpg"
  };
  function artForTitle(title) {
    if (!title) return "/images/logo.png";
    var key = String(title).trim().toLowerCase();
    return SONG_ART[key] || "/images/logo.png";
  }

  // Continent grouping for the "Reached Nations" list -- could be used
  // for grouping headers later. Not used currently.
  var CONTINENT_BY_CODE = {
    US: "North America", CA: "North America", MX: "North America",
    BR: "South America", AR: "South America", CL: "South America", CO: "South America",
    GB: "Europe", DE: "Europe", FR: "Europe", NL: "Europe", BE: "Europe",
    SE: "Europe", CH: "Europe", ES: "Europe", IT: "Europe", AT: "Europe",
    PL: "Europe", NO: "Europe", DK: "Europe", FI: "Europe", IE: "Europe",
    PT: "Europe", GR: "Europe", CZ: "Europe", HU: "Europe", RO: "Europe",
    RU: "Europe", UA: "Europe",
    IN: "Asia", SG: "Asia", AE: "Asia", JP: "Asia", KR: "Asia",
    TR: "Asia", IL: "Asia", CN: "Asia", HK: "Asia", TW: "Asia",
    PH: "Asia", ID: "Asia", MY: "Asia", TH: "Asia", VN: "Asia",
    SA: "Asia",
    ZA: "Africa", EG: "Africa", NG: "Africa", KE: "Africa",
    AU: "Oceania", NZ: "Oceania"
  };

  var MILESTONES = [
    { value: 1000, label: "1K" },
    { value: 5000, label: "5K" },
    { value: 10000, label: "10K" },
    { value: 25000, label: "25K" },
    { value: 50000, label: "50K" },
    { value: 100000, label: "100K" }
  ];

  function $(id) { return document.getElementById(id); }
  function fmt(n) { return Number(n || 0).toLocaleString(); }
  function shortTs(iso) {
    if (!iso) return "";
    var d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    var raw = d.toUTCString().replace("GMT", "UTC");
    // raw is "Sun, 24 May 2026 17:39:42 UTC"
    // emit "Sun, 24 May 2026 · 17:39 UTC"  (middle dot, no seconds)
    return raw.replace(/^(.*?)\s(\d{2}:\d{2}):\d{2}\s(.*)$/, "$1 · $2 $3");
  }
  function prefersReducedMotion() {
    try { return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches; }
    catch (e) { return false; }
  }

  function setStatus(data) {
    var el = $("reachStatus");
    if (!el) return;
    var nations = (data && data.countries && data.countries.length) || 0;
    var sync = shortTs(data && data.generated_at) || "pending";
    el.innerHTML =
      "Watchman&rsquo;s report. Signal confirmed in <b>" + nations + "</b> nations. " +
      "DistroKid stream data, last refreshed " + sync + ".";
  }

  function animateValueTo(el, targetN) {
    if (!el) return;
    if (prefersReducedMotion()) {
      el.textContent = fmt(targetN);
      return;
    }
    var startN = 0;
    var dur = 1400;
    var t0 = performance.now();
    function step(now) {
      var p = Math.min(1, (now - t0) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      var cur = Math.floor(startN + (targetN - startN) * eased);
      el.textContent = fmt(cur);
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = fmt(targetN);
    }
    requestAnimationFrame(step);
  }

  function animateCounter(targetN) {
    // Streams page hero (#reachCount + legacy inline mirror).
    var el = $("reachCount");
    var inline = $("reachTotalInline");
    if (!el && !inline) return;
    if (prefersReducedMotion()) {
      if (el) el.textContent = fmt(targetN);
      if (inline) inline.textContent = fmt(targetN);
      return;
    }
    var startN = 0;
    var dur = 1400;
    var t0 = performance.now();
    function step(now) {
      var p = Math.min(1, (now - t0) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      var cur = Math.floor(startN + (targetN - startN) * eased);
      if (el) el.textContent = fmt(cur);
      if (inline) inline.textContent = fmt(cur);
      if (p < 1) requestAnimationFrame(step);
      else {
        if (el) el.textContent = fmt(targetN);
        if (inline) inline.textContent = fmt(targetN);
      }
    }
    requestAnimationFrame(step);
  }

  function renderHero(data) {
    if ($("reachNations")) $("reachNations").textContent = (data.countries || []).length;
    if ($("reachLast90")) $("reachLast90").textContent = data.last_90 ? fmt(data.last_90) : "--";
    if ($("reachLast30")) $("reachLast30").textContent = data.last_30 ? fmt(data.last_30) : "--";
    if ($("reachLast7"))  $("reachLast7").textContent  = data.last_7  ? fmt(data.last_7)  : "--";
    animateCounter(Number(data.total_streams || 0));
  }

  // Three derived insights below the hero stat grid:
  //   1. Pace this week vs the prior-83-day baseline (last_90 - last_7
  //      divided by 83). Shows whether the signal is accelerating.
  //   2. Continental coverage: how many of the six populated continents
  //      have been reached (Antarctica excluded since nobody lives there).
  //   3. Continuous transmission: total streams x ~4 min per track,
  //      expressed as days. Translates the abstract count into something
  //      visceral.
  function renderInsights(data) {
    // Recent surge: what fraction of all-time streams arrived in the
    // last 30 days. For Shieldbearer this is currently around 63% --
    // the single most striking growth signal on the page. Headline it.
    var surgeEl = $("reachSurgePct");
    var surgeNote = $("reachSurgeNote");
    if (surgeEl) {
      var totalSurge = Number(data.total_streams || 0);
      var l30Surge = Number(data.last_30 || 0);
      if (totalSurge > 0 && l30Surge > 0) {
        var surgePct = Math.round((l30Surge / totalSurge) * 100);
        surgeEl.textContent = surgePct + "%";
        if (surgeNote) {
          surgeNote.textContent = "of all-time streams in the last 30 days (" + fmt(l30Surge) + " of " + fmt(totalSurge) + ")";
        }
      } else {
        surgeEl.textContent = "--";
        if (surgeNote) surgeNote.textContent = "of all-time streams in the last 30 days";
      }
    }

    var vEl = $("reachVelocity");
    var vNote = $("reachVelocityNote");
    if (vEl && vNote) {
      var l7 = Number(data.last_7 || 0);
      var l90 = Number(data.last_90 || 0);
      var priorStreams = l90 - l7;
      if (l7 > 0 && priorStreams > 0) {
        var perDay7 = l7 / 7;
        var perDayPrior = priorStreams / 83;
        var pct = Math.round((perDay7 / perDayPrior - 1) * 100);
        var sign = pct >= 0 ? "+" : "";
        vEl.textContent = sign + pct + "%";
        vNote.textContent = Math.round(perDay7) + "/day vs " + Math.round(perDayPrior) + "/day before";
      } else {
        vEl.textContent = "--";
        vNote.textContent = "Insufficient signal";
      }
    }

    var cEl = $("reachContinents");
    if (cEl) {
      var seen = {};
      (data.countries || []).forEach(function (c) {
        var cont = CONTINENT_BY_CODE[c.code];
        if (cont) seen[cont] = true;
      });
      cEl.textContent = Object.keys(seen).length + " of 6";
    }

    var pEl = $("reachPlayback");
    if (pEl) {
      var total = Number(data.total_streams || 0);
      var TRACK_MINUTES = 4;
      var minutes = total * TRACK_MINUTES;
      var days = minutes / 60 / 24;
      if (days >= 1) {
        pEl.textContent = "~" + Math.round(days) + " days";
      } else {
        var hours = minutes / 60;
        pEl.textContent = "~" + Math.round(hours) + " hours";
      }
    }
  }

  // YouTube section. Pulls /youtube_stats.json (separate store, separate
  // source). YouTube numbers never blend with DistroKid reach totals or
  // Spotify song counts. The same renderer is used on the /reach/youtube
  // subpage (dedicated YouTube report) and on any combined page that
  // hosts an embeddable #youtubeSection block. DOM guards keep elements
  // that do not exist on a given page from being touched.
  function renderYouTube(yt) {
    var hostsAny = $("ytViewsLifetime") || $("youtubeSection") || $("ytStatus");
    if (!hostsAny) return;
    if (!yt || !yt.channel || typeof yt.channel.views_lifetime !== "number") return;

    var section = $("youtubeSection");
    if (section) {
      section.removeAttribute("hidden");
      section.style.display = "";
    }

    var ch = yt.channel || {};
    var watch = yt.watch_time || { last_7: {}, last_30: {} };
    var c48 = yt.last_48h_countries || [];
    var c30 = yt.last_30d_countries || [];
    var topVids = yt.top_videos || [];

    // Watchman status line for the YouTube subpage hero.
    var ytStatus = $("ytStatus");
    if (ytStatus) {
      ytStatus.innerHTML =
        "Watchman&rsquo;s report. YouTube channel signal confirmed. " +
        "View data, last refreshed " + (shortTs(yt.generated_at) || "pending") + ".";
    }

    var intro = $("youtubeIntro");
    if (intro) {
      intro.innerHTML =
        "Independent measurement of the Shieldbearer YouTube channel. " +
        "<b>" + fmt(ch.views_lifetime) + "</b> lifetime views across " +
        "<b>" + fmt(ch.video_count) + "</b> uploads. " +
        "YouTube numbers are a separate source from the DistroKid totals above.";
    }

    var chLead = $("ytChannelLead");
    if (chLead) {
      chLead.innerHTML =
        "<b>" + fmt(ch.views_lifetime) + "</b> lifetime views, " +
        "<b>" + (ch.subscribers_hidden ? "private" : fmt(ch.subscribers)) + "</b> subscribers, " +
        "<b>" + fmt(ch.video_count) + "</b> videos published. Numbers come straight from YouTube&rsquo;s API.";
    }

    var link = $("youtubeChannelLink");
    if (link && ch.url) link.setAttribute("href", ch.url);
    var t = $("youtubeChannelTitle"); if (t) t.textContent = ch.title || "Shieldbearer";
    var h = $("youtubeChannelHandle"); if (h) h.textContent = ch.handle || "";

    var v = $("ytViewsLifetime");
    if (v) {
      // On the YouTube subpage #ytViewsLifetime is the giant hero
      // counter, so animate it. On the combined page it is just a
      // small stat cell; either way textContent ends at the same place.
      if (v.closest && v.closest(".reach-hero")) {
        animateValueTo(v, Number(ch.views_lifetime || 0));
      } else {
        v.textContent = fmt(ch.views_lifetime);
      }
    }
    var s = $("ytSubscribers");
    if (s) s.textContent = ch.subscribers_hidden ? "Private" : fmt(ch.subscribers);
    var vc = $("ytVideoCount"); if (vc) vc.textContent = fmt(ch.video_count);

    var l7 = watch.last_7 || {};
    var l30 = watch.last_30 || {};
    if ($("ytLast7Views")) $("ytLast7Views").textContent = fmt(l7.views);
    if ($("ytLast7Minutes")) $("ytLast7Minutes").textContent = fmt(l7.watchMinutes) + " watch minutes";
    if ($("ytLast30Views")) $("ytLast30Views").textContent = fmt(l30.views);
    if ($("ytLast30Minutes")) $("ytLast30Minutes").textContent = fmt(l30.watchMinutes) + " watch minutes";

    // Hero secondary stats unique to the YouTube subpage:
    // top single-video lifetime view count and avg view duration.
    var topVideoEl = $("ytTopVideoLifetime");
    if (topVideoEl) {
      var topViews = (topVids && topVids[0] && Number(topVids[0].views)) || 0;
      topVideoEl.textContent = topViews ? fmt(topViews) : "--";
    }
    var avgSecEl = $("ytAvgViewSec30");
    if (avgSecEl) {
      var avgSec = Number(l30.avgViewDurationSec) || 0;
      if (avgSec >= 60) {
        var mins = Math.floor(avgSec / 60);
        var secs = Math.round(avgSec - mins * 60);
        avgSecEl.textContent = mins + "m " + (secs < 10 ? "0" : "") + secs + "s";
      } else {
        avgSecEl.textContent = Math.round(avgSec) + "s";
      }
    }

    // 48h country block was removed from the page (data still in JSON for
    // anyone querying directly). Only the 30d block renders.
    renderCountryList("ytCountries30", c30, null);

    // Top videos section: only un-hide if we have videos AND the page
    // has the dedicated YouTube-subpage section wrapper.
    var topVideosSection = $("ytTopVideosSection");
    if (topVideosSection) {
      if (topVids.length) topVideosSection.removeAttribute("hidden");
      else topVideosSection.setAttribute("hidden", "");
    }
    renderTopVideos(topVids);

    // ---- v2.24.2 additions: real growth curve + 30d surge + traffic sources
    renderYouTubeGrowthCurve(yt.daily_views || []);
    renderYouTubeSurge(yt.top_videos_30d || []);
    renderYouTubeTrafficSources(yt.traffic_sources_30d || []);

    // YouTube subpage methodology footer.
    var ytMeta = $("ytMeta");
    if (ytMeta) {
      ytMeta.textContent =
        "How the YouTube signal is counted. The numbers come from the YouTube Data API. " +
        "Views include all formats (Shorts and long-form). A view is counted by YouTube's own rules. " +
        "We don't inflate them, and we don't pad them.";
    }
  }

  function renderCountryList(listId, countries, emptyId) {
    var ul = $(listId);
    var emptyEl = emptyId ? $(emptyId) : null;
    if (!ul) return;
    if (!countries.length) {
      ul.innerHTML = "";
      if (emptyEl) emptyEl.removeAttribute("hidden");
      return;
    }
    if (emptyEl) emptyEl.setAttribute("hidden", "");
    var max = countries.reduce(function (m, c) { return Math.max(m, Number(c.views) || 0); }, 1);
    ul.innerHTML = countries.map(function (c) {
      var pct = Math.max(2, Math.round(((Number(c.views) || 0) / max) * 100));
      return '<li>' +
        '<span class="reach-list__flag">' + (c.flag || "") + '</span>' +
        '<span class="reach-list__name">' + escapeHtml(c.name || c.code || "?") + '</span>' +
        '<span class="reach-list__streams">' + fmt(c.views) + '</span>' +
        '<span class="reach-list__bar"><span style="width:' + pct + '%"></span></span>' +
      '</li>';
    }).join("");
  }

  function renderTopVideos(videos) {
    var ul = $("ytTopVideos");
    if (!ul) return;
    if (!videos.length) {
      ul.innerHTML = "";
      return;
    }
    ul.innerHTML = videos.map(function (v) {
      var thumb = v.thumbnail || "/images/logo.png";
      var url = v.url || ("https://www.youtube.com/watch?v=" + encodeURIComponent(v.videoId || ""));
      return '<li>' +
        '<span class="reach-list__art"><img src="' + thumb + '" alt="" onerror="this.src=\'/images/logo.png\'" loading="lazy" /></span>' +
        '<span class="reach-list__name"><a href="' + url + '" target="_blank" rel="noopener">' + escapeHtml(v.title || "Untitled") + '</a></span>' +
        '<span class="reach-list__streams">' + fmt(v.views) + '</span>' +
        '<span class="reach-list__bar"><span style="width:' + Math.max(2, Math.round((v.views / videos[0].views) * 100)) + '%"></span></span>' +
      '</li>';
    }).join("");
  }

  // YouTube growth curve. Draws the daily_views series as an
  // area+line chart in the SVG element with id="ytGrowthCurve",
  // mirroring renderCurve's approach on the streams page so the
  // two charts feel like the same instrument. Hides the chart
  // and shows the empty-state line if there are fewer than two
  // distinct daily values.
  // Growth curve plots CUMULATIVE views across the 90-day window, not
  // raw daily values. Raw daily on a linear axis got pinned by spike
  // days (one 468-view day next to 10-view days flattened the rest
  // visually). Cumulative is monotonically non-decreasing, so spikes
  // become visible step-ups and the overall direction tells the
  // growth story honestly.
  function renderYouTubeGrowthCurve(dailyViews) {
    var svg = $("ytGrowthCurve");
    var emptyEl = $("ytGrowthCurveEmpty");
    var section = $("ytGrowthCurveSection");
    if (!svg && !section) return;

    var raw = (dailyViews || []).map(function (p) {
      var t = Date.parse(p.date);
      return Number.isFinite(t) ? { t: t, v: Number(p.views) || 0, date: p.date } : null;
    }).filter(Boolean);

    if (raw.length < 2) {
      if (svg) svg.style.display = "none";
      if (emptyEl) emptyEl.removeAttribute("hidden");
      if (section) section.removeAttribute("hidden");
      return;
    }
    if (section) section.removeAttribute("hidden");
    if (emptyEl) emptyEl.setAttribute("hidden", "");
    if (svg) svg.style.display = "";

    raw.sort(function (a, b) { return a.t - b.t; });

    // Summary stats for the cells above the chart.
    var total = 0, bestDayViews = 0, bestDayLabel = "", goodDays = 0;
    for (var i = 0; i < raw.length; i++) {
      total += raw[i].v;
      if (raw[i].v > bestDayViews) {
        bestDayViews = raw[i].v;
        bestDayLabel = raw[i].date;
      }
      if (raw[i].v > 30) goodDays++;
    }
    var totalEl = $("ytGrowthTotal");
    if (totalEl) totalEl.textContent = fmt(total);
    var bestEl = $("ytGrowthBestDay");
    if (bestEl) bestEl.textContent = fmt(bestDayViews);
    var bestDateEl = $("ytGrowthBestDate");
    if (bestDateEl) bestDateEl.textContent = bestDayLabel || "";
    var goodEl = $("ytGrowthGoodDays");
    if (goodEl) goodEl.textContent = fmt(goodDays);

    // Build cumulative series for the path.
    var cum = [];
    var running = 0;
    for (var j = 0; j < raw.length; j++) {
      running += raw[j].v;
      cum.push([raw[j].t, running]);
    }

    var minX = cum[0][0], maxX = cum[cum.length - 1][0];
    var maxY = cum[cum.length - 1][1] || 1;
    var w = 800, h = 220, padL = 12, padR = 12, padT = 18, padB = 18;
    function sx(x) {
      if (maxX === minX) return padL;
      return padL + ((x - minX) / (maxX - minX)) * (w - padL - padR);
    }
    function sy(y) {
      return h - padB - (y / maxY) * (h - padT - padB);
    }
    var path = "M " + sx(cum[0][0]) + " " + sy(cum[0][1]);
    for (var k = 1; k < cum.length; k++) path += " L " + sx(cum[k][0]) + " " + sy(cum[k][1]);
    var areaPath = path + " L " + sx(cum[cum.length - 1][0]) + " " + (h - padB) + " L " + sx(cum[0][0]) + " " + (h - padB) + " Z";
    if (svg) {
      svg.innerHTML = ''
        + '<defs>'
        + '<linearGradient id="ytGrowthGrad" x1="0" y1="0" x2="0" y2="1">'
        + '<stop offset="0%" stop-color="#e74c3c" stop-opacity="0.55" />'
        + '<stop offset="100%" stop-color="#e74c3c" stop-opacity="0.0" />'
        + '</linearGradient>'
        + '</defs>'
        + '<path d="' + areaPath + '" fill="url(#ytGrowthGrad)" />'
        + '<path d="' + path + '" fill="none" stroke="#e74c3c" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />';
    }
  }

  // Surging now: top videos by views over the trailing 30 days.
  // Different list from the lifetime top videos (which is dominated
  // by older releases). Reuses .reach-list--videos styling.
  function renderYouTubeSurge(videos) {
    var ul = $("ytTopVideos30d");
    var section = $("ytSurgeSection");
    if (!ul && !section) return;
    if (!videos.length) {
      if (section) section.setAttribute("hidden", "");
      if (ul) ul.innerHTML = "";
      return;
    }
    if (section) section.removeAttribute("hidden");
    var max = videos[0].views || 1;
    ul.innerHTML = videos.map(function (v) {
      var pct = Math.max(2, Math.round(((Number(v.views) || 0) / max) * 100));
      var thumb = v.thumbnail || "/images/logo.png";
      var url = v.url || ("https://www.youtube.com/watch?v=" + encodeURIComponent(v.videoId || ""));
      return '<li>' +
        '<span class="reach-list__art"><img src="' + thumb + '" alt="" onerror="this.src=\'/images/logo.png\'" loading="lazy" /></span>' +
        '<span class="reach-list__name"><a href="' + url + '" target="_blank" rel="noopener">' + escapeHtml(v.title || "Untitled") + '</a></span>' +
        '<span class="reach-list__streams">' + fmt(v.views) + '</span>' +
        '<span class="reach-list__bar"><span style="width:' + pct + '%"></span></span>' +
      '</li>';
    }).join("");
  }

  // Discovery channels: where viewers came from. The API returns
  // a machine code per row (YT_SEARCH, SUGGESTED_VIDEO, etc.) and
  // the publisher Lambda already pre-attaches a human label, so
  // the frontend just renders label + views + bar.
  function renderYouTubeTrafficSources(sources) {
    var ul = $("ytTrafficSources");
    var section = $("ytDiscoverySection");
    if (!ul && !section) return;
    if (!sources.length) {
      if (section) section.setAttribute("hidden", "");
      if (ul) ul.innerHTML = "";
      return;
    }
    if (section) section.removeAttribute("hidden");
    var max = sources[0].views || 1;
    ul.innerHTML = sources.map(function (s) {
      var pct = Math.max(2, Math.round(((Number(s.views) || 0) / max) * 100));
      return '<li>' +
        '<span class="reach-list__name">' + escapeHtml(s.label || s.source || "?") + '</span>' +
        '<span class="reach-list__streams">' + fmt(s.views) + '</span>' +
        '<span class="reach-list__bar"><span style="width:' + pct + '%"></span></span>' +
      '</li>';
    }).join("");
  }

  // Overview page (/reach): two source panels side-by-side. Each
  // panel shows its own number with its own unit. We never sum
  // streams and YouTube views into a shared total.
  function renderOverview(reach, yt) {
    var sEl = $("overviewStreams");
    var vEl = $("overviewViews");
    if (!sEl && !vEl) return; // not on the overview page

    if (sEl) {
      var streams = Number((reach && reach.total_streams) || 0);
      animateValueTo(sEl, streams);
    }
    var nEl = $("overviewNations");
    if (nEl) {
      var nations = (reach && reach.countries && reach.countries.length) || 0;
      nEl.textContent = nations || "--";
    }

    if (vEl) {
      var views = Number((yt && yt.channel && yt.channel.views_lifetime) || 0);
      animateValueTo(vEl, views);
    }
    var subEl = $("overviewSubs");
    if (subEl) {
      var subs = yt && yt.channel ? yt.channel.subscribers : null;
      var hidden = yt && yt.channel && yt.channel.subscribers_hidden;
      subEl.textContent = hidden ? "private" : (subs != null ? fmt(subs) : "--");
    }
  }

  // Top Transmissions section. Pulls /spotify_songs.json (separate
  // store, separate source). DistroKid and Spotify numbers never mix.
  // If the file is missing or empty, the section stays hidden.
  function renderTopTransmissions(spotify) {
    var section = $("topTransmissionsSection");
    var list = $("topTransmissionsList");
    var intro = $("topTransmissionsIntro");
    if (!section || !list) return;
    var songs = (spotify && Array.isArray(spotify.songs)) ? spotify.songs : [];
    if (!songs.length) {
      section.setAttribute("hidden", "");
      section.style.display = "none";
      list.innerHTML = "";
      if (intro) intro.textContent = "";
      return;
    }
    section.removeAttribute("hidden");
    section.style.display = "";
    var total = Number(spotify.total_spotify_streams || 0);
    if (intro) {
      intro.innerHTML =
        "Per-song stream counts pulled from Spotify for Artists. " +
        "<b>" + songs.length + "</b> tracks logged, <b>" + fmt(total) + "</b> total plays on Spotify. " +
        "These numbers are independent from the DistroKid reach totals above.";
    }
    var max = songs.reduce(function (m, s) { return Math.max(m, Number(s.streams) || 0); }, 1);
    list.innerHTML = songs.map(function (s) {
      var pct = Math.max(2, Math.round(((Number(s.streams) || 0) / max) * 100));
      var title = escapeHtml(s.title || "?");
      var art = artForTitle(s.title);
      return '<li>' +
        '<span class="reach-list__art"><img src="' + art + '" alt="" onerror="this.src=\'/images/logo.png\'" loading="lazy" /></span>' +
        '<span class="reach-list__name">' + title + '</span>' +
        '<span class="reach-list__streams">' + fmt(s.streams) + '</span>' +
        '<span class="reach-list__bar"><span style="width:' + pct + '%"></span></span>' +
      '</li>';
    }).join("");
  }

  // Spotify Surging Now (last 28 days). Pulls /spotify_songs_28d.json.
  // Same shape as the lifetime block above but with a 28d window tag
  // and a different "total" key (total_spotify_streams_28d). If the
  // file is missing or empty, the section stays hidden. The lifetime
  // and 28d files are independent: a missing 28d file is normal until
  // the operator uploads a "Last 28 days" screenshot.
  function renderSpotifySurge(spotify28d) {
    var section = $("spotifySurgeSection");
    var list = $("spotifySurgeList");
    var intro = $("spotifySurgeIntro");
    if (!section || !list) return;
    var songs = (spotify28d && Array.isArray(spotify28d.songs)) ? spotify28d.songs : [];
    if (!songs.length) {
      section.setAttribute("hidden", "");
      section.style.display = "none";
      list.innerHTML = "";
      if (intro) intro.textContent = "";
      return;
    }
    section.removeAttribute("hidden");
    section.style.display = "";
    var total = Number(spotify28d.total_spotify_streams_28d || 0);
    if (intro) {
      intro.innerHTML =
        "What's hot right now on Spotify. " +
        "<b>" + songs.length + "</b> tracks logged in the last 28 days, " +
        "<b>" + fmt(total) + "</b> recent plays.";
    }
    var max = songs.reduce(function (m, s) { return Math.max(m, Number(s.streams) || 0); }, 1);
    list.innerHTML = songs.map(function (s) {
      var pct = Math.max(2, Math.round(((Number(s.streams) || 0) / max) * 100));
      var title = escapeHtml(s.title || "?");
      var art = artForTitle(s.title);
      return '<li>' +
        '<span class="reach-list__art"><img src="' + art + '" alt="" onerror="this.src=\'/images/logo.png\'" loading="lazy" /></span>' +
        '<span class="reach-list__name">' + title + '</span>' +
        '<span class="reach-list__streams">' + fmt(s.streams) + '</span>' +
        '<span class="reach-list__bar"><span style="width:' + pct + '%"></span></span>' +
      '</li>';
    }).join("");
  }

  function renderListIntro(data) {
    var el = $("reachListIntro");
    if (!el) return;
    var n = (data.countries || []).length;
    if (!n) { el.textContent = ""; return; }
    el.innerHTML =
      "<b>" + n + "</b> flags. <b>" + n + "</b> signals that made it through. " +
      "The leaderboard below is ranked by total confirmed transmissions; " +
      "new territories are marked when they first appear.";

    // Biggest-market anchor: pre-frame the leaderboard with the top
    // country plus what share of all-time streams it represents. Makes
    // the country list feel weighted instead of a flat enumeration.
    var anchorEl = $("reachTopMarketLine");
    if (!anchorEl) return;
    var sorted = (data.countries || []).slice().sort(function (a, b) {
      return (Number(b.streams) || 0) - (Number(a.streams) || 0);
    });
    var top = sorted[0];
    var total = Number(data.total_streams || 0);
    if (top && top.streams && total > 0) {
      var topPct = Math.round((Number(top.streams) / total) * 100);
      anchorEl.innerHTML =
        "Biggest market: <b>" + escapeHtml(top.country || "?") + "</b> at <b>" +
        fmt(top.streams) + "</b> streams. About <b>" + topPct +
        "%</b> of all-time signal.";
      anchorEl.removeAttribute("hidden");
    } else {
      anchorEl.setAttribute("hidden", "");
    }
  }

  function renderList(data) {
    var ul = $("reachList");
    if (!ul) return;
    var countries = (data.countries || []).slice();
    if (!countries.length) {
      ul.innerHTML = '<li><span class="reach-list__name" style="grid-column:1 / -1;color:rgba(168,162,154,.5)">No country data yet. Upload a screenshot.</span></li>';
      return;
    }
    var max = Math.max.apply(null, countries.map(function (c) { return Number(c.streams) || 0; }).concat([1]));
    ul.innerHTML = countries.map(function (c) {
      var pct = Math.max(2, Math.round(((Number(c.streams) || 0) / max) * 100));
      return '<li>' +
        '<span class="reach-list__flag">' + (c.flag || "") + '</span>' +
        '<span class="reach-list__name">' + escapeHtml(c.country || "?") + '</span>' +
        '<span class="reach-list__streams">' + fmt(c.streams) + '</span>' +
        '<span class="reach-list__bar"><span style="width:' + pct + '%"></span></span>' +
      '</li>';
    }).join("");
  }

  function renderCurve(data) {
    var svg = $("reachCurve");
    if (!svg) return;
    // The streams curve always tells the same story: "we started at 0
    // and have accumulated <total_streams> over time." Plotting raw
    // history made the chart look like a near-flat line whenever a new
    // screenshot was uploaded, because two recent points (e.g. 9,724
    // and 10,455 four days apart) auto-scaled the y-axis into a narrow
    // band near the top. The window-stat synthesis below anchors the
    // far-left at 0 six months back, lays down intermediate points
    // derived from real last_90 / last_30 / last_7 deltas, and ends at
    // the current total. The shape is always a clear rise from zero.
    //
    // Raw history is intentionally not plotted here. It still lives in
    // /reach.json#history for anyone who wants the per-upload trail.
    var anchorIso = data.generated_at || data.last_published_at;
    var now = anchorIso ? Date.parse(anchorIso) : Date.now();
    if (!Number.isFinite(now)) now = Date.now();
    var DAY = 24 * 3600 * 1000;
    var total = Number(data.total_streams || 0);
    var points = [[now - 180 * DAY, 0]];
    var l90 = Number(data.last_90 || 0);
    var l30 = Number(data.last_30 || 0);
    var l7  = Number(data.last_7  || 0);
    if (l90 > 0) points.push([now - 90 * DAY, Math.max(0, total - l90)]);
    if (l30 > 0) points.push([now - 30 * DAY, Math.max(0, total - l30)]);
    if (l7  > 0) points.push([now - 7  * DAY, Math.max(0, total - l7)]);
    points.push([now, total]);
    svg.style.display = "";
    points.sort(function (a, b) { return a[0] - b[0]; });
    var minX = points[0][0], maxX = points[points.length - 1][0];
    var minY = 0, maxY = Math.max.apply(null, points.map(function (p) { return p[1]; }).concat([1]));
    var w = 800, h = 220, padL = 12, padR = 12, padT = 18, padB = 18;
    function sx(x) {
      if (maxX === minX) return padL;
      return padL + ((x - minX) / (maxX - minX)) * (w - padL - padR);
    }
    function sy(y) {
      if (maxY === minY) return h - padB;
      return h - padB - ((y - minY) / (maxY - minY)) * (h - padT - padB);
    }
    var path = "M " + sx(points[0][0]) + " " + sy(points[0][1]);
    for (var i = 1; i < points.length; i++) path += " L " + sx(points[i][0]) + " " + sy(points[i][1]);
    var areaPath = path + " L " + sx(points[points.length - 1][0]) + " " + (h - padB) + " L " + sx(points[0][0]) + " " + (h - padB) + " Z";
    svg.innerHTML = ''
      + '<defs>'
      + '<linearGradient id="reachGrad" x1="0" y1="0" x2="0" y2="1">'
      + '<stop offset="0%" stop-color="#e74c3c" stop-opacity="0.55" />'
      + '<stop offset="100%" stop-color="#e74c3c" stop-opacity="0.0" />'
      + '</linearGradient>'
      + '</defs>'
      + '<path d="' + areaPath + '" fill="url(#reachGrad)" />'
      + '<path d="' + path + '" fill="none" stroke="#e74c3c" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />';
  }

  function renderMilestones(data) {
    var root = $("reachMilestones");
    if (!root) return;
    var total = Number(data.total_streams || 0);
    // Mark each milestone earned/current/locked.
    var nextIdx = -1;
    for (var i = 0; i < MILESTONES.length; i++) {
      if (total < MILESTONES[i].value) { nextIdx = i; break; }
    }
    root.innerHTML = MILESTONES.map(function (m, i) {
      var earned = total >= m.value;
      var current = !earned && i === nextIdx;
      var cls = "reach-milestone";
      if (earned) cls += " reach-milestone--earned";
      if (current) cls += " reach-milestone--current";
      return '<div class="' + cls + '">' + m.label + '</div>';
    }).join("");
  }

  function renderCelebration(data) {
    var box = $("reachCelebrate");
    if (!box) return;
    var total = Number(data.total_streams || 0);
    var nations = (data.countries || []).length;
    if (total < 10000) {
      box.classList.remove("is-on");
      return;
    }
    // Pick the highest crossed milestone with friendly copy.
    var crossed = MILESTONES.filter(function (m) { return total >= m.value; });
    var top = crossed[crossed.length - 1];
    var headline = top ? (top.value.toLocaleString() + ".") : (fmt(total) + ".");
    var name = top ? wordsForValue(top.value) : fmt(total);
    var copy = "The signal crossed " + name + ". Christ named " + name + " times, across " + nations + " nations, without a gatekeeper&rsquo;s permission.";
    var hEl = $("reachCelebrateHeadline");
    var cEl = $("reachCelebrateCopy");
    if (hEl) hEl.textContent = headline;
    if (cEl) cEl.innerHTML = copy;
    box.classList.add("is-on");
  }

  function wordsForValue(v) {
    var map = {
      1000: "one thousand",
      5000: "five thousand",
      10000: "ten thousand",
      25000: "twenty-five thousand",
      50000: "fifty thousand",
      100000: "one hundred thousand"
    };
    return map[v] || fmt(v);
  }

  function renderMeta(data) {
    var el = $("reachMeta");
    if (!el) return;
    el.textContent =
      "How the signal is counted. The numbers come from DistroKid stream reports. " +
      "Values are estimates per DistroKid's own disclosure. " +
      "We don't inflate them, and we don't count what we can't see.";
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function paint(data) {
    setStatus(data);
    renderCelebration(data);
    renderHero(data);
    renderInsights(data);
    renderListIntro(data);
    renderList(data);
    renderCurve(data);
    renderMilestones(data);
    renderMeta(data);
  }

  // Reach (streams) data. Used on /reach/streams (full report) and
  // on /reach (overview panel). On the overview page, paint() is a
  // no-op for missing DOM; the overview-specific population happens
  // once both fetches resolve below.
  var reachPromise = fetch(SRC, { cache: "no-store" })
    .then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    })
    .then(function (data) { paint(data); return data; })
    .catch(function () {
      var s = $("reachStatus");
      if (s) s.innerHTML = "Watchman&rsquo;s report. Signal acquisition pending.";
      var c = $("reachCount");
      if (c) c.textContent = "--";
      return null;
    });

  // Spotify data. Only renders into #topTransmissionsSection where it
  // exists (currently /reach/streams). Missing file leaves the section
  // hidden everywhere.
  fetch(SPOTIFY_SRC + "?cb=" + Date.now(), { cache: "no-store" })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(renderTopTransmissions)
    .catch(function () { /* silent */ });

  // Spotify 28-day surge. Independent of the lifetime file: the section
  // stays hidden until the operator uploads a "Last 28 days" screenshot
  // and the parser commits /spotify_songs_28d.json.
  fetch(SPOTIFY_28D_SRC + "?cb=" + Date.now(), { cache: "no-store" })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(renderSpotifySurge)
    .catch(function () { /* silent */ });

  // YouTube data. Used on /reach/youtube (full report) and on /reach
  // (overview panel).
  var ytPromise = fetch(YOUTUBE_SRC + "?cb=" + Date.now(), { cache: "no-store" })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (data) { renderYouTube(data); return data; })
    .catch(function () { return null; });

  // Overview page populates BOTH counters from BOTH data sources but
  // keeps them strictly separate. The streams counter shows streams,
  // the YouTube counter shows views, and no element on this page sums
  // them together.
  Promise.all([reachPromise, ytPromise]).then(function (results) {
    renderOverview(results[0], results[1]);
  });
})();

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

  function animateCounter(targetN) {
    var el = $("reachCount");
    var inline = $("reachTotalInline");
    if (!el) return;
    if (prefersReducedMotion()) {
      el.textContent = fmt(targetN);
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
      el.textContent = fmt(cur);
      if (inline) inline.textContent = fmt(cur);
      if (p < 1) requestAnimationFrame(step);
      else {
        el.textContent = fmt(targetN);
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
      list.innerHTML = "";
      if (intro) intro.textContent = "";
      return;
    }
    section.removeAttribute("hidden");
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
      return '<li>' +
        '<span class="reach-list__name">' + escapeHtml(s.title || "?") + '</span>' +
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
    var series = (data.history || []).slice();
    var points = [];
    series.forEach(function (p) {
      var t = Date.parse(p.t);
      if (Number.isFinite(t)) points.push([t, Number(p.total) || 0]);
    });
    // When real history is too thin to draw a meaningful curve, synthesize
    // a rising line from the time-window stats: total - last_90 was the
    // total 90 days ago, total - last_30 was 30 days ago, etc. Anchor the
    // far-left at 0 six months back so the curve clearly rises from zero
    // to the current total.
    var distinctTotals = new Set(points.map(function (p) { return p[1]; }));
    var degenerate = points.length < 2 || distinctTotals.size < 2;
    if (degenerate) {
      var anchorIso = data.generated_at || data.last_published_at;
      var now = anchorIso ? Date.parse(anchorIso) : Date.now();
      if (!Number.isFinite(now)) now = Date.now();
      var DAY = 24 * 3600 * 1000;
      var total = Number(data.total_streams || 0);
      var synthesized = [[now - 180 * DAY, 0]];
      var l90 = Number(data.last_90 || 0);
      var l30 = Number(data.last_30 || 0);
      var l7  = Number(data.last_7  || 0);
      if (l90 > 0) synthesized.push([now - 90 * DAY, Math.max(0, total - l90)]);
      if (l30 > 0) synthesized.push([now - 30 * DAY, Math.max(0, total - l30)]);
      if (l7  > 0) synthesized.push([now - 7  * DAY, Math.max(0, total - l7)]);
      synthesized.push([now, total]);
      points = synthesized;
    }
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

  fetch(SRC, { cache: "no-store" })
    .then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    })
    .then(paint)
    .catch(function () {
      var s = $("reachStatus");
      if (s) s.innerHTML = "Watchman&rsquo;s report. Signal acquisition pending.";
      var c = $("reachCount");
      if (c) c.textContent = "--";
    });

  // Spotify section loads independently. A missing file (404) just
  // means no Spotify data has been uploaded yet; the section stays
  // hidden. No error surfacing required.
  fetch(SPOTIFY_SRC, { cache: "no-store" })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(renderTopTransmissions)
    .catch(function () { /* silent: hidden by default */ });
})();

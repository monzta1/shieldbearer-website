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

  // Country code -> approximate centroid [lat, lng] in decimal degrees.
  // Used to plot every reached country as a glowing marker on the world
  // map below. Centroids do not need to be precise to the city; "in the
  // right place on the map" is enough.
  var LAT_LNG_BY_CODE = {
    US: [39.8, -98.6], CA: [56.1, -106.3], MX: [23.6, -102.5],
    BR: [-14.2, -51.9], AR: [-38.4, -63.6], CL: [-35.7, -71.5], CO: [4.6, -74.3],
    GB: [54.0, -2.0], DE: [51.2, 10.4], FR: [46.6, 2.2], NL: [52.1, 5.3], BE: [50.5, 4.5],
    SE: [60.1, 18.6], CH: [46.8, 8.2], ES: [40.5, -3.7], IT: [42.5, 12.6], AT: [47.5, 14.6],
    PL: [51.9, 19.1], NO: [60.5, 8.5], DK: [56.3, 9.5], FI: [61.9, 25.7], IE: [53.4, -8.0],
    PT: [39.4, -8.2], GR: [39.1, 21.8], CZ: [49.8, 15.5], HU: [47.2, 19.5], RO: [45.9, 24.9],
    RU: [61.5, 105.3], UA: [48.4, 31.2], TR: [38.9, 35.2], IL: [31.0, 34.8],
    IN: [20.6, 78.9], SG: [1.4, 103.8], AE: [23.4, 53.8], JP: [36.2, 138.3], KR: [35.9, 127.8],
    CN: [35.9, 104.2], HK: [22.3, 114.2], TW: [23.7, 121.0],
    PH: [12.9, 121.8], ID: [-0.8, 113.9], MY: [4.2, 101.9], TH: [15.9, 100.9], VN: [14.1, 108.3],
    SA: [23.9, 45.1],
    ZA: [-30.6, 22.9], EG: [26.8, 30.8], NG: [9.1, 8.7], KE: [-0.0, 37.9],
    AU: [-25.3, 133.8], NZ: [-40.9, 174.9]
  };

  // World map viewBox in equirectangular projection space:
  //   x = (lng + 180) / 360 * 1000
  //   y = (90 - lat) / 180 * 500
  // Continent silhouettes are intentionally rough -- the goal is "yes,
  // that is a world map" not cartographic accuracy. Each continent is
  // a polygon of [lng, lat] pairs that the projector converts.
  var WORLD_W = 1000;
  var WORLD_H = 500;
  var CONTINENTS = [
    // North America
    [[-168,66],[-155,71],[-95,73],[-58,60],[-55,48],[-66,45],[-80,25],[-97,16],[-106,23],[-118,32],[-125,40],[-130,55]],
    // Greenland
    [[-55,83],[-20,82],[-22,70],[-50,60],[-55,72]],
    // South America
    [[-80,12],[-60,12],[-50,5],[-35,-5],[-35,-23],[-55,-35],[-65,-55],[-72,-53],[-75,-35],[-82,-10]],
    // Europe + western Russia
    [[-10,58],[5,58],[10,71],[30,70],[55,68],[60,55],[40,45],[28,40],[15,36],[-9,36],[-10,48]],
    // Africa
    [[-17,35],[10,36],[33,32],[42,15],[51,12],[40,-2],[40,-25],[20,-35],[10,-22],[-17,15]],
    // Asia
    [[40,55],[80,75],[140,75],[170,65],[160,55],[140,35],[122,32],[122,22],[105,8],[95,5],[85,7],[70,15],[55,15],[44,30],[40,40]],
    // Indian subcontinent extension
    [[68,33],[88,32],[92,22],[80,8],[73,15]],
    // Southeast Asia + Indonesia
    [[95,5],[140,0],[140,-9],[100,-9],[95,-2]],
    // Australia
    [[113,-12],[143,-10],[153,-25],[150,-38],[130,-33],[115,-35],[113,-22]],
    // Japan
    [[131,33],[141,35],[145,43],[140,45],[132,34]],
    // UK + Ireland
    [[-10,52],[-2,58],[2,58],[1,50],[-5,50]],
    // Antarctica
    [[-180,-65],[180,-65],[180,-90],[-180,-90]]
  ];

  // Legacy: continent grouping for the "Reached Nations" list grouping
  // headers when we ever want them. Not used by the map renderer.
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
    return d.toUTCString().replace("GMT", "UTC");
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
    el.innerHTML = "Watchman&rsquo;s report. Signal confirmed in <b>" + nations + "</b> territories. Last sync: " + sync + ".";
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

  function projX(lng) { return (Number(lng) + 180) / 360 * WORLD_W; }
  function projY(lat) { return (90 - Number(lat)) / 180 * WORLD_H; }

  function renderMap(data) {
    var root = $("reachMap");
    if (!root) return;
    var countries = (data.countries || []).slice();
    var maxStreams = countries.reduce(function (m, c) {
      return Math.max(m, Number(c.streams) || 0);
    }, 1);

    // Continent silhouettes as one combined path so the renderer is cheap.
    var continentPaths = CONTINENTS.map(function (poly) {
      var d = poly.map(function (pt, i) {
        var x = projX(pt[0]).toFixed(1);
        var y = projY(pt[1]).toFixed(1);
        return (i === 0 ? "M " : "L ") + x + " " + y;
      }).join(" ") + " Z";
      return '<path d="' + d + '" />';
    }).join("");

    // Country markers. Radius scales with sqrt(streams / max) so a
    // 100-stream country is still visible next to a 3000-stream one.
    var markers = countries.map(function (c) {
      var ll = LAT_LNG_BY_CODE[c.code];
      if (!ll) return ""; // unmapped country -- silent fallthrough
      var x = projX(ll[1]);
      var y = projY(ll[0]);
      var rel = (Number(c.streams) || 0) / maxStreams;
      var r = 3.4 + Math.sqrt(Math.max(0, Math.min(1, rel))) * 9.6;
      var label = (c.country || "?") + " (" + fmt(c.streams) + ")";
      return '<g class="reach-map__pin" tabindex="0" aria-label="' + escapeAttr(label) + '">' +
        '<title>' + escapeHtml(label) + '</title>' +
        '<circle class="reach-map__pin-halo" cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + (r + 4).toFixed(1) + '" />' +
        '<circle class="reach-map__pin-dot"  cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + r.toFixed(1) + '" />' +
        '<text class="reach-map__pin-flag" x="' + x.toFixed(1) + '" y="' + (y + 4.5).toFixed(1) + '" text-anchor="middle">' + (c.flag || "") + '</text>' +
      '</g>';
    }).join("");

    root.innerHTML =
      '<svg class="reach-map__svg" viewBox="0 0 ' + WORLD_W + ' ' + WORLD_H + '" preserveAspectRatio="xMidYMid meet" aria-label="World map showing reached nations">' +
        '<defs>' +
          '<radialGradient id="reachMapGlow" cx="0.5" cy="0.5" r="0.5">' +
            '<stop offset="0%" stop-color="rgba(231,76,60,0.55)" />' +
            '<stop offset="100%" stop-color="rgba(231,76,60,0)" />' +
          '</radialGradient>' +
        '</defs>' +
        '<rect class="reach-map__ocean" x="0" y="0" width="' + WORLD_W + '" height="' + WORLD_H + '" />' +
        '<g class="reach-map__land">' + continentPaths + '</g>' +
        '<g class="reach-map__pins">' + markers + '</g>' +
      '</svg>';
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
    var emptyEl = $("reachCurveEmpty");
    if (!svg) return;
    var series = (data.history || []).slice();
    var points = [];
    series.forEach(function (p) {
      var t = Date.parse(p.t);
      if (Number.isFinite(t)) points.push([t, Number(p.total) || 0]);
    });
    // Degenerate cases: no points, one point, or all-equal totals.
    // A flat line at the current total reads as a bug to anyone who
    // expects a real growth curve. Show a quiet empty state instead.
    var distinctTotals = new Set(points.map(function (p) { return p[1]; }));
    var degenerate = points.length < 2 || distinctTotals.size < 2;
    if (degenerate) {
      svg.style.display = "none";
      if (emptyEl) emptyEl.style.display = "block";
      return;
    }
    svg.style.display = "";
    if (emptyEl) emptyEl.style.display = "none";
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
    var when = shortTs(data.generated_at) || "pending";
    el.textContent = "Numbers refresh when the operator uploads a new DistroKid screenshot. Last refresh: " + when + ". Streams data via DistroKid; all values are estimates per their note.";
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function escapeAttr(s) {
    return escapeHtml(s).replace(/"/g, "&quot;");
  }

  function paint(data) {
    setStatus(data);
    renderCelebration(data);
    renderHero(data);
    renderMap(data);
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
})();

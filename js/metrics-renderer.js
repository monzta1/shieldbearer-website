/* =============================================================
   /metrics renderer.

   Reads /metrics.json and fills the four sections of the page:
   headline, channels, events, shipped. Every section degrades to
   a polite empty state if the corresponding field is missing or
   zero-length. A fetch failure shows a single one-line note and
   leaves the page intact.

   The page's static markup carries fallback copy in the slot
   elements. Anything we render here overwrites that fallback,
   so a stale metrics.json never produces a half-built layout.
   ============================================================= */
(function () {
  var STATUS_EL_ID = "metrics-status";
  var HEADLINE_EL_ID = "metrics-headline";
  var CHANNELS_EL_ID = "metrics-channels";
  var EVENTS_EL_ID = "metrics-events";
  var SHIPPED_EL_ID = "metrics-shipped";
  var PERIOD_EL_ID = "metrics-period";
  var GENERATED_EL_ID = "metrics-generated";
  var NOTE_EL_ID = "metrics-note";

  var src = (window.SHIELDBEARER_CONFIG && window.SHIELDBEARER_CONFIG.metrics && window.SHIELDBEARER_CONFIG.metrics.source) || "/metrics.json";

  function el(id) { return document.getElementById(id); }

  function fmtNumber(n) {
    if (n == null) return "--";
    return Number(n).toLocaleString();
  }

  function fmtDelta(pct) {
    if (pct == null || isNaN(pct)) return "";
    var sign = pct > 0 ? "+" : "";
    return sign + Number(pct).toFixed(1) + "%";
  }

  function fmtDate(iso) {
    if (!iso) return "";
    var d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toISOString().slice(0, 10);
  }

  function fmtGeneratedAt(iso) {
    if (!iso) return "";
    var d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toUTCString().replace("GMT", "UTC");
  }

  function setText(node, text) {
    if (!node) return;
    node.textContent = text;
  }

  function renderHeadline(headline) {
    var node = el(HEADLINE_EL_ID);
    if (!node) return;
    if (!headline) {
      setText(node, "No headline data this period.");
      return;
    }
    var sessions = fmtNumber(headline.sessions);
    var delta = fmtDelta(headline.deltaPct);
    var comparison = headline.comparison ? " " + String(headline.comparison) : "";
    node.innerHTML =
      '<span class="metrics-headline__n">' + sessions + '</span>' +
      ' sessions' +
      (delta ? ' <span class="metrics-headline__delta">' + delta + '</span>' + (comparison ? '<span class="metrics-headline__cmp">' + comparison + '</span>' : '') : '');
  }

  function renderChannels(channels) {
    var node = el(CHANNELS_EL_ID);
    if (!node) return;
    if (!Array.isArray(channels) || !channels.length) {
      node.innerHTML = '<li class="metrics-row metrics-row--empty">No channel data this period.</li>';
      return;
    }
    node.innerHTML = channels.slice(0, 3).map(function (row) {
      var name = String(row.name || "Unknown");
      var sessions = fmtNumber(row.sessions);
      var share = row.share != null ? Number(row.share).toFixed(1) + "%" : "";
      return '<li class="metrics-row">' +
        '<span class="metrics-row__label">' + escapeText(name) + '</span>' +
        '<span class="metrics-row__value">' + sessions + (share ? ' <span class="metrics-row__share">(' + share + ')</span>' : '') + '</span>' +
      '</li>';
    }).join("");
  }

  function renderEvents(events) {
    var node = el(EVENTS_EL_ID);
    if (!node) return;
    if (!Array.isArray(events) || !events.length) {
      node.innerHTML = '<li class="metrics-row metrics-row--empty">No event data this period.</li>';
      return;
    }
    node.innerHTML = events.slice(0, 5).map(function (row) {
      var name = String(row.name || "unknown_event");
      var count = fmtNumber(row.count);
      return '<li class="metrics-row">' +
        '<span class="metrics-row__label">' + escapeText(name) + '</span>' +
        '<span class="metrics-row__value">' + count + '</span>' +
      '</li>';
    }).join("");
  }

  function renderShipped(shipped) {
    var node = el(SHIPPED_EL_ID);
    if (!node) return;
    if (!Array.isArray(shipped) || !shipped.length) {
      node.innerHTML = '<li class="metrics-row metrics-row--empty">Nothing shipped this period.</li>';
      return;
    }
    node.innerHTML = shipped.slice(0, 6).map(function (row) {
      var d = fmtDate(row.date);
      var label = String(row.label || "");
      return '<li class="metrics-row metrics-row--shipped">' +
        '<span class="metrics-row__date">' + escapeText(d) + '</span>' +
        '<span class="metrics-row__label">' + escapeText(label) + '</span>' +
      '</li>';
    }).join("");
  }

  function escapeText(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function renderMeta(data) {
    setText(el(PERIOD_EL_ID), data && data.period && data.period.label ? data.period.label : "");
    setText(el(GENERATED_EL_ID), data && data.generatedAt ? "Refreshed " + fmtGeneratedAt(data.generatedAt) : "");
    setText(el(NOTE_EL_ID), data && data.note ? String(data.note) : "");
  }

  function renderStatus(message) {
    var node = el(STATUS_EL_ID);
    if (!node) return;
    if (!message) {
      node.hidden = true;
      return;
    }
    node.hidden = false;
    node.textContent = message;
  }

  fetch(src, { cache: "no-store" })
    .then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    })
    .then(function (data) {
      renderStatus("");
      renderMeta(data);
      renderHeadline(data && data.headline);
      renderChannels(data && data.channels);
      renderEvents(data && data.events);
      renderShipped(data && data.shipped);
    })
    .catch(function () {
      renderStatus("Numbers are refreshing. Check back later.");
    });
})();

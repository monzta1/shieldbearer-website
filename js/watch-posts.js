/* =============================================================
   Watch Posts renderer.

   Reads /data/gigs.json and fills the Watch Posts section on the
   homepage. Entries with date >= today render under Upcoming
   (ascending). Entries with date < today render under Recent
   (descending), capped at 3.

   Hide-empty rules:
     - Upcoming subheading + list hidden when no upcoming entries
     - Recent subheading + list hidden when no recent entries
     - Whole section hidden when both buckets are empty
     - Whole section hidden on fetch failure (no half-rendered UI)

   Date format: ISO YYYY-MM-DD in JSON, rendered as
   MONTH DD, YYYY in the DOM (uppercase month, zero-padded day).

   Optional fields per entry:
     - billing: skipped if empty
     - note: skipped if empty
   ============================================================= */
(function () {
  var section = document.getElementById('watch-posts');
  if (!section) return;

  var cfg = (window.SHIELDBEARER_CONFIG && window.SHIELDBEARER_CONFIG.watchPosts) || {};
  var source = cfg.source || '/data/gigs.json';
  var recentCap = typeof cfg.recentCap === 'number' ? cfg.recentCap : 3;

  var MONTHS = [
    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
  ];

  function formatDate(iso) {
    if (!iso || typeof iso !== 'string') return '';
    var parts = iso.split('-');
    if (parts.length !== 3) return iso;
    var year = parts[0];
    var monthIdx = parseInt(parts[1], 10) - 1;
    var day = parseInt(parts[2], 10);
    if (isNaN(monthIdx) || monthIdx < 0 || monthIdx > 11 || isNaN(day)) return iso;
    return MONTHS[monthIdx] + ' ' + (day < 10 ? '0' + day : '' + day) + ', ' + year;
  }

  function todayIso() {
    var d = new Date();
    var y = d.getFullYear();
    var m = d.getMonth() + 1;
    var dd = d.getDate();
    return y + '-' + (m < 10 ? '0' + m : '' + m) + '-' + (dd < 10 ? '0' + dd : '' + dd);
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function buildEntry(g) {
    var entry = document.createElement('article');
    entry.className = 'watch-post';
    var html = '<p class="watch-post__date">' + escapeHtml(formatDate(g.date)) + '</p>';
    var venuePart = (g.venue ? escapeHtml(g.venue) : '');
    var cityPart = (g.city ? escapeHtml(g.city) : '');
    var line2 = venuePart && cityPart ? venuePart + ', ' + cityPart : (venuePart || cityPart);
    if (line2) html += '<p class="watch-post__venue">' + line2 + '</p>';
    if (g.billing) html += '<p class="watch-post__billing">' + escapeHtml(g.billing) + '</p>';
    if (g.note) html += '<p class="watch-post__note">' + escapeHtml(g.note) + '</p>';
    entry.innerHTML = html;
    return entry;
  }

  function partitionAndSort(gigs, today) {
    var safe = Array.isArray(gigs) ? gigs.filter(function (g) { return g && typeof g.date === 'string'; }) : [];
    var upcoming = safe.filter(function (g) { return g.date >= today; })
      .sort(function (a, b) { return a.date.localeCompare(b.date); });
    var recent = safe.filter(function (g) { return g.date < today; })
      .sort(function (a, b) { return b.date.localeCompare(a.date); })
      .slice(0, recentCap);
    return { upcoming: upcoming, recent: recent };
  }

  function render(gigs) {
    var split = partitionAndSort(gigs, todayIso());
    var upcoming = split.upcoming;
    var recent = split.recent;

    var upcomingHeading = section.querySelector('.watch-posts__upcoming-heading');
    var upcomingList = section.querySelector('.watch-posts__upcoming-list');
    var recentHeading = section.querySelector('.watch-posts__recent-heading');
    var recentList = section.querySelector('.watch-posts__recent-list');

    if (upcoming.length === 0) {
      if (upcomingHeading) upcomingHeading.style.display = 'none';
      if (upcomingList) upcomingList.style.display = 'none';
    } else if (upcomingList) {
      upcoming.forEach(function (g) { upcomingList.appendChild(buildEntry(g)); });
    }

    if (recent.length === 0) {
      if (recentHeading) recentHeading.style.display = 'none';
      if (recentList) recentList.style.display = 'none';
    } else if (recentList) {
      recent.forEach(function (g) { recentList.appendChild(buildEntry(g)); });
    }

    if (upcoming.length === 0 && recent.length === 0) {
      section.style.display = 'none';
    }
  }

  fetch(source, { cache: 'no-store' })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(render)
    .catch(function () {
      // Hide the whole section on fetch failure rather than show
      // a stub. The section earns its place only when there is real
      // content to put in it.
      section.style.display = 'none';
    });
})();

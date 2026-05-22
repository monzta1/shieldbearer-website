#!/usr/bin/env node
/**
 * Browser-side regression tests for the homepage / song-meanings /
 * merch JS, run under jsdom so they can manipulate a real DOM and
 * fetch from an in-memory shim.
 *
 * Each test loads the script under test inside a fresh jsdom window,
 * provides the JSON it would normally fetch, and asserts the
 * resulting DOM matches what visitors would see in a real browser.
 */

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { JSDOM } = require("jsdom");

const ROOT = path.resolve(__dirname, "..");

let passed = 0;
let failed = 0;

function assert(cond, label) {
  if (cond) { console.log(`PASS ${label}`); passed += 1; }
  else { console.log(`FAIL ${label}`); failed += 1; }
}

function assertEqual(actual, expected, label) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { console.log(`PASS ${label}`); passed += 1; }
  else {
    console.log(`FAIL ${label}`);
    console.log(`  expected: ${JSON.stringify(expected)}`);
    console.log(`  actual:   ${JSON.stringify(actual)}`);
    failed += 1;
  }
}

// ----------------------------------------------------------------------
// jsdom helpers
// ----------------------------------------------------------------------

function makeDom(html) {
  const dom = new JSDOM(html, {
    url: "https://shieldbearerusa.com/",
    runScripts: "outside-only"
  });
  dom.window.window = dom.window;
  // Stash a back-pointer so runScriptInWindow can reach the dom for
  // its internal VM context (needed for coverage instrumentation).
  dom.window._sentinelOwnerDom = dom;
  return dom;
}

function installFetchShim(window, jsonByUrl) {
  // Map { url-substring: object-or-error } so each test can describe
  // what its script should see when calling fetch(...).
  window.fetch = (url) => {
    const matched = Object.keys(jsonByUrl).find((key) => String(url).includes(key));
    if (!matched) {
      return Promise.reject(new Error("unmocked fetch: " + url));
    }
    const value = jsonByUrl[matched];
    if (value instanceof Error) return Promise.reject(value);
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve(value)
    });
  };
}

function loadScript(window, scriptPath) {
  const src = fs.readFileSync(path.join(ROOT, scriptPath), "utf8");
  vm.runInContext(src, window._sentinelDomContext || (
    window._sentinelDomContext = window.eval("this")
  ));
}

function runScriptInWindow(window, scriptPath) {
  // Use vm.runInContext + jsdom's internal VM context so V8's
  // coverage hooks (NODE_V8_COVERAGE / c8) see the executed lines.
  // window.eval works for assertions but doesn't propagate coverage.
  const dom = window._sentinelOwnerDom;
  const ctx = dom ? dom.getInternalVMContext() : window;
  const src = fs.readFileSync(path.join(ROOT, scriptPath), "utf8");
  vm.runInContext(src, ctx, { filename: path.join(ROOT, scriptPath) });
}

async function flushMicrotasks() {
  await new Promise((resolve) => setImmediate(resolve));
  await new Promise((resolve) => setImmediate(resolve));
  await new Promise((resolve) => setImmediate(resolve));
}

// ----------------------------------------------------------------------
// featured-release.js
// ----------------------------------------------------------------------

(async () => {
  const html = `<!doctype html><html><head></head><body>
    <article class="featured-track" id="featured-release">
      <figure class="featured-track__artwork" aria-label="Sentinels artwork thumbnail">
        <img src="static-fallback.jpg" alt="static alt">
      </figure>
      <h2 class="featured-track__title" id="release-heading">Static Title</h2>
      <p class="featured-track__desc">static blurb</p>
      <iframe class="featured-track__player" src="https://www.youtube.com/embed/STATIC" title="static title"></iframe>
      <div class="featured-track__actions">
        <a class="btn btn--red" href="https://yt/static">Watch Now</a>
        <a class="btn btn--ghost" href="song-meanings.html#static">Read the Meaning</a>
      </div>
      <aside class="featured-track__lyrics" aria-label="Static notes panel">
        <h3 class="featured-track__lyrics-title">Static Notes</h3>
        <div class="featured-track__lyrics-scroll"><p>static</p></div>
      </aside>
    </article>
  </body></html>`;
  const dom = makeDom(html);
  installFetchShim(dom.window, {
    "site.json": {
      homepage: {
        featuredRelease: {
          songId: "lmpg-vid",
          title: "Let My People Go",
          videoId: "lmpg-vid",
          sourceUrl: "https://www.youtube.com/watch?v=lmpg-vid",
          artwork: "https://shieldbearerusa.com/images/signal-room/let-my-people-go.jpg",
          songMeaning: "A cry that shook a nation.\n\nGod heard the cries.\n\nLet My people go."
        }
      }
    }
  });
  runScriptInWindow(dom.window, "js/featured-release.js");
  await flushMicrotasks();

  const doc = dom.window.document;
  assertEqual(doc.querySelector(".featured-track__artwork img").src, "https://shieldbearerusa.com/images/signal-room/let-my-people-go.jpg", "featured-release: artwork swapped");
  assertEqual(doc.getElementById("release-heading").textContent, "Let My People Go", "featured-release: title swapped");
  assertEqual(doc.querySelector(".featured-track__actions .btn--red").href, "https://www.youtube.com/watch?v=lmpg-vid", "featured-release: watch link swapped");
  assertEqual(doc.querySelector(".featured-track__actions .btn--ghost").href, "https://shieldbearerusa.com/song-meanings#let-my-people-go", "featured-release: meaning link slugified to clean URL");
  assertEqual(doc.querySelector(".featured-track__player").src, "https://www.youtube.com/embed/lmpg-vid", "featured-release: embed src swapped");
  assertEqual(doc.querySelector(".featured-track__lyrics-title").textContent, "Let My People Go Notes", "featured-release: notes title swapped");
  const notes = doc.querySelectorAll(".featured-track__lyrics-scroll p");
  assertEqual(notes.length, 3, "featured-release: songMeaning split into paragraphs");
  assertEqual(notes[0].textContent, "A cry that shook a nation.", "featured-release: first notes paragraph");
})();

// featured-release: missing JSON keeps static fallback
(async () => {
  const html = `<!doctype html><html><body>
    <article id="featured-release">
      <figure class="featured-track__artwork"><img src="static.jpg" alt="static"></figure>
      <h2 id="release-heading">Static Title</h2>
      <iframe class="featured-track__player" src="static-embed"></iframe>
      <div class="featured-track__actions"><a class="btn btn--red" href="static-watch">Watch</a><a class="btn btn--ghost" href="static-meaning">Read</a></div>
      <aside class="featured-track__lyrics"><h3 class="featured-track__lyrics-title">Static Notes</h3><div class="featured-track__lyrics-scroll"></div></aside>
    </article>
  </body></html>`;
  const dom = makeDom(html);
  // No featuredRelease in returned JSON
  installFetchShim(dom.window, { "site.json": { homepage: {} } });
  runScriptInWindow(dom.window, "js/featured-release.js");
  await flushMicrotasks();
  assertEqual(dom.window.document.getElementById("release-heading").textContent, "Static Title", "featured-release: missing data preserves static title");
  assertEqual(dom.window.document.querySelector(".featured-track__artwork img").src.split("/").pop(), "static.jpg", "featured-release: missing data preserves static artwork");
})();

// featured-release: fetch error keeps static fallback (no throw)
(async () => {
  const html = `<!doctype html><html><body>
    <article id="featured-release">
      <h2 id="release-heading">Static Title</h2>
    </article>
  </body></html>`;
  const dom = makeDom(html);
  installFetchShim(dom.window, { "site.json": new Error("network down") });
  runScriptInWindow(dom.window, "js/featured-release.js");
  await flushMicrotasks();
  assertEqual(dom.window.document.getElementById("release-heading").textContent, "Static Title", "featured-release: fetch error swallowed, static stays");
})();

// ----------------------------------------------------------------------
// song-meanings-augment.js
// ----------------------------------------------------------------------

(async () => {
  const html = `<!doctype html><html><body></body></html>`;
  const dom = makeDom(html);
  let appendedExtras = null;
  dom.window.appendSongDossiers = (extras) => { appendedExtras = extras; };
  installFetchShim(dom.window, {
    "site.json": {
      released: [
        {
          title: "Let My People Go",
          songId: "lmpg-vid",
          videoId: "lmpg-vid",
          artwork: "https://x/lmpg.jpg",
          sourceUrl: "https://www.youtube.com/watch?v=lmpg-vid",
          songMeaning: "Para one.\n\nPara two.",
          lyrics: "Go DOWN, Moses!",
          reference: "Exodus 5:1 | Exodus 7:16",
          scripture: { ref: "Exodus 5:1", quote: "Let my people go..." }
        },
        // Empty entry: skipped
        { title: "" },
        // Lyrics-and-meaning-empty entry: skipped
        { title: "Bare Title" }
      ]
    }
  });
  runScriptInWindow(dom.window, "js/song-meanings-augment.js");
  await flushMicrotasks();

  assert(Array.isArray(appendedExtras), "augmenter: called appendSongDossiers");
  assertEqual(appendedExtras.length, 1, "augmenter: skipped empty + bare entries");
  assertEqual(appendedExtras[0].id, "let-my-people-go", "augmenter: id slugified from title");
  assertEqual(appendedExtras[0].title, "Let My People Go", "augmenter: title carried");
  assertEqual(appendedExtras[0].lyrics, "Go DOWN, Moses!", "augmenter: lyrics carried");
  assertEqual(appendedExtras[0].meaning.length, 2, "augmenter: meaning split into paragraphs");
  assertEqual(appendedExtras[0].thesis, "Para one.", "augmenter: thesis = first paragraph of meaning");
  assertEqual(appendedExtras[0].artwork, "https://x/lmpg.jpg", "augmenter: artwork carried");
  assertEqual(appendedExtras[0].actions.youtube, "https://www.youtube.com/watch?v=lmpg-vid", "augmenter: youtube action set");
  assertEqual(appendedExtras[0].reference, "Exodus 5:1 | Exodus 7:16", "augmenter: reference carried from site.json");
  assertEqual(appendedExtras[0].scripture.ref, "Exodus 5:1", "augmenter: scripture.ref carried");
  assertEqual(appendedExtras[0].scripture.quote, "Let my people go...", "augmenter: scripture.quote carried");
})();

// song-meanings-augment: bails out gracefully when hook is absent
(async () => {
  const html = `<!doctype html><html><body></body></html>`;
  const dom = makeDom(html);
  // Don't define appendSongDossiers
  installFetchShim(dom.window, { "site.json": { released: [{ title: "X", lyrics: "y" }] } });
  let threw = false;
  try {
    runScriptInWindow(dom.window, "js/song-meanings-augment.js");
    await flushMicrotasks();
  } catch (e) { threw = true; }
  assert(!threw, "augmenter: no hook -> silent no-op (does not throw)");
})();

// song-meanings-augment: derives artwork from videoId when not provided
(async () => {
  const html = `<!doctype html><html><body></body></html>`;
  const dom = makeDom(html);
  let appendedExtras = null;
  dom.window.appendSongDossiers = (extras) => { appendedExtras = extras; };
  installFetchShim(dom.window, {
    "site.json": {
      released: [{
        title: "X",
        videoId: "ABC123",
        lyrics: "lyric",
        songMeaning: "meaning"
      }]
    }
  });
  runScriptInWindow(dom.window, "js/song-meanings-augment.js");
  await flushMicrotasks();
  assertEqual(appendedExtras[0].artwork, "https://img.youtube.com/vi/ABC123/hqdefault.jpg", "augmenter: artwork falls back to youtube hqdefault");
  assertEqual(appendedExtras[0].actions.youtube, "https://www.youtube.com/watch?v=ABC123", "augmenter: youtube action falls back to videoId watch URL");
})();

// ----------------------------------------------------------------------
// merch-rotator.js
// ----------------------------------------------------------------------

(async () => {
  const html = `<!doctype html><html><body>
    <a class="featured-merch-art" href="https://shop/static" target="_blank">
      <img src="images/logo-tee.webp" alt="Static tee">
    </a>
    <div class="featured-merch-copy">
      <h2 id="featured-merch-heading">Static Tee</h2>
      <p>Clean black tee with the Shieldbearer mark front and center.</p>
      <a class="btn" href="https://shop">Wear the Banner</a>
    </div>
  </body></html>`;
  const dom = makeDom(html);
  // Force the random pick to be deterministic
  dom.window.Math.random = () => 0;
  dom.window.SHIELDBEARER_CONFIG = {
    merch: {
      rotate: true,
      source: "data/merch.json",
      fallback: { alt: "Shieldbearer merch" }
    }
  };
  installFetchShim(dom.window, {
    "data/merch.json": {
      products: [
        { title: "Snapback Hat", url: "https://shop/snapback", image: "https://cdn.shopify.com/snap.jpg", description: "Low-profile snapback. Made for the watch." },
        { title: "Other", url: "https://shop/other", image: "https://cdn.shopify.com/other.jpg", description: "Other description." }
      ]
    }
  });
  runScriptInWindow(dom.window, "js/merch-rotator.js");
  await flushMicrotasks();

  const doc = dom.window.document;
  assertEqual(doc.querySelector(".featured-merch-art img").src, "https://cdn.shopify.com/snap.jpg", "merch: image src swapped");
  assertEqual(doc.querySelector(".featured-merch-art img").alt, "Snapback Hat", "merch: alt set to title");
  assertEqual(doc.getElementById("featured-merch-heading").textContent, "Snapback Hat", "merch: heading swapped");
  assertEqual(doc.querySelector(".featured-merch-copy p").textContent, "Low-profile snapback. Made for the watch.", "merch: description swapped from JSON");
  assertEqual(doc.querySelector("a.featured-merch-art").href, "https://shop/snapback", "merch: art link swapped to product url");
  assertEqual(doc.querySelector(".featured-merch-copy .btn").href, "https://shop/", "merch: button stays at shop home (split-link behavior)");
})();

// merch-rotator: missing description falls back to generic line
(async () => {
  const html = `<!doctype html><html><body>
    <a class="featured-merch-art" href="https://shop"><img src="static.jpg" alt="static"></a>
    <div class="featured-merch-copy">
      <h2 id="featured-merch-heading">Static</h2>
      <p>Clean black tee with the Shieldbearer mark front and center.</p>
      <a class="btn" href="https://shop"></a>
    </div>
  </body></html>`;
  const dom = makeDom(html);
  dom.window.Math.random = () => 0;
  dom.window.SHIELDBEARER_CONFIG = { merch: { rotate: true, source: "data/merch.json" } };
  installFetchShim(dom.window, {
    "data/merch.json": {
      products: [{ title: "No Desc Product", url: "https://shop/x", image: "https://cdn.shopify.com/x.jpg" }]
    }
  });
  runScriptInWindow(dom.window, "js/merch-rotator.js");
  await flushMicrotasks();
  const desc = dom.window.document.querySelector(".featured-merch-copy p").textContent;
  assert(/conviction/i.test(desc), "merch: missing description falls back to generic line about conviction/mission");
  assert(!/Clean black tee/.test(desc), "merch: missing description does NOT keep the tee-specific static copy");
})();

// merch-rotator: rotate=false short-circuits
(async () => {
  const html = `<!doctype html><html><body>
    <a class="featured-merch-art" href="https://shop"><img src="static.jpg" alt="static"></a>
    <h2 id="featured-merch-heading">Static</h2>
    <div class="featured-merch-copy"><a class="btn" href="https://shop"></a></div>
  </body></html>`;
  const dom = makeDom(html);
  dom.window.SHIELDBEARER_CONFIG = { merch: { rotate: false, source: "data/merch.json" } };
  let fetchCalled = false;
  dom.window.fetch = () => { fetchCalled = true; return Promise.resolve({ ok: true, json: () => Promise.resolve({}) }); };
  runScriptInWindow(dom.window, "js/merch-rotator.js");
  await flushMicrotasks();
  assert(!fetchCalled, "merch: rotate=false skips fetch entirely");
  assertEqual(dom.window.document.getElementById("featured-merch-heading").textContent, "Static", "merch: rotate=false preserves static heading");
})();

// merch-rotator: empty product list keeps static
(async () => {
  const html = `<!doctype html><html><body>
    <a class="featured-merch-art" href="https://shop"><img src="static.jpg" alt="static"></a>
    <h2 id="featured-merch-heading">Static</h2>
    <div class="featured-merch-copy"><a class="btn" href="https://shop"></a></div>
  </body></html>`;
  const dom = makeDom(html);
  dom.window.SHIELDBEARER_CONFIG = { merch: { rotate: true, source: "data/merch.json" } };
  installFetchShim(dom.window, { "data/merch.json": { products: [] } });
  runScriptInWindow(dom.window, "js/merch-rotator.js");
  await flushMicrotasks();
  assertEqual(dom.window.document.getElementById("featured-merch-heading").textContent, "Static", "merch: empty product list preserves static");
})();

// ----------------------------------------------------------------------
// signal-countdown.js
// ----------------------------------------------------------------------

(async () => {
  // Helper: build a minimal countdown DOM and a fake localStorage so
  // each test runs against a clean state.
  function makeCountdownDom(config) {
    const html = `<!doctype html><html><body>
      <div id="signal-countdown">
        <span id="cd-days">--</span>
        <span id="cd-hours">--</span>
        <span id="cd-mins">--</span>
        <span id="cd-secs">--</span>
      </div>
    </body></html>`;
    const dom = makeDom(html);
    dom.window.SHIELDBEARER_CONFIG = { signalCountdown: config };
    // jsdom ships its own localStorage, but reset it for each test.
    try { dom.window.localStorage.clear(); } catch (e) {}
    return dom;
  }

  // Rolling mode: empty storage seeds a target ~7 days out and renders
  // the countdown immediately.
  {
    const dom = makeCountdownDom({
      enabled: true,
      resetDays: 7,
      fixedTarget: null,
      storageKey: "test-key-1"
    });
    runScriptInWindow(dom.window, "js/signal-countdown.js");
    await flushMicrotasks();
    const days = parseInt(dom.window.document.getElementById("cd-days").textContent, 10);
    assert(days >= 6 && days <= 7, "countdown rolling: days near 7 on first render");
    const stored = dom.window.localStorage.getItem("test-key-1");
    assert(stored && Number.isFinite(parseInt(stored, 10)), "countdown rolling: storage seeded with numeric target");
  }

  // Rolling mode: stored target in the past triggers reset to a new
  // window. Past target should be replaced.
  {
    const dom = makeCountdownDom({
      enabled: true,
      resetDays: 3,
      fixedTarget: null,
      storageKey: "test-key-2"
    });
    const longAgo = Date.now() - (10 * 24 * 60 * 60 * 1000);
    dom.window.localStorage.setItem("test-key-2", String(longAgo));
    runScriptInWindow(dom.window, "js/signal-countdown.js");
    await flushMicrotasks();
    const stored = parseInt(dom.window.localStorage.getItem("test-key-2"), 10);
    assert(stored > Date.now(), "countdown rolling: expired target replaced with future target");
  }

  // Fixed-target mode: reads ISO date from config and ignores
  // localStorage.
  {
    const future = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
    const dom = makeCountdownDom({
      enabled: true,
      resetDays: 7,
      fixedTarget: future,
      storageKey: "test-key-3"
    });
    runScriptInWindow(dom.window, "js/signal-countdown.js");
    await flushMicrotasks();
    const days = parseInt(dom.window.document.getElementById("cd-days").textContent, 10);
    assert(days >= 4 && days <= 5, "countdown fixed-target: shows ~5 days out");
    const stored = dom.window.localStorage.getItem("test-key-3");
    assertEqual(stored, null, "countdown fixed-target: localStorage NOT touched");
  }

  // Fixed-target mode with invalid date string: falls back to rolling.
  {
    const dom = makeCountdownDom({
      enabled: true,
      resetDays: 7,
      fixedTarget: "not-a-date",
      storageKey: "test-key-4"
    });
    runScriptInWindow(dom.window, "js/signal-countdown.js");
    await flushMicrotasks();
    const stored = dom.window.localStorage.getItem("test-key-4");
    assert(stored && parseInt(stored, 10) > Date.now(), "countdown invalid fixed-target: falls back to rolling");
  }

  // Disabled mode: no DOM mutation.
  {
    const dom = makeCountdownDom({
      enabled: false,
      resetDays: 7,
      fixedTarget: null,
      storageKey: "test-key-5"
    });
    runScriptInWindow(dom.window, "js/signal-countdown.js");
    await flushMicrotasks();
    assertEqual(dom.window.document.getElementById("cd-days").textContent, "--", "countdown disabled: leaves DOM untouched");
    assertEqual(dom.window.localStorage.getItem("test-key-5"), null, "countdown disabled: storage untouched");
  }

  // Fixed-target in the past: clamps to zero across all units.
  {
    const past = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const dom = makeCountdownDom({
      enabled: true,
      resetDays: 7,
      fixedTarget: past,
      storageKey: "test-key-past"
    });
    runScriptInWindow(dom.window, "js/signal-countdown.js");
    await flushMicrotasks();
    assertEqual(dom.window.document.getElementById("cd-days").textContent, "00", "countdown past fixed-target: days clamped to 00");
    assertEqual(dom.window.document.getElementById("cd-secs").textContent, "00", "countdown past fixed-target: secs clamped to 00");
  }

  // Container missing: no crash even if the DOM doesn't have the
  // countdown elements (e.g. running on a page that's not Signal Room).
  {
    const dom = makeDom(`<!doctype html><html><body></body></html>`);
    dom.window.SHIELDBEARER_CONFIG = {
      signalCountdown: { enabled: true, resetDays: 7, fixedTarget: null, storageKey: "test-key-6" }
    };
    let threw = false;
    try {
      runScriptInWindow(dom.window, "js/signal-countdown.js");
      await flushMicrotasks();
    } catch (e) { threw = true; }
    assert(!threw, "countdown: silent no-op when #signal-countdown is absent");
  }
})();

// ----------------------------------------------------------------------
// main.js: nav-link injection (the bug that prompted these tests).
// On a clean URL like /contact, the injected Release Timeline link
// must be an absolute path (/timeline). Relative would resolve to
// /contact/timeline which would 404.
// ----------------------------------------------------------------------

(async () => {
  // Minimal page that mirrors what main.js's nav-injection helpers
  // expect to find: a desktop nav with a music dropdown and a
  // mobile menu containing a music link.
  const html = `<!doctype html><html><body>
    <nav>
      <ul class="nav-links">
        <li class="nav-dropdown"><a href="/music">Music</a>
          <ul><li><a href="/song-meanings">Lyrics</a></li></ul>
        </li>
        <li class="nav-dropdown"><a href="/manifesto">Words</a>
          <ul><li><a href="/open-letter">Open Letter</a></li></ul>
        </li>
      </ul>
    </nav>
    <div class="mob-menu" id="mobMenu">
      <a href="/music">Music</a>
      <a href="/manifesto">Words</a>
      <a href="/open-letter">Open Letter</a>
    </div>
  </body></html>`;
  // Pretend we're on a subfolder route. This is exactly the case
  // where a relative href like 'timeline.html' would silently break.
  const dom = new JSDOM(html, {
    url: "https://shieldbearerusa.com/contact/",
    runScripts: "outside-only"
  });
  dom.window.window = dom.window;
  dom.window._sentinelOwnerDom = dom;
  // sbTrack is a global created by analytics.js; main.js calls it.
  dom.window.sbTrack = function () {};
  runScriptInWindow(dom.window, "js/main.js");
  await flushMicrotasks();

  const doc = dom.window.document;
  const allInjectedHrefs = Array.from(doc.querySelectorAll(".nav-links a, .mob-menu a"))
    .map((a) => a.getAttribute("href"))
    .filter(Boolean);

  // Every href must be absolute (start with /) so it works from any
  // page in the site, not just root-level pages.
  const relativeBads = allInjectedHrefs.filter(
    (h) => h && !h.startsWith("/") && !h.startsWith("http") && !h.startsWith("#") && !h.startsWith("mailto:") && !h.startsWith("tel:")
  );
  assertEqual(relativeBads, [], "main.js: no relative-path hrefs in nav after injection");

  const timelineLink = Array.from(doc.querySelectorAll("a")).find(
    (a) => a.textContent.trim() === "Release Timeline"
  );
  assert(timelineLink, "main.js: Release Timeline link injected");
  if (timelineLink) {
    assertEqual(timelineLink.getAttribute("href"), "/timeline", "main.js: Release Timeline href is absolute /timeline");
  }

  const signalRoomLink = Array.from(doc.querySelectorAll("a")).find(
    (a) => /signal\s+room/i.test(a.textContent)
  );
  if (signalRoomLink) {
    assertEqual(signalRoomLink.getAttribute("href"), "/signal-room", "main.js: Signal Room href is absolute /signal-room");
  }

  const gospelLink = Array.from(doc.querySelectorAll("a")).find(
    (a) => /gospel/i.test(a.textContent)
  );
  if (gospelLink) {
    assertEqual(gospelLink.getAttribute("href"), "/gospel", "main.js: Gospel href is absolute /gospel");
  }
})();

// ----------------------------------------------------------------------
// watch-posts.js
// ----------------------------------------------------------------------

// The Date used by the renderer is the browser's clock at run time.
// Tests use clearly-future and clearly-past dates so the
// upcoming/recent partition is unambiguous regardless of when
// the test runs.

(async () => {
  const html = `<!doctype html><html><body>
    <section id="watch-posts" class="watch-posts">
      <div class="watch-posts__inner">
        <h2>Watch Posts</h2>
        <h3 class="watch-posts__upcoming-heading">Upcoming</h3>
        <div class="watch-posts__upcoming-list"></div>
        <h3 class="watch-posts__recent-heading">Recent</h3>
        <div class="watch-posts__recent-list"></div>
      </div>
    </section>
  </body></html>`;
  const dom = makeDom(html);
  installFetchShim(dom.window, {
    "gigs.json": [
      // Far-future entries (Upcoming, must sort ascending)
      { date: "2099-12-31", venue: "Far Future Venue B", city: "City B", billing: "Solo set", note: "" },
      { date: "2099-06-15", venue: "Far Future Venue A", city: "City A", billing: "", note: "" },
      // Far-past entries (Recent, must sort descending, capped at 3)
      { date: "2000-04-01", venue: "Old Venue 1", city: "City 1", billing: "Bill 1", note: "Note 1" },
      { date: "2000-03-15", venue: "Old Venue 2", city: "City 2", billing: "", note: "" },
      { date: "2000-02-01", venue: "Old Venue 3", city: "City 3", billing: "Bill 3", note: "" },
      { date: "2000-01-01", venue: "Old Venue 4 (should be cut)", city: "City 4", billing: "", note: "" }
    ]
  });
  runScriptInWindow(dom.window, "js/watch-posts.js");
  await flushMicrotasks();

  const doc = dom.window.document;
  const upcomingEntries = doc.querySelectorAll(".watch-posts__upcoming-list .watch-post");
  const recentEntries = doc.querySelectorAll(".watch-posts__recent-list .watch-post");

  assertEqual(upcomingEntries.length, 2, "watch-posts: 2 upcoming entries rendered");
  assertEqual(recentEntries.length, 3, "watch-posts: recent capped at 3 (4th cut)");

  // Upcoming sorted ascending: June first, December second
  assert(
    upcomingEntries[0].textContent.includes("Far Future Venue A"),
    "watch-posts: upcoming sorted ascending (earliest date first)"
  );
  assert(
    upcomingEntries[1].textContent.includes("Far Future Venue B"),
    "watch-posts: upcoming second slot is later date"
  );

  // Recent sorted descending: April 1 first, March 15 second, Feb 1 third
  assert(
    recentEntries[0].textContent.includes("Old Venue 1"),
    "watch-posts: recent sorted descending (most recent first)"
  );
  assert(
    recentEntries[2].textContent.includes("Old Venue 3"),
    "watch-posts: recent third slot is oldest of the kept three"
  );

  // Date format: MONTH DD, YYYY (uppercase, zero-padded day)
  assert(
    upcomingEntries[0].textContent.includes("JUNE 15, 2099"),
    "watch-posts: date formatted as 'JUNE 15, 2099'"
  );

  // Billing line rendered when present, skipped when empty
  assert(
    upcomingEntries[0].querySelector(".watch-post__billing") === null,
    "watch-posts: billing line skipped when empty"
  );
  assert(
    upcomingEntries[1].querySelector(".watch-post__billing").textContent === "Solo set",
    "watch-posts: billing line rendered when present"
  );

  // Note line rendered when present, skipped when empty
  assert(
    recentEntries[0].querySelector(".watch-post__note").textContent === "Note 1",
    "watch-posts: note line rendered when present"
  );
  assert(
    recentEntries[1].querySelector(".watch-post__note") === null,
    "watch-posts: note line skipped when empty"
  );

  // Venue + city joined with ', '
  assert(
    upcomingEntries[0].querySelector(".watch-post__venue").textContent === "Far Future Venue A, City A",
    "watch-posts: venue and city joined with comma"
  );
})();

// watch-posts: hides the upcoming subheading when no upcoming entries
(async () => {
  const html = `<!doctype html><html><body>
    <section id="watch-posts">
      <h3 class="watch-posts__upcoming-heading">Upcoming</h3>
      <div class="watch-posts__upcoming-list"></div>
      <h3 class="watch-posts__recent-heading">Recent</h3>
      <div class="watch-posts__recent-list"></div>
    </section>
  </body></html>`;
  const dom = makeDom(html);
  installFetchShim(dom.window, {
    "gigs.json": [
      { date: "2000-01-01", venue: "Old", city: "X", billing: "", note: "" }
    ]
  });
  runScriptInWindow(dom.window, "js/watch-posts.js");
  await flushMicrotasks();

  const doc = dom.window.document;
  assertEqual(
    doc.querySelector(".watch-posts__upcoming-heading").style.display,
    "none",
    "watch-posts: upcoming heading hidden when no upcoming entries"
  );
  assert(
    doc.querySelector(".watch-posts__recent-heading").style.display !== "none",
    "watch-posts: recent heading visible when recent entries exist"
  );
})();

// watch-posts: hides the whole section when both buckets empty
(async () => {
  const html = `<!doctype html><html><body>
    <section id="watch-posts">
      <h3 class="watch-posts__upcoming-heading">Upcoming</h3>
      <div class="watch-posts__upcoming-list"></div>
      <h3 class="watch-posts__recent-heading">Recent</h3>
      <div class="watch-posts__recent-list"></div>
    </section>
  </body></html>`;
  const dom = makeDom(html);
  installFetchShim(dom.window, { "gigs.json": [] });
  runScriptInWindow(dom.window, "js/watch-posts.js");
  await flushMicrotasks();

  assertEqual(
    dom.window.document.getElementById("watch-posts").style.display,
    "none",
    "watch-posts: whole section hidden when both buckets empty"
  );
})();

// watch-posts: hides the whole section on fetch failure
(async () => {
  const html = `<!doctype html><html><body>
    <section id="watch-posts">
      <h3 class="watch-posts__upcoming-heading">Upcoming</h3>
      <div class="watch-posts__upcoming-list"></div>
      <h3 class="watch-posts__recent-heading">Recent</h3>
      <div class="watch-posts__recent-list"></div>
    </section>
  </body></html>`;
  const dom = makeDom(html);
  installFetchShim(dom.window, { "gigs.json": new Error("simulated fetch failure") });
  runScriptInWindow(dom.window, "js/watch-posts.js");
  await flushMicrotasks();

  assertEqual(
    dom.window.document.getElementById("watch-posts").style.display,
    "none",
    "watch-posts: whole section hidden when fetch fails"
  );
})();

// watch-posts: bails out cleanly when section element is absent
(async () => {
  const html = `<!doctype html><html><body></body></html>`;
  const dom = makeDom(html);
  installFetchShim(dom.window, { "gigs.json": [{ date: "2099-01-01", venue: "X", city: "Y", billing: "", note: "" }] });
  let threw = false;
  try {
    runScriptInWindow(dom.window, "js/watch-posts.js");
    await flushMicrotasks();
  } catch (e) { threw = true; }
  assert(!threw, "watch-posts: silent no-op when #watch-posts is absent");
})();

// ----------------------------------------------------------------------
// scripture-links.js
// ----------------------------------------------------------------------

function makeScriptureDom(innerHtml, scriptureCfg) {
  // Helper specific to scripture-links tests. Wraps a body region in
  // a `data-scripture-links` container so the script's activation
  // selector picks it up. Optional `scriptureCfg` object is assigned
  // to window.SHIELDBEARER_CONFIG.scripture so tests can verify the
  // version override (jsdom runs in outside-only mode, so head
  // <script> blocks don't execute and we must set globals directly).
  var html = `<!doctype html><html><head></head>` +
    `<body><div id="root" data-scripture-links>${innerHtml}</div></body></html>`;
  var dom = makeDom(html);
  if (scriptureCfg) {
    dom.window.SHIELDBEARER_CONFIG = { scripture: scriptureCfg };
  }
  return dom;
}

// Basic verse link: "Joshua 1:9" becomes an anchor.
(async () => {
  const dom = makeScriptureDom('<p>See Joshua 1:9 for the charge.</p>');
  runScriptInWindow(dom.window, "js/scripture-links.js");
  await flushMicrotasks();
  const a = dom.window.document.querySelector("a.scripture-link");
  assert(a !== null, "scripture-links: basic Joshua 1:9 becomes an anchor");
  if (a) {
    assertEqual(a.textContent, "Joshua 1:9", "scripture-links: anchor text matches ref verbatim");
    assert(a.href.includes("Joshua%201%3A9"), "scripture-links: href URL-encodes the ref via encodeURIComponent");
    assert(a.href.includes("version=ESV"), "scripture-links: default version is ESV");
    assertEqual(a.target, "_blank", "scripture-links: target=_blank");
    assertEqual(a.rel, "noopener", "scripture-links: rel=noopener");
  }
})();

// Verse range within a chapter: "Psalm 23:1-3" stays one link.
(async () => {
  const dom = makeScriptureDom('<p>Psalm 23:1-3 is the opening.</p>');
  runScriptInWindow(dom.window, "js/scripture-links.js");
  await flushMicrotasks();
  const links = dom.window.document.querySelectorAll("a.scripture-link");
  assertEqual(links.length, 1, "scripture-links: verse range produces one link");
  if (links[0]) assertEqual(links[0].textContent, "Psalm 23:1-3", "scripture-links: verse range text preserved");
})();

// Multi-word book name: "1 Corinthians 13:4" matches before "Corinthians".
(async () => {
  const dom = makeScriptureDom('<p>1 Corinthians 13:4 is love is patient.</p>');
  runScriptInWindow(dom.window, "js/scripture-links.js");
  await flushMicrotasks();
  const a = dom.window.document.querySelector("a.scripture-link");
  assert(a !== null, "scripture-links: 1 Corinthians multi-word book matches");
  if (a) assertEqual(a.textContent, "1 Corinthians 13:4", "scripture-links: multi-word book text includes the leading digit");
})();

// Chapter-only: "Acts 15" links to the whole chapter.
(async () => {
  const dom = makeScriptureDom('<p>Read Acts 15 for the council.</p>');
  runScriptInWindow(dom.window, "js/scripture-links.js");
  await flushMicrotasks();
  const a = dom.window.document.querySelector("a.scripture-link");
  assert(a !== null, "scripture-links: chapter-only Acts 15 links");
  if (a) assertEqual(a.textContent, "Acts 15", "scripture-links: chapter-only text preserved");
})();

// Chapter range: "Numbers 23-24" links (regression for v2.20.3 pre-check fix).
(async () => {
  const dom = makeScriptureDom('<p>A pagan diviner whom God forced to bless. Numbers 23-24.</p>');
  runScriptInWindow(dom.window, "js/scripture-links.js");
  await flushMicrotasks();
  const a = dom.window.document.querySelector("a.scripture-link");
  assert(a !== null, "scripture-links: chapter range Numbers 23-24 links");
  if (a) assertEqual(a.textContent, "Numbers 23-24", "scripture-links: chapter range text preserved");
})();

// Cross-chapter verse range: "Numbers 23:1-24:5".
(async () => {
  const dom = makeScriptureDom('<p>Numbers 23:1-24:5 covers the oracle.</p>');
  runScriptInWindow(dom.window, "js/scripture-links.js");
  await flushMicrotasks();
  const a = dom.window.document.querySelector("a.scripture-link");
  assert(a !== null, "scripture-links: cross-chapter verse range links");
  if (a) assertEqual(a.textContent, "Numbers 23:1-24:5", "scripture-links: cross-chapter text preserved");
})();

// Verse letter suffix: "Romans 5:12a".
(async () => {
  const dom = makeScriptureDom('<p>Romans 5:12a is the first clause.</p>');
  runScriptInWindow(dom.window, "js/scripture-links.js");
  await flushMicrotasks();
  const a = dom.window.document.querySelector("a.scripture-link");
  assert(a !== null, "scripture-links: verse-letter suffix links");
  if (a) assertEqual(a.textContent, "Romans 5:12a", "scripture-links: verse-letter suffix preserved");
})();

// Case-sensitivity false-positive defense: lowercase common noun.
(async () => {
  const dom = makeScriptureDom('<p>the numbers 23 and 24 were posted.</p>');
  runScriptInWindow(dom.window, "js/scripture-links.js");
  await flushMicrotasks();
  const links = dom.window.document.querySelectorAll("a.scripture-link");
  assertEqual(links.length, 0, "scripture-links: lowercase 'numbers' does not false-match");
})();

// Multiple refs in one paragraph: each becomes its own anchor.
(async () => {
  const dom = makeScriptureDom('<p>See John 3:16, Romans 5:8, and 1 John 4:9 together.</p>');
  runScriptInWindow(dom.window, "js/scripture-links.js");
  await flushMicrotasks();
  const links = dom.window.document.querySelectorAll("a.scripture-link");
  assertEqual(links.length, 3, "scripture-links: three refs in one paragraph yield three anchors");
})();

// Skip text inside an existing <a>: the linker leaves manual anchors alone.
(async () => {
  const dom = makeScriptureDom('<p>See <a href="/other">John 3:16</a> already linked.</p>');
  runScriptInWindow(dom.window, "js/scripture-links.js");
  await flushMicrotasks();
  // The existing anchor must NOT be wrapped in another scripture-link.
  const insideAnchor = dom.window.document.querySelector('a[href="/other"] a.scripture-link');
  assert(insideAnchor === null, "scripture-links: does not nest inside existing anchor");
})();

// Skip text inside <code>.
(async () => {
  const dom = makeScriptureDom('<p>Inline <code>John 3:16</code> in code.</p>');
  runScriptInWindow(dom.window, "js/scripture-links.js");
  await flushMicrotasks();
  const links = dom.window.document.querySelectorAll("a.scripture-link");
  assertEqual(links.length, 0, "scripture-links: <code> contents not linked");
})();

// Skip elements with .no-scripture-link.
(async () => {
  const dom = makeScriptureDom('<p class="no-scripture-link">Quiet zone: John 3:16 should NOT link.</p>');
  runScriptInWindow(dom.window, "js/scripture-links.js");
  await flushMicrotasks();
  const links = dom.window.document.querySelectorAll("a.scripture-link");
  assertEqual(links.length, 0, "scripture-links: .no-scripture-link skipped");
})();

// Existing biblegateway anchor (e.g. /gatekeeping KJV link) gets the
// .scripture-link class added without rewriting its href.
(async () => {
  const dom = makeScriptureDom(
    '<p>(<a href="https://www.biblegateway.com/passage/?search=John+14%3A6&amp;version=KJV">John 14:6, KJV</a>)</p>'
  );
  runScriptInWindow(dom.window, "js/scripture-links.js");
  await flushMicrotasks();
  const a = dom.window.document.querySelector('a[href*="biblegateway.com"]');
  assert(a !== null, "scripture-links: existing biblegateway anchor still present");
  if (a) {
    assert(a.classList.contains("scripture-link"), "scripture-links: existing biblegateway anchor gets .scripture-link class");
    assert(a.href.includes("version=KJV"), "scripture-links: existing biblegateway href is NOT rewritten (KJV preserved)");
    assertEqual(a.target, "_blank", "scripture-links: existing anchor gets target=_blank if missing");
    assertEqual(a.rel, "noopener", "scripture-links: existing anchor gets rel=noopener if missing");
  }
})();

// Re-running the styler on an already-classed anchor must not double up.
(async () => {
  const dom = makeScriptureDom(
    '<p><a class="scripture-link" href="https://www.biblegateway.com/passage/?search=John+3%3A16&amp;version=ESV">John 3:16</a></p>'
  );
  runScriptInWindow(dom.window, "js/scripture-links.js");
  await flushMicrotasks();
  const a = dom.window.document.querySelector('a.scripture-link');
  if (a) {
    // The class list should still contain scripture-link exactly once.
    const count = Array.prototype.filter.call(a.classList, function (c) { return c === "scripture-link"; }).length;
    assertEqual(count, 1, "scripture-links: existing .scripture-link class not duplicated");
  }
})();

// Version override via SHIELDBEARER_CONFIG.scripture.version.
(async () => {
  const dom = makeScriptureDom(
    '<p>John 3:16 is the verse.</p>',
    { version: "NIV" }
  );
  runScriptInWindow(dom.window, "js/scripture-links.js");
  await flushMicrotasks();
  const a = dom.window.document.querySelector("a.scripture-link");
  assert(a !== null, "scripture-links: version override -- anchor still produced");
  if (a) {
    assert(a.href.includes("version=NIV"), "scripture-links: version override pushes NIV into href");
    assertEqual(a.getAttribute("data-version"), "NIV", "scripture-links: data-version attr reflects override");
  }
})();

// No activation root means no work: a page with neither data-scripture-links
// nor .scripture-linked does nothing.
(async () => {
  const html = `<!doctype html><html><body><p>John 3:16 is the verse.</p></body></html>`;
  const dom = makeDom(html);
  runScriptInWindow(dom.window, "js/scripture-links.js");
  await flushMicrotasks();
  const links = dom.window.document.querySelectorAll("a.scripture-link");
  assertEqual(links.length, 0, "scripture-links: no activation root, no links");
})();

// Number-only without a book name: no false match.
(async () => {
  const dom = makeScriptureDom('<p>Final score: 5:12 -- a real nail-biter.</p>');
  runScriptInWindow(dom.window, "js/scripture-links.js");
  await flushMicrotasks();
  const links = dom.window.document.querySelectorAll("a.scripture-link");
  assertEqual(links.length, 0, "scripture-links: '5:12' without book name does not match");
})();

// MutationObserver picks up content added after initial DOMContentLoaded.
// Important for /song-meanings dossiers and any JS-rendered card.
(async () => {
  const dom = makeScriptureDom('<p>seed</p>');
  runScriptInWindow(dom.window, "js/scripture-links.js");
  await flushMicrotasks();
  // Inject a new paragraph with a scripture ref.
  const newP = dom.window.document.createElement("p");
  newP.textContent = "Inserted after load: Hebrews 11:1 is faith.";
  dom.window.document.getElementById("root").appendChild(newP);
  // Wait past the 200ms debounce.
  await new Promise((r) => setTimeout(r, 300));
  await flushMicrotasks();
  const links = dom.window.document.querySelectorAll("a.scripture-link");
  assert(links.length >= 1, "scripture-links: MutationObserver re-scans after DOM insert");
  const found = Array.prototype.some.call(links, function (a) { return a.textContent === "Hebrews 11:1"; });
  assert(found, "scripture-links: dynamically inserted ref gets linked");
})();

// Comma-separated list: "John 14:26, Ephesians 1:13-14" -- each gets linked.
(async () => {
  const dom = makeScriptureDom('<p>Compare John 14:26, Ephesians 1:13-14, and Romans 8:9.</p>');
  runScriptInWindow(dom.window, "js/scripture-links.js");
  await flushMicrotasks();
  const links = dom.window.document.querySelectorAll("a.scripture-link");
  assertEqual(links.length, 3, "scripture-links: three comma-separated refs each linked");
})();

// ----------------------------------------------------------------------
// signal-room-home.js
// ----------------------------------------------------------------------

// Homepage Signal Room countdown ticks even when comingSoon is empty.
// Regression test for the bug where the countdown stayed hidden
// because activate() returned early on empty comingSoon, never
// reaching the startCountdown call.
(async () => {
  const html = `<!doctype html><html><body>
    <section data-signal-room>
      <span data-sr-eyebrow>Signal Room</span>
      <h2 data-sr-title>Static Title</h2>
      <p data-sr-copy>Static copy</p>
      <img data-sr-art src="static.jpg" alt="static">
      <a data-sr-cta href="/signal-room">CTA</a>
      <div data-sr-countdown>
        <span><b data-sr-d>00</b> d</span>
        <span><b data-sr-h>00</b> h</span>
        <span><b data-sr-m>00</b> m</span>
        <span><b data-sr-s>00</b> s</span>
      </div>
    </section>
  </body></html>`;
  const dom = makeDom(html);
  // Fixed target 3 days 4 hours 2 minutes out. The 2-minute buffer
  // absorbs sub-second drift between setting the target and the
  // script's first tick so the assertion is stable.
  const targetMs = Date.now() + (3 * 24 + 4) * 60 * 60 * 1000 + 2 * 60 * 1000;
  dom.window.SHIELDBEARER_CONFIG = {
    signalCountdown: {
      enabled: true,
      fixedTarget: new Date(targetMs).toISOString()
    }
  };
  // comingSoon empty -> activate() should NOT fire; but countdown
  // must still tick.
  installFetchShim(dom.window, { "site.json": { comingSoon: [] } });
  runScriptInWindow(dom.window, "js/signal-room-home.js");
  await flushMicrotasks();

  const cd = dom.window.document.querySelector("[data-sr-countdown]");
  assert(cd !== null, "signal-room-home: countdown element present");
  if (cd) {
    assertEqual(cd.hidden, false, "signal-room-home: countdown unhidden even when comingSoon empty");
    const d = dom.window.document.querySelector("[data-sr-d]").textContent;
    const h = dom.window.document.querySelector("[data-sr-h]").textContent;
    assertEqual(d, "03", "signal-room-home: days cell ticks to fixed target");
    assertEqual(h, "04", "signal-room-home: hours cell ticks to fixed target");
  }
})();

// When comingSoon has an entry, the full block activates AND the
// countdown still runs (was already wired before; covered here so
// the unconditional refactor did not break it).
(async () => {
  const html = `<!doctype html><html><body>
    <section data-signal-room>
      <span data-sr-eyebrow>Signal Room</span>
      <h2 data-sr-title>Static Title</h2>
      <p data-sr-copy>Static copy</p>
      <img data-sr-art src="static.jpg" alt="static">
      <a data-sr-cta href="/signal-room">CTA</a>
      <div data-sr-countdown>
        <span><b data-sr-d>00</b> d</span>
        <span><b data-sr-h>00</b> h</span>
        <span><b data-sr-m>00</b> m</span>
        <span><b data-sr-s>00</b> s</span>
      </div>
    </section>
  </body></html>`;
  const dom = makeDom(html);
  // 1 day 2 hours plus a 2-minute buffer for the same drift reason.
  const targetMs = Date.now() + (1 * 24 + 2) * 60 * 60 * 1000 + 2 * 60 * 1000;
  dom.window.SHIELDBEARER_CONFIG = {
    signalCountdown: { enabled: true, fixedTarget: new Date(targetMs).toISOString() }
  };
  installFetchShim(dom.window, {
    "site.json": { comingSoon: [{ title: "Next Song", stage: "writing", artwork: "next.jpg" }] }
  });
  runScriptInWindow(dom.window, "js/signal-room-home.js");
  await flushMicrotasks();

  const doc = dom.window.document;
  assertEqual(doc.querySelector("[data-sr-title]").textContent, "Next Song", "signal-room-home: comingSoon swaps title");
  assertEqual(doc.querySelector("[data-sr-eyebrow]").textContent, "Signal Room · Live", "signal-room-home: comingSoon promotes eyebrow to Live");
  assertEqual(doc.querySelector("[data-sr-cta]").getAttribute("data-state"), "active", "signal-room-home: cta state attr flipped to active");
  assertEqual(doc.querySelector("[data-sr-d]").textContent, "01", "signal-room-home: countdown still ticks when comingSoon populated");
})();

// ----------------------------------------------------------------------
setTimeout(() => {
  console.log("\n=========================================");
  console.log(`Website JS tests: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}, 600);

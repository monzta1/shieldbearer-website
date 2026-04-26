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
  assertEqual(doc.querySelector(".featured-track__actions .btn--ghost").href, "https://shieldbearerusa.com/song-meanings.html#let-my-people-go", "featured-release: meaning link slugified");
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
          lyrics: "Go DOWN, Moses!"
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
        { title: "Snapback Hat", url: "https://shop/snapback", image: "https://cdn.shopify.com/snap.jpg" },
        { title: "Other", url: "https://shop/other", image: "https://cdn.shopify.com/other.jpg" }
      ]
    }
  });
  runScriptInWindow(dom.window, "js/merch-rotator.js");
  await flushMicrotasks();

  const doc = dom.window.document;
  assertEqual(doc.querySelector(".featured-merch-art img").src, "https://cdn.shopify.com/snap.jpg", "merch: image src swapped");
  assertEqual(doc.querySelector(".featured-merch-art img").alt, "Snapback Hat", "merch: alt set to title");
  assertEqual(doc.getElementById("featured-merch-heading").textContent, "Snapback Hat", "merch: heading swapped");
  assertEqual(doc.querySelector("a.featured-merch-art").href, "https://shop/snapback", "merch: art link swapped to product url");
  assertEqual(doc.querySelector(".featured-merch-copy .btn").href, "https://shop/", "merch: button stays at shop home (split-link behavior)");
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
setTimeout(() => {
  console.log("\n=========================================");
  console.log(`Website JS tests: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}, 200);

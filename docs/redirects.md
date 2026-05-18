# Legacy .html redirects

The site moved from `/page.html` to clean `/page` around Apr 22-25,
2026. Old URLs still draw search and backlink traffic. This is how
that traffic gets sent to the new pages, and why the obvious
approach does not work here.

## Why in-repo redirect stubs do NOT work on this site

The first attempt replaced each `page.html` with a small redirect
stub (canonical + meta refresh + JS replace). It was shipped in
v2.13.0 and reverted in the next commit because it broke the live
site.

Reason: on this GitHub Pages setup, a request for the bare clean
URL `/music` is served by the static file `music.html`. The
directory file `music/index.html` only answers `/music/` with a
trailing slash. The whole site, every canonical tag, and Google's
index all use the no-slash form `/music`. That is the parity test's
entire purpose: `page.html` and `page/index.html` must stay
byte-identical because GitHub Pages can serve either one.

A static file cannot return different content based on whether the
request was `/music` or `/music.html`. They resolve to the same
file. So a stub at `music.html` makes the real clean URL `/music`
serve the stub. Confirmed live: `/music`, `/song-meanings`,
`/timeline`, `/faq` all returned the stub body until the revert.

Do not reintroduce in-repo stubs. The redirect has to happen at the
edge, where the actual requested path is visible.

## The only correct mechanism: Cloudflare Worker (true 301)

`tools/cloudflare-redirect-worker.js` issues a real 301 at the
Cloudflare edge and only acts on the explicit `.html` paths, so the
clean URLs are untouched. Deploy steps, assuming Cloudflare is in
front of shieldbearerusa.com:

1. Cloudflare dashboard -> Workers and Pages -> Create Worker.
2. Paste the contents of `tools/cloudflare-redirect-worker.js`.
   Deploy it.
3. Workers Routes -> add route `shieldbearerusa.com/*` -> the
   worker. The worker only rewrites the mapped `.html` paths and
   passes everything else through with `fetch`, so clean URLs and
   the directory indexes are unaffected.
4. Verify with curl:

   ```
   curl -sI https://shieldbearerusa.com/music.html
   # expect: HTTP/2 301, location: https://shieldbearerusa.com/music

   curl -sI https://shieldbearerusa.com/music
   # expect: HTTP/2 200, the real page (NOT a redirect, NOT a stub)
   ```

   Both checks matter. The second one is the check that the stub
   approach failed.

The Worker map also handles `/index.html -> /` and
`/press.html -> /interviews`, which an in-repo file never could.

## Until the Worker is deployed

The legacy `.html` files stay as byte-identical mirrors of their
clean URL (the original, working state). Old `.html` links keep
serving the full page rather than redirecting. That is not ideal
for SEO consolidation, but it is correct and not broken. The
canonical tags already on every page point search engines at the
clean URL, so ranking signal still consolidates. The Worker is the
upgrade from "works" to "true 301," and it is the only safe way to
get there on this hosting.

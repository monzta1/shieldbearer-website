# Legacy .html redirects

The site moved from `/page.html` to clean `/page` around Apr 22-25,
2026. Old URLs still draw search and backlink traffic. This is how
that traffic gets sent to the new pages.

## What is live now (in-repo, no external infra)

Every legacy path in the redirect set is a stub HTML file at the
repo root. Each stub carries:

- `<link rel="canonical">` to the clean URL, so Google consolidates
  ranking signals onto the new page.
- `<meta name="robots" content="noindex, follow">`, so the stub
  drops out of the index and the crawler follows to the clean URL.
- `<meta http-equiv="refresh">` and `location.replace()`, so a
  visitor lands on the clean URL with no visible stop.

The real page content for each one lives at `page/index.html`,
which GitHub Pages serves for the clean URL. The stub never touches
that.

Stubbed paths: music, timeline, faq, song-meanings, creed, about,
contact, interviews, process, videos, manifesto, sentinelbot.

This is a soft redirect. It consolidates SEO and moves the visitor,
but it is not a true HTTP 301. For a true 301, deploy the Worker.

## True 301 (deploy when ready)

`tools/cloudflare-redirect-worker.js` issues a real 301 at the
Cloudflare edge. Deploy steps, assuming Cloudflare is in front of
shieldbearerusa.com:

1. Cloudflare dashboard -> Workers and Pages -> Create Worker.
2. Paste the contents of `tools/cloudflare-redirect-worker.js`.
   Deploy it.
3. Workers Routes -> add route `shieldbearerusa.com/*` -> the
   worker. (A `/*` route is fine; the worker only acts on the
   mapped paths and passes everything else through with `fetch`.)
4. Verify with curl:

   ```
   curl -I https://shieldbearerusa.com/music.html
   # expect: HTTP/2 301, location: https://shieldbearerusa.com/music
   ```

5. Once the 301 is confirmed for every mapped path, the in-repo
   stubs can be deleted from the repo. The Worker covers them. Do
   the curl check first.

The Worker map also handles `/index.html -> /` and
`/press.html -> /interviews`, which the in-repo stubs cannot
(index.html is the homepage; press.html does not exist as a file).

## Verifying the soft redirect today

```
curl -s https://shieldbearerusa.com/music.html | grep -E 'canonical|refresh|replace'
```

Should show the canonical to `/music`, the meta refresh, and the
JS replace.

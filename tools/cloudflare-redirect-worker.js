/* =============================================================
   Shieldbearer legacy .html -> clean URL, true 301.

   GitHub Pages cannot issue a real 301, so the in-repo stubs use
   canonical + meta refresh + JS replace (good enough for SEO
   consolidation, but a soft redirect). This Worker issues a real
   301 at the Cloudflare edge. Deploy it when Cloudflare is in
   front of shieldbearerusa.com. Steps are in docs/redirects.md.
   ============================================================= */

const REDIRECTS = {
  '/music.html': '/music',
  '/timeline.html': '/timeline',
  '/faq.html': '/faq',
  '/song-meanings.html': '/song-meanings',
  '/creed.html': '/creed',
  '/about.html': '/about',
  '/contact.html': '/contact',
  '/interviews.html': '/interviews',
  '/press.html': '/interviews',
  '/index.html': '/',
  '/process.html': '/process',
  '/videos.html': '/videos',
  '/manifesto.html': '/manifesto',
  '/sentinelbot.html': '/sentinelbot'
};

addEventListener('fetch', (event) => {
  event.respondWith(handle(event.request));
});

async function handle(req) {
  const url = new URL(req.url);
  const target = REDIRECTS[url.pathname];
  if (target) {
    return Response.redirect(url.origin + target + url.search, 301);
  }
  return fetch(req);
}

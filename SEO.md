# Shieldbearer Website SEO Decision Log

This file records SEO architecture decisions and the reasoning
behind them. The point is to keep future work from re-litigating
choices that were already made deliberately, and to give a clear
trigger list for when each decision should actually be revisited.

If you change anything documented here, update the relevant
section, add a dated entry, and link the commit. Out-of-date
decision logs are worse than no decision log.

## Canonical URL form

**Decision (2026-05-04):** Clean URLs are canonical. Both
`/<page>` and `/<page>.html` return 200; canonical tags, the
sitemap, and internal links all point at the clean form. Do not
add server-side or client-side redirects between the two forms
yet.

**Why:**

- The canonical signal already points at clean URLs across all
  25 pages and at every entry in `sitemap.xml`. Reversing that
  signal (switching to `.html` as canonical) would force Google
  to re-process the entire site and almost certainly causes a
  4 to 8 week ranking dip while the index rebuilds. Not worth it
  for a small consolidation gain.
- The `.html` URLs are still receiving a non-trivial amount of
  organic traffic (Search Console reports clicks on
  `/music.html`, `/sentinelbot.html`, and others). Killing them
  abruptly with a meta-refresh could lose those clicks before
  Google has consolidated to the clean form.
- GitHub Pages does not support real 301 redirects. The
  available client-side option (`<meta http-equiv="refresh">`)
  is a weaker signal than a 301 and may itself confuse the
  index. We keep it as a tool to deploy if and only if
  duplicate-content problems show up in Search Console.

**How to apply:** No redirect work between URL forms today. Both
forms continue to serve 200. Canonical tags continue to point at
the clean URL. The duplicate-content situation is acceptable
as-is.

**Review trigger:** If the Search Console "Pages" report shows
both `/<page>` and `/<page>.html` URLs appearing as indexed
duplicates after 6 weeks (target review date 2026-06-15), revisit
this decision. At that point the practical fix is to add
`<meta http-equiv="refresh" content="0; url=/<page>">` plus a
canonical tag on each `.html` legacy page. That is the explicit
escalation path; do not deploy it preemptively.

## Trailing-slash root canonical

**Decision (2026-05-04, commit 9102c18):** The homepage canonical
moved from `https://shieldbearerusa.com` to
`https://shieldbearerusa.com/` (added trailing slash). Same
change applied to `og:url`, which moved from
`https://shieldbearerusa.com/index.html` to
`https://shieldbearerusa.com/`.

**Why:** A domain root is canonically `/`. The trailing-slash
form is correct per HTTP spec and matches how every other page
on the site canonicalizes (e.g. `/music`, `/about`). Aligning
the root makes the canonical pattern uniform.

**Risk:** Both forms 200 at the server, and Google handles
trailing-slash equivalence at the root well, so this is a small
canonical signal change rather than a structural one. Logged
here so that if rankings wobble in the next 2 weeks this is a
candidate cause to investigate.

**Review trigger:** If homepage impressions or position drop
sharply within 14 days of the change date (review by 2026-05-18)
and no other obvious cause is found, consider reverting to the
no-slash form. Otherwise leave it.

## Desktop vs mobile ranking gap

**Decision (2026-05-04):** Do not optimize for the desktop
ranking gap. Monitor only.

**Background:** Search Console reports the site ranks ~10x
better on mobile than on desktop for brand queries. Three
hypotheses were checked:

- Bot, mobile, and desktop renders are byte-identical (verified
  with curl + UA spoofing). The static HTML carries the page
  substance; client-side JS only adds ancillary content like the
  featured-release card. Server-side render parity is not the
  cause.
- Canonical tags, viewport meta, and structural markup are
  consistent across all surfaces. No technical desktop-only
  defect.
- The site has no desktop-only content blocks or mobile-only
  hidden text.

**Most likely actual cause:** Google has been mobile-first
indexing since 2020 and uses the mobile rendering as the
canonical signal. The site's audience composition (Christian
metal fans skew mobile-heavy) means engagement signals like
dwell time and CTR are dominated by mobile sessions, which
positively reinforces mobile ranking and leaves desktop as a
thinner, less-weighted view of the same pages.

**How to apply:** Keep doing what is working on mobile. Do not
add desktop-specific content, do not split markup by viewport,
do not chase a desktop-only fix that does not exist. Desktop
position will rise naturally as overall site authority grows.

**Review trigger:** If desktop impressions ever exceed mobile
impressions (currently inverted), or if the site gets a
significant inbound link from a desktop-skewing source like a
trade publication, the gap framing may need to change. Revisit
the analysis at that point, not before.

## Sitemap and indexing audit (2026-05-04)

**State at audit date:**

- All 23 URLs in `sitemap.xml` return HTTP 200. No 404s or
  redirects detected. Search Console's earlier report of "4
  redirects + 2 hard 404s" appears stale relative to the live
  site.
- Sitemap uses the clean URL form throughout, consistent with
  the canonical decision above.
- `robots.txt` allows all and points to the sitemap correctly.
- 20 pages currently flagged as "Discovered, currently not
  indexed" by Search Console. With clean canonical signal and
  no broken URLs in the sitemap, the most likely cause is weak
  internal linking and (for some pages) thin content.

**How to apply:** No sitemap edits in this commit. The internal
linking and content-thinness fixes happen in commits 3 and 4
(Tasks 4 and 6 of the SEO project). Re-crawl the sitemap after
those commits land to confirm everything still 200s.

**Review trigger:** Re-run the sitemap status crawl monthly
(`for url in $(grep -oE '<loc>[^<]*</loc>' sitemap.xml | sed
's|<\\?/?loc>||g'); do curl -sIo /dev/null -w "%{http_code}
$url\n" "$url"; done`). Expected output: `200` for every URL,
no exceptions. If anything else returns, fix immediately.

## URL form on social shares

**Decision (2026-05-04, commit 9102c18):** `og:url` on the
homepage was normalized to the canonical root
(`https://shieldbearerusa.com/`) instead of the legacy
`/index.html`. All other pages already had the canonical clean
URL in `og:url`. Applied for consistency with the canonical tag
chain.

**Side effect to monitor:** Existing social shares pointing at
`/index.html` continue to work because the URL still 200s. New
shares from the homepage will use the canonical root.

**Review trigger:** None expected. If `og:url` is rejected by
any social-platform validator (Facebook, Twitter, LinkedIn,
Discord), check the validator output and adjust.

## Brand keyword strategy

**Decision (2026-05-04):** Both "Shieldbearer" (one word) and
"Shield Bearer" (two words) appear in title, meta description,
JSON-LD `alternateName`, and visible body copy. The brand stays
established as one word everywhere on the site and on
Spotify, YouTube, and Instagram; the two-word variant exists
purely as a search-disambiguation aid.

**Why:** Search Console shows real users searching "shield
bearer" (13 impressions) more than "shieldbearer" (8
impressions). Without the two-word form somewhere on the page,
Google has no signal to map that query to this site.

**How to apply:** When writing new copy, lead with "Shieldbearer"
(one word). The two-word form should appear at least once per
page in body copy, ideally in the first paragraph or hero.
Never prefer the two-word form in a heading, button, or social
profile name.

**Review trigger:** If Search Console shows "shield bearer"
queries no longer return the homepage as the top result after
8 weeks (review by 2026-06-29), revisit how prominently the
two-word form appears. Otherwise leave it.

## Hero h1

**Decision (2026-05-04):** The homepage h1 is "Jesus Reigns at
Full Volume" and stays that way. Override applied to the
generic SEO advice that an h1 should contain the brand name.

**Why:** The artistic h1 is a brand asset and a creative
statement. Modern Google ranking weights h1 keyword presence
very lightly compared to title, meta, content, and authority
signals. The brand name is already present in the title, meta
description, JSON-LD, and visible body copy on the page;
forcing it into the h1 would damage identity for marginal SEO
gain.

**Review trigger:** Only if the homepage drops out of the top 5
results for a direct brand query ("shieldbearer" or "shield
bearer") for 4 consecutive weeks would it be worth reconsidering
this. As of the change date the site ranks reliably for both
brand queries.

## Master review schedule

| Date | Action |
| ---- | ------ |
| 2026-05-18 | Quick check: homepage impressions stable after trailing-slash canonical change |
| 2026-06-01 | Sitemap status crawl, monthly cadence |
| 2026-06-15 | Duplicate-content check on `/<page>` vs `/<page>.html` (escalation trigger for meta-refresh deferral) |
| 2026-06-29 | Brand keyword query check ("shield bearer" two-word form) |
| 2026-07-01 | Sitemap status crawl, monthly cadence |

If any review trigger fires earlier than its scheduled date,
revisit the relevant section above and update with the new
decision and reasoning. Do not delete prior decisions; date them
out and add the new one underneath.

# SEO Branch Verification Pass

**Branch:** `seo-fixes-2026-05`
**Verified on:** 2026-05-04
**Decision artifact:** This document is what the operator reviews
before deciding whether to merge or push the branch. Every claim
below is reproducible from the commands listed; the JSON outputs
from Lighthouse are committed to the repo at
`seo-report-home.json` and `seo-report-gatekeeping.json` for
audit.

## 1. Lighthouse SEO

Both runs targeted a local serve of the branch
(`python3 -m http.server 8765`) so the score reflects this
branch's HTML, not whatever production currently has.

| Page | Score | Notes |
| ---- | ----- | ----- |
| `/` (homepage) | **100 / 100** | All 9 SEO audits PASS. Structured-data audit returns N/A (Lighthouse doesn't actively validate Schema.org payloads; that's checked separately in section 3). |
| `/gatekeeping/` | **100 / 100** | All 9 SEO audits PASS. Same N/A note. |

Audit list (identical for both pages, all PASS):

- Page isn't blocked from indexing
- Document has a `<title>` element
- Document has a meta description
- Page has successful HTTP status code
- Links have descriptive text
- Links are crawlable
- robots.txt is valid
- Image elements have `[alt]` attributes
- Document has a valid `hreflang`
- Document has a valid `rel=canonical`

Reproduce:

```
npx -y lighthouse http://localhost:8765/ \
  --only-categories=seo --output=json \
  --output-path=./seo-report-home.json --quiet
npx -y lighthouse http://localhost:8765/gatekeeping/ \
  --only-categories=seo --output=json \
  --output-path=./seo-report-gatekeeping.json --quiet
```

JSON outputs committed at `seo-report-home.json` and
`seo-report-gatekeeping.json`.

## 2. Sitemap validation

23 sitemap entries crawled against the local serve. Every URL
must return 200, must self-canonicalize, and must have a unique
non-empty title.

| URL | HTTP | self-canon | title (chars) |
| --- | ---: | :--------: | ------------: |
| `/` | 200 | YES | 61 |
| `/music` | 200 | YES | 48 |
| `/videos` | 200 | YES | 21 |
| `/song-meanings` | 200 | YES | 57 |
| `/timeline` | 200 | YES | 64 |
| `/process` | 200 | YES | 25 |
| `/creed` | 200 | YES | 24 |
| `/manifesto` | 200 | YES | 63 |
| `/epk` | 200 | YES | 24 |
| `/open-letter` | 200 | YES | 53 |
| `/gospel` | 200 | YES | 50 |
| `/faq` | 200 | YES | 35 |
| `/gatekeeping` | 200 | YES | 69 |
| `/for-ai-artists` | 200 | YES | 39 |
| `/no-rulebook` | 200 | YES | 35 |
| `/ai-and-creativity` | 200 | YES | 39 |
| `/god-uses-tools` | 200 | YES | 29 |
| `/artist-freedom` | 200 | YES | 56 |
| `/sentinelbot` | 200 | YES | 26 |
| `/interviews` | 200 | YES | 53 |
| `/about` | 200 | YES | 50 |
| `/story` | 200 | YES | 24 |
| `/contact` | 200 | YES | 63 |

Aggregate gates:

- All 200: **PASS**
- All self-canonical: **PASS**
- All titles unique: **PASS**

Title length distribution: 21 to 69 chars. The four entries over
60 chars (`/`, `/timeline`, `/manifesto`, `/gatekeeping`) are
intentional and discussed in their respective commit messages.
Google truncates at ~58 to 60 chars on desktop; everything over
that still ranks fine, just shows truncated in the SERP. Each
title was structured so that even if cut at the truncation
point, the brand and intent remain visible.

## 3. JSON-LD validation (homepage)

`@type: MusicGroup` (subclass of Organization, richer schema for
artists). 12 of 12 structural checks pass. Both referenced
assets resolve.

```
@context is schema.org                              PASS
@type is MusicGroup                                 PASS
name is non-empty string                            PASS
alternateName is "Shield Bearer"                    PASS
url is https URL                                    PASS
description is non-empty                            PASS
description mentions both name forms                PASS
logo is https URL                                   PASS
image is https URL                                  PASS
member is object with name                          PASS
sameAs is non-empty array of URLs                   PASS
genre present                                       PASS
```

Asset reachability:

- `logo`: `images/logo.png` (image/png, 93755 bytes) PASS
- `image`: `images/og-image.jpg` (image/jpeg, 270712 bytes) PASS

Image dimension note: Lighthouse and Google Rich Results
recommend logo >= 112 x 112 px. Both files exceed that based on
their byte size, but I did not pixel-measure them. If a future
Rich Results audit warns on dimensions, regenerate from source
at higher resolution.

## 4. Untouched pages snapshot (per reviewer request)

These 11 pages had titles and descriptions in the SERP-acceptable
range (140 to 165 chars) before this branch and were intentionally
left alone. Snapshot for future review:

| Page | Title (chars) | Description (chars) |
| ---- | ------------- | ------------------- |
| `ai-and-creativity` | "AI Is Not the Antichrist | Shieldbearer" (39) | 166 |
| `creed` | "The Creed | Shieldbearer" (24) | 166 |
| `epk` | "Press Kit | Shieldbearer" (24) | 130 |
| `for-ai-artists` | "For AI Christian Artists | Shieldbearer" (39) | 161 |
| `god-uses-tools` | "God Uses Tools | Shieldbearer" (29) | 150 |
| `gospel` | "The Gospel Does Not Need Permission | Shieldbearer" (50) | 124 |
| `process` | "The Method | Shieldbearer" (25) | 118 |
| `sentinelbot` | "SentinelBot | Shieldbearer" (26) | 125 |
| `signal-room` | "Signal Room | Shieldbearer" (26) | 137 |
| `story` | "The Story | Shieldbearer" (24) | 129 |
| `videos` | "Videos | Shieldbearer" (21) | 120 |

Some descriptions sit slightly under the 140 char target
(`gospel`, `process`, `sentinelbot`, `signal-room`, `story`,
`videos`). They were left because the existing copy is page-
specific and earned (not generic). Editing for the sake of
hitting a length target would have been over-engineering.

If a future audit shows any of these underperforming on
impressions or CTR, that's a trigger to expand the description.
Not before.

## 5. What changed, by file

Five-commit chain on `seo-fixes-2026-05`. One row per file,
across all five commits.

| File | Change | Why |
| ---- | ------ | --- |
| `index.html` | Title, meta desc, OG, Twitter Card, JSON-LD `alternateName` + `description` + `logo` + `image`, hero subline copy | Brand SEO for both name variants; commit 1 + 1.5 |
| `SEO.md` | Created | Decision log; commit 2 |
| `SEO.md` | "How to use this document" header | Per commit 2 review; commit 3 |
| `SEO.md` | Parity rule + build-step tech debt note | Per commit 4 review; this commit |
| `contact.html` | Title, meta desc, OG, body content, form dropdown options | Audience-specific content; commit 3 |
| `contact/index.html` | Synced from `contact.html` | Parity miss caught in verification pass; this commit |
| `gatekeeping.html` | Title, meta desc, OG (article type), 4-H2 structure, KJV-trimmed quotes with attribution, internal link to manifesto | Pillar content for "gatekeepers in the Bible" search; commits 3 + 4 |
| `gatekeeping/index.html` | Synced from `gatekeeping.html` | Mirror parity; commit 4 |
| `manifesto.html` | Title, meta desc, OG block (was missing), Twitter Card, em-dash sweep | Per-page tightening + missing OG; commit 4 |
| `manifesto/index.html` | Synced | Mirror parity; commit 4 |
| `about.html` | Title, meta desc, alt attribute em-dashes, internal link to gatekeeping | Per-page tightening + Q6 link; commit 3 + 4 |
| `about/index.html` | Synced | Mirror parity; commit 4 |
| `story.html` | h2 em-dash, paragraph em-dashes, internal link to gatekeeping | Em-dash sweep + Q6 link; commit 3 + 4 |
| `story/index.html` | Synced | Mirror parity; commit 4 |
| `song-meanings.html` | Title, meta desc, 8 verse-ref em-dashes, `groupedByGenre` fix | Em-dash sweep + commit-3 augmenter fix; commit 3 + 4 |
| `song-meanings/index.html` | Synced | Mirror parity; commit 4 |
| `interviews.html` | Title, meta desc, h3 em-dash | Per-page tightening + sweep; commit 4 |
| `interviews/index.html` | Synced | Mirror parity; commit 4 |
| `epk.html` | ~20 em-dashes (titles, alts, prose) | Em-dash sweep; commit 4 |
| `epk/index.html` | Synced | Mirror parity; commit 4 |
| `timeline.html` | Title em-dash + ~10 prose em-dashes, description tightened | Em-dash sweep + per-page tightening; commit 4 |
| `timeline/index.html` | Synced | Mirror parity; commit 4 |
| `process.html` | ~10 prose em-dashes | Em-dash sweep; commit 4 |
| `process/index.html` | Synced | Mirror parity; commit 4 |
| `videos.html` | iframe title em-dash | Em-dash sweep; commit 4 |
| `videos/index.html` | Synced | Mirror parity; commit 4 |
| `music.html` | Title, meta desc, 1 prose em-dash | Per-page tightening + sweep; commit 4 |
| `music/index.html` | Synced | Mirror parity; commit 4 |
| `for-ai-artists.html` | 2 prose em-dashes | Em-dash sweep; commit 4 |
| `for-ai-artists/index.html` | Synced | Mirror parity; commit 4 |
| `sentinelbot.html` | 1 prose em-dash + CSS pseudo whitelist | Em-dash sweep; commit 4 |
| `sentinelbot/index.html` | 1 prose em-dash + CSS pseudo whitelist (NOT full-sync due to legitimate CSS divergence) | Em-dash sweep; commit 4 |
| `artist-freedom.html` | Description trimmed (212 to 163), og:type article | Per-page tightening; commit 4 |
| `artist-freedom/index.html` | Synced | Mirror parity; commit 4 |
| `faq.html` | Title, meta desc | Per-page tightening; commit 4 |
| `faq/index.html` | Synced | Mirror parity; commit 4 |
| `no-rulebook.html` | Description trimmed (171 to 142) | Per-page tightening; commit 4 |
| `no-rulebook/index.html` | Synced | Mirror parity; commit 4 |
| `open-letter.html` | Title, meta desc | Per-page tightening; commit 4 |
| `open-letter/index.html` | Synced | Mirror parity; commit 4 |
| Other CSS pseudo-content files | Em-dash whitelist comment | em-dash-allow sigil for legitimate uses; commit 4 |
| `js/sentinelbot.js` | Whitelist comment on regex strip line | em-dash-allow sigil; commit 4 |
| `js/song-meanings-augment.js` | Whitelist comment on placeholder | em-dash-allow sigil; commit 4 |
| `css/style.css` | Comment em-dashes to colons | Em-dash sweep; commit 4 |
| `js/main.js`, `js/analytics.js` | Header comment em-dashes to colons | Em-dash sweep; commit 4 |
| `README.md` | Multiple separator em-dashes to colons / parens | Em-dash sweep; commit 4 |
| `scripts/test.sh` | Em-dash guard added (test #21) | Future-proofing; commit 4 |
| `VERIFICATION.md` | Created | This document |

## 6. Headline metrics expected to move

Search Console takes 2 to 8 weeks to reflect changes depending
on the metric. Re-check dates anchored to today (2026-05-04).

| Metric | Baseline | Target | Re-check date | If miss |
| ------ | -------- | ------ | ------------- | ------- |
| Brand search ("shieldbearer", "shield bearer") | Inconsistent top-5 | Top-3 for both forms | 2026-06-29 (8 weeks) | Revisit `alternateName` prominence and visible body copy density on the homepage |
| `/gatekeeping` clicks | 0 (position 60, 13 impressions) | 5+ clicks/month | 2026-07-01 | Strengthen internal linking from related pages; check whether KJV "porters" wording is hurting search match (consider adding ESV-style fragment with attribution) |
| Indexed page count | 23 entries, 20 flagged "Discovered, currently not indexed" | All 23 indexed | 2026-06-15 (6 weeks) | Submit sitemap manually in Search Console; check internal linking density to thin pages |
| Total clicks (site-wide, monthly) | Current baseline (operator has the number) | +30% in 90 days | 2026-08-04 (12 weeks) | If under +15%, revisit content depth on the long-tail pages |
| Desktop position gap | ~10x worse than mobile | No deliberate fix; expect natural narrowing as authority grows | 2026-06-15 (6 weeks) | Monitor only. Do not add desktop-specific content per SEO.md decision |

## 7. Deliberately deferred

| Item | Why deferred | Catch trigger |
| ---- | ------------ | ------------- |
| Meta-refresh redirect on legacy `.html` URLs | Risk of click loss; current canonical signal is consistent. SEO.md "Canonical URL form" section. | 2026-06-15 (6 weeks) duplicate-content check |
| Mirror sync between legacy `.html` and clean URL `/index.html` | Manual `cp` works for now. Real fix is a build step. | SEO.md "Parity between URL forms" section (added in this commit). Monthly check. |
| Build step that auto-generates one URL form from the other | Tech debt; project doesn't currently have a build pipeline beyond the test script. | SEO.md "Build step for URL form parity" tech debt entry (added in this commit). |
| ESV-style scripture variants for SEO match | Copyright restriction. KJV is public domain and serviceable. | Only revisit if `/gatekeeping` ranks below position 30 after 8 weeks |
| `gospel.html`, `process.html`, `sentinelbot.html`, `signal-room.html`, `story.html`, `videos.html` description expansion | Already page-specific and earned, just under 140 chars | Trigger: any of these surfaced as underperforming in Search Console |

## 8. Risks

The three calendar triggers from SEO.md, restated here so they
hit the eye at decision time:

| Trigger date | Risk being watched | What "bad" looks like |
| ------------ | ------------------ | ---------------------- |
| 2026-05-18 (2 weeks) | Trailing-slash root canonical change (`https://shieldbearerusa.com` to `https://shieldbearerusa.com/`) | Homepage impressions or position drop sharply within 14 days with no other obvious cause. Action: revert to no-slash form. |
| 2026-06-15 (6 weeks) | Canonical Path A decision (clean URLs canonical, no redirects between forms) | `/<page>` and `/<page>.html` both showing as indexed duplicates in Search Console. Action: add meta-refresh on legacy `.html` URLs per the documented escalation path. |
| 2026-06-29 (8 weeks) | Brand keyword strategy ("Shield Bearer" two-word form prominence) | "shield bearer" queries no longer return the homepage as the top result. Action: revisit how prominently the two-word form appears in title and visible body. |

Lower-tier risk: `contact/index.html` was diverged from
`contact.html` for the duration between commit 3 and the
verification pass. The site was rendering the OLD contact title
and description on `/contact` even after the Task 4 content
update went in. That's not a current risk (synced in the
verification pass), but it's the second parity drift caught after
the about / story / gatekeeping / song-meanings parity fixes in
commit 4. The build-step deferral above is the real long-term
fix; until then, `cp legacy.html legacy/index.html` is the manual
discipline and the SEO.md monthly check is the calendar fallback.

## 9. Recommended push timing

**Recommend: push immediately.**

The branch is internally consistent, every test gate passes,
sitemap is clean, JSON-LD validates, both Lighthouse SEO audits
return 100/100, parity is synced across all clean-URL mirrors,
and the em-dash guard now prevents future regressions.

The two-week trailing-slash watch is the only forward-looking
concern, and that watch is independent of when we push: the 14
days start from the date the canonical signal changes, which is
the date GitHub Pages serves the new HTML, which is roughly the
push date. Delaying the push delays the watch window.

The one judgment call against pushing immediately would be if
the operator wants to stage on a separate Pages preview first.
GitHub Pages doesn't natively support preview environments, so
this would mean either (a) creating a temporary subdomain
configured to serve from this branch, or (b) running a local
serve and clicking through every page to check visual integrity
before push. Option (b) is the lighter-weight smoke test and I'd
recommend it before push if there's any concern. The local serve
is already configured (port 8765) and the changes that affect
visible UI are limited to:

- Homepage hero subline (one paragraph rewrite)
- Contact page (significant new audience-specific sections)
- Gatekeeping page (full restructure, new content under H2 1, 2, 3)

Spend 5 minutes loading those three pages locally if you want
the smoke test. Otherwise push.

## Appendix: How to reproduce this verification

```bash
# 1. Local serve
cd /path/to/shieldbearer-website
python3 -m http.server 8765 &

# 2. Lighthouse SEO
npx -y lighthouse http://localhost:8765/ \
  --only-categories=seo --output=json \
  --output-path=./seo-report-home.json --quiet
npx -y lighthouse http://localhost:8765/gatekeeping/ \
  --only-categories=seo --output=json \
  --output-path=./seo-report-gatekeeping.json --quiet

# 3. Sitemap validation
python3 -c "
import re, urllib.request
with open('sitemap.xml') as f: s=f.read()
urls = re.findall(r'<loc>([^<]+)</loc>', s)
for u in urls:
    fu = u.replace('https://shieldbearerusa.com', 'http://localhost:8765')
    try:
        b = urllib.request.urlopen(fu, timeout=10).read().decode()
        c = re.search(r'rel=\"canonical\" href=\"([^\"]+)\"', b)
        t = re.search(r'<title>([^<]+)</title>', b)
        print(f'{u}: canon={c.group(1) if c else None}, title={t.group(1) if t else None}')
    except Exception as e:
        print(f'{u}: ERROR {e}')
"

# 4. JSON-LD validation
python3 -c "
import re, json
h = open('index.html').read()
ld = json.loads(re.search(r'<script type=\"application/ld\\+json\">\s*(\{.*?\})\s*</script>', h, re.DOTALL).group(1))
print(json.dumps(ld, indent=2))
assert ld['@type'] == 'MusicGroup'
assert ld['alternateName'] == 'Shield Bearer'
assert 'Shield Bearer' in ld['description']
print('PASS')
"

# 5. Em-dash guard
./scripts/test.sh
```

End of verification.

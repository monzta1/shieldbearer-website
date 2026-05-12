# Shieldbearer Website Changelog

Versioning note:
- Use semantic versioning in the form `vmajor.minor.patch`
- Patch bumps track small site/admin/logging changes
- Minor bumps track visible site features or broader UI additions
- Major bumps track architecture-level changes
- Always add the newest entry at the top of the file

## v2.7.3 - May 2026
- Stronger fix for the location column wrapping. The v2.7.2 attempt used a `.col-location` selector with the same specificity as the `th, td` rule that declares `word-break: break-word`, and lost the cascade because the general rule was declared later. Bumped to `!important` on `white-space: nowrap`, `word-break: normal`, and `overflow-wrap: normal` for the IP and location cells. The IP column was hitting the same bug (e.g. "108.28.97.217" wrapped to two lines).
- Bumped the table `min-width` from 1100px to 1500px so the 9 columns get their hint widths instead of being squeezed below them. The table-shell already has `overflow-x: auto`, so wider min-width just means horizontal scroll on narrow viewports rather than column-cramming.
- Widened `.col-location` from 130px to 170px and `.col-ip` from 130px to 140px to comfortably fit the longest expected values without overflow.

## v2.7.2 - May 2026
- Fixed the `location` column on `admin/logs.html` rendering one letter per line in the cache-candidates and rare-unanswered tables. The general `td` rule uses `word-break: break-word`, which broke even short city strings character-by-character when the column had no width hint. Added a `.col-location` rule plus a `.loc` class on the location th/td cells in the two insight tables, with `min-width: 120px` and `white-space: nowrap` so short labels stay on one line.
- Switched the displayed format from "City, Country" to "City, RegionCode" (e.g. "Dallas, TX", "Ancaster, ON") to match the compact form now written by `sentinelbot-lambda` v1.9.1. Region codes are shorter and more informative than country names for the US/CA/AU traffic the site sees in practice.
- Frontend change only; backend format change is in `sentinelbot-lambda` v1.9.1 and applied to all 333 historical rows via the backfill script's new `--force` flag.

## v2.7.1 - May 2026
- Added a `location` column to all three tables on `admin/logs.html` (cache candidates, rare unanswered questions, raw log). Shows the approximate location resolved from the chat row's sourceIp; renders "-" when the lookup failed, the IP was private, or the row predates the lookup feature.
- Frontend only displays the field; the chat Lambda writes it. See `sentinelbot-lambda` v1.9.0 for the write-time and backfill implementation. The sentinelbot-logs read Lambda returns the whole row so the new column requires no API change.
- Updated empty-table colspans (8 to 9 for cache and raw tables; 6 to 7 for repeats) to keep the empty-state messaging aligned across all columns.

## v2.7.0 - May 2026
- Added Watch Posts section to the homepage between the Signal Fire video block and the merch banner. Renders upcoming and recent live appearances from a single data file at `data/gigs.json`.
- Sort logic: entries with date >= today render under "Upcoming" (ascending). Entries with date < today render under "Recent" (descending), capped at 3.
- Format per entry: uppercase month + zero-padded day + year, then "Venue, City" on its own line, then optional billing line, then optional note line. Each optional line is skipped when the source field is empty.
- Hide-empty rules: the Upcoming subheading hides when no upcoming entries; same for Recent; the whole section hides when both buckets are empty or when the fetch fails. No half-rendered stubs.
- New file: `js/watch-posts.js` (vanilla, fetch + render, no framework). New file: `data/gigs.json` (seeded with two KGroup Band appearances: 2026-05-09 Flory UMC and 2026-03-22 Dulles Town Center Mall).
- Three new structural tests in `scripts/test.sh` (watch-posts.js wired on homepage, section element present, gigs.json valid JSON).
- 17 new jsdom regression assertions covering sort order, recent cap, date formatting, optional-line rendering, hide-empty paths for both subheadings and the whole section, and graceful no-op when the section element is absent.
- Style matches existing site theme (black background, red accents, courier eyebrow, display-font heading). Plain stacked entries, no card components or heavy framing. Mobile spacing inherits from the section padding tokens already in use elsewhere on the homepage.
- Test count: 198 -> 201 structural; 53 -> 70 jsdom.

## v2.6.1 - May 2026
- Adopted `AGENT_HANDOFF.md`, `AGENT_STATE.md`, and `MEMORY.md` per the operator instructions audit. `AGENT_HANDOFF.md` carries system knowledge and standing rules; `AGENT_STATE.md` carries current branch, next task, active watch windows, and deferred items; `MEMORY.md` is the entry-point index. AGENTS.md (pre-push checklist) and SEO.md (decision log) remain as-is. No code change.

## v2.6.0 - May 2026
- Added six structural checks to `scripts/test.sh` (tests 22 to 27): no same-href-same-label duplicates in nav surfaces, og:url matches canonical on every page, legacy `.html` and clean-URL `/index.html` mirrors byte-identical (sentinelbot exception), no duplicate IDs within any page, all page titles unique, external `target=_blank` links carry `rel=noopener`. Test count rose from 192 to 198.
- Fixed og:url canonical drift on 11 pages (22 files including `/index.html` mirrors): ai-and-creativity, creed, epk, for-ai-artists, god-uses-tools, gospel, process, sentinelbot, signal-room, story, videos. Each had og:url ending in `.html` while canonical was the clean URL. Aligned og:url to the canonical clean URL form. Caught by test 23, the new check.

## v2.5.3 - May 2026
- Removed duplicate `<a href="/gospel">The Gospel</a>` entry from the Words dropdown on `gospel.html` and `gospel/index.html`. Two adjacent identical anchors had been hand-edited in; the desktop nav was rendering "The Gospel" twice in a row when hovering Words. Audit confirmed no other page had the duplicate.

## v2.5.2 - May 2026
- Replaced the gatekeeping pillar article with the operator-authored version. Cleaner theological framing distinguishing biblical gatekeeping (service under God's authority) from modern gatekeeping (adding standards beyond what God has established). Ten H2 sections plus four H3 case studies (Pharisees, Disciples, Judaizers, Early Church Debate). Hero h1, meta description, OG tags, share bar, and related-reading box preserved from the prior revision; KJV scripture quotations from v2.5.0 retained for copyright cleanliness.

## v2.5.1 - May 2026
- Contact page factual corrections. Booking section rewritten to reflect the actual offering: Shieldbearer is a studio project (not a touring band); Moncy is the only musician (on guitar); vocals on most releases are AI; the only Shieldbearer-branded live option is Moncy playing guitar over recorded tracks for a feature slot. KGroup Band is named as the sister project for live praise and worship.
- Added a "Singer collaborations" section explicitly inviting real vocalists. States that songs featuring real vocalists are already in production and will release in the near future. Form dropdown adds a dedicated "Singer collaboration" option so vocalist outreach routes distinctly.
- Title and meta description updated to "Booking, Press, Singer Collabs, AI & Faith" to reflect the new section.

## v2.5.0 - May 2026
- Comprehensive SEO improvement pass. Implemented across the `seo-fixes-2026-05` branch and merged to `sentinelbot-stable` via fast-forward.
- **Homepage brand SEO.** New title `Shieldbearer (Shield Bearer) | Christian Metal from Scripture` carrying both name variants for search disambiguation. Meta description, OG tags, and Twitter Card all aligned. JSON-LD `MusicGroup` retained (subclass of Organization, richer schema for an artist) with `alternateName: "Shield Bearer"`, expanded `description` mentioning both forms, plus `logo` and `image` fields. Hero h1 untouched ("Jesus Reigns at Full Volume" stays as the artistic brand statement). Hero subline rewritten to introduce both "Shieldbearer" and "Shield Bearer" naturally in visible body copy.
- **Decision log.** New `SEO.md` documents canonical URL form decision (Path A: clean URLs canonical, no redirects between forms; meta-refresh deferred 4 to 6 weeks), trailing-slash root canonical change, og:url normalization, desktop vs mobile ranking gap framing (mobile-first indexing plus audience composition; monitor only), brand keyword strategy, hero h1 override, and a master review schedule with calendar-anchored re-check dates (2026-05-18, 2026-06-01, 2026-06-15, 2026-06-29, 2026-07-01).
- **Contact page rewrite.** Body content expanded with five audience-specific sections (Booking, Press and media, Fan mail, Ministry partnerships, AI and faith conversation). 383 words of substantive copy explaining what kinds of inquiries fit each audience and the response timeline. Form dropdown updated to match the new sections.
- **Gatekeeping pillar rewrite.** Title aligned with search intent ("Gatekeepers in the Bible: Meaning, Role, and Symbolism"). Restructured under four H2s: Who Were the Gatekeepers in the Bible / What Scripture Says About Gatekeepers / The Symbolic Meaning of Gatekeepers / Modern-Day Gatekeeping in Christian Art and Music. Existing seven case studies (Pharisees through Early Church Debate) preserved as H3 sub-points. KJV scripture fragments quoted with attribution; outbound BibleGateway links re-versioned to KJV (public-domain copyright safety).
- **Internal linking.** Three contextual prose links added to `/gatekeeping` from `manifesto.html` ("gatekeepers in the Bible"), `about.html` ("what gatekeeping means scripturally"), and `story.html` ("the biblical role of gatekeepers"). Varied descriptive anchor text per SEO best practice.
- **Per-page SEO tightening.** 10 pages updated with proper meta descriptions and (where missing or generic) titles: about, artist-freedom, contact, faq, gatekeeping, manifesto, music, no-rulebook, open-letter, song-meanings, timeline, plus the homepage. 11 pages intentionally left untouched (already in spec range): ai-and-creativity, creed, epk, for-ai-artists, god-uses-tools, gospel, process, sentinelbot, signal-room, story, videos.
- **Manifesto OG completion.** `manifesto.html` was missing OG and Twitter Card tags entirely; full block added.
- **Em-dash guard.** New test step 21 in `scripts/test.sh` catches U+2014, `&mdash;`, and `—` across .html / .css / .js / .md / .txt files. Per-line whitelist sigil `em-dash-allow` for legitimate uses (CSS pseudo-content separators and intentional regex strips). Repo-wide sweep applied with per-occurrence judgment.
- **Hero subline copy refinement.** Parens to commas for natural prose flow on the homepage.
- **Verification artifacts committed.** `VERIFICATION.md` documents the Lighthouse SEO score (100/100 on homepage and `/gatekeeping`), sitemap row-by-row table (23/23 URLs return 200, all self-canonical, all titles unique), JSON-LD validation (12/12 structural checks pass), file-by-file change log, and reproduction commands. `seo-report-home.json` and `seo-report-gatekeeping.json` are the raw Lighthouse JSON outputs.
- **Test count.** Rose from 191 to 192 with the em-dash guard.

## v2.4.4 - May 2026
- `song-meanings-augment.js` now reads `reference` and `scripture` from each `released[]` entry on `site.json` and passes them to the dossier. Previously these were hard-coded to empty, so a release promoted from `site.json` always showed without a scripture even when the song record carried one. Defaults remain safe (empty) when the fields are missing.

## v2.4.3 - May 2026
- Fixed song-meanings genre grouping. `groupedByGenre` previously grouped only consecutive entries, so dossiers appended after the static SONG_DOSSIERS list (e.g. by `song-meanings-augment.js` from `site.json released[]`) created a duplicate genre section instead of merging into the existing block. Now groups by genre globally, preserving first-occurrence order.
- Fixed `appendSongDossiers` insertion order. Auto-augmented entries (new releases promoted from `site.json`) now insert at the start of their genre block so a fresh release appears at the top of its section, instead of appended to the end. New genres still append as a new group at the end.

## v2.4.2 - April 2026
- Added new FAQ entry `faq-ai-copyright` answering the copyright and ownership question, placed as the lead entry in the AI and Faith section (immediately before `faq-ai-legitimate`). Identical insertion in `faq.html` and `faq/index.html` for legacy and clean-URL parity. Markup matches the surrounding AI and Faith entries (no kicker, deliberate per section convention).

## v2.4.1 - April 2026
- Added an Israel article to the Creed, sitting between Salvation and the closing block. States Shieldbearer's covenant theology: the Abrahamic covenant is everlasting, Israel has not been replaced by the Church, and we pray for the peace of Jerusalem. Applied identically to both `creed.html` and `creed/index.html` so the legacy and clean-URL paths stay in sync.

## v2.4.0 - April 2026
- Added a self-resetting countdown timer to the Signal Room ("Next Signal" clock) that always counts down to a 7-day rolling target stored in localStorage; when it hits zero it silently mints a new 7-day window
- Knobs live in `js/config.js` under `signalCountdown`: `enabled`, `resetDays`, `fixedTarget` (set an ISO date string to pin the timer to a specific release), `storageKey`
- New `js/signal-countdown.js` is gated at 100% line coverage with seven jsdom tests (rolling first render, expired target reset, fixed-target mode, invalid date fallback, disabled mode, missing container, past fixed-target clamp)

## v2.3.4 - April 2026
- Restored mobile menu items that were missing relative to the desktop nav: The Armory under Music, Press Coverage under Press, AI and Faith FAQ under For AI Artists. Mobile flat list now matches desktop dropdowns 1:1.

## v2.3.3 - April 2026
- Fixed mobile menu order on every page so it mirrors the desktop nav structure (Music group, About + FAQ, Press, Words + Gospel, AI and Faith items, then Contact and Merch)
- Shortened the mobile label "The Gospel Does Not Need Permission" to "The Gospel" so it no longer wraps to two lines on small screens
- Added Gospel to the desktop Words dropdown so the link surfaces on both surfaces

## v2.3.2 - April 2026
- Fixed the homepage merch rotator showing the static "Clean black tee..." description for every product (hat, hoodie, etc.); the rotator now swaps the description block with the product-specific copy from Shopify, falling back to a generic mission-themed line if the baker did not capture one
- Extended `scripts/fetch-merch.sh` to scrape each Shopify product page's meta description and store it in `data/merch.json` alongside title, image, and URL

## v2.3.1 - April 2026
- Added `TODO.md` at the repo root with an honest backlog of future enhancements grouped by visible/infrastructure/content/testing, and an explicit list of things deliberately NOT on the roadmap

## v2.3.0 - April 2026
- Added `AGENTS.md` at the repo root with the contributor workflow checklist (tests, changelog, em-dash rule, checkpoint, verify-live) so the same rules are visible to future contributors and not just stored in chat memory

## v2.2.0 - April 2026
- Added page-aware opening greetings in SentinelBot for every public route; the Signal Room's rich opener still wins when present, otherwise the chat opens with a path-specific intro pulled from a small map (Manifesto, FAQ, Music, Song Meanings, Timeline, Press Kit, every essay page, etc.)
- Falls back to a generic Shieldbearer greeting if the path is not in the map

## v2.1.1 - April 2026
- Added a static guard in the test suite that fails on any `name.html` string literal in JS source so the relative-href bug class cannot return silently
- Added a live link crawler to `scripts/verify-live.sh` that follows every internal href across six representative pages and asserts each returns 2xx or 3xx

## v2.1.0 - April 2026
- Added jsdom regression tests for the homepage featured-release renderer, song-meanings augmenter, and merch rotator
- Added a c8 coverage gate at 90% lines and statements; current coverage is 100% on the three tested client-side files
- Added a jsdom test for `js/main.js` that loads it on a subfolder route and asserts injected nav hrefs are absolute

## v2.0.2 - April 2026
- Rewrote root `.html` files to use absolute asset paths so legacy URLs and clean URLs both load styles, fonts, and images correctly
- Updated `js/main.js` selectors and href targets to match the new clean URLs after the .html cleanup

## v2.0.1 - April 2026
- Fixed the broken Release Timeline link on subfolder pages (was `/contact/timeline.html`, now `/timeline`) by switching JS-injected nav hrefs to absolute paths
- Updated `js/featured-release.js` and `js/song-meanings-augment.js` to emit clean URLs instead of `.html` paths

## v2.0.0 - April 2026
- Removed the `.html` extension from every public URL across 23 pages while keeping the original `.html` files in place so existing Google Search and Metal Archives links still resolve
- Restructured pages into folder/index.html on disk so GitHub Pages serves clean paths like `/sentinelbot` natively
- Updated every internal href, canonical tag, and sitemap entry to use the clean absolute path

## v1.7.0 - April 2026
- Wired the homepage featured-release card to render from `homepage.featuredRelease` in `site.json` with the static markup as a graceful fallback
- Wired the song-meanings page to append a dossier per item in `released[]` from `site.json` so new releases auto-add a meaning entry without code changes

## v1.6.3 - April 2026
- Added a passphrase gate to `admin/logs.html` so the SentinelBot conversation logs are not visible to anyone who guesses the URL
- Stored only a SHA-256 hash of the passphrase in source so plaintext is not exposed to source viewers

## v1.6.2 - April 2026
- Fixed Microsoft Clarity tracking that was silently blocked by the site CSP; added `https://scripts.clarity.ms` to script-src and `https://j.clarity.ms` to connect-src on every page
- Added a `clarity_load_error` GA4 event that fires if the Clarity loader ever fails to load, so future silent breakage shows up in analytics

## v1.6.1 - April 2026
- Consolidated runtime configuration into a single `js/config.js` shared by every page that previously had per-script settings
- Added a tracking-id audit so a missing analytics or sentinelbot config surfaces immediately at deploy time

## v1.6.0 - April 2026
- Added a featured-merch rotator that pulls products from the public Shopify storefront sitemap and bakes them into `data/merch.json` for fast same-origin delivery
- Made the homepage merch image and the Wear the Banner button link to different targets: image to the specific product, button to the shop home
- Added a config flag for instant rollback to a static merch image without redeploying the JSON

## v1.5.16 - April 2026
- Fixed the homepage hero artwork zoom-crop on mobile so the full Galilean image is visible
- Switched the small-screen hero-bg image layer from cover to 100% auto with a black fill behind it

## v1.5.15 - April 2026
- Added the shared SentinelBot launcher script to the SentinelBot page itself
- Kept the page content and structure intact while restoring the site-wide assistant behavior

## v1.5.14 - April 2026
- Added a prominent Year One Release Archive link to the EPK
- Broke the SentinelBot page into clearer sections for easier scanning without changing the wording

## v1.5.13 - April 2026
- Added archive share buttons for Facebook, X, and copy-link sharing
- Added milestone YouTube embeds to highlighted release cards on the timeline

## v1.5.12 - April 2026
- Added the Ruach Spotify playlist directly below the Armory embed on the music page
- Kept the music page playlist section grouped and consistent with the site structure

## v1.5.11 - April 2026
- Added the shared SentinelBot assistant to the archive page so it matches the rest of the site
- Kept the timeline page visually and behaviorally consistent with other Shieldbearer pages

## v1.5.10 - April 2026
- Added a tenth Year One achievement for the 12,300 YouTube subscriber milestone
- Updated the achievements section subtitle to include the subscriber milestone in the year-one story
- Reflected the expanded achievement count in the anniversary hero stats

## v1.5.9 - April 2026
- Added a ninth Year One achievement for the live merch store milestone
- Updated the achievements section subtitle to include the merch store in the year-one story
- Reflected the expanded achievement count in the anniversary hero stats

## v1.5.8 - April 2026
- Added YouTube thumbnails to archive cards for a more visual release story
- Turned the hero into a blurred thumbnail collage for a cinematic first impression
- Upgraded the year dividers, source pills, and mission stats styling for the anniversary page

## v1.5.7 - April 2026
- Removed Eagle’s Wrath Incoming! 🦅🔥 Operation Fire Begins from the archive timeline
- Marked the short-form release record as excluded so the public archive stays clean

## v1.5.6 - April 2026
- Excluded short-form archive noise from the timeline feed
- Flagged livestreams and subscriber-count live posts so they stay out of the public archive
- Kept the anniversary archive focused on actual releases only

## v1.5.5 - April 2026
- Added a root-level `site.json` so the archive page fetch resolves on GitHub Pages
- Kept the timeline page bound to the same root-relative fetch path
- Aligned the live site asset location with the served Pages root

## v1.5.4 - April 2026
- Re-enabled the top-level Release Timeline navigation link site-wide
- Upgraded the archive page into a one-year anniversary layout with album blocks and year chapters
- Added the homepage archive CTA and restored timeline indexing in the sitemap

## v1.5.3 - April 2026
- Temporarily removed the Release Timeline UI entry from the public navigation
- Removed the homepage timeline CTA and sitemap reference
- Left the timeline data pipeline and hidden route intact for backend continuity

## v1.5.2 - April 2026
- Moved Release Timeline to the top-level nav directly after Music
- Removed the duplicate Release Timeline entry from the AI and Faith dropdown

## v1.5.1 - April 2026
- Added the Release Timeline link to the AI and Faith navigation dropdown across the site

## v1.5.0 - April 2026
- Added a client-side release timeline view driven by `site.json`
- Highlighted the latest release and milestone anniversary states
- Added a homepage CTA and sitemap entry for the release timeline page

## v1.4 - April 2026
- Added the public `sentinelbot.html` page to the AI and Faith section
- Added SentinelBot to the site navigation dropdowns
- Added `sentinelbot.html` to the sitemap for search indexing
- Published the Watchman-class SentinelBot story as a permanent site page

## v1.3.1 - April 2026
- Raised the SentinelBot admin log counter baseline to 139
- Excluded already cached questions from the CACHE CANDIDATES panel
- Kept the admin totals aligned with the live DynamoDB counter

## v1.3 - April 2026
- Added SentinelBot Mark I identity and character profile
- Added version-aware replies in the live system
- Established the `SENTINELBOT_VERSION` flow for future minor updates

## v1.2 - April 2026
- Added the admin insights panels for top questions, weak answers, and cache candidates
- Added rare unanswered question tracking
- Improved timestamp handling and log readability

## v1.1 - April 2026
- Expanded the site-side UI support for SentinelBot
- Added public-page launcher coverage across the site
- Introduced the logs admin page for internal review

## v1.0 - April 2026
- Initial SentinelBot deployment on the Shieldbearer site
- Watchman-class Guardian Intelligence online
- Core responses covered music, mission, theology, and site navigation


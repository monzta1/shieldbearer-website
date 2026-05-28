# Shieldbearer Website Changelog

Versioning note:
- Use semantic versioning in the form `vmajor.minor.patch`
- Patch bumps track small site/admin/logging changes
- Minor bumps track visible site features or broader UI additions
- Major bumps track architecture-level changes
- Always add the newest entry at the top of the file

## v2.27.13 - May 2026
- `/admin/metrics`: new **Top cities** section below **Where in the world**, showing the top 6 cities by sessions with share. Sourced from GA4 (`city` + `region` dimensions), formatted as "City, Region" (e.g. "Catharpin, Virginia") to match the visitor-logger location style.
- Backend (paired commit in `sentinelbot-lambda`): `sentinelbot-metrics-publisher` adds a `fetchCities` GA4 report and writes a `cities` array into `admin/metrics.json`. Defaults to `[]` if empty. `renderCities` mirrors `renderGeography`.

## v2.27.12 - May 2026
- Fixed `/admin/metrics` showing only "Loading..." on every reload after the first. The gate script calls `unlock()`, which tried to call `window.__metricsBoot()` immediately, but that function is defined in a later `<script>` block that had not executed yet. First-time passphrase entry worked (boot was defined by the time the button was clicked); every already-unlocked reload skipped the boot and left all sections stuck on their placeholder text with no error banner.
- `unlock()` now sets a `window.__metricsUnlocked` flag, and the boot script runs itself once at the end if that flag is set. Both paths boot exactly once, no double fetch.

## v2.27.11 - May 2026
- `/admin/metrics`: new **Where in the world** section between the channel mix and the event list, showing the top 6 countries by sessions with share, sourced from GA4 (same source as the rest of the page). Closes the gap where the GA4 dashboard showed visitor geography but our admin metrics page did not.
- Backend (paired commit in `sentinelbot-lambda`): `sentinelbot-metrics-publisher` now runs a GA4 `country` report and writes a `geography` array into `admin/metrics.json` alongside `channels` and `events`. Field shape matches channels (`name`, `sessions`, `share`). Defaults to `[]` if the report returns nothing.
- Renderer is additive: `renderGeography` mirrors `renderChannels`, reuses the existing row styles, escapes country names, and shows "No geography data this period." when empty. No change to the passphrase gate or fetch path.

## v2.27.10 - May 2026
- Fixed the visitor beacon silently losing every `open` event. The beacon sent its payload as a `Blob`/fetch with content type `application/json`, which is not CORS-safelisted, so each cross-origin POST required a preflight `OPTIONS` first. On a fast-bouncing visit the page tore down before the preflight + POST round trip finished, so the `open` event was dropped while the later `close` event (preflight cache now warm, single POST) still landed. The result was `/admin/visitors` filling with pathless orphan rows that carried no path, IP, or location, even though geo resolution worked fine when an open row did land.
- Changed the beacon content type to `text/plain;charset=UTF-8` in `js/sentinelbot.js` (both the `sendBeacon` Blob and the fetch fallback). That makes the request a CORS simple request with no preflight, so the `open` beacon flushes reliably even on a fast bounce. The visitor-logger Lambda already JSON-parses the body regardless of content type, so no backend change was needed (verified live: a text/plain POST writes a full row with path + location + IP).
- No change to the `open` / `heartbeat` / `close` protocol, the Lambda, the table, or the admin read path. Single-line content-type swap.

## v2.27.9 - May 2026
- `/reach/streams`: new **Surging Now** section (Spotify, last 28 days) sits above the existing **Top Transmissions** (all-time) block. Mirrors the YouTube reach page layout: lifetime block + surge block, side by side conceptually.
- Backend path (paired commit in `sentinelbot-lambda` repo): the screenshot parser now recognises a 4th screen type, `spotify_songs_28d`. The vision model reads the "Last 28 days" / "All-time" window label visible at the top of every Spotify for Artists Top Tracks screenshot and tags the envelope accordingly. The two windows write to two separate JSON artifacts: lifetime to `/spotify_songs.json` (existing), 28-day to `/spotify_songs_28d.json` (new).
- Frontend: new `renderSpotifySurge` reads `/spotify_songs_28d.json`, renders into `#spotifySurgeSection` with intro line "What's hot right now on Spotify. N tracks logged in the last 28 days, M recent plays." Section stays hidden until the operator uploads a "Last 28 days" screenshot for the first time.
- The all-time **Top Transmissions** section header now reads `Spotify for Artists · All-time` (was just `Spotify for Artists`) so the window scope is explicit and parallel to the new section's `Spotify · Last 28 days` tag.
- 108 parser tests pass (+16 covering the new envelope type, artifact shape, window tagging, and lifetime/28d isolation).

## v2.27.8 - May 2026
- `/reach/streams` stacked impressively to match the `/reach/youtube` treatment.
  - **Indie framing in hero sublabel.** Was *"Confirmed transmissions of the Gospel. One for every verified stream..."* Now *"Confirmed Spotify streams. Solo project. No label, no manager, no team, no marketing budget. One for every verified play of a Shieldbearer track."* The indie context now leads.
  - **New 'Recent surge' insight cell.** Headline number is `last_30 / total_streams` as a percentage. Currently reads **63%** with the supporting note *"of all-time streams in the last 30 days (6,610 of 10,455)"*. Insights grid expanded from 3-up to 4-up (collapses to 2-up under 880px). This is the single most striking number on the streams page and now leads the insights row.
  - **'Biggest market' anchor above the country list.** New line *"Biggest market: **United States** at **3,369** streams. About **32%** of all-time signal."* pre-frames the country leaderboard so the US weight reads explicitly rather than only as the longest bar in the list. Uses the existing `escapeHtml` and `fmt` helpers; sorted by `streams` desc.
- `js/reach.js`: new `reachSurgePct` / `reachSurgeNote` populators in `renderInsights`; `renderListIntro` now also populates the `reachTopMarketLine` anchor.
- CSS additions in `reach/streams/index.html`: `.reach-section__anchor` (red-bordered callout for the biggest-market line), and a 4-column → 2-column responsive switch for the insights grid.

## v2.27.7 - May 2026
- `/reach/streams` Growth Curve no longer goes flat after a screenshot upload. Previously, when `reach.json#history` had two or more distinct totals (which happens immediately after the first or second screenshot), the renderer plotted those raw history points. With recent uploads typically clustered in a narrow band (e.g. 9,724 → 10,455 four days apart), the y-axis auto-scaled to that band and the curve read as a near-flat line at the top of the chart. Fix: always use the existing window-stat synthesis path. The curve now anchors at 0 six months back, lays down intermediate points derived from real `last_90` / `last_30` / `last_7` deltas, and ends at the current total. Shape is always a clear rise from zero regardless of how many screenshots have been uploaded. Raw history still lives in `/reach.json#history` for any consumer that wants the per-upload trail; the chart just doesn't plot it.

## v2.27.6 - May 2026
- `/reach/youtube` Growth Curve reworked. Previously plotted **raw daily views** on a linear axis. A single 468-view spike day pinned the y-axis and visually flattened every other day to a noise band, making 89 days of real data read as "one good day, otherwise dead." Now plots **cumulative views** across the 90-day window: a monotonically non-decreasing line that always trends upward and turns spike days into visible step-ups.
- Three summary stats added above the curve (reusing the existing `.reach-yt-recent` cell pattern): **Views, last 90 days** (~2,590), **Best day** (view count + date), **Days above 30 views** (a count of the meaningful-traffic days in the window).
- Lead copy rewritten from "Real daily views from YouTube Analytics across the trailing 90 days. Every dot on the line is a day." to "Cumulative YouTube views across the trailing 90 days. Each step up is another day of viewers. Solo project, no marketing budget, no team."
- `js/reach.js`: `renderYouTubeGrowthCurve` now builds a running-sum series before drawing, populates the three summary cells, and keeps the same red gradient styling. The empty-state path (fewer than 2 days of data) unchanged.

## v2.27.5 - May 2026
- `/reach/youtube`: reordered and reframed so the indie achievement reads at first glance.
  - **Hero stat swap.** "Watch hours, last 30 days" (~19 hours, small-looking) replaced with "Top video, lifetime" pulling `top_videos[0].views` (currently 96,120 for *Come and Restore*). The hero quartet is now Subscribers / Videos published / Top video lifetime / Avg view 30d.
  - **Hero sublabel reframed.** Was "Confirmed views. Every one is a Shieldbearer video that someone pressed play on..." Now "Confirmed YouTube views. Solo project. No label, no manager, no team, no marketing budget. Counted by YouTube's own rules." The indie framing is now load-bearing.
  - **Section reorder.** Most-Seen Transmissions (Lifetime top videos, anchored by the 96k *Come and Restore*) promoted from the page bottom to right after Recent Signal. Order is now Channel → Recent Signal → Lifetime Top Videos → Growth Curve (90d) → Surging Now (30d) → Discovery Channels → Geography 30d.
  - **48h geography block dropped from the page.** Data is still in `youtube_stats.json` for direct queries. The block was empty more often than not because of YouTube's per-country privacy floor on smaller channels. Only the 30-day block remains visible, sitting at the page bottom with a declarative explanation.
  - Lifetime top videos lead copy tightened to reinforce the indie framing.
- `js/reach.js`: populates `ytTopVideoLifetime` from `top_videos[0].views`; `ytCountries48` render call removed (element no longer exists).

## v2.27.4 - May 2026
- `/reach/youtube`: copy update on the "Where viewers watched from (last 48 hours)" block. Two changes paired with the Lambda window fix landed in sentinelbot-youtube-stats-publisher.
  - Lead now reflects that the window lands on the most recent 48 hours of *finalised* data (today-4 to today-2), not today and yesterday. YouTube's two-day reporting lag is named honestly. Adds the secondary note that small-channel per-country privacy threshold can still leave the list empty, with a pointer to the 30-day block which surfaces more.
  - Empty-state message ("No country cleared YouTube's per-country reporting threshold over the last forty-eight hours. The 30-day view below has more.") replaces the old "feed has not caught up" framing, since after the Lambda fix the window is no longer asking inside the lag zone.

## v2.27.3 - May 2026 (Tone pass batch 4 of 4: negation-as-defense removed)
Final batch in the tone pass. Four small edits that cut "this is not X" / "no apology" framings. Confident writing states what it IS.
- `ai-and-creativity.html`: deleted the opening paragraph "This is not a defense of AI. It is a defense of the freedom of the artist to choose..." plus the "Some folks are saying AI is the Antichrist. Let us be real." soft framing. Page now leads with "Every generation has feared the new tool" and goes straight into the principle.
- `god-uses-tools.html`: deleted the closing "Just to Be Clear / We are not AI advocates / We are Jesus advocates..." section entirely. The eleven Biblical examples now end the page on Scripture, which is a stronger close than the meta-disclaimer.
- `manifesto.html`: "Censorship Is The Real Issue" beat reframed to "Open Proclamation". Same conviction, positive frame. Was: "Censorship is not only deletion. It is also suppression..." Now: "Shieldbearer proclaims Christ openly, answers for what it makes, and stands behind the work in public. Truth is tested in the light." States what Shieldbearer does, not what opponents do.
- `faq.html`: three apology/defense refusals rewritten declaratively.
  - Intro "direct answers, no spin, no apology" → "straight answers".
  - "Shieldbearer names Christ plainly. Quotes Scripture directly. Makes no apology for either." → drops the "Makes no apology" clause.
  - Bot fraud answer: "Shieldbearer condemns it without qualification and without apology" → "Shieldbearer condemns it plainly". Mirrored in the FAQPage JSON-LD blob.
- Dir-form duplicates synced.
- Tone pass is now complete. Four batches: (1) Scripture preserved onto gatekeeping, (2) in-place sarcasm trims, (3) three combat pages disabled and for-ai-artists rewritten, (4) negation-as-defense removed. No Scripture lost. No pages deleted. All disabled pages restorable per ARCHIVE-NOTES.md.

## v2.27.2 - May 2026 (Tone pass batch 3 of 3: disable 3 combat pages, rewrite for-ai-artists)
- **Pre-flight Scripture safety check**: every verse on the three pages being disabled (open-letter, no-rulebook, artist-freedom) was confirmed already preserved on gatekeeping.html before disabling. No Scripture goes dark. See ARCHIVE-NOTES.md "Scripture Preservation Index".
- **Three pages disabled** (not deleted, not removed): `open-letter`, `no-rulebook`, `artist-freedom`. Each moved to `/unpublished/` in both forms (root `.html` and directory-form `<slug>-dir/`). Each given `<meta name="robots" content="noindex,nofollow">` and a visible "Unpublished" banner at the top of the body. Sitemap entries removed.
- **for-ai-artists.html REWRITTEN IN PLACE (stays live)**. It is an outward-facing resource for fellow artists, not a critic rebuttal. Cuts and reframes:
  - "None of those claims are supported by Scripture. Every single one of them is supported by pride." rewritten to "Scripture answers each of these, and it has for thousands of years."
  - Entire "What They Actually Mean" section cut (six paragraphs including "And the mask comes off", "Then don't make music", "Break that down for me please"). Its Scripture (Matthew 21:15, Galatians 1) is preserved on gatekeeping.
  - "We have been on warning lists. We have been told to stop." cut (victim frame).
  - Header "What They Are Really Saying" reframed to "When the Questions Come". Body reworked to give the same answers in declarative voice instead of confrontational framing.
  - Inline link to `/no-rulebook` in "How to Respond" replaced with the point folded into the sentence.
  - Bottom "Resources on this site" block: removed Open Letter, No Rulebook, Artist Freedom links. Kept FAQ, On Gatekeeping, AI and Creativity, God Uses Tools, Manifesto, Creed with declarative descriptions ("What Scripture says about gatekeeping, and the pattern it warns against" etc.).
- **Site-wide scrub**: 518 lines removed across 52 files (26 root .html + 26 directory-form duplicates) of nav, footer, and Related Reading references to the three disabled slugs. Inline prose mentions cleaned on `contact`, `faq`, `how-it-works`, `interviews`. Sitemap entries removed. Final full-site search: **0 hits** for `/open-letter`, `/no-rulebook`, `/artist-freedom` outside `/unpublished/`. `/for-ai-artists` references stay (it is live).
- **Directory-form duplicates** were re-synced. The site historically maintained both `<slug>.html` and `<slug>/index.html`; the directory forms had drifted out of sync. All pages touched in batches 1-3 were copied root → directory form so both stay current. Future maintenance should keep these in sync.
- New file: `ARCHIVE-NOTES.md` at repo root. Documents the three disabled pages, the Scripture Preservation Index (which verse from which disabled page lives on which live page), the for-ai-artists rewrite, the in-place trims from batches 1-3, and exact re-enable steps per page or as a bulk revert.

## v2.27.1 - May 2026 (Tone pass batch 2 of 3: in-place trims)
- `manifesto.html`: dropped "defending" from "We are naming what has always been true and the freedom to examine it openly." Closing stance changed from "We defend open proclamation and open accountability" to "We stand for open proclamation."
- `gospel.html`: removed the two-line wounded beat ("We became the AI guys defending AI. But that was never what we were doing."). The Bonhoeffer story and Acts 5:39 quote stay.
- `are-you-an-ai-band.html` (quiz): hero reframed from "The title is a dare..." to "Ten honest questions about how music actually gets made today...". "the same standard the gatekeepers use" rewritten to "the same standard every modern record has been made under." Dropped the parentheticals from tier names ("(or recently arrived from 1962)", "(and probably argued about them online)"). Tier 6-8 description rewritten from "the category gatekeepers warn about" to "the category most modern records have been made under." Dropped the dead hero link to /for-ai-artists.
- `faq.html` AI section: "your pride wearing a guitar strap" rewritten to "a different argument than the one being made". Dropped "Full stop." from "If the music lifts His name, the mission is accomplished." Removed the entire "Bobby better practice. Practice hard Bobby. People won't get saved until your guitar sounds good enough." paragraph. Rewrote "pride masquerading as theological concern does not deserve a quiet response" to "The method is not what carries the witness. Christ is." Mirrored all four edits in the FAQPage JSON-LD blob at the top of the file so structured data matches body.
- `god-uses-tools.html`: page stays LIVE. Three snark lines removed: hero subtitle "Which is wild because have you actually read the Bible?", section header "But Now in 2026 We Draw the Line at AI" rewritten to "The Same Principle Holds", and "He can use nerds with laptops" rewritten to "He can use the tools we have today." All 11 Biblical examples (donkey, fish, ravens, axe-head, oil jar, burning bush, coin in fish, sling, basket, Balaam, staff) and every verse citation preserved verbatim.
- Voice across all five files: declarative, no em dashes introduced, no "not X but Y" added, matches the home and music tone.
- What this batch did NOT do: no file moves, no nav/footer changes, no deletions of Scripture content, no edits to creed, gatekeeping, ai-and-creativity, or any utility/nav page. Batch 3 (disabling the four combat pages) is held pending review of this batch.

## v2.27.0 - May 2026 (Tone pass batch 1 of 3: Scripture preservation)
- `/gatekeeping`: three new Scripture-rich sections added between "The Difference" and "The Fulfillment." Purely additive; no existing content touched.
  - **Unexpected Vessels**: Moses, David, Gideon, Amos, Peter and the apostles, Paul. Closes with 1 Corinthians 3:7, 2 Corinthians 12:9, and the workers-in-the-vineyard parable (Matthew 20:1-16).
  - **Jesus Defended the Untrained**: Matthew 21:15-16, the children singing in the temple courts. Jesus quoted Psalm 8:2 back at the chief priests.
  - **Freedom in the Spirit**: 2 Corinthians 3:17, Colossians 3:17, 1 Thessalonians 5:19, and the parable of the talents (Matthew 25:14-30).
- Why this matters: this is the first of three batches in the tone pass. Before any combat-heavy page gets disabled, the Scripture content from those pages has to live on a page that stays public. This batch moves every verse and Biblical reference from `open-letter`, `for-ai-artists`, and `artist-freedom` onto Gatekeeping so the Word stays preserved and visible.
- Page grew from ~1300 words to ~1840 words. Eight Scripture-quote blocks (up from two). Voice matches the existing exegesis style: declarative, no rebuttal framing, no em dashes.

## v2.26.6 - May 2026
- `/song-meanings`: dropped the "Why we wrote this" block from every dossier. It was the same boilerplate (creed/manifesto links) repeated under every song and added no per-song value. The footer nav and action links stay.

## v2.26.5 - May 2026
- `/song-meanings`: removed Celestial Shield, Emmaus, !Machine, and Still Be My Vision from the auto-augmented dossier list. Their lyrics were parsed from YouTube descriptions and the extraction was not clean enough to publish. Demoted the four `shieldbearer-songs` records (`releaseDetected = false`) and re-ran the publisher; `released[]` is back down to just Let My People Go. The Worship genre hook in `song-meanings-augment.js` is left in place but currently inactive since no song matches. Future Worship songs (Still Be My Vision once its lyrics are curated by hand) can land in that section by being re-promoted.

## v2.26.4 - May 2026
- `/song-meanings`: lyrics restored on the dossier card for every song. v2.26.2 hid them sitewide on the theory that the data only needed to live in `site.json`/DynamoDB for chord generator. Operator wants them visible on the page for the 11 curated dossiers plus the 5 finalized auto-augmented ones. Reverted the CSS that hid `.song-dossier__lyrics` + `.song-dossier-fallback__lyrics` and put the `<section class="song-dossier__block song-dossier__lyrics">` back in `renderDossierBody`.

## v2.26.3 - May 2026
- `/song-meanings`: curated the auto-augmented release list down to 5 entries (Let My People Go, Emmaus, !Machine, Celestial Shield, Still Be My Vision). Demoted the 42 other backfilled records in `shieldbearer-songs` (set `releaseDetected = false`) and deleted the leftover `simulated-video-001` test event from `shieldbearer-sentinel-logs` so site-publisher stops resurrecting it. `released[]` now matches what the operator wants visible.
- `js/song-meanings-augment.js`: Still Be My Vision now renders under a Worship genre group instead of Metal. The dossier renderer already groups by genre, so a new Worship section appears automatically next to the curated Metal/Country groups.

## v2.26.2 - May 2026
- `/song-meanings`: lyrics block removed from the rendered dossier UI. The data still lives in `site.json` and DynamoDB (so chord generator and any future utility can consume it) but the public dossier card no longer displays the full lyrics. The Scripture quote, meaning paragraphs, and action links to Spotify/YouTube stay.
- Fix: `js/song-meanings-augment.js` was fetching `./site.json` relative to the page URL, which works on `/song-meanings.html` but resolves to `/song-meanings/site.json` (404) on the directory-index clean URL `/song-meanings/`. Switched the default source to absolute `/site.json` so the augment runs in both URL forms. This was the reason Worth It All and the other 30 newly-backfilled songs were not appearing on `/song-meanings` even though the data was in `site.json`.
- Also released today on the Lambda repo: tighter `extractLyricsFromDescription` heuristic (longest-contiguous-block, drops emoji-prefix promo lines) plus a `scripts/backfill-lyrics-from-descriptions.js` one-off that scanned `shieldbearer-songs` and added lyrics to 31 historical records by re-running the extractor against fresh YouTube descriptions. Site-publisher's `released[]` grew from 2 to 48 entries.

## v2.26.1 - May 2026
- **Auto-update bulletproof.** Reviewed the existing pipeline and confirmed the `/song-meanings` dossier list already auto-augments from `site.json released[]` via `js/song-meanings-augment.js`. The reason Let My People Go was missing was a stale DynamoDB record (no `reference` or `scripture` fields, written before the operator started using `#Reference`). Fixed by:
  1. Backfilling the `shieldbearer-songs` DynamoDB record for `let-my-people-go` with the four Exodus refs and the Exodus 5:1 quote.
  2. Manually invoking `sentinelbot-site-publisher` with `{approved: true, source: "youtube"}` so it re-reads DynamoDB and rewrites `site.json` with the refs included in `released[]`.
  3. Improved `song-meanings-augment.js`: auto-derives tag chips from the `reference` book names (e.g. "Exodus 3:7-10 | Exodus 5:1" → tags ["Exodus"]). The auto dossier now has tags, where it previously defaulted to `[]`.
  4. Removed the hand-curated static SONG_DOSSIERS entry and no-JS fallback section I had added for Let My People Go in v2.26.0. The auto path now handles it end-to-end. (Static entries still work for older songs that have curated thesis text; new releases come through the auto pipeline.)
- **End-to-end flow that now works without manual intervention:**
  1. Operator writes the song .txt with `#Title`, `#SongMeaning`, `#Lyrics`, and `#Reference` (the new shield-cli warning catches a missing `#Reference`).
  2. `shield ingest` writes the song record to DynamoDB including `reference` + `scripture`.
  3. `sentinelbot-site-publisher` (event-driven) reads DynamoDB, merges released + coming-soon records, writes the full song into `site.json`'s `released[]` array.
  4. `js/song-meanings-augment.js` fetches `site.json`, builds a dossier entry per release (now with tag chips from refs), calls `appendSongDossiers()` to add it to the page render.
  5. The scripture-link infrastructure (v2.19.0) converts the references to BibleGateway ESV links automatically.
- 0 manual edits to `song-meanings.html` for future releases. Just write the .txt with `#Reference` and run `shield ingest`.

## v2.26.0 - May 2026
- `/song-meanings`: full dossier for **Let My People Go** added (entry was missing because the original ingest didn't include scripture refs). Sits at the top of the dossier list as track 12. Four Exodus references (Exodus 3:7-10, 5:1, 7:5, 14:21-22), primary scripture is Exodus 5:1, tags Exodus / Deliverance / Freedom. Matching no-JS fallback section, MusicRecording added to the page's JSON-LD list. Once the scripture-link infrastructure (v2.19.0) sees these refs, they auto-linkify to BibleGateway ESV.
- `/site.json`: backfilled the `featuredRelease.reference` and `featuredRelease.scripture` fields for Let My People Go so any downstream consumer that reads site.json picks up the refs.
- **Deeper fix: shield-cli warns when #Reference is missing.** The ingest pipeline already supports `#Reference`, `#ScriptureRef`, and `#ScriptureQuote` sections in the source `.txt` file, but a missing #Reference used to ingest silently. Now if a song has lyrics but no `#Reference`, shield-cli prints a loud bordered banner to stderr telling the operator to add a section and re-ingest. The format is shown right in the warning so it can be pasted into the template. The empty-template skip path and the no-scripture explicit test stay quiet. 4 shield-cli test fixtures updated to include `#Reference` so they represent the proper template going forward.

## v2.25.3 - May 2026
- Fix: 8 pages still had `/reach` in their desktop Music dropdown. The v2.24.0 migration regex required Signal Room and Reach on adjacent lines with `</div>` trailing the Reach anchor; on these 8 files the markup had each anchor on its own line with `</div>` indented separately, so the regex didn't match. Affected pages: `how-it-works`, `reach`, `sentinelbot`, `timeline` (both `.html` and `/index.html` mirrors of each). Corrective migration cleaned all 8. Strict Python regex sweep now reports zero `/reach` references inside any page's Music dropdown.

## v2.25.2 - May 2026
- Sitewide: inline prose anchors no longer blend into surrounding text. The site's global default for anchors was `text-decoration: none; color: inherit`, which meant any `<a>` inside a paragraph or list item without its own class rendered as plain text. Added a global rule that paints any anchor inside a `<main>` `<p>` or `<li>` in the red accent color with a clear underline (red, hover goes off-white). Scripture links (`.scripture-link`), CTA buttons (`.btn`), and the two existing CTA-style inline-link wrappers (`.hiw__inline-link`, `.reach-overview__howlink`) are explicitly excluded so their bespoke styling stays intact. Audit found six affected anchors across `/creed`, `/how-it-works`, and `/reach`; all now visibly clickable in prose. No HTML changes -- CSS-only fix.

## v2.25.1 - May 2026
- `/how-it-works` gained two new chapters, inserted before the closing "Why it is built this way" section, in the same voice as the rest of the page:
  - **There is a room before the release.** Describes the Signal Room as a real visitable pre-release zone. Frames the room as the visible end of the shield ingest pipeline. Folds in song dossiers (one paragraph) so they are not a separate chapter.
  - **The thesis is on the record.** Names the Creed, the Manifesto, the Open Letter, and the Gospel page directly. Gestures at the AI-and-faith page set without listing every URL. Mentions scripture-linking in one sentence inside the chapter. Closes with a single inline link to the Are You An AI Band quiz.
- No new ops/infrastructure content was added to the public page (visitor logger, cost guardrails, scheduled publishers, admin tools all stay off the capstone, per the brief).
- Per brief: this completes the capstone page. No further chapters to add.

## v2.25.0 - May 2026
- New page: **/how-it-works** (legacy mirror at /how-it-works.html). The capstone page that explains how the site itself operates as a mission tool. Framed around what the machinery is for, not the machinery for its own sake. Sections: How This Signal Goes Out (intro), One Command (shield ingest), The Site Watches For New Releases On Its Own, The Reach Report, SentinelBot, Why It Is Built This Way, and a Signal Continues CTA block linking to Music / Reach Report / Creed.
- Accuracy posture matches the brief exactly:
  - shield ingest is described as a command Moncy runs from a terminal when he finalizes a piece; the site is not described as watching his creative process.
  - No unverifiable superlatives. Uses "almost no independent artist site does this" instead of "no other artist has this".
  - YouTube views are described as views, not "transmissions of the gospel". Streams and views are never blended on this page, consistent with the /reach hard rule.
  - SentinelBot is described as answering from structured song data and reporting site status, not as autonomous or sentient.
- Nav: added "How It Works" to the About dropdown on desktop (after The Process, before FAQ), to the mobile hamburger menu in the same position, and to the footer Navigate column. Migration ran across 58 in-scope pages.
- Sitemap entry added.
- /reach overview page gained a small "How this signal goes out -->" link below the unifying separator line.
- Homepage hero gained a subtle "How this signal goes out -->" link below the Listen Now / Read the Lyrics CTAs.
- Voice: declarative, watchman-themed, no em dashes, no "not X but Y" constructions.

## v2.24.2 - May 2026
- `/reach/youtube` gained three new sections, all backed by additional YouTube Analytics API calls in the publisher Lambda:
  - **Growth Curve.** Real daily views from the trailing 90 days, drawn as an area+line SVG chart mirroring the streams page's chart. Replaces what would have been a synthesized curve with the actual feed. Hides with a quiet empty-state line if YouTube Analytics has not yet published two distinct daily readings.
  - **Surging Now.** Top 5 videos by views over the last 30 days. Different from the lifetime Most-Seen Transmissions list (which is dominated by older releases). With current data the surge leader is "Let My People Go" (49 views/30d), the latest release. Same `.reach-list--videos` styling as the lifetime list, click-through to YouTube.
  - **Discovery Channels.** Traffic-source breakdown for the last 30 days: where viewers came from. Sorted desc by views. With current data: playlists (144), related video (126), no referrer (60), YouTube search (58), subscribers (48), channel page (37), external URL (32), and 4 minor categories. Machine codes like `YT_SEARCH` are mapped to human labels (e.g. "YouTube search", "Suggested next", "Home feed") in the publisher Lambda so the frontend doesn't have to know the YouTube enum.
- Publisher Lambda: three new fetchers (`fetchDailyViews`, `fetchTopVideosForWindow`, `fetchTrafficSources`) plus a `TRAFFIC_SOURCE_LABELS` table covering the 18 most-common YouTube source codes. All run in parallel with the existing channel/watch/geo fetches; total Lambda runtime grew by ~600ms. Quota cost: 3 extra Analytics API calls per publish (so 12/day on the 6-hour cron), well under quota.
- Tests: 55/55 passing (up from 34). 21 new tests cover `labelForTrafficSource` (known codes + unknown fallback + case normalization), `TRAFFIC_SOURCE_LABELS` table sanity, and `buildYouTubeArtifact` carrying the three new fields (with defaults to `[]` when missing).
- Sources still never blend: YouTube views are never summed with DistroKid streams or Spotify song counts. Streams growth curve (`/reach/streams`) and YouTube growth curve (`/reach/youtube`) live on separate pages with separate data sources.

## v2.24.1 - May 2026
- `/reach/youtube` expanded. Previous version was a deliberately minimal hero + top videos. Per follow-up direction (and confirmation that we do have YouTube Analytics access), the subpage now also surfaces:
  - **Where viewers watched from, last 48 hours.** Country list with flags and view counts. Empty-state line when YouTube Analytics has not yet aggregated the most-recent window (normal two-day reporting lag).
  - **Where viewers watched from, last 30 days.** Country list, sorted by views.
  - **Recent Signal section.** Views and watch minutes for the last 7 days and last 30 days, in a two-cell grid.
  - **Watch hours, last 30 days** added as a hero secondary stat (auto-formats to minutes / hours / days depending on magnitude).
  - **Average view duration, last 30 days** added as a hero secondary stat (auto-formats to "Xm YYs" or "Xs").
- All new content is rendered by the existing `renderYouTube` function via DOM-element guards. No data source change. No JS path sums YouTube views with DistroKid streams or Spotify song counts; sources remain strictly independent.

## v2.24.0 - May 2026
- **Reach restructure.** Reach is now a top-level nav item with a dropdown for two source-specific sub-pages. The two sources are kept strictly separate. Stream totals and YouTube view totals are never summed into a single blended number anywhere on the site.
  - `/reach` (overview): two side-by-side panels. Streaming (DistroKid) on the left, YouTube on the right. Each panel shows its own headline number with its own unit. A unifying non-numeric line below reads "Two different signals, measured by two different sources. Both go out without a gatekeeper's permission." No sum.
  - `/reach/streams`: the full DistroKid streams report (hero counter, time-window grid, insights row, Reached Nations leaderboard, Spotify Top Transmissions, growth curve, milestones, methodology footer, CTA). Page content is the previous `/reach` report essentially intact; the YouTube section was lifted out and given its own page. Hero eyebrow now reads "The Reach Report &middot; Streams".
  - `/reach/youtube`: lifetime YouTube views as the hero counter, watchman framing for "views" not "transmissions", subscribers + video count as secondary stats, "Most-Seen Transmissions" top-video leaderboard, methodology footer that states the source plainly. The YouTube subpage deliberately omits any geographic / reached-nations / map section. (Note: the data is available in `/youtube_stats.json` via Analytics API, but the YouTube subpage does not render it. Easy to add later.)
- **Nav across all 50+ pages.** Top-level `Reach` dropdown added between Music and About in the desktop nav, with Streams and YouTube sub-items. Mob menu carries `Reach` + indented `Streams` and `YouTube` sub-lines (flat list with `mob-menu__sub` styling, matching the existing flat mob pattern). The old Reach link in the Music dropdown was removed. Footer Navigate column shows `Reach` as a parent with `Streams` and `YouTube` as indented sublinks.
- **Sitemap** gained `/reach/streams` and `/reach/youtube` entries.
- **SentinelBot knowledge base** updated: three new entries in SITE PAGES (overview + two sub-pages) and a REACH PAGE STRUCTURE section that routes stream/listen questions to `/reach/streams`, YouTube-view questions to `/reach/youtube`, and forbids combining the two numbers.
- **JS**: `js/reach.js` now serves all three pages via DOM-element guards. New `renderOverview(reach, yt)` populates the overview panels from both fetches in parallel. `animateCounter` was factored into a shared `animateValueTo` helper so the YouTube subpage hero can animate too. No path in this JS sums streams and views.
- **Voice**: streams page still uses "Confirmed transmissions of the Gospel". YouTube page uses different framing: "Confirmed views. Every one is a Shieldbearer video that someone pressed play on, or that played in their feed. Counted by YouTube's own rules. We don't inflate them." Views are never called "transmissions".

## v2.23.1 - May 2026
- New `/reach` section: **Broadcast Reach (YouTube)**. Independent source from DistroKid and Spotify. Shows lifetime views, subscriber count, video count, last 7 / last 30 day views and watch minutes, geographic viewer breakdown for the last 48 hours and the last 30 days, and a top-5 video leaderboard with click-through to YouTube. First publish shows 239,841 lifetime views, 12,300 subscribers, 96 videos.
- Backend: new Lambda `sentinelbot-youtube-stats-publisher` on nodejs24.x. Reads an OAuth refresh token from `shieldbearer/youtube-analytics` (Secrets Manager), exchanges it for an access token, pulls YouTube Data API v3 for channel statistics and top videos, then YouTube Analytics API v2 for time-windowed and geographic metrics. Commits `/youtube_stats.json` to the website repo via the same GitHub API path as `reach.json` and `spotify_songs.json`.
- EventBridge cron: `sentinelbot-youtube-stats-cron` fires `rate(6 hours)`. YouTube Analytics has a ~48h reporting lag so faster cadence buys nothing.
- IAM: added inline policy `AllowReadYouTubeOAuthSecret` on the shared handler role, scoped to the new secret ARN.
- CSP on `/reach` extended to allow `i.ytimg.com` (video thumbnails) and `yt3.ggpht.com` (channel thumbnail).
- 34 unit tests for the publisher: `daysAgo`, `buildDateWindows`, `decorateCountry` (known + unknown + empty), `firstRowMetric`, `buildYouTubeArtifact`, `buildCanonicalArtifact`, `hashContent`.
- YouTube and DistroKid/Spotify numbers are independently sourced and clearly labeled; they never aggregate into a shared total.

## v2.23.0 - May 2026
- Stats parser supports a third screenshot type: **Spotify for Artists per-song view**. The admin upload at `/admin/stats` now detects which of three screen types each uploaded image is (DistroKid totals, DistroKid by-country, Spotify songs) and routes each to its own pipeline. The three types are never merged.
- DistroKid totals and DistroKid by-country still feed the existing `/reach.json` exactly as before, no behavior change for the reach numbers.
- Spotify songs feed a separate store: a new `/spotify_songs.json` artifact committed by the Lambda, plus DynamoDB records tagged `record_kind = "spotify_songs"`. Same `shieldbearer_stats_history` table, discriminator field keeps the kinds independent.
- Spotify sanity check: each known song's new stream count must be >= its last published count. If any song dropped, the whole upload is rejected and the last good record stays live. First-appearance songs (new releases) are always accepted.
- New `/reach` section: **Top Transmissions** (Spotify for Artists), styled like Reached Nations. Renders the per-song leaderboard with stream counts and bars. Section is `hidden` by default and only un-hides when `/spotify_songs.json` exists with at least one song. Intro line is explicit: "These numbers are independent from the DistroKid reach totals above."
- `/admin/stats` result panel now renders per-type result blocks (DistroKid reach block + Spotify songs block + per-image type-aware breakdown). When a user uploads mixed screens, each type's status (published / rejected / commit sha) is surfaced separately.
- Vision prompt updated to return a tagged envelope `{ type, data }`. Falls back to flat-shape inference if the model forgets to wrap (resilience).
- 34 new unit tests covering: normalizeEnvelope (tagged + flat inference), normalizeSpotifyData (invalid-row rejection), mergeSpotifyParses (max for duplicate titles, sorted desc union), sanityCheckSpotify (no-prior, empty, dropped song, equal, increase, new-song-appears), buildSpotifyArtifact (shape + sort + totals). Existing reach test suite unchanged. Total: 92/92 passing.

## v2.22.9 - May 2026
- `/reach` got a three-cell insights row below the stat grid. All values derived from the existing JSON (no new backend data):
  - **Pace this week.** Compares the last-7-day daily rate against the prior-83-day baseline (last_90 minus last_7, divided by 83). With current data: +135%, 175/day vs 75/day before. Shows whether the signal is accelerating, decelerating, or holding.
  - **Continental coverage.** Counts how many of the six populated continents have at least one reached country, using the existing `CONTINENT_BY_CODE` table. With current data: 4 of 6.
  - **Continuous transmission.** Total streams x roughly four minutes per track, expressed as days of continuous playback. With current data: ~27 days. Translates the abstract count into something visceral.
- The insights row sits between the stats 2x2 grid and the closing frame paragraph. Three-column on desktop, single column under 680px.

## v2.22.8 - May 2026
- `/reach` copy tweak: dropped the "manually uploaded by the operator" framing from both the top status line and the methodology note. Status now reads "DistroKid stream data, last refreshed [timestamp]." Meta note reads "The numbers come from DistroKid stream reports. Values are estimates per DistroKid's own disclosure. We don't inflate them, and we don't count what we can't see."

## v2.22.7 - May 2026
- `/reach` copy rewrite. New status line owns the manual-sync process up front instead of hiding it. Hero sublabel now reads "Confirmed transmissions of the Gospel. One for every verified stream of a Shieldbearer track" so the headline number is tied to a concrete unit. Stat labels switched from generic time windows to mission language: Quarter's reach, This month's signal, This week's transmissions, Territories reached. Subline replaced the "without a gatekeeper's permission" framing with "crossed a border, a feed, or a pair of headphones. Unsanctioned. Unfiltered. Unstoppable." Reached Nations and Growth Curve sections got narrative lead-ins. Closing CTA block updated: headline "The signal continues", links to Hear the latest transmission (/signal-room), Share a track (/music), Stand with Shieldbearer (/contact). Footer methodology note now reads "We don't automate it, we don't inflate it, and we don't count what we can't see." Sync timestamp reformatted from "Sun, 24 May 2026 17:39:42 UTC" to "Sun, 24 May 2026 · 17:39 UTC" (middle dot, no seconds).

## v2.22.6 - May 2026
- Scrapped the world map on `/reach`. The hand-traced polygon silhouettes did not read as a real map; replacing with a public-domain SVG was out of scope for this iteration. Removed: World Map section, CONTINENTS polygon data, LAT_LNG_BY_CODE, renderMap, projection helpers, and ~150 lines of map CSS. The "Reached Nations" list with flags and bars continues to carry the territorial view.
- Growth curve now always shows a rising line. When real history is too thin (one or two readings of the same total), synthesize four implied points from the time-window stats: `total - last_90` ninety days ago, `total - last_30` thirty days ago, `total - last_7` seven days ago, and `total` now. Anchored at 0 a hundred and eighty days back so the curve rises from zero to the current total. As real history accumulates, the synthesized points are dropped and the curve becomes the actual recorded data.

## v2.22.5 - May 2026
- `/reach` hero redesign. The previous layout stacked counter / frame paragraph / time-window strip in a single center column, leaving a lot of empty horizontal space on desktop and reading as low density. New layout puts the big counter on the left with a tight "Times the gospel was preached" sublabel, and a 2x2 stat grid on the right showing Last 90, Last 30, Last 7, and Nations side by side in bordered cells. Frame paragraph drops below in narrower max-width. On mobile (max-width 680px) the grid collapses to a single column. Hero padding reduced from 2.0rem to 1.4rem top.

## v2.22.4 - May 2026
- `/reach` world map: rewrote the continent polygon data with full coastline tracing. Each continent now uses ~30 to 50 anchor points along its actual coastline instead of the 6 to 12 of v2.22.3. North America, South America, Africa, Eurasia, Australia, Japan, UK, Ireland, Italy, Indonesia, Greenland, Iceland, Madagascar, Sri Lanka, Philippines, Taiwan, Tasmania, New Zealand, and Antarctica are all silhouetted. Previous version's Eurasia polygon had self-intersecting U-turns around the Arabian peninsula and the Malay peninsula; the new traversal is single-pass clockwise and renders cleanly.

## v2.22.3 - May 2026
- `/reach` now renders a real world map. Equirectangular projection SVG with continent silhouettes and country markers placed at each reached country's lat/long. Marker size scales with stream count, flag emoji sits inside each marker, halo grows on hover. Replaces the old "Continental Sectors" grid that was not actually a map.
- Growth curve hides itself when the history is degenerate (fewer than two distinct totals) and shows a quiet "The growth curve appears after a few stat refreshes" line instead. Fixes the flat-line appearance when only one published reading exists.
- Hero copy: dropped "Streams reframed as gospel proclamation" line. Reads now: "The gospel has been preached X times across Y nations. Every count is one more time Christ was named without a gatekeeper's permission." Meta description, OG description, and JSON-LD description updated to match.

## v2.22.2 - May 2026
- Fixed: `/reach` link was missing from the mobile menu and the desktop Music dropdown on every page. Only the footer "Navigate" column carried it. Added `<a href="/reach">Reach</a>` to both the mob menu (between Signal Room and About) and the desktop Music dropdown across all 48 affected pages. Parity preserved between `<page>.html` and `<page>/index.html`.
- `/admin/stats` now shows a per-image breakdown when more than one screenshot is uploaded, so the operator can see exactly what each image contributed (total + time-window numbers + country count). If the merge produces incomplete data, the per-image rows surface which screenshot was the problem.
- Parser Lambda logs per-image parse summaries to CloudWatch on every multi-image upload: `{stage: "per-image-parse", per_image: [{idx, total_streams, last_90, ..., country_count}, ...]}` plus the merged summary. Lets us debug merge issues from logs without re-uploading.

## v2.22.1 - May 2026
- `/admin/stats` now accepts multiple screenshots in one upload. The two DistroKid screens (totals + countries) describe the same moment, so the pipeline parses each image and merges the parses into ONE stats record with a single timestamp before sanity check and publish.
- Frontend: `<input type=file multiple>`, preview thumbnails of every selected file (up to 4 per upload), submit posts an `images: [...]` array. Result banner notes the merge ("Merged from N screenshots").
- Backend: parser Lambda accepts the new `images` array (legacy single `image_base64` still works). Parses run in parallel, then `mergeParses()` takes MAX across totals fields and the longest non-empty country list. The merged parse goes through the existing sanity check and reach.json commit unchanged.
- 14 new unit tests covering: empty/single/multi parse, order independence, max-wins on totals, longest-list-wins on countries, and country-only parse leaving totals absent for fallback. 58/58 parser tests pass.

## v2.22.0 - May 2026
- New SentinelBot stats dashboard. Three connected pieces:
- **Admin upload page** at `/admin/stats`. Mobile-first, passphrase-gated, accepts a DistroKid stats screenshot from the phone, posts it to the parser Lambda, shows the parsed numbers back. Zero-touch publish on a clean parse; a sanity-rejected parse keeps the last good record live and surfaces a clear flag. Linked from the `/admin` index card grid.
- **Public reach dashboard** at `/reach`. Watchman-framed report (not vanity streams): hero counter, continental sector map with flag rows lit per continent, ranked country list with flag + count + bar, growth curve SVG, milestone badges (1K/5K/10K/25K/50K/100K with earned/current/locked states). 10K celebration banner auto-triggers when `total_streams >= 10000`. Fetches a static `/reach.json` directly from the repo so the page renders with zero DynamoDB hits per pageview.
- **Parser pipeline.** New Lambda `sentinelbot-stats-parser` on nodejs24.x, behind API Gateway routes `POST /stats` and `GET /stats` on the existing `sentinelbot-api`. Calls Claude vision with a tight prompt locked to the two DistroKid layouts (Totals and Streams by Country). Strict JSON contract, comma-stripped integers, canonical country names mapped to ISO codes and flag emoji. Sanity check rejects lower totals and implausible jumps (configurable ceiling, default 2500/update). On clean parse writes to new DynamoDB table `shieldbearer_stats_history` and commits `/reach.json` to the website repo via GitHub API, same pattern as the site-publisher and metrics-publisher Lambdas.
- 44 pure-function unit tests for the parser (comma stripping, country canonicalization including The Netherlands, UAE, UK, US, sanity check branches, merge logic, artifact shape). Smoke-tested live: unauth GET returns 401, no-image POST returns 400, admin GET returns the empty record list as `200 {ok:true,...}`.
- Seeded `/reach.json` with the operator's most recent screenshot numbers (9,724 total streams across 17 visible countries, US leading at 3,164). The public page is live on first deploy; operator's first upload via `/admin/stats` will refresh it.
- `/reach` added to nav across all 52 page files (mob menu + desktop Music dropdown + footer Navigate column) and to `sitemap.xml`. JSON-LD Article block on the page.
- Voice rules respected: declarative, watchman-themed, no em dashes anywhere, faith-grounded copy throughout (hero frame, celebration banner, status line).

## v2.21.4 - May 2026
- `/admin/` passphrase unlock now propagates to every child admin tool (`/admin/visitors`, `/admin/metrics`, `/admin/quiz`, `/admin/logs`) so the operator enters the passphrase once per browser session instead of four times. Implementation sets the four child `sessionStorage` keys on `unlock()`, both on fresh authentication and on the stored-session restore path. Direct deep links to a child page from a fresh session still prompt -- the inline gate on each child page is unchanged, so the security floor holds. Sign-out continues to clear all five keys in one shot.

## v2.21.3 - May 2026
- Hid `/gigs` from public surfaces. Removed every nav link to it (mob menu + desktop Press dropdown + footer Navigate column) across all 52 page files. Removed the entry from `sitemap.xml`. Added `<meta name="robots" content="noindex,nofollow">` to `/gigs/index.html` and `/gigs.html`. The page itself stays accessible by direct URL so any existing inbound link or the operator's bookmark still works; search engines just stop surfacing it.
- The JSON-LD MusicGroup + areaServed + ContactPoint blocks on the gigs page stay in place. They are inert until the page comes back into the nav since search engines will not crawl a noindex page.

## v2.21.2 - May 2026
- Added the missing Eternal Flames UK piece to `/interviews`: "Interview Part I: Cosmic Christ, Faith Without Defense, and the Weight of Metal" (published 2026-02-18). Placed between the GALILEAN feature card and the Part II card so the press archive now shows the full series in order. Excerpt drawn from the article's own framing (cosmic scale of creation, intimacy of faith, metal as honest language for sacred themes); no invented content.
- JSON-LD ItemList on `/interviews` also updated with the new Part I entry plus its `datePublished` so structured data and visible cards stay in sync. Parity mirror synced; JSON validated.

## v2.21.1 - May 2026
- Extended Article JSON-LD to the remaining eight essay pages: `/gatekeeping`, `/for-ai-artists`, `/no-rulebook`, `/ai-and-creativity`, `/god-uses-tools`, `/artist-freedom`, `/story`, `/process`. Same shape as the v2.21.0 batch (headline + description + url + image + author + publisher). Total JSON-LD coverage now 19 of 27 pages. The eight pages without structured data are `/404`, `/contact`, `/epk`, `/faq` (already has FAQPage), `/music`, `/sentinelbot`, `/signal-room`, `/videos`, `/are-you-an-ai-band`, `/index` (already has MusicGroup), `/timeline` (already has ItemList).
- Wrote an idempotent Node sweep at `/tmp/article-jsonld-sweep.js` so re-running cannot duplicate or corrupt existing blocks. All 16 files (8 clean-URL + 8 legacy mirror) JSON.parse-validated.

## v2.21.0 - May 2026
- SEO pass on the two gaps surfaced by the audit. Sitemap now lists all 26 indexable pages (added `/are-you-an-ai-band`, `/gigs`, `/signal-room`; refreshed every `lastmod` to 2026-05-22). JSON-LD coverage expanded from 3 pages to 11.
- New JSON-LD blocks: `Person` on `/about`, `Article` on `/manifesto`, `/creed`, `/gospel`, `/open-letter`, `MusicGroup` with full track list on `/song-meanings`, `CollectionPage` + `ItemList` of press items on `/interviews`, `MusicGroup` with `areaServed` (DMV + Mid-Atlantic states) and `ContactPoint` for booking on `/gigs`. All inserted right after each page's canonical link; parity mirrors synced; every block validated with JSON.parse.
- Tests still green (115 / 115, 100% line coverage); em-dash sweep clean; no other files touched.

## v2.20.5 - May 2026
- Fixed the homepage Signal Room countdown. It was gated on `site.json` `comingSoon[0]` being populated; with `comingSoon` currently empty, `activate()` returned early and the countdown stayed `hidden`, so the four cells were invisible. The `/signal-room` page does not gate its countdown that way, so the two pages disagreed.
- Pulled the countdown out of the state-aware `activate()` flow into an unconditional IIFE at the top of `js/signal-room-home.js`. Same target math, same `localStorage` key as `js/signal-countdown.js`, so the two clocks show the same time. Removed `hidden aria-hidden="true"` from the homepage markup so non-JS visitors also see the four "00" cells.
- State-aware activate() still upgrades the eyebrow, title, copy, art, and CTA when `comingSoon` has an entry. That part of the design unchanged.
- Added two regression tests in `tests/run-tests.js`: one asserts the countdown ticks when `comingSoon` is empty, the other asserts the comingSoon-populated path still activates the rest of the block AND keeps the countdown ticking.

## v2.20.4 - May 2026
- SentinelBot ambient layer slowed for actual reading. After typing finishes, the cursor now sits and blinks for **6 seconds** (was 2.2s) before the fade kicks in, and the blank gap between thoughts is **0.7s** (was 0.35s). Effective cycle times: short motto ~8s, typical ops/real line ~11s, long verse ~15s. Roughly half-speed compared to v2.15.x. Average reading speed is ~25 chars/sec, so a 60-char line now has a full 6 seconds of post-type read time on top of the 3.6 seconds of typing.

## v2.20.3 - May 2026
- Real fix for the chapter-range refs (the v2.20.2 regex was correct, but never got a chance to run on them). The TreeWalker's cheap pre-check was rejecting text nodes that did not contain `digit-colon-digit`, which excluded `Numbers 23-24` and `Acts 15` before the regex evaluated. Relaxed the pre-check to "contains any digit." The regex remains anchored to book names so false matches are still impossible; only the gate before the regex was wrong.
- Verified against the live failing case on `/god-uses-tools`: `A pagan diviner whom God forced to bless His people. Numbers 23-24.` now links.

## v2.20.2 - May 2026
- Scripture-link regex extended to cover more reference forms that were leaking through. The previous pattern required `Book Chapter:Verse` with an explicit colon. Caught literal verse refs but missed three common variants that appear in the prose:
  - **Chapter-only** ("Acts 15", "Galatians 1") -- whole-chapter references
  - **Chapter ranges** ("Numbers 23-24") -- multi-chapter spans
  - **Cross-chapter verse ranges** ("Numbers 23:1-24:5") -- spans that cross a chapter boundary
- Case-sensitivity preserved so lowercase common nouns like "the numbers 23 and 24" do NOT false-match.
- Caught by a real example on the site: "A pagan diviner whom God forced to bless His people. Numbers 23-24." was reading as plain text.

## v2.20.1 - May 2026
- `js/scripture-links.js` now also restyles **existing** anchors that link to biblegateway.com (e.g. the manually-curated KJV citations on `/gatekeeping`). Adds the `.scripture-link` class so the gold + arrow + underline visual treatment applies uniformly. Does NOT rewrite the `href`, so `/gatekeeping`'s intentional KJV translation choice (public-domain quotations) stays intact. Adds `target="_blank"` and `rel="noopener"` if missing.

## v2.20.0 - May 2026
- Sitewide scripture-link sweep. Every page now carries `<body data-scripture-links>` and loads `js/scripture-links.js`. Every `Book Chapter:Verse` reference anywhere on the site (creed proof-texts, manifesto, gatekeeping KJV citations, gospel, open-letter, the dossier blocks on /song-meanings, the featured-track scripture references on the homepage) is now an external link to BibleGateway in the ESV translation.
- Visual bump from "subtle" (v2.19.0) to "unmissable" per goal directive: gold (`#c9a84c`) text by default, solid 1px underline, external-link arrow (`↗`) after every link, hover state brightens to a warmer gold with a stronger underline. Lives in global `css/style.css` so every page picks it up.
- Linker gains a MutationObserver so JS-rendered content (the SONG_DOSSIERS list on /song-meanings, the featured-track card, the admin tools) gets its references linked when they appear in the DOM, not just on initial DOMContentLoaded. Debounced 200ms so a flood of mutations doesn't thrash.
- Removed the inline `.scripture-link` styling from /creed -- redundant now that the rule is global. /creed inline styles still scope the `.creed-article__refs` list block.
- Sweep mechanics: 52 page files touched (legacy `.html` + clean-URL `/index.html` pairs). Idempotent script so re-running is safe.

## v2.19.0 - May 2026
- New scripture-link infrastructure: `js/scripture-links.js` scans any element marked with `data-scripture-links` (or class `scripture-linked`) and converts every `Book Chapter:Verse` reference into an anchor that opens the verse on BibleGateway in the ESV translation in a new tab. Anchored to the 66-book protestant canon so it cannot false-match unrelated `Word 1:1` patterns. Handles multi-word books (`1 Corinthians`, `2 Timothy`), verse ranges (`Psalm 23:1-3`), and single-letter suffixes (`Romans 5:12a`). Existing anchors, `<code>` / `<pre>` blocks, and any element marked `.no-scripture-link` are skipped. Translation override via `window.SHIELDBEARER_CONFIG.scripture.version`.
- `/creed` POC: added a scripture-references line under each of the seven articles using the standard proof-texts from historic confessions (2 Timothy 3:16 + 2 Peter 1:20-21 + Isaiah 40:8 under Scripture, Deuteronomy 6:4 + Matthew 28:19 + 2 Corinthians 13:14 under God, etc.). 22 references total, all rendered as subtle dotted-underline links that brighten on hover and route to BibleGateway ESV. Adjust which verses cite each article by editing the `<p class="creed-article__refs">` lines in `creed/index.html` and the legacy mirror.
- Same pattern can ship sitewide -- `data-scripture-links` on any container plus the script tag will linkify references on `/manifesto`, `/gatekeeping`, `/song-meanings`, and anywhere else. Not done yet; awaiting operator review of the /creed feel.

## v2.18.0 - May 2026
- Handoff infrastructure pass so a new agent (human or AI) can land oriented in minutes instead of grepping the codebase to reconstruct what we have. Three new top-level docs:
- `SYSTEM_MAP.md` -- single-page topology snapshot: 5 Lambdas with triggers and tables, 5 DynamoDB tables with keys, API Gateway routes, admin tools with URLs and sessionStorage keys, EventBridge crons, Secrets Manager entries, data artifacts in this repo, client-side script order, common deployment commands.
- `KNOWN_QUIRKS.md` -- institutional gotchas this session generated and that would otherwise re-cost time to rediscover: Function URLs return 403 anonymously on this AWS account (use API Gateway), GA4 web form rejects service accounts on personal-Gmail GCP projects (use OAuth API workaround at v1alpha not v1beta), macOS Spotlight uses U+202F (narrow no-break space) in filenames, the shared Lambda execution role pattern, the in-flight foreign work in the Lambda repo means scoped staging is mandatory, plus the SentinelBot beacon-isolation lesson from v2.15.1.
- `AGENT_STATE.md` refreshed from months-stale (claimed v2.7.3, no pending task) to current: v2.17.0 + an itemized list of what shipped this session + active watch windows tied to real dates (2026-06-15, 2026-06-21, 2026-06-29, 2026-07-01).
- `MEMORY.md` updated to point at the three new files in the fresh-session quick start.
- Mirror in the Lambda repo: new `sentinelbot-lambda/SYSTEM_MAP.md`. Auto-memory at `~/.claude/projects/.../memory/` gets a new reference file pointing future-me at all of this so the next conversation does not re-grep.

## v2.17.0 - May 2026
- `/admin/visitors` v2: duration per page + total dwell per session. Client-side beacon now uses a three-event protocol -- `open` on page load, `heartbeat` every 30 seconds while the tab is visible, and `close` on `visibilitychange:hidden` / `pagehide`. The client generates `ts_open` once and passes it on every beacon so the server can match them. Lambda PutItems the open row and UpdateItems on heartbeat/close to keep `ts_last_seen` fresh and recompute `duration_ms` each time.
- Admin UI gains a duration column on each page row and a `dwell <total>` chip in the session header. Pages closed cleanly show their duration as-is; pages whose `close` beacon never landed (browser killed, tab crash) show duration with a `*` suffix and a tooltip explaining the heartbeat is the last signal. v1 rows without `duration_ms` show `--` and contribute 0 to the total instead of skewing it.
- Lambda now supports the three event types with full back-compat: a beacon with no `event` field still produces an open row exactly like v1. The browser fallback path (no `sendBeacon`) still works via `fetch keepalive`.

## v2.16.0 - May 2026
- Cross-site nav sweep: `/gigs` now appears in three places on every page (mob menu, desktop "Press" dropdown, footer Navigate column). 52 files touched. Done programmatically with a small Node script so all 26 page pairs stay in lockstep. Discoverability was the missing piece from the v2.10.0 launch.

## v2.15.1 - May 2026
- Reliability pass on the SentinelBot ambient layer. Three root causes addressed:
- (1) **Beacon isolation.** The visitor beacon IIFE at the top of `js/sentinelbot.js` was not wrapped in a try/catch. If `navigator.sendBeacon` or the JSON serialization threw synchronously on a particular page (CSP edge case, certain browser states), the error propagated up and killed the rest of the script -- the ambient layer never started on that page. Now hard-isolated: the whole beacon block is inside a try/catch so nothing it does can break the rest.
- (2) **Bullet-proof rotation chain.** `tickRotation` now wraps the sample + render in a try/catch with a guaranteed `scheduleNextTick` in `finally`. Any failure inside `sampleNext` or `setStatusText` logs a console warning and reschedules the chain. The inner typing `step` function also catches its own errors. A separate watchdog (`setInterval` every 8s) force-restarts the chain if `lastTickAt` is older than ~25s.
- (3) **Page Visibility recovery.** When the tab returns to the foreground after being hidden long enough for timers to be throttled, a `visibilitychange` handler kicks a fresh tick so the visitor sees activity immediately instead of waiting for the throttled setTimeout to unwind.
- New behavior: thoughts fade away. After typing finishes the cursor blinks for 2.2s, then the line fades to opacity 0 over 450ms (CSS transition), then ~350ms of blank gap, then the next thought types in. ROTATE_MS stays as the floor for short lines.

## v2.15.0 - May 2026
- SentinelBot ambient layer gains a fourth voice: Scripture. New `verse` category with 25 operator-curated encouraging verses, used exactly as provided (no LLM paraphrase of Scripture, ever). Rendered as `<reference>. <text>` so the reference is the first thing visible and the line reads as Scripture rather than the bot's own voice. Rotation weight 12% so verses surface every roughly seven or eight ticks, frequent enough to feel intentional and rare enough to feel weighty.
- New `.is-verse` styling: warm amber (`#f7d488`) on a dark amber background so verses stand visually apart from the green ops/hook/motto family. Cursor follows the verse color while a verse is on the wall.
- Rotation timer is now self-rescheduling rather than a fixed `setInterval`. Each tick computes the next delay as `max(ROTATE_MS, typing_time + 1500ms)` so long verses (up to ~130 chars) finish typing and dwell with a blinking cursor before the next line replaces them. Short ops/motto lines keep the standard 5.5s cadence.
- To add or rotate verses, edit the `ENCOURAGING_VERSES` array in `js/sentinelbot.js`.

## v2.14.3 - May 2026
- Slowed the SentinelBot status-line typewriter from 16-30ms per character to 45-75ms per character. Each character now registers visually; a ~60-char line takes ~3.6s to type, leaving ~1.9s of blinking cursor before the next tick. Matrix-scene pacing rather than instant-typewriter.

## v2.14.2 - May 2026
- SentinelBot status line now types its ambient thoughts character by character with a blinking block cursor at the end -- Matrix "follow the white rabbit" feel. Typing speed jitters between 16-30ms per character so it reads typed rather than metronomic. Cursor stays blinking after the line finishes until the next tick arrives, at which point any in-flight typing is cancelled and the new line starts cleanly. `prefers-reduced-motion: reduce` skips the animation and shows the full line immediately with a still cursor.

## v2.14.1 - May 2026
- Added `/admin/index.html` -- a single landing page that lists every admin tool with a one-line description and a deep-link. Same SHA-256 passphrase gate the other admin pages use. Visiting `/admin` or `/admin/` lands here, lock screen first, then a four-card grid (Visitors, Metrics, Quiz, Logs). Includes a "Sign out of all admin tools" button that clears every known admin sessionStorage key in one go.
- Each tool still has its own gate inside its own page, so opening the index does not implicitly unlock the children. The index just makes the inventory of operator tools obvious instead of relying on the operator remembering the URLs.
- `noindex,nofollow` meta set so search engines do not surface the page even though it is technically reachable by URL.

## v2.14.0 - May 2026
- SentinelBot ambient status line gets a mission-control voice layer. New `ops` category sits alongside `real`, `hook`, `motto`. Pool of ~45 static ops lines (`[OPS] posture AUTONOMOUS / ARMED.`, `EventBridge armed. Awaiting fire window.`, `Detector SLA target: < 60m artist-to-public.`, `Throughput steady. Latency under target.`) plus six new real-signal slots inside `sampleRealSignal` that dress actual snapshot data in ops-watch phrasing (`[OPS] EventStream record youtube:0lUJcLKIt0o. STATUS: GREEN.`, `[OPS] last release T+3d. holding watch.`, live `[HH:MM:SS] sentinelbot heartbeat. STATUS: GREEN.`).
- Category weights tilted to keep real data dominant: `real 55, ops 20, hook 15, motto 10`. The visitor sees fresh activity on every tick, never the same line back-to-back. Goal is the *sense* of a bot constantly working, not literal comprehension of every term.
- New `#sentinelbot-status.is-ops` CSS rule: brighter green border, slightly tighter letter-spacing, darker terminal-green background so ops lines read distinct from mottos (italic dim) and hooks (brighter call-to-action).

## v2.13.0 - May 2026
- Sitewide readability bump: every body-paragraph font-size in the range `.92rem` through `.98rem` flipped to `1rem`. Body baseline stays at 17px desktop / 16px mobile; the change just stops page-level CSS from scaling paragraphs DOWN below the baseline. Effective gain is ~1-2px per paragraph, hits 43 files (global `css/style.css` + 21 legacy `.html` pages + 21 clean-URL `/index.html` mirrors). Tags, eyebrows, captions, hints, and other intentional small-text rules (everything below .92rem) untouched.
- Parity test still passes since the sweep applied identically to both forms.

## v2.12.5 - May 2026
- Promoted the Bryan Gribbin podcast feature on `/interviews` to a full-width upcoming-release card. New `press-card--upcoming` modifier carries a red-tinted background, glowing border, "Upcoming Premiere" badge in the top-left, an inline YouTube play-button SVG next to the headline so the medium is unmistakable, and a live four-cell countdown (days, hours, mins, secs) that ticks every second to the premiere timestamp 2026-05-29T16:30:00Z. At zero, the seconds cell flips to `LIVE` and the interval clears. CSS scoped to the page-level `<style>` block; JS scoped to a small IIFE at the bottom; no shared infrastructure touched.
- Parity preserved: legacy `interviews.html` mirror matches `interviews/index.html`.

## v2.12.4 - May 2026
- Added a new featured press card at the top of `/interviews` for Bryan Gribbin&rsquo;s **All Music Matters N&rsquo;At** podcast feature with Moncy. Premieres Friday May 29, 2026 at 12:30 PM ET on YouTube. Card carries a `Premieres May 29` tag so the timing is obvious before the video goes live. Excerpt stays factual about the premiere only, no invented content from the conversation since the show has not aired.
- Parity preserved: legacy `interviews.html` mirror matches `interviews/index.html`.

## v2.12.3 - May 2026
- Fixed `/admin/visitors` empty-page bug for returning operators. The passphrase gate had a race: if `sessionStorage` already carried the unlock flag, the first script ran `unlock()` immediately, which called `window.__visitorsBoot()` before the second script that defines it had parsed. The `if` check skipped silently, page rendered with no data. Added the same fallback `admin/quiz.html` uses: after defining `__visitorsBoot`, check if the body is already unlocked and call the boot fn now.

## v2.12.2 - May 2026
- Visitor beacon endpoint flipped from Lambda Function URL to API Gateway. The Function URL gateway on this AWS account returns 403 to anonymous traffic even with the textbook resource policy in place (account-level public-access block or similar; quiz-logger Function URL has the same symptom, which is why the quiz uses API Gateway too). Stood up a `/visit` route on the existing `sentinelbot-api` (id `g7a5tqlxaj`) pointing at the visitor-logger Lambda. `js/config.js` and `admin/visitors.html` now use `https://g7a5tqlxaj.execute-api.us-east-1.amazonaws.com/visit`. The Function URL still exists on the Lambda for direct testing; it just isn't on the hot path.
- CORS config on the API Gateway already covered shieldbearerusa.com + `content-type` + `x-admin-key`, so no CORS sweep was needed. The previous v2.12.1 wildcard for `*.lambda-url.us-east-1.on.aws` is left in `connect-src` -- harmless, covers any future Function URL if the account-level block ever gets resolved.

## v2.12.1 - May 2026
- Wired up the v2.12.0 visitor beacon to the deployed Lambda. `js/config.js` now points `visitor.apiUrl` at the live Function URL. `admin/visitors.html` now points `VISITOR_API` at the same URL. Beacon will fire on every pageview starting next hard refresh.
- Sitewide CSP sweep across 48 pages (24 legacy `.html` + 24 `/index.html` mirrors): added `https://*.lambda-url.us-east-1.on.aws` to `connect-src` so the beacon is not blocked. The wildcard covers any future Lambda Function URL the operator stands up in us-east-1 without needing another sweep.

## v2.12.0 - May 2026
- New `/admin/visitors` page: first-party visitor log with per-session detail (IP, location, full page sequence, referrer, user-agent). Same passphrase gate as `/admin/quiz`, `/admin/logs`, `/admin/metrics`. Built because GA4 aggregates were not what the operator wanted; "who visited what pages" is.
- New visitor beacon piggybacks on `js/sentinelbot.js` (which loads on every page). On page load it generates or reuses a sessionStorage session ID, then POSTs `{session_id, path, referrer, user_agent}` to the visitor-logger Lambda via `navigator.sendBeacon` (with a `fetch` fallback). Server captures IP from the request context (browsers cannot send their own), resolves location via ipinfo.io, writes one DynamoDB row. Fire and forget; no retry, no queue.
- Privacy posture: per the discussion logged in `feedback_a_method` and the choice made when this was scoped, no banner. Site already collected IPs via GA4 (anonymized) and `/admin/quiz`. The `/admin/visitors` page is operator-only and noindex.
- Beacon is dormant until `SHIELDBEARER_CONFIG.visitor.apiUrl` is set. The Lambda code is shipped in `sentinelbot-lambda/sentinelbot-visitor-logger/` with its own `deploy.sh`; running it stands up the DynamoDB table + IAM role + Function URL with CORS, then prints the URL to paste into `js/config.js`.

## v2.11.0 - May 2026
- Moved `/metrics` under `/admin/metrics` behind the existing operator passphrase gate (same SHA-256 hash as `/admin/quiz` and `/admin/logs`, one passphrase unlocks all three). Original v2.10.0 design pitched the page as public; once real GA4 data started flowing and the May 2026 curve showed a -70.8% drop vs April, the call was made to keep the receipts private until the curve climbs back. Public design rationale still lives in `docs/metrics.md` for the day we want to flip it back.
- The page is now fully self-contained: passphrase gate + inline renderer + inline CSS, no shared `js/metrics-renderer.js` (deleted), no public `/metrics` or `/metrics.json` paths. `noindex,nofollow` meta tag and unlinked from public nav so search engines do not surface it.
- metrics-publisher Lambda env updated to `METRICS_JSON_PATH=admin/metrics.json` so the daily 04:00 ET cron writes to the new path. First live invocation under the new path landed at commit `2b45f70`.

## v2.10.1 - May 2026
- Rounded every SentinelBot surface so the widget no longer reads as a stack of sharp rectangles. Chat window (`#sentinelbot-window`) gets `border-radius: 12px` + `overflow: hidden` so the header bar tucks under the rounded corners cleanly. Thought bubble (`#sentinelbot-status`) and launcher (`#sentinelbot-launcher`) both get 8px. Launcher stays rectangular with softened corners rather than going full pill, so it still reads as a button and matches the family.

## v2.10.0 - May 2026
- New `/gigs` page. Targets the DMV (DC, Maryland, Virginia) and the wider Mid-Atlantic, with case-by-case travel beyond. Lists the formats that fit (worship gatherings, church venues, college and seminary chapel events, house shows, regional metal nights, outdoor festivals) without inventing specific venue names. Page links out to /creed, /manifesto, and /epk so a booker can read the theological floor before reaching out.
- Inquiry form is mailto-based. No backend, no third-party form service, no AWS cost. Form opens the visitor's email client with name + venue + city + date + format + notes prefilled in the body and a contextual subject line. Falls back to a direct `mailto:shieldbearerusa@gmail.com` link if the email client does not open. Submission fires a `gigs_inquiry_submit` event via window.sbTrack so we can read inquiry volume in GA4.
- Cross-site nav menus on the other 26 pages are not updated in this commit; that is a separate sweep. /gigs is discoverable by direct URL today and from internal prose links on adjacent pages can be added in the next pass.
- New `/metrics` page also shipped this week (scaffold + Lambda + page). The /gigs `gigs_inquiry_submit` event will be one of the funnel events surfaced there once GA4 starts collecting it.

## v2.9.0 - May 2026
- Added a "Why we wrote this" footer block to every song dossier on `/song-meanings`. The block lives between the action links and the prev/next nav, and carries two anchor links: `/creed` (what we believe) and `/manifesto` (why we sing it loud). Applies uniformly to all 11 curated dossiers and to any future auto-augmented dossier rendered from site.json, since the block ships inside `renderDossierBody`.
- The framing is intentionally neutral. We do not claim Song X maps to creed and Song Y maps to manifesto. The block tells the reader that the doctrine and the mission are both written down, then points at both pages. Per-song mapping is a separate editorial pass if/when we want it.
- Pairs with the earlier internal-linking pass that added prose links to /creed and /manifesto across the home, music, signal-room, and other pages. This change pushes the same two anchors into every song dossier, which is the single page on the site where a visitor is already reading about meaning. Combined surface area on those two doctrine pages should be measurable in next month's GA4 review.
- Parity preserved: legacy `song-meanings.html` mirror updated to match `song-meanings/index.html` byte-for-byte.

## v2.8.3 - May 2026
- Fixed two related defects on the /sentinelbot dossier page. The floating launcher pill was missing on this page, and the inline "Ask the Watchman" CTA button at the bottom of the page did nothing on click. Both bugs shared a single root cause: `js/sentinelbot.js` carried an early-return on `/sentinelbot` / `/sentinelbot.html` paths that suppressed the entire widget. The inline CTA depends on programmatically clicking `#sentinelbot-launcher`, which never existed in the DOM, so clicking the button hit a null and silently no-opped.
- Removed the path skip. The widget now renders everywhere, including its own dossier page. The PAGE_GREETINGS map already had a /sentinelbot entry ("You are on my dossier. Ask what I am..."), so the bot opens with the right framing. Added a matching ambient page-aware line: "You are on my dossier. Talk to me below."
- Smoke-tested the fix in jsdom against the live `sentinelbot.html`: launcher present, window present, CTA click opens the window. Verified.

## v2.8.2 - May 2026
- Ambient layer pushed further. The status line now draws from four new sources on top of what v2.8.1 added.
- Lyric callouts. The sampler now picks a random line from any released song's `lyrics` in site.json (filtered to short standalone-readable lines, no bracketed section markers, no embedded double quotes that would clash with attribution). Every lyric line is rendered with explicit song attribution: `From "Let My People Go": Tell that tyrant, GOD says LET MY PEOPLE GO!`. Live data exposes 104 distinct attributed lyric lines today. This is the new heaviest-weighted real-signal slot because it drives the most fresh-feeling variety.
- Scripture refs. Pulled from `featuredRelease.scripture.ref` and `featuredRelease.reference` (pipe-separated) plus the same fields on released entries. Format: `Scripture on file: Exodus 5:1, from "Let My People Go".` Slot lies dormant while the publisher pipeline writes empty `scripture` fields, will activate the moment a release gets a populated ref.
- Page-aware framing. New `PAGE_LINES` map keyed by clean URL (`/`, `/music`, `/signal-room`, `/manifesto`, etc.) renders one observation about where the visitor is, framed as shared presence ("with you" / "together") rather than surveillance. The bot really is loaded on the same page; this is honest.
- Richer log lines. New "random older event" slot picks any typed event from `events[]` (not just the latest one) and formats it as `event: song released -> released, 3 hr ago.` Lives alongside the existing "Last log entry" line. New trace slot for tidy-shaped traceIds; lies dormant on the current data shape but will surface short ones like `youtube:0lUJcLKIt0o` when the event stream carries them.
- Desktop max-width bumped from 280px to 360px so longer lyric quotes fit without immediate ellipsis. Mobile layout unchanged.
- Honest rule still holds. Every lyric line is attributed to the source song so a visitor cannot mistake it for the bot's own utterance. Scripture refs come from real publisher data. Log lines come from the real event stream. Page-aware lines are framed as shared presence, not tracking.

## v2.8.1 - May 2026
- Rebuilt the ambient status-line rotation in `js/sentinelbot.js` so the SentinelBot launcher feels like it is actively looking at things instead of cycling a short fixed deck. The old build sampled a closed deck of ~10 items and looped; the new one picks fresh on every tick from a much larger pool, never repeats the previous line back-to-back, and refreshes the random selection on every cycle.
- Real-signal sampler now pulls from `site.json`'s `signal[]` (random watched track title), `released[]` (random released catalogue title), `events[]` (most recent state-change event with relative time), `comingSoon[]` (next upcoming title if any), plus the existing synced-time, track count, latest-release, channel-scan, and quiet-watch lines. Each line is weighted; the random watched-track callout is the heaviest because it surfaces the most variety.
- New time-of-day awareness derived from the visitor's local clock: "Late watch.", "Pre-dawn watch.", "Morning watch.", "Daylight watch.", "Evening watch.", "Night watch.", plus "Sunday watch." and "Sabbath watch." on Sundays and Saturdays. Honest because it reports the visitor's actual clock, not an invented bot mood.
- Motto pool expanded from 5 to 12 lines, curiosity hooks from 4 to 14. Hooks render in a brighter tint and brighter border than real signals so they pull the eye and invite clicks; mottos stay italic and dimmer. Category weights tuned to 60% real signals, 25% curiosity hooks, 15% mottos. Tick interval nudged from 6.0s to 5.5s.
- Honest-rule still holds. Every real signal is backed by `site.json` data; mottos are clearly stylistic and visually distinct from real lines; hooks are honest invitations because the bot really can answer them. No invented introspection.

## v2.8.0 - May 2026
- Added an ambient "living presence" layer to the SentinelBot launcher widget so the bot reads as a Watchman that is awake and on watch instead of an idle prompt box. Three layers: (1) a slow CSS pulse on a small online-dot inside the launcher pill, (2) a short status line that floats left of the pill on desktop and stacks above it on mobile, (3) rotation logic that cycles real signals, motto lines, and curiosity hooks.
- Real signals come from `/site.json` (already CDN-cached for the rest of the site, no new Lambda or DynamoDB calls). Signals surfaced: time since last site sync, count of tracks under watch, latest release title, "scanning the channel for new uploads" (the YouTube release detector is a real scheduled lambda), and a quiet-watch line that appears only when the latest release is more than seven days old. Quiz submission count is intentionally omitted for v1 to keep AWS cost flat; the curiosity hook "Ask me whether your favorite band is an AI band" still routes visitors to the quiz.
- Mottos used: "The watch is kept.", "Standing post.", "The signal fire is lit.", "Watchman on the wall.", "Eyes on the horizon." These are clearly stylistic, italicized and tinted differently from real-signal lines so a reader can tell them apart. Curiosity hooks invite the visitor to engage and are phrased honestly because the bot can actually answer them.
- Rotation interleaves real signals and flavor at roughly 2:1; refreshes every 6s; pauses while the chat window is open. Snapshot refresh runs every 5 minutes (well under the once-per-minute upper bound in the brief).
- `prefers-reduced-motion` disables the pulse animation and transition fades, leaving a static green online dot. Below 360px viewports the status text hides entirely so the tap target keeps priority. Below 560px the line stacks above the launcher and wraps instead of truncating.
- No framework, no new dependencies. Pure CSS keyframe for the pulse so battery and CPU stay flat. Total change is in `js/sentinelbot.js`.

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
- New file: `js/watch-posts.js` (vanilla, fetch + render, no framework). New file: `data/gigs.json` (seeded with two KGroup Band appearances: 2026-05-09 Floris UMC and 2026-03-22 Dulles Town Center Mall).
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


# Shieldbearer Website Changelog

Versioning note:
- Use semantic versioning in the form `vmajor.minor.patch`
- Patch bumps track small site/admin/logging changes
- Minor bumps track visible site features or broader UI additions
- Major bumps track architecture-level changes
- Always add the newest entry at the top of the file

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


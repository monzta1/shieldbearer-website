# Agent State

Live working state. Update this file with every meaningful change so the next agent (or future-you) lands oriented. Out-of-date state is worse than no state.

## Current state (last updated 2026-05-22)

| Field | Value |
| ----- | ----- |
| Active branch | `sentinelbot-stable` (production) |
| Latest commit | v2.17.0 -- `/admin/visitors` v2 with open/heartbeat/close beacon protocol + per-page duration + total session dwell |
| Test gate | structural + 70/70 jsdom + 100% line coverage |
| Last live verification | 2026-05-22, all passes |
| Execution mode | Operator-led, agent executes (A-method for stepwise tasks) |
| Operator | Moncy Abraham |

## What just shipped (recent run)

This session moved the project from v2.7.3 -> v2.17.0. Major adds in order:

- v2.8.x -- SentinelBot widget renders on its own dossier page; ambient layer rebuilt for variety
- v2.9.0 -- song-dossier footer links every track to /creed + /manifesto
- v2.10.0 -- new /gigs page with mailto inquiry form
- v2.10.1 -- rounded corners on SentinelBot widget surfaces
- v2.11.0 -- /metrics moved under /admin/metrics with passphrase gate
- v2.12.x -- visitor tracker (Lambda + DynamoDB + beacon + /admin/visitors); routed through API Gateway after Function URL 403 discovery
- v2.13.0 -- readability sweep (paragraph font-sizes .92-.98rem -> 1rem across 43 files)
- v2.14.x -- SentinelBot ops-watch voice, typewriter cursor, /admin landing index
- v2.15.x -- Scripture verses in ambient rotation, reliability hardening (beacon isolation, watchdog, fade-out)
- v2.16.0 -- /gigs in nav across all 52 page files
- v2.17.0 -- visitor logger v2 with duration tracking

Also shipped on the Lambda side: `sentinelbot-metrics-publisher` (new), `sentinelbot-visitor-logger` (new), `sentinelbot-site-publisher` stamp feature for index.html, songMeaning sanitizer in shield-cli + release-detector.

## Next task

**No active task.** Operator picks what to work on next.

When a new task starts, replace this section with:

- Objective (one sentence)
- Steps (numbered list, exact)
- Definition of Done (verifiable)
- Output Format (what the response must look like)

Confirm with the operator before acting if any of the above are unclear.

## Active watch windows

| Date | What to check | Action if it fires |
| ---- | ------------- | ------------------ |
| 2026-06-15 | Duplicate-content check on `/<page>` vs `/<page>.html` | If both forms still indexed as duplicates, add `<meta http-equiv="refresh">` on legacy `.html` pages per `SEO.md` |
| 2026-06-21 | `/admin/visitors` review: did the sitewide typewriter (v2.14.2) hurt time-on-page on /manifesto, /song-meanings, /story, /gigs vs the pre-v2.14.2 baseline? | If yes, scope the typewriter to showcase pages only (see option 2 in v2.14.2 design notes) |
| 2026-06-29 | Brand keyword query check ("shield bearer" two-word) | If homepage no longer ranks top, revisit visible-body usage of the two-word form |
| 2026-07-01 | First independent monthly review per `docs/monthly-review.md` (covering June) | Write `docs/monthly-reviews/2026-06.md`, one commit |

## Open follow-ups

Deferred but not forgotten. Pick up when the trigger appears or in a maintenance window.

1. **Build step for URL form parity.** Documented in `SEO.md`. Half-day estimate. Pull off the shelf when URL parity breaks something visible or when the site migrates off GitHub Pages.
2. **Meta-refresh on legacy `.html` URLs.** Deferred per `SEO.md`. Trigger 2026-06-15.
3. **`og:title` vs `<title>` policy.** Two pages currently differ intentionally (`artist-freedom.html`, `story.html`). Decide long-term policy.
4. **JSON-LD presence per page.** Only homepage + timeline have rich JSON-LD. Consider adding test step 28 if rich-result eligibility becomes a goal across more pages.
5. **GA4 Key Events marking** -- operator-side, in GA4 console. Mark the visible-engagement events (`outbound_click`, `watch_now`, `sentinelbot_open`, `gigs_inquiry_submit`) as Key Events so they show in the Acquisition reports.
6. **Cloudflare Worker for legacy `.html` 301 redirects.** `tools/cloudflare-redirect-worker.js` exists in the repo but is not deployed. Defer until URL-form duplicate content is confirmed via Search Console.
7. **Detector-side songMeaning cleaner already shipped** -- if a future ingest needs to add fields beyond songMeaning, the sanitizer pattern is in `sentinelbot-release-detector-youtube/index.js`.

## Where to start as a new agent

1. Read `MEMORY.md` (this file's index entry).
2. Read `AGENT_HANDOFF.md` for system knowledge.
3. Read `SYSTEM_MAP.md` for the live topology snapshot.
4. Read `KNOWN_QUIRKS.md` before debugging anything weird.
5. Read `AGENTS.md` for the pre-push checklist (the gate that fails commits).
6. Read this file (`AGENT_STATE.md`) for what's pending.
7. Run `./scripts/test.sh` to confirm a clean tree.

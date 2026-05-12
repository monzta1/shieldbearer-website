# Agent State

Live working state. Update this file with every change so the
next agent (or future-you) lands oriented. Out-of-date state is
worse than no state.

## Current state (last updated 2026-05-05)

| Field | Value |
| ----- | ----- |
| Active branch | `sentinelbot-stable` (production) |
| Latest commit | v2.7.1 location column on admin logs + sentinelbot-lambda v1.9.0 IP geolocation |
| Test gate | 201 / 201 structural + 70 / 70 jsdom + 100% line coverage |
| Last live verification | 2026-05-05, all passes |
| Execution mode | Conservative (ask before major actions) |
| Operator | Moncy Abraham |

## Next task

**No pending task.** The SEO project is fully shipped to
production. The most recent work added six structural tests to
`scripts/test.sh` and fixed 22 files for og:url canonical
alignment. The operator can pick what to work on next.

When a new task starts, replace this section with:

- Objective (one sentence)
- Steps (numbered list, exact)
- Definition of Done (verifiable)
- Output Format (what the response must look like)

Confirm the task with the operator before acting if any of the
above are unclear.

## Active watch windows

These are calendar triggers from `SEO.md`. Nothing has fired
yet; check Search Console on each date.

| Date | What to check | Action if it fires |
| ---- | ------------- | ------------------ |
| 2026-05-18 | Homepage impressions stable after trailing-slash canonical change | If sharp drop with no other cause, revert root canonical to no-trailing-slash form |
| 2026-06-01 | Sitemap status crawl + URL-form parity diff (monthly) | Fix any DIFFERS line that is not `sentinelbot.html` |
| 2026-06-15 | Duplicate-content check on `/<page>` vs `/<page>.html` | If both forms still indexed as duplicates, add `<meta http-equiv="refresh">` on legacy `.html` pages per the documented escalation path |
| 2026-06-29 | Brand keyword query check ("shield bearer" two-word) | If the homepage no longer ranks top for that query, revisit how prominently the two-word form appears in title and visible body |
| 2026-07-01 | Sitemap status crawl + URL-form parity diff (monthly) | Same as 2026-06-01 |

## Open follow-ups

These are deferred, not forgotten. Pick them up when the
triggering condition appears or when a maintenance window opens.

1. **Build step for URL form parity.** Documented in `SEO.md`
   under "Build step for URL form parity (tech debt)". Half-day
   estimate. Pull off the shelf when URL parity breaks something
   user-visible or when the site migrates off GitHub Pages.
2. **Meta-refresh on legacy `.html` URLs.** Deferred 4 to 6
   weeks per the canonical decision in `SEO.md`. Trigger date
   2026-06-15.
3. **og:title vs `<title>` policy.** Two pages currently differ
   intentionally (`artist-freedom.html` and `story.html`).
   Should this be allowed long-term? No test enforces match
   currently; that is by design but worth a future decision.
4. **JSON-LD presence and validity per page.** Only the homepage
   has rich JSON-LD today; the timeline has an ItemList. No
   automated test enforces JSON-LD presence on pages that should
   have it. Consider adding test step 28 if rich-result eligibility
   becomes a goal across more pages.

## Recent decisions worth remembering

- Path A canonical (clean URLs canonical, no redirects between
  forms). Documented in `SEO.md`.
- Brand variant strategy: "Shieldbearer" (one word) is primary
  in headings and social profiles; "Shield Bearer" (two words)
  appears in title, meta, JSON-LD `alternateName`, and visible
  body for search disambiguation.
- Hero h1 stays "Jesus Reigns at Full Volume" (artistic asset
  trumps generic SEO advice about brand-in-h1).
- KJV scripture quotations on `/gatekeeping` (public domain;
  copyright clean).
- AGENT_HANDOFF.md and AGENT_STATE.md and MEMORY.md adopted
  alongside the existing AGENTS.md, SEO.md, VERIFICATION.md.
  AGENTS.md remains the contributor checklist; AGENT_HANDOFF
  is the deeper system knowledge file.

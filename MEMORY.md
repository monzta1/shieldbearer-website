# Memory

Entry point. Read this first.

This file does not carry working content; it points at every doc
and convention an agent needs. Read the linked docs, then go to
`AGENT_STATE.md` for the current task.

## Quick start for a new session

1. Read `AGENT_HANDOFF.md` fully. It explains what the project
   is, the conventions, and the standing rules.
2. Read `SYSTEM_MAP.md`. Single-page snapshot of the whole stack
   (5 Lambdas, 5 DynamoDB tables, API Gateway routes, admin tools).
3. Read `AGENT_STATE.md`. Current branch, latest version, what
   just shipped, active watch windows, follow-ups.
4. Read `KNOWN_QUIRKS.md` before debugging anything that feels
   strange. Most of the dragons are documented there.
5. Read `AGENTS.md`. The pre-push checklist is what blocks
   deployment if skipped.
6. If the task touches SEO/links/redirects/canonical, read
   `SEO.md`.
7. Run `./scripts/test.sh` to confirm the tree is clean before
   making changes.

## File index

| File | Purpose |
| ---- | ------- |
| `MEMORY.md` | This file. Index. |
| `AGENT_HANDOFF.md` | System knowledge, conventions, standing rules. |
| `SYSTEM_MAP.md` | Live topology snapshot: Lambdas, tables, routes, admin tools, data artifacts, common commands. |
| `KNOWN_QUIRKS.md` | Institutional gotchas (Function URL 403, GA4 SA form rejection, macOS U+202F filenames, etc.). |
| `AGENT_STATE.md` | Current branch, latest version, what shipped, active watch windows, deferred items. |
| `AGENTS.md` | Pre-push checklist and contributor workflow. |
| `SEO.md` | SEO architecture decision log with calendar review triggers. |
| `SHIELDBEARER_WEBSITE_CHANGELOG.md` | Semver release log. Every change adds an entry. |
| `VERIFICATION.md` | Last full verification pass artifact (Lighthouse + sitemap + JSON-LD). |
| `README.md` | Project overview for a fresh visitor. |
| `docs/monthly-review.md` | Five-question runbook for the monthly GA4 review (cadence starts July 2026). |
| `docs/metrics.md` | Design spec for `/admin/metrics` page + metrics-publisher Lambda. |
| `docs/analytics.md` | GTM + GA4 + Clarity setup notes. |
| `docs/outreach.md` | Lost-referrer hunt + re-engagement tables. |
| `docs/hero-diagnosis.md` | Hero LCP investigation + fix notes. |
| `docs/redirects.md` | Why in-repo redirect stubs do not work on GitHub Pages. |
| `scripts/test.sh` | Structural test gate (27 checks plus jsdom plus coverage). Run it. |
| `scripts/checkpoint.sh` | Tag-and-push helper. |
| `scripts/verify-live.sh` | Post-deploy live URL verifier. |

## Standing rules at a glance

- No em dashes anywhere. Hard rule. Use commas, periods, colons,
  parentheses.
- Every change updates `SHIELDBEARER_WEBSITE_CHANGELOG.md` with a
  semver bump. Patch for fixes, minor for features, major for
  architecture.
- Legacy `.html` and clean-URL `/<page>/index.html` mirrors must
  stay byte-identical (sentinelbot is the documented exception).
  Use `cp <page>.html <page>/index.html` after every page edit.
- Default execution mode is Conservative. Ask before major
  actions, content rewrites, or pushing to production.
- Run `./scripts/test.sh` before every commit. The exit status
  is the gate.

## How to update this file

`MEMORY.md` should change rarely. Update it when:

- A new top-level doc is added to the repo
- A standing rule changes
- The quick-start sequence changes

Leave `AGENT_HANDOFF.md` and `AGENT_STATE.md` to handle the rest.

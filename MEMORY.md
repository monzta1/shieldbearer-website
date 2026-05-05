# Memory

Entry point. Read this first.

This file does not carry working content; it points at every doc
and convention an agent needs. Read the linked docs, then go to
`AGENT_STATE.md` for the current task.

## Quick start for a new session

1. Read `AGENT_HANDOFF.md` fully. It explains what the project
   is, the conventions, and the standing rules.
2. Read `AGENT_STATE.md`. Confirm the current branch, the next
   task, and any active watch windows or follow-ups.
3. Read `AGENTS.md`. The pre-push checklist is what blocks
   deployment if skipped.
4. If the task touches SEO, links, redirects, or the canonical
   chain, read `SEO.md` for prior decisions and review triggers.
5. Run `./scripts/test.sh` to confirm the tree is in a known-
   good state before making changes.

## File index

| File | Purpose |
| ---- | ------- |
| `MEMORY.md` | This file. Index. |
| `AGENT_HANDOFF.md` | System knowledge, conventions, standing rules. |
| `AGENT_STATE.md` | Current branch, next task, active watch windows, deferred items. |
| `AGENTS.md` | Pre-push checklist and contributor workflow. |
| `SEO.md` | SEO architecture decision log with calendar review triggers. |
| `SHIELDBEARER_WEBSITE_CHANGELOG.md` | Semver release log. Every change adds an entry. |
| `VERIFICATION.md` | Last full verification pass artifact (Lighthouse + sitemap + JSON-LD). |
| `README.md` | Project overview for a fresh visitor. |
| `scripts/test.sh` | Structural test gate (27 checks plus jsdom plus coverage). Run it. |
| `scripts/checkpoint.sh` | Tag-and-push helper. |
| `scripts/verify-live.sh` | Post-deploy live URL verifier. |
| `seo-report-home.json` | Lighthouse SEO JSON, homepage. Snapshot from 2026-05-04 verification. |
| `seo-report-gatekeeping.json` | Lighthouse SEO JSON, gatekeeping. Same snapshot. |

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

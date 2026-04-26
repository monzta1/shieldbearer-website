# Shieldbearer Website. Future Enhancements.

Honest backlog. Items aren't promises. Pick what's worth doing
when. Marked `[priority]` for the cluster I'd reach for first.

## Visible / fan-facing

- **[priority] First-release publish flip.** Publisher Lambda is
  currently `DRY_RUN=true`. Once Let My People Go is the first
  song to clear the merge pipeline, flip `DRY_RUN=false` and verify
  the homepage swaps automatically. Then weekly autopilot.
- **Public changelog page** at `/changelog`. Surface a curated
  fan-facing version of `SHIELDBEARER_WEBSITE_CHANGELOG.md` so
  visitors see "what's new" without leaving the site.
- **Latest-release handler for SentinelBot.** Right now "what's
  your latest release?" without a song name doesn't auto-pull
  from songs table. Add a path that queries `released[]` ordered
  by `publishedAt DESC` and answers with the top one.
- **Mobile polish pass.** Some pages (manifesto, story) feel
  cramped on phones. Audit each page at 390px and 768px widths.
- **A11y audit.** No formal accessibility check done yet. Run
  axe-core or similar; prioritize keyboard nav, ARIA labels on
  interactive elements, contrast on the red-on-black palette.

## Infrastructure / dev workflow

- **[priority] Migrate from legacy GitHub Pages to Actions-based
  deploy.** Pages currently lags 5-30 minutes occasionally and
  has no visible build status. An Actions workflow gives a green
  check on every commit, faster deploys, and a paper trail.
- **DST handling for Lambda crons.** EventBridge cron is UTC-only.
  When EST kicks in November, the Friday scan slides 1 hour
  earlier in ET. Either accept the drift, or migrate to
  EventBridge Scheduler (timezone-aware).
- **GitHub PAT rotation reminder.** Token expires in 30 days
  (or 90, depending on what got picked). Set a calendar reminder
  to rotate before it expires; without it the publisher silently
  fails on the next run.
- **Performance measurement.** Add a build-time check or live
  audit (e.g. Lighthouse via Pages CI) for LCP/INP/CLS so we
  notice regressions when adding new images or scripts.
- **Auto-generate sitemap.xml** from the page list instead of
  hand-maintaining it. Easy to forget.

## Content

- **404 page redesign.** Currently minimal. Could include a
  search box, "popular pages" list, in-character SentinelBot
  message ("This signal does not exist on the wall...").
- **Richer dossier auto-augment.** When a YouTube release lands,
  the song-meanings page gets a thin entry (title + lyrics +
  meaning). Extend the shield-cli `.txt` schema to accept
  `#scripture`, `#tags`, `#thesis`, `#genre` so auto-published
  dossiers match the curated ones.
- **Per-page SentinelBot greetings: keep iterating.** The current
  map is path-based and static. Could become data-driven (read
  from a JSON config) so a contributor can edit greetings without
  touching `js/sentinelbot.js`.

## Testing / quality

- **CI on push.** GitHub Actions running `./scripts/test.sh` and
  `./scripts/verify-live.sh` automatically on every push or PR.
  Currently relies on `checkpoint.sh` which we can forget.
- **Lighthouse CI.** Catch performance / a11y / SEO regressions
  on every build.
- **Visual regression tests.** Optional. Tools like Percy or
  Backstop. Probably overkill at this scale.

## Things explicitly NOT on the roadmap

- Migrating the static site to a framework (Next, Astro, etc.).
  The static-HTML architecture is a feature, not a debt.
- Adding a paid CMS. The whole pipeline is intentionally
  zero-monthly-cost; that constraint is a north star.
- Visual rebrand. The visual identity is settled.

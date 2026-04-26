# Shieldbearer Website. Contributor Workflow.

This file lives in the repo so anyone working on it (human or AI
collaborator) follows the same flow. If you're an AI, treat this as
binding even if you don't have the context that produced it.

## Before every push

Walk these in order. Don't bundle. Each step is a checkpoint, not a
suggestion.

1. **Tests pass.** Run `./scripts/test.sh`. This runs:
   - Structural HTML checks (balanced tags, link targets, sitemap,
     CSP allowlist, admin gate, clean-URL routing).
   - Browser-side jsdom regression tests for `featured-release.js`,
     `song-meanings-augment.js`, `merch-rotator.js`, and `main.js`.
   - c8 coverage gate at 90% lines on those four client scripts.
   - The gate exits non-zero on any drop.

2. **Changelog entry.** Add a new version entry at the top of
   `SHIELDBEARER_WEBSITE_CHANGELOG.md`. Versioning rules:
   - **patch** for fixes, admin/logging changes
   - **minor** for visible features or broader UI
   - **major** for architecture-level changes (e.g. clean URLs)

   Skipping the changelog is the most common slip. Treat it as a
   gate, not paperwork.

3. **No em dashes anywhere.** Hard rule. Applies to the changelog,
   commit message, and any visible copy. Use period, comma, colon,
   parentheses, or rewrite the sentence.

4. **Run `./scripts/checkpoint.sh "<message>"`.** Re-runs the test
   suite, commits, tags, pushes. If tests fail, the script aborts
   and nothing ships.

5. **Verify live after Pages builds.** GitHub Pages can lag a few
   minutes. After the build settles, run `./scripts/verify-live.sh`
   to confirm:
   - Every clean URL responds 200
   - Legacy `.html` paths still resolve (existing Google index)
   - Sitemap, robots, site.json, 404 are reachable
   - Internal href crawler finds no dead or relative links

## Things to skip

- `git add -A` is fine here (single-purpose website repo) but
  prefer naming files explicitly when you can.
- Don't delete legacy `.html` files even though clean URLs are the
  canonical paths. Search engines and external links rely on them.
- Don't add inline `<script>` tags with `unsafe-eval` or any new
  third-party CDN without first updating the CSP in every page that
  carries one. CSP misalignment caused a real Clarity outage; tests
  guard against the most common cases.

## Source of truth pointers

- Site config: `js/config.js`. Analytics IDs, SentinelBot endpoint,
  merch rotator settings.
- Live data feed: `site.json` (written by shield-cli locally, by
  the publisher Lambda from DynamoDB after a release).
- Merch pool: `data/merch.json` (baked by `scripts/fetch-merch.sh`
  from the public Shopify sitemap; refreshed automatically by
  `checkpoint.sh`).

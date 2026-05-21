# /metrics

A public-facing summary of how the site is doing. Live at `shieldbearerusa.com/metrics`.

## Why public

Two reasons.

1. **Receipts.** The site claims real engagement with real visitors, real plays, real outbound clicks. Saying it in a header is cheap. Showing the number this calendar month, refreshed weekly, is not. The /metrics page is the receipt.
2. **Discipline forcing function.** A public number is an accountability surface for the next experiment. Last month's number is right there. You either ship something that moves it or you do not.

## What the page shows

The single source of truth is `metrics.json` at the site root. The page reads it and renders four sections:

1. **Headline number for the calendar month so far.** Sessions, plus the month-over-month delta as a percentage. No dashboards, no charts, one line.
2. **Where people came from.** Top three traffic channels by session count. Each entry shows channel, session count, share of total.
3. **What people did.** Top three events by count, drawn from the event funnel: outbound_click, watch_now, send_message, signal_room_open, sentinelbot_open. Each entry shows event name, count, and engaged-session share where available.
4. **What we shipped.** A short list of dated commits or releases that landed during the period, pulled from a hand-curated section of `metrics.json` (not GA4). Keeps the engagement number honest by pairing it with what changed.

## Data flow

```
GA4 Data API
   │
   │  (cron, daily at ~04:00 ET)
   ▼
shieldbearer-metrics-publisher Lambda
   │
   │  read service-account credentials from Secrets Manager
   │  query Data API for last 35-day window
   │  build metrics.json (~5 KB)
   │  PUT to GitHub contents API: metrics.json on sentinelbot-stable
   ▼
shieldbearerusa.com/metrics.json
   │
   ▼
/metrics page fetch + render
```

Same pattern as `sentinelbot-site-publisher` for `site.json`. Same auth, same retry policy, same commit message style (`auto: metrics refresh <YYYY-MM-DD>`).

## Refresh cadence

- Lambda runs daily at 04:00 America/New_York via EventBridge cron.
- `metrics.json` includes a `generatedAt` ISO timestamp and a `period` object describing the window covered.
- The page surfaces both so a reader can tell how fresh the numbers are.

## Why not real-time

GA4 has data-processing latency (up to 24-48 hours for finalized data). A real-time page would either show partial data or invent confidence intervals. Daily refresh is the right cadence for a public page: fresh enough to be interesting, stable enough to be honest.

## What it does not show

- No individual visitor data. Aggregate only.
- No IP, no city, no precise timestamps.
- No A/B test variant exposure. We are not running any.
- No revenue or financial numbers. Out of scope for the public page.

## Failure modes

| Failure | What the page shows |
|---|---|
| `metrics.json` fetch fails | A one-line note: "Numbers are refreshing. Check back later." Page does not error. |
| GA4 credentials expire | Lambda logs `metrics-publisher-failed`, last-good `metrics.json` stays on disk, page keeps rendering the stale snapshot with the visible `generatedAt` timestamp telling the truth. |
| GA4 returns zero rows | Page renders the section with explicit zeros, not omitted. |
| Lambda hits GitHub rate limit | Retried via the same `githubRequestWithRetry` helper used by the site publisher. |

## Operator runbook

To force a refresh: `aws lambda invoke --function-name shieldbearer-metrics-publisher --payload '{}' --cli-binary-format raw-in-base64-out --region us-east-1 /tmp/metrics-out.json`.

To rotate the GA4 service account: replace the secret value at `shieldbearer/ga4-service-account` in Secrets Manager. No code change required.

To extend the metric set: edit the Lambda's `buildMetricsArtifact` to add a new field, then add a renderer for it in `js/metrics-renderer.js`. The `metrics.json` schema is intentionally additive; old clients ignore unknown fields.

## Schema

`metrics.json` shape (all fields required unless noted):

```json
{
  "generatedAt": "2026-06-01T08:00:00Z",
  "period": {
    "label": "May 2026 so far",
    "start": "2026-05-01",
    "end": "2026-05-31"
  },
  "headline": {
    "sessions": 1234,
    "deltaPct": 12.4,
    "comparison": "vs April"
  },
  "channels": [
    { "name": "Organic Search", "sessions": 412, "share": 33.4 },
    { "name": "Direct", "sessions": 298, "share": 24.1 },
    { "name": "Referral", "sessions": 156, "share": 12.6 }
  ],
  "events": [
    { "name": "outbound_click", "count": 287, "engagedShare": null },
    { "name": "watch_now", "count": 142, "engagedShare": null },
    { "name": "sentinelbot_open", "count": 98, "engagedShare": null }
  ],
  "shipped": [
    { "date": "2026-05-21", "label": "Publisher stamper + songMeaning sanitizer" },
    { "date": "2026-05-21", "label": "v2.9.0 dossier cross-links to creed and manifesto" }
  ],
  "source": "ga4-data-api",
  "note": "Numbers are aggregates only. Refreshed daily at 04:00 ET."
}
```

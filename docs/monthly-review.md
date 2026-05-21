# Monthly Review

A repeatable runbook for the monthly read of how the site is doing. Same questions every month so the answers stay comparable.

## Cadence

- **First run skipped.** The mid-June 2026 first pass got merged into the fix-validation deep-dive after the hero image, internal-linking, publisher-stamp, and songMeaning sanitization work landed in May. There was no point separating signal from the fix-validation noise.
- **Regular cadence starts July 2026.** First independent monthly review covers the calendar month of June 2026 and runs the first week of July.
- Subsequent months: first week of the following calendar month.
- One operator runs it. The doc lives here so the same questions get asked every time.

## What we read

Source order, in priority:

1. **GA4 Explorations** for the calendar month. The four reports built during the v2.x overhaul:
    - Acquisition by channel/source/medium
    - Landing page performance (page, sessions, engagement rate, bounce rate, average engagement time)
    - Event funnel (page_view -> outbound_click -> watch_now / read_meaning / send_message)
    - Cross-domain handoff: shieldbearerusa.com -> shop.shieldbearerusa.com, shieldbearerusa.com -> radio.shieldbearerusa.com
2. **GA4 DebugView** sanity check. Send one test event from the live site, confirm it shows up. If DebugView is dead, treat the whole month's numbers with suspicion until the sbTrack pipeline is verified end-to-end.
3. **`/metrics` page** for the public-facing summary. Should agree with GA4 within rounding. If it disagrees, the metrics-publisher Lambda is stale or broken; treat that as a P0 fix before continuing the review.
4. **CloudWatch** for the SentinelBot widget event volume and the publisher-stamp run log. Look for anomalies in stamp-index-assertion-warn entries.
5. **Linear / GitHub issues** opened or closed this month that affect the public site.

## The questions

Ask the same five every month. Write the answers in `docs/monthly-reviews/YYYY-MM.md` (create the directory on first run). Short answers; the discipline is in asking, not in writing essays.

1. **Where did people come from?** Top three channels by sessions. Any new traffic source that did not exist last month?
2. **What did they do?** Top three landing pages, and the top three events fired (outbound_click, watch_now, send_message, etc.). Engagement rate trend month-over-month.
3. **What broke?** Any tracked event that went to zero or fell more than 50% month-over-month without an explanation. Cross-domain handoff rate is the canary.
4. **What worked?** One thing that beat last month meaningfully. Does the increase tie back to a specific change shipped that month? If yes, name the commit and the date.
5. **What is the next experiment?** One concrete change to ship next month, with a measurable prediction. Example: "Add a hero CTA to /signal-room. Predict outbound_click to /signal-room up 30% in July."

## Outputs

Each monthly review produces three artifacts in the same directory:

1. `docs/monthly-reviews/YYYY-MM.md` -- the five answers, ~300 words.
2. A single commit titled `monthly-review: <month> <year>` with that file.
3. If a single experiment was named in question 5, an Issue or TODO so it does not get lost.

## Anti-patterns

- Do not invent metrics that are not in GA4 or `/metrics`. If GA4 cannot tell us, mark the question "no signal" and move on.
- Do not let one bad event flood the analysis. Note it once in question 3 and continue.
- Do not extend the review with optional sections. Five questions, three artifacts, done. The discipline is the cadence.
- Do not skip a month. If a calendar event prevents the first week, run it the second week. Never skip two months in a row.

## When the review uncovers a bug

If the review finds a tracking or pipeline bug (events going to zero, cross-domain misfiring, stamper assertion warnings), the fix is its own commit on its own branch. Do not mix bug-fix code into the monthly-review file. The review records what was observed; the fix is its own work stream.

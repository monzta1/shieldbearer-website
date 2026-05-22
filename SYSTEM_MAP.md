# System Map

One-page snapshot of the whole Shieldbearer stack. A new agent should land here, scan once, and know where everything lives.

Last verified: 2026-05-22.

## Two repositories

| Repo | What | Branch | Live URL |
| ---- | ---- | ------ | -------- |
| `shieldbearer-website` | Static site (GitHub Pages) | `sentinelbot-stable` | https://shieldbearerusa.com |
| `sentinelbot-lambda` | All AWS Lambda code | `sentinelbot-stable` | invoked via API Gateway / EventBridge |

The website repo is the only public-facing artifact. The Lambda repo is private backend.

## AWS account

- Account: 744330047785
- Region: us-east-1 (everything)
- Operator IAM user: `monzta` (limited permissions; some IAM actions need root via console)

## Lambdas

| Name | Trigger | Reads | Writes | Endpoint |
| ---- | ------- | ----- | ------ | -------- |
| `sentinelbot-handler` | API Gateway `POST /sentinel` | `shieldbearer-sentinel-logs` | `shieldbearer-sentinel-logs` | https://g7a5tqlxaj.execute-api.us-east-1.amazonaws.com/sentinel |
| `sentinelbot-release-detector-youtube` | EventBridge cron (Sat 13:00 UTC) | YouTube Data API v3 | `EventStream`, `shieldbearer-songs`, `shieldbearer-sentinel-logs` | -- |
| `sentinelbot-site-publisher` | EventBridge cron (Sat 13:15 UTC) | `EventStream`, `shieldbearer-songs`, `shieldbearer-sentinel-logs` | `shieldbearer-website/site.json` via GitHub API + stamps `index.html` between marker comments | -- (also invokable via aws lambda invoke) |
| `sentinelbot-metrics-publisher` | EventBridge cron (Daily 08:00 UTC) | GA4 Data API + Secrets Manager (`shieldbearer/ga4-service-account`) | `shieldbearer-website/admin/metrics.json` via GitHub API | -- |
| `sentinelbot-visitor-logger` | API Gateway `POST /visit` + `GET /visit` | `shieldbearer_visits` + ipinfo.io | `shieldbearer_visits` | https://g7a5tqlxaj.execute-api.us-east-1.amazonaws.com/visit (also a Function URL exists at lambda-url.us-east-1.on.aws but it 403s anonymously, see KNOWN_QUIRKS.md) |
| `ai-band-quiz-logger` | API Gateway `POST /quiz` + `GET /quiz` | `ai_band_quiz_submissions` + ipinfo.io | `ai_band_quiz_submissions` | https://g7a5tqlxaj.execute-api.us-east-1.amazonaws.com/quiz |
| `sentinelbot-logs` | API Gateway `GET /logs` | `shieldbearer-sentinel-logs` | -- | https://g7a5tqlxaj.execute-api.us-east-1.amazonaws.com/logs |
| `lumina` | Separate project, distinct domain (not Shieldbearer) | -- | -- | jw37k7mbf7.execute-api... |

## DynamoDB tables (all PAY_PER_REQUEST, us-east-1)

| Table | PK | SK | Purpose |
| ----- | -- | -- | ------- |
| `shieldbearer-songs` | `songId` | -- | Canonical song catalog. shield-cli writes, publisher reads. |
| `shieldbearer-sentinel-logs` | `id` | -- | Multi-purpose: chat logs, release-event records (`pk = releaseevent#...`), detector denylist (`id = config:release-detector-denylist`). |
| `EventStream` | `pk` (= songId) | `sk` (= ISO ts) | Per-event log of SONG_RELEASED / SONG_UPDATED events. |
| `ai_band_quiz_submissions` | `submission_id` | -- | Quiz submissions with IP + location. |
| `shieldbearer_visits` | `session_id` | `ts_open` | Visitor pageviews (open + heartbeat + close protocol, duration_ms tracked). |

## API Gateway

Single HTTP API: `sentinelbot-api` (id `g7a5tqlxaj`). All public Lambdas route through here.

| Route | Lambda | Auth |
| ----- | ------ | ---- |
| `POST /sentinel` | sentinelbot-handler | none (rate-limit + log) |
| `GET /logs` | sentinelbot-logs | `x-admin-key` header |
| `POST /quiz` | ai-band-quiz-logger | none |
| `GET /quiz` | ai-band-quiz-logger | `x-admin-key` header |
| `POST /visit` | sentinelbot-visitor-logger | none |
| `GET /visit` | sentinelbot-visitor-logger | `x-admin-key` header |

CORS at the API level: allow `https://shieldbearerusa.com`, methods GET/POST/OPTIONS, headers content-type + x-admin-key.

## Secrets Manager

| Secret | Used by | Purpose |
| ------ | ------- | ------- |
| `shieldbearer/ga4-service-account` | sentinelbot-metrics-publisher | GA4 Data API service-account JSON key |

The GitHub token used by both publishers lives in Lambda env vars, not Secrets Manager (legacy decision; could be moved).

## EventBridge crons

| Rule | Schedule | Target |
| ---- | -------- | ------ |
| `release-detector-saturday-window` | `cron(0 13 ? * SAT *)` | sentinelbot-release-detector-youtube |
| `site-publisher-saturday-window` | `cron(15 13 ? * SAT *)` | sentinelbot-site-publisher |
| `sentinelbot-metrics-publisher-daily` | `cron(0 8 * * ? *)` | sentinelbot-metrics-publisher (daily 08:00 UTC = 04:00 ET) |

## Admin tools (web)

All at `/admin/...` on the live site. Same SHA-256 passphrase hash unlocks every page (`64354c5c7192a65cc78df77adbf77b4df37d6c60868cc83085f48f4f97e5848f`). Each tool has its own `sessionStorage` key.

| URL | Backing data | sessionStorage key |
| --- | ------------ | ------------------ |
| `/admin/` | -- (landing) | `sb-admin-index-unlocked` |
| `/admin/visitors` | `shieldbearer_visits` via `GET /visit` | `sb-visitors-admin-unlocked` |
| `/admin/metrics` | `admin/metrics.json` (committed by metrics-publisher) | `sb-metrics-admin-unlocked` |
| `/admin/quiz` | `ai_band_quiz_submissions` via `GET /quiz` | `sb-quiz-admin-unlocked` |
| `/admin/logs` | `shieldbearer-sentinel-logs` via `GET /logs` | `sb-admin-unlocked` (legacy name) |

## Data artifacts in the website repo

| File | Source | Purpose |
| ---- | ------ | ------- |
| `site.json` | sentinelbot-site-publisher | Featured release, Signal Room comingSoon, full released catalog, event stream |
| `admin/metrics.json` | sentinelbot-metrics-publisher | GA4 monthly aggregates for /admin/metrics page |
| `data/merch.json` | `scripts/fetch-merch.sh` (manual) | Shopify product cache for the homepage merch rotator |
| `docs/song-index.json` | `scripts/build-song-index.js` (in sentinelbot-lambda repo) | Search index for /song-meanings |

## Client-side scripts on every page

Loaded in this order from each page:

1. `/js/config.js` -- `window.SHIELDBEARER_CONFIG` knobs (GTM/GA4 IDs, sentinelbot apiUrl, quiz apiUrl, visitor apiUrl, signalCountdown, merch).
2. `/js/analytics.js` -- GTM + GA4 + Clarity init + `window.sbTrack(event, params)` helper.
3. `/js/main.js` -- nav menu, mobile hamburger, page utilities.
4. `/js/sentinelbot.js` -- visitor beacon (top of file), then chat widget + ambient status line + Scripture rotation. Loads on every page.

Additional scripts loaded per page as needed: `featured-release.js`, `song-meanings-augment.js`, `merch-rotator.js`, `signal-countdown.js`, `metrics-renderer.js`, `signal-room-callout.js`.

## Deployment commands at a glance

| Action | Command |
| ------ | ------- |
| Run website tests | `cd shieldbearer-website && ./scripts/test.sh` |
| Commit + tag + push website | `cd shieldbearer-website && ./scripts/checkpoint.sh "<msg>"` |
| Run Lambda tests | `cd sentinelbot-lambda && npm test` |
| Deploy a Lambda | `cd <lambda-dir> && rm -f function.zip && zip -q function.zip index.js && aws lambda update-function-code --function-name <name> --zip-file fileb://function.zip --region us-east-1` |
| Force a publisher run | `aws lambda invoke --function-name sentinelbot-site-publisher --payload '{"approved":true,"source":"youtube"}' --cli-binary-format raw-in-base64-out --region us-east-1 /tmp/out.json` |
| Force a metrics run | `aws lambda invoke --function-name sentinelbot-metrics-publisher --payload '{}' --cli-binary-format raw-in-base64-out --region us-east-1 /tmp/out.json` |
| Ingest a song via shield-cli | `cd /Users/moncyabraham/Shieldbearer/dropzone && node /Users/moncyabraham/Projects/sentinelbot-lambda/tools/shield-cli/bin/shield.js ingest *.txt` |

## Where current state lives

- `AGENT_STATE.md` (this repo) -- current branch, latest commit/version, next task, watch windows.
- `SHIELDBEARER_WEBSITE_CHANGELOG.md` -- version history with summaries.
- `KNOWN_QUIRKS.md` -- institutional gotchas (AWS-account-level oddities, browser edge cases, recurring traps).
- `/Users/moncyabraham/.claude/projects/-Users-moncyabraham-Projects/memory/MEMORY.md` -- auto-loaded operator-preference memory across all projects.
- `~/.claude/CLAUDE.md` -- global Claude Code instructions including the A-method.

# Known Quirks

Institutional gotchas that have bitten us once and will bite again. Read before you start fighting any of these symptoms; the fix is almost certainly here.

## AWS

### Lambda Function URLs return 403 to anonymous traffic on this account

Even with `AuthType=NONE` and the textbook resource policy (`Principal: *`, `Action: lambda:InvokeFunctionUrl`, condition `lambda:FunctionUrlAuthType = NONE`), Function URLs reply `403 Forbidden` to the public. We hit this on both `sentinelbot-visitor-logger` and `ai-band-quiz-logger`. Cause is likely an account-level Lambda public-access block or an inherited SCP we can't see from the operator IAM user.

**Workaround that always works:** route through the existing `sentinelbot-api` HTTP API at `g7a5tqlxaj`. Add an integration to the Lambda, add a route (e.g. `POST /visit`), grant API Gateway invoke permission. CORS is already configured on the API. The Function URL still gets created during deploy but lives unused.

### `monzta` IAM user can't `iam:AttachUserPolicy` or `iam:PutRolePolicy`

The operator user has limited permissions. When you need to attach an AWS-managed policy to the user or add an inline policy to a role, sign in as root via the AWS Console and do it through the UI. We hit this on both Secrets Manager access (added `SecretsManagerReadWrite` to `monzta`) and the GA4 secret read policy (added an inline policy to `sentinelbot-handler-role-5ikqhbaz`).

### Many Lambdas share the same execution role

`sentinelbot-handler-role-5ikqhbaz` is the role behind most of our Lambdas (publisher, detector, metrics, visitor). It has broad DynamoDB access already. When you stand up a new Lambda, prefer reusing this role with `VISITOR_ROLE_ARN=...` style overrides in the deploy script instead of creating a new role (the operator can't make new roles anyway).

## Google

### GA4 web form rejects service accounts on personal-Gmail GCP projects

The `Admin -> Property access management -> Add users` form refuses `*@*.iam.gserviceaccount.com` emails with "this email doesn't match a Google Account" when the GCP project owner is a personal Gmail (not a Workspace tenant). Both Property-level and Account-level forms reject it. Tried incognito, waited propagation, no fix.

**Workaround that worked:** OAuth API. Open https://developers.google.com/oauthplayground, authorize scope `https://www.googleapis.com/auth/analytics.manage.users` as the Gmail that owns the property, exchange for an access token, then `curl` the Admin API:

```
curl -s -X POST \
  "https://analyticsadmin.googleapis.com/v1alpha/properties/<PROPERTY_ID>/accessBindings" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"user":"<SA_EMAIL>","roles":["predefinedRoles/viewer"]}'
```

Note the endpoint is `v1alpha` not `v1beta`. The `v1beta` path 404s on `accessBindings`.

### Our GA4 property ID

`531353319`. Service account `shieldbearer-metrics-reader@shieldbearer-sentinelbot.iam.gserviceaccount.com` has Viewer role on it.

## macOS

### Filenames from Spotlight / Screenshot use U+202F (narrow no-break space)

macOS embeds U+202F before AM/PM in auto-generated filenames (`let-my-people-go 5.59.38 AM.txt`). When you type the path with a regular space in a shell command, the path resolves to nothing and `cat`/`open` fails with ENOENT.

**Workarounds:** use a shell glob (`cd /path/to/dir && ls *.txt`), or copy the filename via tab-completion, or `xxd` the listing to see the actual byte sequence (`e2 80 af`).

## shieldbearer-website repo

### Legacy `.html` + clean-URL `/<page>/index.html` must stay byte-identical

The repo carries every page in two forms (`music.html` and `music/index.html`) because GitHub Pages serves the legacy form for `/music` requests. The test suite has a parity gate (`scripts/test.sh` block 24) that fails the build if any pair drifts. Documented exception: `sentinelbot.html` (its legacy file carries a CSS rule the clean URL doesn't need).

**When you edit one form, edit the other.** Or, after editing one, `cp <page>.html <page>/index.html` to sync.

### Em dash hard rule

`scripts/test.sh` block 21 fails on any U+2014 / `&mdash;` / `—` in the repo. Use period, comma, colon, parentheses, or rewrite the sentence. Per-line whitelist sigil `em-dash-allow` exists for legitimate regex/CSS uses.

### `redirect` stubs in the repo don't actually redirect

GitHub Pages serves `<page>.html` for the bare `/page` request. A previous attempt (v2.13.0) converted those legacy files to JS-redirect stubs. The clean URL then served the stub body. Reverted in v2.13.1.

**If you want a real 301**, deploy a Cloudflare Worker (`tools/cloudflare-redirect-worker.js` exists). Not currently active.

## sentinelbot-lambda repo

### NEVER `git add -A` in this repo

The repo carries in-flight uncommitted work in many directories (`SENTINELBOT_CHANGELOG.md`, `api/events.js`, `docs/song-index.json`, `scripts/*.js`, `node_modules/`, etc.) that does not belong in your commit. Add specific paths only:

```bash
git add path/to/specific/file.js path/to/another.js
git diff --cached --stat   # confirm scope before commit
```

This bites every session. The repo's `AGENTS.md` says it in step 4 of the pre-push checklist; treat it as binding.

### shield-cli writes both `site.json` AND DynamoDB; publisher rewrites `site.json` from DynamoDB

When you `shield ingest`, the snapshot in `shieldbearer-website/site.json` gets the new Signal Room entry, but `homepage.featuredRelease` is owned by the publisher Lambda and built from `shieldbearer-songs` table. So an ingest does not by itself change the featured release card -- the publisher has to run after.

To refresh featuredRelease after an ingest: invoke the publisher manually (`aws lambda invoke --function-name sentinelbot-site-publisher --payload '{"approved":true,"source":"youtube"}' --cli-binary-format raw-in-base64-out --region us-east-1 /tmp/out.json`).

### The detector denylist exists at `id: config:release-detector-denylist` in `shieldbearer-sentinel-logs`

When a YouTube video gets misclassified as a release (e.g. a Short the system thought was full-length), add its videoId to the `videoIds` list on that record. The detector reads it on every run and skips matched IDs forever.

We also need to delete the existing `releaseevent#youtube#<videoId>` record from `shieldbearer-sentinel-logs` to remove it from the publisher's release event scan. Denylisting alone only prevents re-detection.

## Browser / client

### `navigator.sendBeacon` can throw synchronously

Some browsers / browser states throw rather than return false from `sendBeacon`. The visitor beacon at the top of `js/sentinelbot.js` was once unprotected and a thrown beacon killed the rest of the script, including the ambient layer (v2.15.0). It is now hard-isolated in a try/catch. Don't remove that try/catch.

### Page Visibility throttling breaks timer chains in background tabs

Browsers throttle `setTimeout` in hidden tabs to 1000ms minimum. The SentinelBot ambient layer has a watchdog (`setInterval` every 8s) that force-restarts the rotation if `lastTickAt` is older than 25s. It also listens to `visibilitychange` to kick a fresh tick when the tab returns. Don't remove either.

## Admin tools

### One SHA-256 passphrase unlocks every `/admin/*` page

The hash `64354c5c7192a65cc78df77adbf77b4df37d6c60868cc83085f48f4f97e5848f` lives in every admin page's inline JS. Each page has its OWN `sessionStorage` key, so the index does not implicitly unlock the children. To change the passphrase, update the hash in every `/admin/*.html` page (currently 4 plus the index). If the passphrase ever leaks, this is a fast sweep.

### Admin API keys are hardcoded in client JS

`x-admin-key` values for `/admin/quiz`, `/admin/logs`, `/admin/visitors` are baked into the static JS of each admin page. The keys are visible in source to anyone who unlocks the page. The passphrase is the real perimeter. If a key leaks, rotate the env var on the Lambda AND update the page JS.

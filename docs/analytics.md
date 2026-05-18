# Analytics

## How it works

`js/analytics.js` is the single source of truth, loaded sitewide.
It pushes every event to `window.dataLayer` (GTM container
`GTM-N7SR64KL`, which forwards to GA4 `G-QTHJRB1B7G`). It also has
a direct GA4 fallback if GTM is blocked, and loads Microsoft
Clarity.

Events are wired by delegation on `document`, not per element. A
button added in a later template rewrite still fires without being
re-wired. That is the fix for the Apr/May 2026 instrumentation
collapse, where the migration silently dropped custom events to
zero. The delegation infers from the link href and context, and an
explicit `data-track` attribute refines the parameters when
present. Coverage cannot drop to zero from a template change again.

### Optional data-track attributes (refine params, not required)

```
<a href="https://open.spotify.com/..." data-track="listen"
   data-platform="spotify" data-track-name="sentinels">Listen</a>
<a href="https://instagram.com/..." data-track="follow"
   data-platform="instagram">Follow</a>
<a href="https://shieldbearer.bandcamp.com" data-track="support"
   data-support-type="bandcamp">Support</a>
<form data-track-form="contact" action="...">...</form>
<button data-track="sentinelbot_open">Ask the Watchman</button>
```

Without these, listen/follow/support/merch still fire from href
inference. The attributes add cleaner platform and track names.

## Events

| Event | Trigger |
|---|---|
| `listen_click` | Spotify/Apple/YouTube/Bandcamp/Tidal/etc link, or `data-track="listen"` |
| `follow_click` | social profile link with follow/subscribe text, or `data-track="follow"` |
| `support_click` | buymeacoffee/ko-fi/patreon/paypal/Bandcamp-buy, or `data-track="support"` |
| `merch_click` | shop.shieldbearerusa.com link, or `data-track="merch"` |
| `form_start` | first focus into any `<form>` |
| `form_submit` | any form submit |
| `play_audio` | any `<audio>` or radio element starts |
| `scroll_depth` | 25 / 50 / 75 / 100 percent, every content page |
| `sentinelbot_open` | SentinelBot widget opened |
| `sentinelbot_question` | question submitted to SentinelBot |
| `clarity_load_error` | Clarity CDN blocked or failed |

GA4 native `scroll` (90 percent) and outbound `click` are enabled
by the GA4 enhanced-measurement defaults in the GA4 console.

## GA4 Key Events (console action, not code)

GA4 had zero Key Events configured, so no conversions were
measured. In GA4 Admin -> Events, mark these as Key Events:

- `listen_click` -- core artist conversion
- `support_click` -- direct revenue intent
- `form_submit` -- contact / SentinelBot question
- `scroll_depth` where `percent = 75` -- deep engagement
- `sentinelbot_question` -- the differentiator
- `play_audio` -- radio stream / song preview

This cannot be done from the repo. It is a one-time GA4 console
action. Do it once and it sticks.

## Verifying after a deploy

Do not assume. GA4 Admin -> DebugView, with the Google Analytics
Debugger Chrome extension on, then walk the page and click the
buttons. Confirm each event shows up in DebugView in real time.
The pages to walk: /, /music, /timeline, /creed, /faq,
/song-meanings, /signal-room, /are-you-an-ai-band, /manifesto,
/contact, /videos, /for-ai-artists, /sentinelbot, /process.

## GTM and GA4 dual-firing

The site runs two tags: Google Tag Manager `GTM-N7SR64KL` and
direct GA4 `G-QTHJRB1B7G`. They are not redundant by accident,
so it matters which path carries what.

- Page views and GA4 enhanced measurement (native `scroll` at 90
  percent, outbound `click`, site search, video, file download)
  fire through whichever GA4 path is live. GTM is primary. The
  direct GA4 snippet in `js/analytics.js` is a fallback that only
  initializes if a valid `G-` id is configured, so if GTM is
  blocked or fails the basic GA4 stream still records.
- Every custom event (`listen_click`, `follow_click`,
  `support_click`, `merch_click`, `form_start`, `form_submit`,
  `play_audio`, `scroll_depth`, `signal_room_click`,
  `sentinelbot_open`, `sentinelbot_question`) goes through
  `window.sbTrack`, which pushes onto `window.dataLayer`. GTM
  reads `dataLayer`. So custom events route via GTM, then GTM
  forwards them to GA4 through its GA4 event tag.
- Risk: a custom event reaches GA4 twice if both the GTM GA4 tag
  AND the direct GA4 snippet are configured to forward the same
  dataLayer event. Today the direct snippet only does
  `gtag('config', ...)` for page views and does not bind the
  custom dataLayer events, so there is no double count. If a GA4
  event tag is ever added to the direct snippet, dedupe it.

Test both paths in DebugView:

1. GTM path: GA4 Admin -> DebugView with GTM Preview mode on
   (Tag Assistant). Trigger an event, confirm the GTM GA4 event
   tag fires and the event lands in DebugView with its params.
2. Direct path: block `googletagmanager.com/gtm.js` in the
   browser network panel, reload, trigger the same event. Page
   views should still land via the direct `G-` snippet. Custom
   events will not land in this state, which is expected, because
   they depend on GTM reading dataLayer. That is the documented
   tradeoff of routing custom events through GTM.

To make custom events survive a GTM outage, add a GA4 event tag
inside GTM that mirrors to the direct stream, or bind the
dataLayer events in the direct snippet and dedupe. Decide based
on how often GTM is actually blocked for this audience. Not
needed unless the data shows a real gap.

## Cross-domain tracking for shop.shieldbearerusa.com

Merch is on `shop.shieldbearerusa.com`, a Shopify subdomain.
Without cross-domain linking, GA4 starts a new session when a
visitor crosses from the main site to the shop, so the
`merch_click` to purchase journey breaks at the subdomain jump
and attribution is lost.

`js/analytics.js` already sets the GA4 linker for both domains in
the direct snippet. The GTM GA4 configuration must also be told,
because GTM is the primary path. This is a GA4 console action,
not a repo change:

1. GA4 Admin -> Data Streams -> the web stream.
2. Configure tag settings -> Configure your domains.
3. Add `shieldbearerusa.com` and `shop.shieldbearerusa.com`.
4. In GTM, confirm the GA4 configuration tag has the same domains
   listed under cross-domain settings.
5. Verify: open the site, click a merch link, land on the Shopify
   subdomain, and confirm the URL carries the `_gl` linker
   parameter and DebugView shows one continuous session, not two.

Shopify side: the Shopify GA4 / Google channel must use the same
`G-` measurement id for the journey to stitch. If Shopify uses a
separate GA property, the join cannot happen in the main
property and that is a Shopify configuration task, not a repo
one.

## Linktree round-trip tracking

Common loop: someone finds Shieldbearer on social, taps the
Linktree (`linktr.ee/shieldbearerusa`), then taps through to
`shieldbearerusa.com`. GA4 sees the arrival as referral from
`linktr.ee` and, because Linktree is a separate domain that
cannot be cross-domain linked (no control over their tags), the
social origin is lost and the session looks like generic
Linktree referral. Some of the referral-channel loss in the
deep-dive is likely this loop being uncounted as social.

What the repo can do is already done: the outbound click to the
footer Linktree link fires through the `js/analytics.js` click
delegation. To make the round trip legible:

1. On every Linktree destination URL that points back to the
   site, append UTM params, for example
   `?utm_source=linktree&utm_medium=social&utm_campaign=bio`.
   That is a Linktree dashboard edit, not a repo change.
2. Then arrivals from Linktree show as
   `linktree / social` with a campaign, instead of
   `linktr.ee / referral`, and the social origin is preserved.
3. Optionally tag each individual Linktree button with its own
   `utm_content` (spotify, youtube, music, signal-room) so the
   bio link performance is visible per destination.

This closes the loop on the GA4 side. The repo side needs
nothing further.

## When event counts look low

All custom events route through `window.sbTrack`, including
`sentinelbot_open` and `sentinelbot_question`. The widget guards
that call: if `window.sbTrack` is absent the chat still works,
the event just no-ops silently. That resilience has a blind
spot. If GTM or `js/analytics.js` is blocked or stripped by a
privacy extension, an ad-blocker, or browser tracking-prevention,
`sbTrack` no-ops with no error, so real widget usage produces no
event.

So if SentinelBot event counts look low against observed widget
usage once the GA4 Key Events are marked, check whether
`window.sbTrack` is being blocked or stripped by
tracking-prevention before assuming the wiring is wrong. The same
caution applies to every custom event, but SentinelBot is the
one most likely to show the gap because its usage is easy to
observe directly. The wiring being correct and the count being
low are not contradictory when a tracker is blocked client side.


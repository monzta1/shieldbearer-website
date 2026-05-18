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

# Shieldbearer Analytics Setup and Usage

This project now includes instrumentation hooks for:

1. Google Tag Manager (GTM)
2. Google Analytics 4 (GA4) via GTM tags
3. Google Search Console
4. Microsoft Clarity via GTM tags

## 1) GTM and GA4

All pages include the official GTM web container snippets using container ID:

`GTM-N7SR64KL`

`js/analytics.js` only pushes custom events to `window.dataLayer` and does not directly load GA4/Clarity scripts.

### GA4 Base Tag (required in GTM)

Create this tag in GTM exactly once:

1. Tags -> New
2. Tag Type -> Google tag
3. Measurement ID -> `G-QTHJRB1B7G`
4. Triggering -> `All Pages`
5. Tag name -> `GA4 - Shieldbearer USA - Base`
6. Save and Publish container

Rules:

- Do not use numeric stream ID.
- Do not add hardcoded GA4 scripts to site files.
- Do not create duplicate GA4 base tags in GTM.

### Recommended setup

1. Create a GTM container for `shieldbearerusa.com`
2. Use container ID `GTM-N7SR64KL`
3. In GTM, add a GA4 Configuration tag and connect your GA4 Measurement ID
4. In GTM, add a Microsoft Clarity tag if needed
4. Add cross-domain measurement in GA4 for:
   - `shieldbearerusa.com`
   - `shop.shieldbearerusa.com`

## 2) Search Console

The site now includes:

- `robots.txt`
- `sitemap.xml` at `https://shieldbearerusa.com/sitemap.xml`

### Steps

1. Open Google Search Console
2. Add property:
   - Prefer **Domain property**: `shieldbearerusa.com`
3. Verify with DNS TXT record in GoDaddy
4. Submit sitemap:
   - `https://shieldbearerusa.com/sitemap.xml`

## 3) Microsoft Clarity

Configure Clarity in GTM. Do not add Clarity direct script snippets to the site when GTM is enabled.

## 4) Tracked events already wired

The site is pre-wired to capture:

- `listen_click` (Spotify, YouTube, Apple Music, Amazon Music)
- `merch_click` (shop link clicks)
- `outbound_press_click` (press links)
- `follow_click` (social/linktree clicks)
- `contact_submit`
- `contact_submit_success`
- `contact_submit_fallback`
- `signal_signup`
- `signal_signup_submit`
- `scroll_open` (lyrics/meaning card open)
- `scroll_depth` (25, 50, 75, 100)

## How to use the dashboards

## GA4

Use these reports first:

1. Reports -> Engagement -> Events
2. Reports -> Acquisition -> Traffic acquisition
3. Explore -> Funnel exploration

Suggested funnels:

1. `page_view` (home)
2. `listen_click` or `scroll_open`
3. `merch_click` or `contact_submit`

Build comparisons:

- source / medium
- landing page
- device category

## GTM

Use GTM Preview mode to validate every event before publish.

Add custom event triggers for:

- `listen_click`
- `merch_click`
- `contact_submit`
- `signal_signup`

Then map each to GA4 event tags.

### Verification

1. Open GTM Preview and load `https://shieldbearerusa.com`
2. Confirm `GA4 - Shieldbearer USA - Base` fires on every tested page
3. In GA4 Realtime, confirm `page_view` events are received

## Search Console

Use these sections weekly:

1. Performance -> Queries and Pages
2. Indexing -> Pages
3. Experience/Core Web Vitals (if data available)

Watch for:

- non-indexed important pages
- top queries leading to music and lyrics pages
- page CTR opportunities

## Clarity

Use Clarity for behavior diagnostics:

1. Heatmaps for homepage and music page CTA zones
2. Recordings filtered by rage clicks/dead clicks
3. Compare sessions that click `merch` vs sessions that bounce

## Quick go-live checklist

1. Confirm snippets use `GTM-N7SR64KL` on every page
2. Publish GTM container
3. Confirm GA4 event stream receives custom events
4. Verify Search Console property and submit sitemap
5. Run one manual test journey:
   - open home
   - click Listen
   - open lyrics
   - click Merch
   - submit contact

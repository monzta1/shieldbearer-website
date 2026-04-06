# Shieldbearer Tracking Map (GTM-First)

This document defines the production event model for Shieldbearer USA using GTM as the only tag loader.

## Event Transport

All custom interactions are pushed to `dataLayer` as:

- `event`: `sb_click`
- `sb_action`: normalized action name (snake_case)
- `sb_platform`
- `sb_destination`
- `sb_location`
- `sb_song_name`
- `sb_link_text`
- `page_title`
- `page_path`
- optional: `sb_status`

## Action Inventory

1. `merch_click`
- Trigger condition: click on elements with `data-track="merch-click"`
- Parameters: `sb_platform=shopify`, `sb_destination`, `sb_location`, `sb_link_text`
- Affected elements/pages: merch links in nav/footer/CTAs across all pages

2. `spotify_click`
- Trigger condition: click on `data-track="spotify-click"`
- Parameters: `sb_platform=spotify`, `sb_destination`, `sb_location`, `sb_song_name`, `sb_link_text`
- Affected elements/pages: song links/cards and Spotify links across site

3. `youtube_click`
- Trigger condition: click on `data-track="youtube-click"`
- Parameters: `sb_platform=youtube`, `sb_destination`, `sb_location`, `sb_link_text`
- Affected elements/pages: YouTube links across site

4. `radio_click`
- Trigger condition: click on `data-track="radio-click"`
- Parameters: `sb_platform=spotify`, `sb_destination`, `sb_location`, `sb_link_text`
- Affected elements/pages: radio/playlist links

5. `email_click`
- Trigger condition: click on `data-track="email-click"` and signal form submit
- Parameters: `sb_platform=email`, `sb_destination`, `sb_location`, `sb_link_text`, optional `sb_status`
- Affected elements/pages: mailto links, signal signup

6. `social_click`
- Trigger condition: click on `data-track="social-click"`
- Parameters: `sb_platform` (instagram/facebook/x/tiktok), `sb_destination`, `sb_location`
- Affected elements/pages: social/linktree links across site

7. `presskit_click`
- Trigger condition: click on `data-track="presskit-click"`
- Parameters: `sb_destination`, `sb_location`, `sb_link_text`
- Affected elements/pages: interviews/press/press-related outbound links

8. `epk_click`
- Trigger condition: click on `data-track="epk-click"`
- Parameters: `sb_destination`, `sb_location`, `sb_link_text`
- Affected elements/pages: EPK links

9. `manifesto_click`
- Trigger condition: click on `data-track="manifesto-click"`
- Parameters: `sb_destination`, `sb_location`, `sb_link_text`
- Affected elements/pages: manifesto links

10. `open_letter_click`
- Trigger condition: click on `data-track="open-letter-click"`
- Parameters: `sb_destination`, `sb_location`, `sb_link_text`
- Affected elements/pages: open letter links

11. `lyrics_expand`
- Trigger condition: meaning card / lyric accordion opened
- Parameters: `sb_location=song_card`, `sb_song_name`, `sb_link_text`
- Affected elements/pages: song meanings and meaning cards

12. `contact_submit`
- Trigger condition: contact form submit attempt
- Parameters: `sb_platform=email`, `sb_location=contact_form`, `sb_destination`, `sb_status=attempt`
- Affected elements/pages: contact page form

13. `contact_submit_success`
- Trigger condition: contact form request success callback
- Parameters: `sb_platform=email`, `sb_location=contact_form`, `sb_destination`, `sb_status=success`
- Affected elements/pages: contact page form

14. `email_submit_success`
- Trigger condition: signal signup success callback
- Parameters: `sb_platform=email`, `sb_location=cta`, `sb_destination`, `sb_status=success`
- Affected elements/pages: signal signup forms

15. `outbound_click`
- Trigger condition: click on `data-track="outbound-click"`
- Parameters: `sb_platform=external`, `sb_destination`, `sb_location`, `sb_link_text`
- Affected elements/pages: qualifying external links

## GTM Workspace Setup

Create these GTM variables:

- `DLV - sb_action` -> `sb_action`
- `DLV - sb_platform` -> `sb_platform`
- `DLV - sb_destination` -> `sb_destination`
- `DLV - sb_location` -> `sb_location`
- `DLV - sb_song_name` -> `sb_song_name`
- `DLV - sb_link_text` -> `sb_link_text`
- `DLV - page_title` -> `page_title`
- `DLV - page_path` -> `page_path`
- `DLV - sb_status` -> `sb_status`

Create one trigger:

- `Custom Event - sb_click`
- Event name: `sb_click`

Create GA4 event tags (all triggered by `Custom Event - sb_click` + filter):

- `GA4 - Event - merch_click` where `DLV - sb_action equals merch_click`
- `GA4 - Event - spotify_click` where `DLV - sb_action equals spotify_click`
- `GA4 - Event - youtube_click` where `DLV - sb_action equals youtube_click`
- `GA4 - Event - radio_click` where `DLV - sb_action equals radio_click`
- `GA4 - Event - email_click` where `DLV - sb_action equals email_click`
- `GA4 - Event - social_click` where `DLV - sb_action equals social_click`
- `GA4 - Event - presskit_click` where `DLV - sb_action equals presskit_click`
- `GA4 - Event - epk_click` where `DLV - sb_action equals epk_click`
- `GA4 - Event - manifesto_click` where `DLV - sb_action equals manifesto_click`
- `GA4 - Event - open_letter_click` where `DLV - sb_action equals open_letter_click`
- `GA4 - Event - lyrics_expand` where `DLV - sb_action equals lyrics_expand`
- `GA4 - Event - contact_submit` where `DLV - sb_action equals contact_submit`
- `GA4 - Event - contact_submit_success` where `DLV - sb_action equals contact_submit_success`
- `GA4 - Event - email_submit_success` where `DLV - sb_action equals email_submit_success`
- `GA4 - Event - outbound_click` where `DLV - sb_action equals outbound_click`

For each GA4 event tag, map parameters:

- `platform` -> `{{DLV - sb_platform}}`
- `destination` -> `{{DLV - sb_destination}}`
- `location` -> `{{DLV - sb_location}}`
- `song_name` -> `{{DLV - sb_song_name}}`
- `link_text` -> `{{DLV - sb_link_text}}`
- `page_title` -> `{{DLV - page_title}}`
- `page_path` -> `{{DLV - page_path}}`
- `status` -> `{{DLV - sb_status}}`

## Validation Checklist

1. GTM Preview: confirm `sb_click` appears once per interaction.
2. GTM Preview: confirm only the matching GA4 event tag fires (no doubles).
3. GA4 DebugView: confirm event names and mapped parameters.
4. Confirm no duplicate `page_view` events.
5. Confirm no direct GA4/Clarity scripts in codebase.

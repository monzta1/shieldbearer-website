# Shieldbearer Website Changelog

Versioning note:
- Use semantic versioning in the form `vmajor.minor.patch`
- Patch bumps track small site/admin/logging changes
- Minor bumps track visible site features or broader UI additions
- Major bumps track architecture-level changes

## v1.0 - April 2026
- Initial SentinelBot deployment on the Shieldbearer site
- Watchman-class Guardian Intelligence online
- Core responses covered music, mission, theology, and site navigation

## v1.1 - April 2026
- Expanded the site-side UI support for SentinelBot
- Added public-page launcher coverage across the site
- Introduced the logs admin page for internal review

## v1.2 - April 2026
- Added the admin insights panels for top questions, weak answers, and cache candidates
- Added rare unanswered question tracking
- Improved timestamp handling and log readability

## v1.3 - April 2026
- Added SentinelBot Mark I identity and character profile
- Added version-aware replies in the live system
- Established the `SENTINELBOT_VERSION` flow for future minor updates

## v1.3.1 - April 2026
- Raised the SentinelBot admin log counter baseline to 139
- Excluded already cached questions from the CACHE CANDIDATES panel
- Kept the admin totals aligned with the live DynamoDB counter

## v1.4 - April 2026
- Added the public `sentinelbot.html` page to the AI and Faith section
- Added SentinelBot to the site navigation dropdowns
- Added `sentinelbot.html` to the sitemap for search indexing
- Published the Watchman-class SentinelBot story as a permanent site page

## v1.5.0 - April 2026
- Added a client-side release timeline view driven by `site.json`
- Highlighted the latest release and milestone anniversary states
- Added a homepage CTA and sitemap entry for the release timeline page

## v1.5.1 - April 2026
- Added the Release Timeline link to the AI and Faith navigation dropdown across the site

## v1.5.2 - April 2026
- Moved Release Timeline to the top-level nav directly after Music
- Removed the duplicate Release Timeline entry from the AI and Faith dropdown

## v1.5.3 - April 2026
- Temporarily removed the Release Timeline UI entry from the public navigation
- Removed the homepage timeline CTA and sitemap reference
- Left the timeline data pipeline and hidden route intact for backend continuity

## v1.5.4 - April 2026
- Re-enabled the top-level Release Timeline navigation link site-wide
- Upgraded the archive page into a one-year anniversary layout with album blocks and year chapters
- Added the homepage archive CTA and restored timeline indexing in the sitemap

## v1.5.5 - April 2026
- Added a root-level `site.json` so the archive page fetch resolves on GitHub Pages
- Kept the timeline page bound to the same root-relative fetch path
- Aligned the live site asset location with the served Pages root

## v1.5.6 - April 2026
- Excluded short-form archive noise from the timeline feed
- Flagged livestreams and subscriber-count live posts so they stay out of the public archive
- Kept the anniversary archive focused on actual releases only

## v1.5.7 - April 2026
- Removed Eagle’s Wrath Incoming! 🦅🔥 Operation Fire Begins from the archive timeline
- Marked the short-form release record as excluded so the public archive stays clean

## v1.5.8 - April 2026
- Added YouTube thumbnails to archive cards for a more visual release story
- Turned the hero into a blurred thumbnail collage for a cinematic first impression
- Upgraded the year dividers, source pills, and mission stats styling for the anniversary page

## v1.5.9 - April 2026
- Added a ninth Year One achievement for the live merch store milestone
- Updated the achievements section subtitle to include the merch store in the year-one story
- Reflected the expanded achievement count in the anniversary hero stats

## v1.5.10 - April 2026
- Added a tenth Year One achievement for the 12,300 YouTube subscriber milestone
- Updated the achievements section subtitle to include the subscriber milestone in the year-one story
- Reflected the expanded achievement count in the anniversary hero stats

## v1.5.11 - April 2026
- Added the shared SentinelBot assistant to the archive page so it matches the rest of the site
- Kept the timeline page visually and behaviorally consistent with other Shieldbearer pages

## v1.5.12 - April 2026
- Added the Ruach Spotify playlist directly below the Armory embed on the music page
- Kept the music page playlist section grouped and consistent with the site structure

## v1.5.13 - April 2026
- Added archive share buttons for Facebook, X, and copy-link sharing
- Added milestone YouTube embeds to highlighted release cards on the timeline

## v1.5.9 - April 2026
- Added editorial notes and milestone badges to the anniversary archive entries
- Tagged the five defining releases with story context in `site.json`
- Kept the timeline visually rich while preserving the release archive structure

## v1.5.10 - April 2026
- Removed the short-form `Worth It All` entry from the archive timeline
- Kept the official video release in the archive while excluding the stray short

## v1.5.11 - April 2026
- Removed the short-form `Silence In The Face Of Evil` entry from the archive timeline
- Kept the archive focused on release-level entries instead of short-form clips

## v1.5.12 - April 2026
- Added a Year One achievements section above the release archive
- Framed the archive with a mission-first summary before the catalog timeline begins

## v1.5.13 - April 2026
- Removed the incorrect "written in defence of Israel" note from the Celestial Shield archive entries for Slayer of the Grave and Prison Break
- Kept the archive notes aligned with the actual release context

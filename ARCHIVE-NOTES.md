# Archive notes

What was disabled, what was preserved, and how to bring any of it back.

## Disabled pages (three)

| Slug | Original URL | Current location (root .html) | Current location (dir form) |
| --- | --- | --- | --- |
| `open-letter` | /open-letter | unpublished/open-letter.html | unpublished/open-letter-dir/index.html |
| `no-rulebook` | /no-rulebook | unpublished/no-rulebook.html | unpublished/no-rulebook-dir/index.html |
| `artist-freedom` | /artist-freedom | unpublished/artist-freedom.html | unpublished/artist-freedom-dir/index.html |

Each disabled file has:

- `<meta name="robots" content="noindex,nofollow">` in the head.
- A red "Unpublished" banner at the top of the body.
- All original content otherwise intact. No edits to the prose.

Sitemap entries for the three slugs were removed.

## NOT disabled (still live)

- **for-ai-artists** stays live. It is an outward-facing resource for fellow artists, not a rebuttal of critics. It was REWRITTEN in place to remove the combative sections ("What They Actually Mean", "supported by pride", "the mask comes off", warning-list victim line) while keeping the solidarity, the Scripture references, and the Christ-bore-the-shield close. The "What They Are Really Saying" header became "When the Questions Come" and its body was reframed declaratively. Bottom Resources block trimmed to live pages with declarative descriptions.
- **god-uses-tools** stays live. The page is Scripture-dense (eleven Biblical examples with full verse citations) and the load-bearing content is the Word. Only three snark lines were removed in the previous batch ("Which is wild because have you actually read the Bible?", "But Now in 2026 We Draw the Line at AI" header, "He can use nerds with laptops"). All eleven Biblical examples and every verse citation are preserved verbatim.

## Scripture Preservation Index

Every Scripture reference from a disabled page now lives on a public page.

### From `open-letter` (now disabled) → on `/gatekeeping`

| Verse / passage | Where it lives now |
| --- | --- |
| Matthew 20:1-16 (workers in the vineyard parable) | gatekeeping, section "Unexpected Vessels" |
| 1 Corinthians 3:7 | gatekeeping, section "Unexpected Vessels" |
| 2 Corinthians 12:9 | gatekeeping, section "Unexpected Vessels" |
| Biblical hero list (Moses, David, Gideon, Amos, Peter and the apostles, Paul) | gatekeeping, section "Unexpected Vessels" (six-item list) |

### From `no-rulebook` (now disabled)

The page contained no Scripture references. Nothing to preserve.

### From `artist-freedom` (now disabled) → on `/gatekeeping`

| Verse / passage | Where it lives now |
| --- | --- |
| 1 Thessalonians 5:19 | gatekeeping, section "Freedom in the Spirit" |
| 2 Corinthians 3:17 | gatekeeping, section "Freedom in the Spirit" |
| Colossians 3:17 | gatekeeping, section "Freedom in the Spirit" |
| Matthew 25:14-30 (parable of the talents) | gatekeeping, section "Freedom in the Spirit" |
| Matthew 23:13 | gatekeeping (was already present pre-batch, under "The Pharisees") |

### From `for-ai-artists` (now rewritten in place, still live)

| Verse / passage | Status |
| --- | --- |
| Matthew 23:13 | still present on for-ai-artists; also on gatekeeping |
| Burning bush, donkey, sling, Amos, fishermen, Saul references | still present on for-ai-artists (kept in the "What Scripture Actually Says" section) |
| Matthew 21:15 (Jesus defending children in the temple) | moved to gatekeeping, section "Jesus Defended the Untrained" (it had been folded into the cut "What They Actually Mean" section) |
| Galatians 1 (Judaizers reference) | already on gatekeeping under "The Judaizers" |

## How to re-enable a disabled page

Restoring is fast. Per page:

1. **Move both files back to root.** For example for `open-letter`:
   ```
   git mv unpublished/open-letter.html ./open-letter.html
   git mv unpublished/open-letter-dir ./open-letter
   ```
   The first is the root .html form. The second is the directory-form (pretty URL) duplicate that the site uses in parallel.

2. **Remove the noindex meta and the Unpublished banner** from both files. Open each. Delete the line `<meta name="robots" content="noindex,nofollow">` from the head. Delete the entire `<!-- Unpublished archive banner ... -->` block plus its `<div>...</div>` immediately after `<body data-scripture-links>`.

3. **Add the nav and footer links back.** Top nav: the "AI and Faith" dropdown (in every live HTML file plus its `<slug>/index.html` duplicate). The "Words" dropdown for `open-letter`. Footer "Navigate" list in every live file. Footer "Take Action" list for `open-letter`. Easiest: copy the pattern used for "On Gatekeeping" (for AI pages) or "The Creed" (for Words) in any live file and adapt the slug and label.

4. **Restore sitemap.xml** with the matching `<url>` block.

5. **Commit, push, verify Pages built green.**

## How to re-enable all three at once

Easiest path is to revert the change:

```
cd shieldbearer-website
git log --oneline | head        # find the v2.27.x batch 3 commit hash
git revert <that-hash> --no-edit
git push origin sentinelbot-stable
```

That brings the files back to root, restores all nav and footer links, restores sitemap entries, and undoes the for-ai-artists rewrite plus the in-place trims (manifesto, gospel, quiz, FAQ, god-uses-tools).

If you want a more surgical restore (bring back the pages but keep the tone trims and the for-ai-artists rewrite), do the per-page steps above for each slug individually.

## In-place edits that landed alongside the disabling

These are not reversible by moving a file. They were edits to live pages. If you want them undone, revert the matching commit.

### Batch 1 (additive only on gatekeeping)
- Added three sections to gatekeeping.html: "Unexpected Vessels", "Jesus Defended the Untrained", "Freedom in the Spirit". See the Scripture Preservation Index above for details.

### Batch 2 (in-place trims on live pages)
- manifesto.html: "defending the freedom" → "the freedom"; "We defend open proclamation and open accountability" → "We stand for open proclamation".
- gospel.html: removed "We became the AI guys defending AI. But that was never what we were doing."
- are-you-an-ai-band.html (quiz): hero reframed; tier parentheticals dropped; "gatekeepers' own standard" → "the same standard every modern record has been made under"; dead link to for-ai-artists removed from hero.
- faq.html: "pride wearing a guitar strap" replaced; "Full stop" dropped; "Bobby better practice" paragraph removed; "pride masquerading" line replaced. Mirrored in JSON-LD.
- god-uses-tools.html: three snark lines removed; all Biblical content kept verbatim.

### Batch 3 Part B (for-ai-artists rewrite)
- "None of those claims are supported by Scripture. Every single one of them is supported by pride." → "Scripture answers each of these, and it has for thousands of years."
- Entire "What They Actually Mean" section cut (six paragraphs). Its Scripture refs (Matthew 21:15, Galatians 1) live on gatekeeping.
- "We have been on warning lists. We have been told to stop." cut. Following line kept.
- Header "What They Are Really Saying" → "When the Questions Come". Body reframed declaratively without changing the substance.
- Inline link to /no-rulebook in "How to Respond" body removed; point folded into the sentence.
- Bottom Resources block: removed Open Letter, No Rulebook, Artist Freedom links. Kept FAQ, On Gatekeeping, God Uses Tools, AI and Creativity (with declarative descriptions). Added Manifesto and Creed.

### Inline cleanup for disabled-page references
- contact.html (and contact/index.html): "AI and faith conversation" paragraph rewritten to point at gatekeeping and the AI and Faith FAQ instead of the removed pages.
- faq.html: removed the inline link "Read the full case at There Is No Rulebook"; rewrote the labeling paragraph's tail to drop the artist-freedom.html link.
- how-it-works.html: removed "Open Letter" from the doctrine chain in the thesis chapter.
- interviews.html: removed the entire "An Open Letter" promotional section below the press cards.
- 404.html: in batch 3 not modified (it still references for-ai-artists which is live, no scrubbing needed).
- sitemap.xml: removed the three disabled URLs.

## Where directory-form duplicates come from

The site historically maintained two parallel forms of each page: `slug.html` at the root and `slug/index.html` in a directory. Both serve the same pretty URL. The directory forms had drifted out of sync. In this batch, the disabled pages were moved as both `unpublished/<slug>.html` and `unpublished/<slug>-dir/` (the latter contains the original `index.html`). Live pages that received in-place edits in batches 1-3 were synced root → dir form so both stay current.

If you re-enable a page, restore BOTH the root .html and the directory form.

## Voice rules honored throughout

- No em dashes introduced. The existing em-dash pseudo-content separator in gatekeeping CSS is tagged with `em-dash-allow`.
- No "not X but Y" added.
- No AI flourishes.
- Declarative, matching the home and music pages.

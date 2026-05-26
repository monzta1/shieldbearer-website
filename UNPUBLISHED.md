# Unpublished pages

This document records which long-form pages were de-listed from the live
Shieldbearer site, why, and exactly what it takes to bring any one of them
back. Nothing here was deleted. Every page is still committed, still
deployable, and still reachable directly under `/unpublished/<slug>` for
internal review.

## Why these were unpublished

An outside tone review (May 2026) flagged that the AI-and-Faith section
read as defensive and at points combative, even though the home page and
music read as confident. The pattern: too many overlapping pages all
arguing against critics, plus sarcasm and gotcha lines that read as
wounded rather than confident. The decision was to keep the declarative
pages (Creed, Gatekeeping, Manifesto, Gospel, AI and Creativity) and
de-list the rebuttal-mode pages without deleting anything, so they can be
brought back individually if needed.

## Currently unpublished

| Slug | Original URL | Current location | Classified as |
| --- | --- | --- | --- |
| `open-letter` | /open-letter | /unpublished/open-letter.html | Sermon-as-rebuke ("The Parable You Keep Ignoring", "Why Some Of You Fear Technology") |
| `for-ai-artists` | /for-ai-artists | /unpublished/for-ai-artists.html | Solidarity letter with "What They Actually Mean" gotcha section |
| `no-rulebook` | /no-rulebook | /unpublished/no-rulebook.html | "Invented last Tuesday" / "nothing to prove" defense |
| `artist-freedom` | /artist-freedom | /unpublished/artist-freedom.html | History lesson with "creativity police officer" rebuke |
| `god-uses-tools` | /god-uses-tools | /unpublished/god-uses-tools.html | Donkey/fish/raven list with snarky framing |

Each file has:

- `<meta name="robots" content="noindex,nofollow">` in the head (search engines skip it).
- A red banner at the top of `<body>` labeling it as Unpublished.
- Original content otherwise untouched. Re-enabling is non-destructive.

## What was scrubbed from the live site

To keep the de-listed pages reachable only by direct URL inside
`/unpublished/`, every public link to them was removed:

- Top-nav dropdown items in all 24 live HTML files.
- Footer navigation entries in all 24 live HTML files.
- "Related Reading" resource-link boxes on `creed`, `gatekeeping`, `manifesto`, `gospel`, `ai-and-creativity`, `are-you-an-ai-band`, and others.
- Inline prose mentions on `contact.html`, `how-it-works.html`, `interviews.html`, `404.html`.
- The "AI and Faith" dropdown parent link was repointed from `/for-ai-artists` to `/gatekeeping`.

The scrub script that did the work lives at `/tmp/scrub_disabled_links.py` and the dropdown-parent restore at `/tmp/restore_aiandfaith_parent.py` (recreate from this file if needed).

## Re-enabling one page

If you decide a page should come back, do this:

1. **Move the file back to the repo root.**
   ```
   git mv unpublished/<slug>.html ./<slug>.html
   ```

2. **Remove the noindex meta and the Unpublished banner.**
   Open the file. Delete the `<meta name="robots" content="noindex,nofollow">` line in the head (single line, just below the viewport meta). Delete the entire `<!-- Unpublished archive banner ... -->` block plus the `<div>...</div>` immediately after `<body data-scripture-links>`.

3. **Re-add the nav and footer links.** Top nav: add the page back into the "AI and Faith" dropdown for AI pages, or the "Words" dropdown for `open-letter`. Footer: add the matching `<li>` entry in the Navigate column of every live HTML file (the footer is identical across all of them). The simplest path is to copy a block from an already-listed page (e.g. for an AI page, copy the pattern used for "On Gatekeeping" from `index.html` and adapt the slug + label).

4. **Re-add Related Reading references** (optional, only if the page belongs in a curated cluster).

5. **If you also want the page in the dropdown parent again** (was originally the case for `for-ai-artists` which served as the "AI and Faith" parent link), edit the `<a href="/gatekeeping">AI and Faith</a>` parent line in each live HTML file's nav to point back to the re-enabled page.

6. **Commit, push, verify the GitHub Pages build went green.** The page should now be at its original URL.

## Re-enabling all five at once

Reverse the original change in bulk:

1. `git mv unpublished/*.html ./` then `rmdir unpublished` (only if the folder is empty).
2. For each of the five files, delete the noindex meta and the Unpublished banner block (search the file for `Unpublished archive banner`).
3. Restore the nav + footer entries. The cleanest way is to look at the git history of any one live file pre-tone-pass and copy the original nav/footer back over. The relevant commit is the one that ships this `UNPUBLISHED.md` file plus the tone trims (around v2.27.x).
4. Restore the "Related Reading" boxes on `creed.html`, `gatekeeping.html`, `manifesto.html`, `gospel.html`, `ai-and-creativity.html`, `are-you-an-ai-band.html` from the same pre-tone-pass commit.
5. Restore the in-place trims if you want the original combative phrasing back (the manifesto "defending the freedom" line, the gospel "AI guys defending AI" beat, the FAQ "pride wearing a guitar strap" / "Bobby better practice" lines, the quiz tier parentheticals, the "gatekeepers' own standard" framing). Look for the matching commit in `SHIELDBEARER_WEBSITE_CHANGELOG.md` to find what was removed and where.

## In-place trims that landed alongside the unpublishing

These are not reversible by moving a file. They were edits to live pages
intended to match the tone of the home and music pages. If you want them
back, undo them in the same git commit:

- **manifesto.html**: "defending the freedom to examine it openly" → "the freedom to examine it openly". "We defend open proclamation and open accountability" → "We stand for open proclamation".
- **gospel.html**: removed the line "We became the AI guys defending AI. But that was never what we were doing."
- **are-you-an-ai-band.html** (quiz): hero copy reframed; "(or recently arrived from 1962)" and "(and probably argued about them online)" parentheticals dropped from the tier names; "the gatekeepers' own standard" → "the same standard every modern record has been made under"; the link to `/for-ai-artists` in the hero was deleted (cannot point at an unpublished page).
- **faq.html**: "That is your pride wearing a guitar strap" → "That is a different argument than the one being made". "If the music lifts His name, the mission is accomplished. Full stop." → drop "Full stop". "And if God can only work through technically impressive music, then Bobby better practice. Practice hard Bobby. People won't get saved until your guitar sounds good enough." → removed entirely. "And pride masquerading as theological concern does not deserve a quiet response" → "The method is not what carries the witness. Christ is." Consolidated `/no-rulebook` and `/artist-freedom` inline link references (those pages were unpublished anyway).

## Quick re-enable command for an emergency

For the impatient: this brings everything back in roughly two minutes.

```bash
cd shieldbearer-website
git log --oneline | head     # find the commit BEFORE the tone pass
git revert <that-commit-hash> --no-edit
git push origin sentinelbot-stable
```

(That revert path assumes the tone pass is a single commit. If it's split
across multiple commits, revert them in reverse order.)

# Homepage hero re-diagnosis

Priority B Report 1. Findings from direct measurement of the live
site. Lab/field metrics that need a browser run are marked and
left for the operator to fill, not invented.

## Fold position at 375px (deterministic, from served CSS)

`#hero { height: 100svh }` is exactly one viewport. At the fold
the visitor sees only the hero art and the scroll cue.
`.hero-content-section` is the second full screen.
`#release` ("New Release, Let My People Go") is the third screen.

So at 375px and at 390px (iPhone 13/14) the New Release block is
about two full viewport heights below the fold. Deliberate
cinematic design, not a bug, but the release is nowhere near the
fold.

## Asset weights (real GET, pre-fix)

| Resource | Bytes |
|---|---|
| Homepage HTML | 52,423 |
| /css/style.css | 35,465 (render-blocking, fine) |
| Google Fonts CSS | 2,029 (render-blocking, third-party, display=swap) |
| images/galilean-art.png | 2,697,928 (the visible hero LCP element) |
| images/over-the-skies-of-hell-art.jpg | 1,457,151 (second screen) |
| YouTube thumb (below fold) | 13,151 |

The mobile hero background was a 2.7 MB PNG loaded as a CSS
background-image. That is the measured defect.

## Render-block audit

GTM/GA4/Clarity load async (gtm.js j.async=true), not in the
hero paint path. Google Fonts CSS is render-blocking third-party
but display=swap avoids FOIT. style.css is render-blocking,
same-origin, 35 KB. Body-end core scripts (config, analytics,
main, sentinelbot) have no defer but sit after content, so they
do not block hero first paint. The real bottleneck was
same-origin: the 2.7 MB PNG.

## Fix applied (commit, this round)

Generated breakpoint JPEG variants with sips (the only encoder
available in the build environment):

| File | Size | Target | Was |
|---|---|---|---|
| galilean-art-768.jpg (mobile) | 104 KB | < 200 KB | 2.7 MB |
| galilean-art-1536.jpg (desktop) | 400 KB | < 500 KB | 2.7 MB |
| over-the-skies-768.jpg (mobile) | 76 KB | < 150 KB | 1.46 MB |
| over-the-skies-1536.jpg (desktop) | 320 KB | < 500 KB | 1.46 MB |

`.hero-bg` and `.hero-content-section` now select the variant by
breakpoint via a CSS custom property; the gradient layers and
filter are unchanged. Originals kept untouched for og:image (44
pages reference galilean-art.png). WebP/AVIF was not produced
(no cwebp/avifenc/ImageMagick/sharp in the environment, only
sips, which cannot encode those formats). The drop-in upgrade is
scripted in tools/encode-hero-images.sh and is a safe
progressive enhancement via image-set().

## Post-fix measurement (OPERATOR TO FILL -- not faked)

Lighthouse and PSI cannot be run from the build environment.
These are not estimated or invented. After deploy and CDN
propagation, run them and fill this section:

1. Chrome DevTools -> Lighthouse -> Mobile -> analyze
   `https://shieldbearerusa.com/`. Record:
   - LCP: ____  (pre-fix expectation: poor, multi-second on
     mid-tier 4G due to the 2.7 MB LCP image)
   - FCP: ____
   - TTI: ____
   - TBT: ____
   - CLS: ____  (expected low; hero is a CSS background, the
     below-fold img carries width/height)
2. pagespeed.web.dev for the same URL. Record lab values and the
   CrUX field data if the origin has enough traffic:
   - Lab LCP/FCP/TTI/TBT/CLS: ____
   - Field (CrUX) LCP/INP/CLS: ____
3. Compare lab vs field. Field lags up to 28 days, so a fresh
   deploy will show improved lab before field catches up.

The hero question closes when this section is filled and LCP is
confirmed healthy. If bounce persists after LCP is healthy, the
next investigation is the two-screens-to-content depth or
off-site factors, not hero weight.

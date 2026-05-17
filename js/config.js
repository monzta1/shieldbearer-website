/* =============================================================
   SHIELDBEARER. Central Site Configuration.

   One source of truth for runtime knobs. Edit a value here, push,
   done. This file MUST load before every other script in js/.

   Sections:
     analytics    : GTM, GA4, Clarity tracking IDs
     sentinelbot  : Chat widget backend
     merch        : Homepage featured-merch rotator
   ============================================================= */
window.SHIELDBEARER_CONFIG = {

  /* Analytics ........................................................
     gtmId     : Google Tag Manager container ID ("GTM-XXXXXXX")
     ga4Id     : Direct GA4 fallback measurement ID ("G-...")
                 Used only if GTM is unavailable.
     clarityId : Microsoft Clarity project ID (heatmaps/sessions)
     Leave any field as "" to disable that integration.
     ............................................................... */
  analytics: {
    gtmId:     "GTM-N7SR64KL",
    ga4Id:     "G-QTHJRB1B7G",
    clarityId: "w7gal18ekh"
  },

  /* SentinelBot chat widget .........................................
     apiUrl : Lambda endpoint that powers the chat. Swap to a
              staging URL while testing without affecting prod.
     ............................................................... */
  sentinelbot: {
    apiUrl: "https://g7a5tqlxaj.execute-api.us-east-1.amazonaws.com/sentinel"
  },

  /* Are You An AI Band quiz .........................................
     apiUrl : API Gateway endpoint for the quiz logging Lambda.
              Leave "" until the logging Lambda is deployed. When
              empty the quiz still runs end to end and the share
              card still generates; only the anonymous submission
              POST is skipped. Set this to the Invoke URL printed
              by ai-band-quiz-logger/deploy.sh, then push.
     ............................................................... */
  quiz: {
    apiUrl: "https://g7a5tqlxaj.execute-api.us-east-1.amazonaws.com/quiz"
  },

  /* Featured-merch rotator (homepage only) ..........................
     rotate   : true  = pick a random product from `source` on each
                        page load.
                false = instant kill switch; always show the static
                        `fallback` below. Use this if the rotator
                        misbehaves; no redeploy of data/merch.json
                        needed.
     source   : Path to the baked merch JSON. Refreshed by running
                scripts/fetch-merch.sh before deploy.
     fallback : Static merch card shown when rotate=false OR when
                the fetch of `source` fails for any reason.
     ............................................................... */
  merch: {
    rotate: true,
    source: "data/merch.json",
    fallback: {
      title: "Shieldbearer Logo Tee",
      image: "images/logo-tee.webp",
      url:   "https://shop.shieldbearerusa.com",
      alt:   "Shieldbearer logo t-shirt"
    }
  },

  /* Signal Room countdown (signal-room page only) ...................
     enabled     : true  = render the countdown block.
                   false = hide it entirely (kill switch, no redeploy).
     resetDays   : When the rolling timer hits zero (or no value is
                   stored yet) it auto-sets a new target this many
                   days into the future. Default 7.
     fixedTarget : Optional ISO 8601 string. If set, the timer counts
                   to this exact date for every visitor and ignores
                   the rolling reset. Set back to null to return to
                   rolling mode. Examples:
                     "2026-05-10T20:00:00Z"  (UTC)
                     "2026-05-10T20:00:00-04:00"  (specific timezone)
     storageKey  : localStorage key for persisting the rolling target.
                   Change this if you ever need to invalidate every
                   visitor's stored target in one shot.
     ............................................................... */
  signalCountdown: {
    enabled: true,
    resetDays: 7,
    fixedTarget: null,
    storageKey: "shieldbearer_signal_target"
  }

};

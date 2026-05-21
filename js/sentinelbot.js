(() => {
  // Config lives in js/config.js (window.SHIELDBEARER_CONFIG.sentinelbot).
  const API_URL = (window.SHIELDBEARER_CONFIG && window.SHIELDBEARER_CONFIG.sentinelbot && window.SHIELDBEARER_CONFIG.sentinelbot.apiUrl) || "";

  // Do not render the floating widget on the SentinelBot page
  // itself. No point offering a shortcut to the page you are on.
  const sbPath = (window.location && window.location.pathname || "/").replace(/\/+$/, "") || "/";
  if (sbPath === "/sentinelbot" || sbPath === "/sentinelbot.html") return;

  // Route widget events through the same dataLayer pipeline as the
  // rest of analytics.js: window.sbTrack pushes to GTM, GTM to GA4.
  function track(ev, params) {
    if (typeof window.sbTrack === "function") window.sbTrack(ev, params || {});
  }

  let isOpen = false;
  let history = [];

  const style = document.createElement("style");
  style.textContent = `
    #sentinelbot-presence {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      align-items: center;
      gap: 10px;
      pointer-events: none;
    }
    #sentinelbot-launcher {
      position: static;
      background: #000;
      color: #00ff41;
      border: 1px solid #00ff41;
      padding: 10px 14px;
      font-family: Courier New, monospace;
      cursor: pointer;
      box-shadow: 0 0 12px rgba(0,255,65,0.35);
      display: inline-flex;
      align-items: center;
      gap: 8px;
      pointer-events: auto;
    }
    .sentinelbot-online-dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #00ff41;
      box-shadow: 0 0 6px rgba(0,255,65,0.85);
      animation: sentinelbot-pulse 2.4s ease-in-out infinite;
    }
    @keyframes sentinelbot-pulse {
      0%, 100% { opacity: 1; box-shadow: 0 0 6px rgba(0,255,65,0.85); }
      50%      { opacity: 0.45; box-shadow: 0 0 12px rgba(0,255,65,0.45); }
    }
    #sentinelbot-status {
      max-width: 280px;
      color: #b9ffcb;
      background: rgba(0,0,0,0.55);
      border: 1px solid rgba(0,255,65,0.35);
      padding: 6px 10px;
      font-family: Courier New, monospace;
      font-size: 12px;
      line-height: 1.3;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      opacity: 0;
      transform: translateY(2px);
      transition: opacity .45s ease, transform .45s ease;
      pointer-events: none;
      user-select: none;
    }
    #sentinelbot-status.is-visible {
      opacity: 0.9;
      transform: translateY(0);
    }
    #sentinelbot-status.is-motto {
      font-style: italic;
      color: #7fcf99;
    }
    #sentinelbot-status.is-hook {
      color: #e6ffe9;
      border-color: rgba(0,255,65,0.55);
    }
    @media (prefers-reduced-motion: reduce) {
      .sentinelbot-online-dot { animation: none; }
      #sentinelbot-status { transition: none; }
    }
    @media (max-width: 560px) {
      #sentinelbot-presence {
        flex-direction: column;
        align-items: flex-end;
        gap: 6px;
      }
      #sentinelbot-status {
        max-width: calc(100vw - 40px);
        white-space: normal;
        font-size: 11px;
      }
    }
    @media (max-width: 360px) {
      #sentinelbot-status { display: none; }
    }
    #sentinelbot-window {
      position: fixed;
      bottom: 70px;
      right: 20px;
      width: 360px;
      max-width: calc(100vw - 40px);
      height: 480px;
      max-height: calc(100vh - 120px);
      background: #000;
      color: #00ff41;
      border: 1px solid #00ff41;
      box-shadow: 0 0 18px rgba(0,255,65,0.35);
      z-index: 9999;
      display: none;
      flex-direction: column;
      font-family: Courier New, monospace;
    }
    #sentinelbot-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px;
      border-bottom: 1px solid #00ff41;
      background: #031b08;
      font-weight: bold;
    }
    #sentinelbot-close {
      background: transparent;
      border: none;
      color: #00ff41;
      font-size: 18px;
      cursor: pointer;
    }
    #sentinelbot-messages {
      flex: 1;
      overflow-y: auto;
      padding: 10px;
      font-size: 14px;
      line-height: 1.45;
    }
    .sentinelbot-msg {
      margin-bottom: 12px;
      white-space: pre-wrap;
    }
    .sentinelbot-user::before {
      content: "> ";
      color: #00ff41;
    }
    .sentinelbot-bot::before {
      content: "// ";
      color: #00ff41;
    }
    .sentinelbot-bot a {
      color: #8fd3ff;
      text-decoration: underline;
      text-underline-offset: 2px;
    }
    .sentinelbot-bot a:hover {
      color: #c5e8ff;
    }
    #sentinelbot-inputbar {
      display: flex;
      gap: 8px;
      padding: 10px;
      border-top: 1px solid #00ff41;
    }
    #sentinelbot-input {
      flex: 1;
      background: #000;
      color: #00ff41;
      border: 1px solid #00ff41;
      padding: 8px;
      font-family: Courier New, monospace;
      outline: none;
    }
    #sentinelbot-send {
      background: #000;
      color: #00ff41;
      border: 1px solid #00ff41;
      padding: 8px 12px;
      cursor: pointer;
      font-family: Courier New, monospace;
    }
  `;
  document.head.appendChild(style);

  const presence = document.createElement("div");
  presence.id = "sentinelbot-presence";

  const statusLine = document.createElement("div");
  statusLine.id = "sentinelbot-status";
  statusLine.setAttribute("role", "status");
  statusLine.setAttribute("aria-live", "polite");

  const launcher = document.createElement("button");
  launcher.id = "sentinelbot-launcher";
  launcher.setAttribute("aria-label", "Open SentinelBot");
  launcher.innerHTML = '<span class="sentinelbot-online-dot" aria-hidden="true"></span><span>SENTINELBOT _</span>';

  presence.appendChild(statusLine);
  presence.appendChild(launcher);

  const win = document.createElement("div");
  win.id = "sentinelbot-window";
  win.innerHTML = `
    <div id="sentinelbot-header">
      <span>SENTINELBOT // SHIELDBEARER</span>
      <button id="sentinelbot-close">×</button>
    </div>
    <div id="sentinelbot-messages"></div>
    <div id="sentinelbot-inputbar">
      <input id="sentinelbot-input" type="text" placeholder="Ask about Shieldbearer..." />
      <button id="sentinelbot-send">Send</button>
    </div>
  `;

  document.body.appendChild(presence);
  document.body.appendChild(win);

  const closeBtn = win.querySelector("#sentinelbot-close");
  const messages = win.querySelector("#sentinelbot-messages");
  const input = win.querySelector("#sentinelbot-input");
  const sendBtn = win.querySelector("#sentinelbot-send");

  /* ---------- Ambient presence layer ----------
     Each tick samples ONE line from a weighted pool: mostly real signals
     pulled from /site.json (already CDN-cached for the rest of the site,
     zero new Lambda/DynamoDB cost), mixed with watchman mottos and
     curiosity hooks. No fixed deck, no repeating loop. Every sample
     avoids the previous line so the rotation feels alive instead of
     looped. Honest-rule: real signals come from real data; mottos are
     clearly stylistic flavor and visually distinct. No invented
     introspection, no fake "thinking" presented as real activity. */

  const SITE_JSON_URL = "/site.json";
  const SITE_REFRESH_MS = 5 * 60 * 1000;
  const ROTATE_MS = 5500;

  // Category weights. Real signals dominate so the layer reads as
  // grounded; hooks get bumped because their job is to pull the visitor
  // into the chat; mottos round out the texture.
  const CATEGORY_WEIGHTS = { real: 60, hook: 25, motto: 15 };

  const MOTTOS = [
    "The watch is kept.",
    "Standing post.",
    "The signal fire is lit.",
    "Watchman on the wall.",
    "Eyes on the horizon.",
    "Sentinels at every gate.",
    "No watchman sleeps tonight.",
    "The wall is manned.",
    "The horn is ready.",
    "Lamp trimmed. Oil full.",
    "Watching the road from the tower.",
    "Bow strung. Eyes open."
  ];

  const CURIOSITY_HOOKS = [
    "Ask me whether your favorite band is an AI band.",
    "Ask me what tools went into this record.",
    "Ask me why they call us an AI band.",
    "Ask me what Shieldbearer is actually about.",
    "Ask me about the latest release.",
    "Ask me what we are working on right now.",
    "Ask me what the Signal Room is.",
    "Ask me which Shieldbearer song hits hardest.",
    "Ask me whether faith and AI can coexist.",
    "Ask me how this all started.",
    "Ask me what scripture is behind the latest song.",
    "Ask me what record I am watching for next.",
    "Ask me who Moncy built me for.",
    "Ask me what a Shieldbearer is."
  ];

  let siteSnapshot = null;
  let rotationTimer = null;
  let lastText = "";

  function pickRandom(arr) {
    if (!arr || !arr.length) return null;
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function pickRandomAvoiding(arr, avoidText) {
    if (!arr || !arr.length) return null;
    if (arr.length === 1) return arr[0];
    let pick = pickRandom(arr);
    let guard = 0;
    while (pick === avoidText && guard < 4) {
      pick = pickRandom(arr);
      guard += 1;
    }
    return pick;
  }

  function pickWeightedCategory(weights) {
    const total = Object.values(weights).reduce((a, b) => a + b, 0);
    let n = Math.random() * total;
    for (const k of Object.keys(weights)) {
      n -= weights[k];
      if (n <= 0) return k;
    }
    return Object.keys(weights)[0];
  }

  function syncedLine(iso) {
    if (!iso) return "";
    const then = Date.parse(iso);
    if (!Number.isFinite(then)) return "";
    const diffMs = Date.now() - then;
    if (diffMs < 60_000) return "Site synced just now.";
    const mins = Math.floor(diffMs / 60_000);
    if (mins < 60) return `Site synced ${mins} minute${mins === 1 ? "" : "s"} ago.`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `Site synced ${hrs} hour${hrs === 1 ? "" : "s"} ago.`;
    const days = Math.floor(hrs / 24);
    return `Site synced ${days} day${days === 1 ? "" : "s"} ago.`;
  }

  function shortAgo(iso) {
    const then = Date.parse(iso || "");
    if (!Number.isFinite(then)) return "";
    const diffMs = Date.now() - then;
    if (diffMs < 60_000) return "moments ago";
    const mins = Math.floor(diffMs / 60_000);
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hr ago`;
    const days = Math.floor(hrs / 24);
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }

  function timeOfDayLine() {
    const h = new Date().getHours();
    const d = new Date().getDay();
    const candidates = [];
    if (h < 5) candidates.push("Late watch. The wall stays manned.");
    if (h >= 5 && h < 7) candidates.push("Pre-dawn watch.");
    if (h >= 7 && h < 12) candidates.push("Morning watch.");
    if (h >= 12 && h < 17) candidates.push("Daylight watch.");
    if (h >= 17 && h < 21) candidates.push("Evening watch.");
    if (h >= 21) candidates.push("Night watch.");
    if (d === 0) candidates.push("Sunday watch.");
    if (d === 6) candidates.push("Sabbath watch.");
    return pickRandom(candidates) || "";
  }

  // Pulls one real signal at random from whatever the snapshot supports.
  // Each call may return a different line, so the visitor sees fresh
  // facts on every tick instead of a fixed loop.
  function sampleRealSignal(snap) {
    if (!snap) return null;

    const slots = [];

    // Watched tracks. The signal[] array is the bot's actual watch list.
    // Surfacing a random title makes the bot feel like it is looking at
    // specific things, not reciting a summary.
    const signalArr = Array.isArray(snap.signal) ? snap.signal : [];
    const namedSignals = signalArr
      .map((s) => s && String(s.title || "").trim())
      .filter((t) => t && t.length && t.length < 60 && !/^test/i.test(t) && !/simulated/i.test(t));
    if (namedSignals.length) {
      slots.push({ w: 22, build: () => `Watching: ${pickRandom(namedSignals)}.` });
    }

    // Released catalogue. Pick a random released title and call it out.
    const releasedArr = Array.isArray(snap.released) ? snap.released : [];
    const namedReleased = releasedArr
      .map((r) => r && String(r.title || "").trim())
      .filter((t) => t && t.length && t.length < 60 && !/simulated/i.test(t));
    if (namedReleased.length) {
      slots.push({ w: 10, build: () => `On the shelf: ${pickRandom(namedReleased)}.` });
    }

    // Recent event from the event log. The publisher writes events[]
    // with stateAfter and publishedAt fields. Honest to surface as a
    // log line because that is literally what it is.
    const eventsArr = Array.isArray(snap.events) ? snap.events : [];
    const recentEvent = eventsArr.find((e) => e && e.eventType && e.publishedAt);
    if (recentEvent) {
      const ago = shortAgo(recentEvent.publishedAt);
      const evType = String(recentEvent.eventType).replace(/_/g, " ").toLowerCase();
      slots.push({ w: 12, build: () => `Last log entry: ${evType}, ${ago}.` });
    }

    // Coming-soon callout if anything is in the pipeline.
    const comingArr = Array.isArray(snap.comingSoon) ? snap.comingSoon : [];
    const namedComing = comingArr
      .map((c) => c && String(c.title || "").trim())
      .filter((t) => t && t.length && t.length < 60);
    if (namedComing.length) {
      slots.push({ w: 14, build: () => `Coming up on the watch: ${pickRandom(namedComing)}.` });
    }

    // Latest release on watch. Featured release title.
    const latest =
      snap.homepage &&
      snap.homepage.featuredRelease &&
      String(snap.homepage.featuredRelease.title || "").trim();
    if (latest) {
      slots.push({ w: 8, build: () => `Latest release on watch: ${latest}.` });
    }

    // Track count.
    const trackCount = Number(snap.signalCount);
    if (Number.isFinite(trackCount) && trackCount > 0) {
      slots.push({
        w: 6,
        build: () => `Watching ${trackCount} track${trackCount === 1 ? "" : "s"}.`
      });
    }

    // Synced time.
    const synced = syncedLine(snap.generatedAt);
    if (synced) slots.push({ w: 5, build: () => synced });

    // YouTube detector status. The release-detector lambda is a real
    // scheduled job. Stating that the channel is being scanned is
    // factual, not flavor.
    slots.push({ w: 5, build: () => "Scanning the channel for new uploads." });

    // Time-of-day awareness. Honest: derived from the visitor's clock.
    const tod = timeOfDayLine();
    if (tod) slots.push({ w: 6, build: () => tod });

    // Quiet-watch line, only if the latest release is older than a week.
    const publishedAt =
      snap.homepage &&
      snap.homepage.featuredRelease &&
      Date.parse(snap.homepage.featuredRelease.publishedAt || "");
    if (Number.isFinite(publishedAt) && (Date.now() - publishedAt) > 7 * 24 * 60 * 60 * 1000) {
      slots.push({ w: 4, build: () => "On watch. No new releases since last check." });
    }

    if (!slots.length) return null;

    // Weighted pick across the slot menu.
    const total = slots.reduce((a, s) => a + s.w, 0);
    let n = Math.random() * total;
    for (const s of slots) {
      n -= s.w;
      if (n <= 0) return s.build();
    }
    return slots[slots.length - 1].build();
  }

  function sampleNext() {
    const cat = pickWeightedCategory(CATEGORY_WEIGHTS);

    if (cat === "real") {
      const real = sampleRealSignal(siteSnapshot);
      if (real && real !== lastText) return { text: real, kind: "real" };
      // No real signal available (site.json failed or just got an exact
      // duplicate). Fall through to a hook so the visitor still gets
      // something fresh.
      return { text: pickRandomAvoiding(CURIOSITY_HOOKS, lastText), kind: "hook" };
    }

    if (cat === "hook") {
      return { text: pickRandomAvoiding(CURIOSITY_HOOKS, lastText), kind: "hook" };
    }

    return { text: pickRandomAvoiding(MOTTOS, lastText), kind: "motto" };
  }

  function setStatusText(item) {
    if (!item || !item.text) return;
    statusLine.textContent = item.text;
    statusLine.classList.toggle("is-motto", item.kind === "motto");
    statusLine.classList.toggle("is-hook", item.kind === "hook");
    statusLine.classList.add("is-visible");
    lastText = item.text;
  }

  function tickRotation() {
    if (isOpen) return; // pause rotation while the chat window is open
    const item = sampleNext();
    if (item && item.text) setStatusText(item);
  }

  async function refreshSiteSnapshot() {
    try {
      const res = await fetch(SITE_JSON_URL, { cache: "no-cache" });
      if (!res.ok) return;
      siteSnapshot = await res.json();
    } catch (err) {
      // Network or parse failure. Ambient layer stays alive on mottos
      // and curiosity hooks. No console noise, no retry storm.
    }
  }

  function startAmbient() {
    if (rotationTimer) return;
    tickRotation();
    rotationTimer = setInterval(tickRotation, ROTATE_MS);
  }

  refreshSiteSnapshot().finally(startAmbient);
  setInterval(refreshSiteSnapshot, SITE_REFRESH_MS);

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function stripMarkdown(text) {
    return String(text || "")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/__(.*?)__/g, "$1")
      .replace(/_(.*?)_/g, "$1")
      .replace(/`(.*?)`/g, "$1")
      .replace(/#{1,6}\s/g, "")
      .replace(/—/g, " "); // em-dash-allow: regex strips em-dashes from bot output
  }

  function formatBotMessage(text) {
    const raw = stripMarkdown(String(text || ""));
    const wrapped = `<div>${raw}</div>`;
    const doc = new DOMParser().parseFromString(wrapped, "text/html");

    function linkifyText(textNode) {
      const fragment = document.createDocumentFragment();
      const text = textNode.nodeValue || "";
      const urlPattern = /((https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/[^\s<]*)?)/g;
      let lastIndex = 0;
      let match;

      while ((match = urlPattern.exec(text)) !== null) {
        if (match.index > lastIndex) {
          fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
        }

        const href = match[1].startsWith("http") ? match[1] : `https://${match[1]}`;
        const anchor = document.createElement("a");
        anchor.href = href;
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";
        anchor.textContent = match[1];
        fragment.appendChild(anchor);
        lastIndex = match.index + match[1].length;
      }

      if (lastIndex < text.length) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
      }

      return fragment;
    }

    function sanitizeNode(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        return linkifyText(node);
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.tagName === "BR") {
          return document.createElement("br");
        }

        if (node.tagName === "A") {
          const anchor = document.createElement("a");
          const href = node.getAttribute("href") || "";
          anchor.href = href.startsWith("http") ? href : `https://${href}`;
          anchor.target = "_blank";
          anchor.rel = "noopener noreferrer";
          anchor.textContent = node.textContent || anchor.href;
          return anchor;
        }

        const fragment = document.createDocumentFragment();
        for (const child of Array.from(node.childNodes)) {
          fragment.appendChild(sanitizeNode(child));
        }
        return fragment;
      }

      return document.createDocumentFragment();
    }

    const out = document.createElement("div");
    for (const child of Array.from(doc.body.firstChild?.childNodes || [])) {
      out.appendChild(sanitizeNode(child));
    }

    return out.innerHTML.replace(/\n/g, "<br>");
  }

  function botHistoryText(text) {
    return stripMarkdown(String(text || ""))
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .trim();
  }

  function renderMessage(text, type) {
    const div = document.createElement("div");
    div.className = `sentinelbot-msg ${type}`;
    if (type === "sentinelbot-bot") {
      div.innerHTML = formatBotMessage(text);
    } else {
      div.textContent = text;
    }
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function buildSignalRoomContext() {
    const model = typeof window !== "undefined" ? window.__SIGNAL_ROOM_MODEL__ : null;
    if (!model || !model.title) return null;
    const firstLines = String(model.lyrics || model.teaserLyrics || "")
      .split(/\r?\n/)
      .filter((line) => line.trim().length)
      .slice(0, 4)
      .join(" / ");
    const meaning = String(model.songMeaning || "").trim();
    return {
      title: model.title,
      firstLines,
      meaning,
      artwork: model.artwork || ""
    };
  }

  function primeSignalRoomHistory() {
    const ctx = buildSignalRoomContext();
    if (!ctx) return false;
    const summaryParts = [`The song currently taking shape in the Signal Room is "${ctx.title}".`];
    if (ctx.firstLines) summaryParts.push(`Opening lines so far: "${ctx.firstLines}".`);
    if (ctx.meaning) summaryParts.push(`What it's about: ${ctx.meaning}`);
    const summary = summaryParts.join(" ");
    history = [
      { role: "user", content: `What song is Shieldbearer writing in the Signal Room right now?` },
      { role: "assistant", content: summary }
    ];
    renderMessage(
      `You are inside the Signal Room. The song on the desk right now is "${ctx.title}". Ask me about the lyrics, the meaning, or anything else about Shieldbearer.`,
      "sentinelbot-bot"
    );
    return true;
  }

  // Map of page paths to the greeting SentinelBot opens with. Both
  // clean URLs (/manifesto) and the legacy .html (/manifesto.html)
  // routes hit the same key. If a page isn't here, we fall through
  // to a generic greeting.
  const PAGE_GREETINGS = {
    "/": "You're on Shieldbearer's home base. Ask about the music, the latest release, the Signal Room, or anything else about the mission.",
    "/about": "You're on the About page. Ask about Moncy, the band's story, or what Shieldbearer stands for.",
    "/story": "You're reading the Shieldbearer story. Ask about the long road behind the music or the path that led here.",
    "/process": "You're on the Process page. Ask how Shieldbearer writes, records, and ships music.",
    "/music": "You're in the Armory. Ask about any track, album, or where to listen.",
    "/videos": "You're on the Signal Fire video page. Ask about any video, single, or release context.",
    "/song-meanings": "You're in the lyrics dossier. Ask about any track's meaning, scripture, or theme.",
    "/timeline": "You're in the Release Archive. Ask about any milestone, release, or year-one moment.",
    "/sentinelbot": "You're on my dossier. Ask what I am, who built me, or how I work.",
    "/manifesto": "You're reading the Shieldbearer Manifesto. Ask what we stand for or why we built it this way.",
    "/creed": "You're reading the Shieldbearer Creed. Ask what we stand on or why.",
    "/gospel": "You're reading the Gospel statement. Ask what Shieldbearer means by the Good News.",
    "/open-letter": "You're reading the Open Letter. Ask what it answers or who it's addressed to.",
    "/faq": "FAQ page. Ask anything about Shieldbearer, the music, or the mission.",
    "/contact": "Contact page. Booking, collaboration, press, listener mail. Ask what's on your mind.",
    "/epk": "Press Kit. Ask about media coverage, embeddable content, or downloads.",
    "/interviews": "Press archive. Ask about an interview or coverage feature.",
    "/for-ai-artists": "For AI Artists. Ask why Shieldbearer welcomes AI tools or what the line is between use and gimmick.",
    "/ai-and-creativity": "AI and Creativity essay. Ask why AI doesn't replace the artist and what it does instead.",
    "/god-uses-tools": "God Uses Tools essay. Ask why instruments don't compromise the message.",
    "/no-rulebook": "No Rulebook essay. Ask about the freedom Shieldbearer claims for AI in worship.",
    "/artist-freedom": "Artist Freedom essay. Ask about creative liberty under conviction.",
    "/gatekeeping": "On Gatekeeping essay. Ask why permission isn't required to make music for Christ.",
  };

  function primePageGreeting() {
    const raw = (window.location && window.location.pathname || "/").replace(/\/$/, "") || "/";
    // Normalise legacy .html routes back to clean keys.
    const key = raw === "" ? "/" : raw.replace(/\.html$/, "");
    const greeting = PAGE_GREETINGS[key] ||
      "Ask about Shieldbearer, the music, the mission, or any of the writings on this site.";
    renderMessage(greeting, "sentinelbot-bot");
  }

  function primeOpeningHistory() {
    // Signal Room gets its rich greeting first; otherwise pick by path.
    if (!primeSignalRoomHistory()) primePageGreeting();
  }

  function toggleWindow() {
    isOpen = !isOpen;
    win.style.display = isOpen ? "flex" : "none";
    if (isOpen) {
      track("sentinelbot_open", { from_path: window.location.pathname });
      statusLine.classList.remove("is-visible");
      if (history.length === 0 && messages.childElementCount === 0) {
        primeOpeningHistory();
      }
      input.focus();
    }
    if (!isOpen) {
      history = [];
      messages.innerHTML = "";
      tickRotation();
    }
  }

  async function sendMessage() {
    const question = input.value.trim();
    if (!question) return;

    track("sentinelbot_question", { from_path: window.location.pathname });
    renderMessage(question, "sentinelbot-user");
    input.value = "";
    input.disabled = true;
    sendBtn.disabled = true;

    const thinking = document.createElement("div");
    thinking.className = "sentinelbot-msg sentinelbot-bot";
    thinking.textContent = "processing signal";
    messages.appendChild(thinking);
    messages.scrollTop = messages.scrollHeight;

    let dots = 0;
    const interval = setInterval(() => {
      dots = (dots + 1) % 4;
      thinking.textContent = "processing signal" + ".".repeat(dots);
    }, 300);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          history,
          page: window.location.pathname
        })
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      const answer = data.answer || data.error || "Signal lost. Try again.";

      const delay = Math.min(800 + answer.length * 5, 2000);

      history.push({ role: "user", content: question });
      history.push({ role: "assistant", content: botHistoryText(answer) });
      history = history.slice(-10);

      setTimeout(() => {
        clearInterval(interval);
        thinking.remove();
        renderMessage(answer, "sentinelbot-bot");
        input.disabled = false;
        sendBtn.disabled = false;
        input.focus();
      }, delay);

    } catch (err) {
      clearInterval(interval);
      thinking.remove();
      renderMessage("Signal lost. Try again.", "sentinelbot-bot");
      input.disabled = false;
      sendBtn.disabled = false;
      input.focus();
      console.error(err);
    }
  }

  launcher.addEventListener("click", toggleWindow);
  closeBtn.addEventListener("click", toggleWindow);
  sendBtn.addEventListener("click", sendMessage);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage();
  });
})();

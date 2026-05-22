/* =============================================================
   Scripture reference linker.

   Scans article content regions (NOT nav, footer, the
   SentinelBot widget, or other chrome) and wraps every
   `Book Chapter:Verse` style reference in an anchor that opens
   the verse on BibleGateway in the ESV translation in a new tab.

   Activation: add `data-scripture-links` (or class
   `scripture-linked`) to any element whose descendants should
   have refs auto-linked. The script walks that subtree, finds
   text matching the reference regex, and rewrites only the
   matched substrings. Existing anchors are left alone so the
   script is safe to re-run.

   Patterns supported:
     - "Joshua 1:9"
     - "1 Corinthians 13:4"
     - "Psalm 23:1-3"     (verse range)
     - "John 3:16, 17"    (sibling verse list -- only first ref linked)
     - "Genesis 1:1; 2:4" (semicolon list -- only first ref linked)

   The regex is anchored to a curated book list so it cannot
   false-match unrelated `Word 1:1` patterns (e.g. ratios,
   timestamps, score lines like "won 1:0").

   Translation override: set `window.SHIELDBEARER_CONFIG.scripture.version`
   to any BibleGateway version code ("NIV", "KJV", "NLT", "NKJV",
   etc.). Default is "ESV".
   ============================================================= */
(function () {
  // Books in canonical order. Including books used in your
  // current site refs plus the rest of the protestant canon so
  // you can add references anywhere without revisiting the list.
  var BOOKS = [
    // Old Testament
    "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy",
    "Joshua", "Judges", "Ruth",
    "1 Samuel", "2 Samuel", "1 Kings", "2 Kings",
    "1 Chronicles", "2 Chronicles",
    "Ezra", "Nehemiah", "Esther", "Job", "Psalm", "Psalms",
    "Proverbs", "Ecclesiastes",
    "Song of Solomon", "Song of Songs",
    "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel",
    "Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah",
    "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi",
    // New Testament
    "Matthew", "Mark", "Luke", "John", "Acts", "Romans",
    "1 Corinthians", "2 Corinthians",
    "Galatians", "Ephesians", "Philippians", "Colossians",
    "1 Thessalonians", "2 Thessalonians",
    "1 Timothy", "2 Timothy",
    "Titus", "Philemon", "Hebrews", "James",
    "1 Peter", "2 Peter",
    "1 John", "2 John", "3 John",
    "Jude", "Revelation"
  ];

  // Sort by length desc so "1 Corinthians" matches before "Corinthians"
  // and "Song of Songs" matches before "Song". RegExp alternation is
  // first-match-wins per left-to-right.
  var bookPattern = BOOKS
    .slice()
    .sort(function (a, b) { return b.length - a.length; })
    .map(function (b) { return b.replace(/ /g, "\\s+"); })
    .join("|");

  // Match: <book><space(s)><chapter>[:<verse>][-<chapter-or-verse>[:<verse>]][verse-letter]
  // Examples:
  //   "Psalm 23:1"             chapter + verse
  //   "Psalm 119:105"          chapter + verse
  //   "1 Corinthians 13:4-7"   verse range within chapter
  //   "Numbers 23-24"          chapter range, no verses
  //   "Acts 15"                whole chapter
  //   "Romans 5:12a"           verse with letter suffix
  //   "Numbers 23:1-24:5"      cross-chapter verse range
  // Capture group 1 = full reference; we keep it as a single block.
  var refRegex = new RegExp(
    "(" +
      "(?:" + bookPattern + ")" +
      "\\s+\\d{1,3}" +                          // chapter (required)
      "(?::\\d{1,3})?" +                        // optional :verse
      "(?:-\\d{1,3}(?::\\d{1,3})?)?" +          // optional -endChapter[:endVerse] OR -endVerse
      "[a-z]?" +                                // optional verse-letter
    ")",
    "g"
  );

  var cfg = (window.SHIELDBEARER_CONFIG && window.SHIELDBEARER_CONFIG.scripture) || {};
  var VERSION = String(cfg.version || "ESV").toUpperCase();
  var BASE = "https://www.biblegateway.com/passage/?search=";

  function buildHref(ref) {
    var search = encodeURIComponent(ref.replace(/\s+/g, " ").trim());
    return BASE + search + "&version=" + encodeURIComponent(VERSION);
  }

  // Skip text inside these tags: existing anchors (already linked),
  // script/style, and elements that opted out via .no-scripture-link.
  function shouldSkipElement(el) {
    if (!el || el.nodeType !== 1) return false;
    var tag = el.tagName;
    if (tag === "A" || tag === "SCRIPT" || tag === "STYLE" || tag === "CODE" || tag === "PRE") return true;
    if (el.classList && el.classList.contains("no-scripture-link")) return true;
    return false;
  }

  function walkAndLink(root) {
    if (!root) return;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        // Bail on text inside skipped ancestors.
        var p = node.parentNode;
        while (p && p !== root) {
          if (shouldSkipElement(p)) return NodeFilter.FILTER_REJECT;
          p = p.parentNode;
        }
        // Cheap pre-check: text must contain at least one digit. Used
        // to also require digit-colon-digit, but that excluded
        // chapter-range and chapter-only refs like "Numbers 23-24"
        // and "Acts 15" that the regex DOES match. The regex itself
        // is anchored to book names so false matches stay impossible.
        if (!/\d/.test(node.nodeValue)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    var toProcess = [];
    var n;
    while ((n = walker.nextNode())) toProcess.push(n);

    for (var i = 0; i < toProcess.length; i++) {
      replaceInTextNode(toProcess[i]);
    }
  }

  function replaceInTextNode(textNode) {
    var text = textNode.nodeValue;
    refRegex.lastIndex = 0;
    if (!refRegex.test(text)) return;
    refRegex.lastIndex = 0;

    var parent = textNode.parentNode;
    if (!parent) return;

    var frag = document.createDocumentFragment();
    var lastIdx = 0;
    var m;
    var anyMatch = false;
    while ((m = refRegex.exec(text)) !== null) {
      anyMatch = true;
      var ref = m[1];
      var start = m.index;
      var end = start + ref.length;
      if (start > lastIdx) {
        frag.appendChild(document.createTextNode(text.slice(lastIdx, start)));
      }
      var a = document.createElement("a");
      a.href = buildHref(ref);
      a.target = "_blank";
      a.rel = "noopener";
      a.className = "scripture-link";
      a.textContent = ref;
      a.setAttribute("data-version", VERSION);
      a.setAttribute("title", "Read " + ref + " (" + VERSION + ") on BibleGateway");
      frag.appendChild(a);
      lastIdx = end;
    }
    if (!anyMatch) return;
    if (lastIdx < text.length) {
      frag.appendChild(document.createTextNode(text.slice(lastIdx)));
    }
    parent.replaceChild(frag, textNode);
  }

  function rootSelector() {
    return "[data-scripture-links], .scripture-linked";
  }

  // Debounced re-scan triggered by DOM mutations. Pages like
  // /song-meanings, the homepage featured-track card, and the
  // /admin tools all render content async after DOMContentLoaded,
  // so we need to catch refs that arrive later.
  var rescanTimer = null;
  function scheduleRescan() {
    if (rescanTimer) return;
    rescanTimer = setTimeout(function () {
      rescanTimer = null;
      run();
    }, 200);
  }

  function attachObservers() {
    if (typeof MutationObserver !== "function") return;
    var roots = document.querySelectorAll(rootSelector());
    for (var i = 0; i < roots.length; i++) {
      var obs = new MutationObserver(function (mutations) {
        // Only care about added DOM. Attribute/character changes don't
        // typically inject scripture refs.
        for (var j = 0; j < mutations.length; j++) {
          if (mutations[j].addedNodes && mutations[j].addedNodes.length) {
            scheduleRescan();
            return;
          }
        }
      });
      obs.observe(roots[i], { childList: true, subtree: true });
    }
  }

  // Second pass: existing <a> tags that already link to BibleGateway
  // (e.g. the manually-curated KJV citations on /gatekeeping) need
  // the .scripture-link class so the gold unmissable styling applies
  // to them too. We do NOT rewrite their hrefs -- the page's
  // intentional translation choice is preserved -- we only restyle.
  function styleExistingBibleAnchors(root) {
    if (!root) return;
    var anchors = root.querySelectorAll("a[href*='biblegateway.com']");
    for (var i = 0; i < anchors.length; i++) {
      var a = anchors[i];
      if (a.classList.contains("scripture-link")) continue;
      a.classList.add("scripture-link");
      // Make sure these open in a new tab too.
      if (!a.target) a.target = "_blank";
      if (!a.rel) a.rel = "noopener";
    }
  }

  function run() {
    var roots = document.querySelectorAll(rootSelector());
    for (var i = 0; i < roots.length; i++) {
      walkAndLink(roots[i]);
      styleExistingBibleAnchors(roots[i]);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      run();
      attachObservers();
    });
  } else {
    run();
    attachObservers();
  }
})();

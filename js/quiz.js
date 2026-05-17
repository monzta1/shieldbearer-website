/* =============================================================
   ARE YOU AN AI BAND. Quiz engine.

   Vanilla JS, no framework, matches the rest of the static site.
   State lives in memory and the URL hash so a refresh keeps you
   on the same screen. Logging is best effort and never blocks the
   quiz. The share card is drawn client side with Canvas, so there
   is no image server and no cost.

   Screens: landing -> quiz -> result
   Paths:   musician, listener (10 questions each, scored 0 to 10)
   ============================================================= */
(function () {
  "use strict";

  var SITE_URL = "shieldbearerusa.com/are-you-an-ai-band";
  var SHARE_URL = "https://shieldbearerusa.com/are-you-an-ai-band";

  /* ---- Question banks -------------------------------------------------
     Each question:
       id       stable identifier logged with the submission
       category scoring bucket shown in the result breakdown
       q        the question text
       type     "yesno" or "choice"
       options  for "choice": [{ label, ai }]; ai:true scores a point
       yesScores for "yesno": true if "Yes" is the AI-affirming answer
       reveal   one or two sentences shown after answering
       why      musician path only: the technical justification behind
                the "Why is this AI?" expander
     ------------------------------------------------------------------- */

  var MUSICIAN = [
    {
      id: "m1", category: "Drums", type: "yesno", yesScores: true,
      q: "When you track drums, does Slate Trigger, Superior Drummer, GetGood, or EZdrummer touch them at any stage?",
      reveal: "Trigger fires samples by detecting transients with a trained model. Superior Drummer and EZdrummer are sample libraries driven by velocity and behavior modeling. Machine learning is deciding what your kit sounds like.",
      why: "Transient detection is a classifier. It learns what a hit looks like in the waveform and triggers a sample on a confidence threshold. That is pattern recognition, the core mechanic of machine learning."
    },
    {
      id: "m2", category: "Vocals", type: "yesno", yesScores: true,
      q: "Be honest. Has a lead vocal you released ever been through Melodyne or Auto-Tune, even for a couple of notes?",
      reveal: "Melodyne analyzes pitch, formants, and timing, then rebuilds the note. Auto-Tune runs continuous pitch estimation. The final performance is machine reconstructed.",
      why: "Melodyne's engine separates and re-synthesizes pitch content with trained signal models. The algorithm decides the final pitch, the formant shape, and the timing of the note you keep."
    },
    {
      id: "m3", category: "Guitar", type: "choice",
      q: "Your main rhythm tone. What is actually in the chain?",
      options: [
        { label: "Kemper profile", ai: true },
        { label: "Quad Cortex capture", ai: true },
        { label: "Neural DSP or Tonex", ai: true },
        { label: "Real amp, mic'd, no captures", ai: false }
      ],
      reveal: "Kemper, Quad Cortex, Neural DSP, and Tonex are neural networks trained to predict the behavior of a real amp. The profile is a model.",
      why: "A capture trains a neural network on the input and output of a real amp until it predicts the amp's nonlinear response. That is supervised machine learning, shipped as a preset."
    },
    {
      id: "m4", category: "Mastering", type: "yesno", yesScores: true,
      q: "Final master. Did iZotope Ozone, Gullfoss, or any assistant-mode plugin touch it?",
      reveal: "Ozone's assistant listens to your mix and proposes a chain. Gullfoss makes thousands of corrective decisions a second from a trained model of balanced sound.",
      why: "Ozone's Master Assistant runs a trained model that classifies your audio and selects targets. Gullfoss is a real-time decision engine fed by a learned reference. Both are AI making mix calls for you."
    },
    {
      id: "m5", category: "Production", type: "choice",
      q: "Which is closest to how you record?",
      options: [
        { label: "Logic Pro 11, Pro Tools 2024+, Cubase 13+, Ableton 12, or FL Studio 21 (current versions)", ai: true },
        { label: "Reaper, or an older version of any of the above", ai: false },
        { label: "Fully analog. Tape, hardware mixer, no DAW at any stage.", ai: false }
      ],
      reveal: "Modern DAW versions ship with ML features running by default.",
      optionReveals: [
        "Modern DAW versions ship with ML features running by default. Logic 11's Drummer is ML. Pro Tools 2024 has ML stem separation. Ableton 12's drum sampler uses ML. FL Studio's mastering uses ML. If you updated your DAW in the last two years, AI is running whether you opted in or not. The developer opted you in before you installed it.",
        "Respect. Older DAWs and minimalist tools like Reaper genuinely do not ship with ML by default. You are in a smaller club than you think.",
        "A genuine analog purist exists in 2026 and we salute you. You are not the audience this quiz was built for. You are welcome here anyway."
      ],
      optionWhy: [
        "Logic Pro 11's Drummer feature uses a machine learning model trained on real drummers to generate fills and variations. Pro Tools 2024+ ships with ML stem separation that uses trained neural networks to isolate vocals, drums, and bass from a mix. Ableton 12's Drum Sampler uses ML to assign samples to drum pads based on transient classification. FL Studio's mastering plugin uses ML for spectral analysis and dynamic balancing. Cubase 13's vocal alignment uses trained models for timing correction. None of these require the user to enable AI features. They ship enabled by default.",
        null,
        null
      ]
    },
    {
      id: "m6", category: "Production", type: "yesno", yesScores: true,
      q: "Sample libraries. Kontakt, Omnisphere, or an orchestral suite on your last release?",
      reveal: "Modern sample instruments use round robins, articulation logic, and behavior modeling so the part reads as human. You are conducting a programmed model of a player.",
      why: "Libraries like Kontakt, Spitfire, and Orchestral Tools script their realism with round robins and articulation rules. It is a built model of how a player behaves, standing in for the player. The instrument is making the performance choices for you."
    },
    {
      id: "m7", category: "Guitar", type: "yesno", yesScores: true,
      q: "Deep cut. Have you ever printed a DI, reamped it through a neural capture instead of a real head, and listed the real amp in the credits?",
      reveal: "A reamp through a capture is a model generating your tone after the fact. The DI was a real performance. The amp on the record was a forward pass through a network.",
      why: "The capture predicts the amp's response to any input. Sending a DI through it is inference. The tone credited to a real head is the output of a trained model running on your interface."
    },
    {
      id: "m8", category: "Vocals", type: "yesno", yesScores: true,
      q: "Deep cut. Have you ever built a harmony stack by transposing one take in Melodyne and blending it under the lead?",
      reveal: "That harmony singer is one performance, re-pitched and re-synthesized by an algorithm. You produced a choir out of a model.",
      why: "Transposing in Melodyne re-synthesizes pitch and formants from a learned voice model. Every part in that stack is algorithm output, not a second person at a mic."
    },
    {
      id: "m9", category: "Discovery", type: "choice",
      q: "Your last few hundred new listeners. How did they actually find you?",
      options: [
        { label: "Spotify algorithmic playlists", ai: true },
        { label: "YouTube suggested videos", ai: true },
        { label: "A social feed put it there", ai: true },
        { label: "Word of mouth and live shows only", ai: false }
      ],
      reveal: "Recommendation engines are machine learning. If a feed put your music in front of someone, AI selected your audience for you.",
      why: "Spotify and YouTube recommendations are trained ranking models. Your reach has been shaped by AI whether or not you ever opened a plugin."
    },
    {
      id: "m10", category: "Production", type: "yesno", yesScores: false,
      q: "Knowing all of that, would you still tell a crowd from the stage that there are no computers and no AI on this music, just real playing?",
      reveal: "Every answer above was a machine learning system. The honest position holds that the tools were always there and the only new thing is that they are visible.",
      why: "This question scores the opposite way on purpose. Saying you would still make that claim is the exact gap the quiz exists to surface. Saying you would not is honesty about the work."
    }
  ];

  var LISTENER = [
    {
      id: "l1", category: "Discovery", type: "yesno", yesScores: true,
      q: "Has Spotify, YouTube, or your feed ever introduced you to a song you ended up loving?",
      reveal: "That introduction was a recommendation model. An algorithm learned your taste and made the call. AI has been building your worship playlist for years."
    },
    {
      id: "l2", category: "Vocals", type: "yesno", yesScores: true,
      q: "Have you ever been moved to tears by a worship song with flawless, soaring vocals?",
      reveal: "Flawless modern vocals are almost always shaped with Melodyne or Auto-Tune. The performance that broke you open was touched by pitch software."
    },
    {
      id: "l3", category: "Worship", type: "yesno", yesScores: true,
      q: "Have you sung Holy Forever, Gratitude, or anything off a major worship record in the last year?",
      reveal: "Those records were tracked to a click, edited on a grid, tuned, sampled, and AI-assisted in mastering. You have been worshipping with these tools the whole time."
    },
    {
      id: "l4", category: "Drums", type: "choice",
      q: "When the drums on your favorite worship track land perfectly in the pocket every time, what do you think happened?",
      options: [
        { label: "All human, untouched", ai: false },
        { label: "Probably edited and tightened", ai: true },
        { label: "Never thought about it", ai: true }
      ],
      reveal: "Those drums were triggered, sample reinforced, and quantized. Modern drum replacement like Slate Trigger 2 uses trained models to do it. The pocket was assisted."
    },
    {
      id: "l5", category: "Mastering", type: "yesno", yesScores: true,
      q: "Do your favorite albums sound loud, clear, and polished on cheap earbuds and a car stereo alike?",
      reveal: "That consistency comes from AI-assisted mastering like Ozone and smart limiters. A trained model balanced what you are hearing."
    },
    {
      id: "l6", category: "Guitar", type: "yesno", yesScores: true,
      q: "Have you ever heard a massive guitar tone and assumed it was a wall of real amps?",
      reveal: "Most modern big tones are Kemper, Quad Cortex, or Neural DSP. Those are neural networks trained on real amps. The wall of sound was a model."
    },
    {
      id: "l7", category: "Discovery", type: "yesno", yesScores: true,
      q: "Has autoplay ever kept you in a worship set for an hour without you choosing a single next song?",
      reveal: "Autoplay is a recommendation engine running continuously. AI built that hour of worship for you in real time."
    },
    {
      id: "l8", category: "Vocals", type: "yesno", yesScores: true,
      q: "Have you ever replayed a live worship video because it sounded better than the room could have?",
      reveal: "Live worship releases are commonly tuned and sweetened after the fact. The version you replay was touched by the same tools."
    },
    {
      id: "l9", category: "Worship", type: "yesno", yesScores: true,
      q: "Do you believe a song can carry the gospel even if software touched the recording?",
      reveal: "Most people say yes here, and that answer is the whole point. The message was never in the tool. It was in the truth being declared."
    },
    {
      id: "l10", category: "Worship", type: "yesno", yesScores: false,
      q: "Knowing all this, would you still tell an artist their AI-assisted song does not count as real worship?",
      reveal: "Say no and you already stand with the manifesto. Say yes and the same tools were inside every song that ever moved you. The line was never the tools."
    }
  ];

  var BANKS = { musician: MUSICIAN, listener: LISTENER };

  /* ---- Scoring categories -------------------------------------------- */
  var CATEGORIES = [
    { min: 0, max: 2, name: "The Purist (or recently arrived from 1962)",
      desc: "Either you track to tape in a cabin with no internet, or you have not looked closely at how a single record you love was made. Both are rare. One is honest." },
    { min: 3, max: 5, name: "The Casual (you have been told the story and believed it)",
      desc: "You took the purity story at face value. No shame in it. The people who sold it to you were using every tool on this list while they said it." },
    { min: 6, max: 8, name: "The Suspect (you have used the tools and probably argued about them online)",
      desc: "You know your way around a session. The math says you have leaned on machine learning more than once. The honest move is to own it and extend the same grace to everyone else." },
    { min: 9, max: 10, name: "Congratulations, you're an AI band",
      desc: "Welcome to the club. Most of your favorite records are already in it. By the gatekeepers' own standard, you are the thing they warn about. You always were. So was every record they praised. The standard was never the tools. It was whether you could see them." }
  ];

  function categoryFor(score) {
    for (var i = 0; i < CATEGORIES.length; i++) {
      if (score >= CATEGORIES[i].min && score <= CATEGORIES[i].max) return CATEGORIES[i];
    }
    return CATEGORIES[CATEGORIES.length - 1];
  }

  /* ---- State --------------------------------------------------------- */
  var state = { path: null, index: 0, answers: [], score: 0 };

  function el(id) { return document.getElementById(id); }

  function screens(name) {
    ["screen-landing", "screen-quiz", "screen-result"].forEach(function (s) {
      var node = el(s);
      if (node) node.hidden = (s !== "screen-" + name);
    });
    window.scrollTo(0, 0);
  }

  /* ---- Landing ------------------------------------------------------- */
  function startPath(path) {
    state.path = path;
    state.index = 0;
    state.answers = [];
    state.score = 0;
    location.hash = "quiz-" + path;
    renderQuestion();
    screens("quiz");
  }

  /* ---- Quiz ---------------------------------------------------------- */
  function renderQuestion() {
    var bank = BANKS[state.path];
    var item = bank[state.index];
    var total = bank.length;
    var pathLabel = state.path === "musician" ? "Musician path" : "Listener path";

    var html = "";
    html += '<div class="quiz-progress">' + pathLabel + ' &middot; Question ' +
            (state.index + 1) + ' of ' + total + '</div>';
    html += '<div class="quiz-bar"><span style="width:' +
            (((state.index) / total) * 100) + '%"></span></div>';
    html += '<h2 class="quiz-q">' + escapeHtml(item.q) + '</h2>';
    html += '<div class="quiz-options" id="quizOptions">';

    if (item.type === "yesno") {
      html += optionButton("Yes", "yes");
      html += optionButton("No", "no");
    } else {
      for (var i = 0; i < item.options.length; i++) {
        html += optionButton(item.options[i].label, "c" + i);
      }
    }
    html += '</div>';

    if (state.path === "musician" && item.why) {
      html += '<details class="quiz-why"><summary>Why is this AI? Click to expand</summary>' +
              '<p>' + escapeHtml(item.why) + '</p></details>';
    }

    html += '<div class="quiz-reveal" id="quizReveal" hidden>' +
            '<p id="quizRevealText"></p>' +
            '<div id="quizRevealWhy"></div>' +
            '<button class="btn btn--red" id="quizNext">' +
            (state.index + 1 === total ? "See my result" : "Next question") +
            '</button></div>';

    el("quizCard").innerHTML = html;

    var opts = el("quizOptions");
    opts.addEventListener("click", function (e) {
      var btn = e.target.closest("button[data-val]");
      if (!btn) return;
      answer(btn.getAttribute("data-val"), btn);
    });
  }

  function optionButton(label, val) {
    return '<button class="quiz-opt" data-val="' + val + '">' +
           escapeHtml(label) + '</button>';
  }

  function answer(val, btn) {
    var bank = BANKS[state.path];
    var item = bank[state.index];

    var buttons = el("quizOptions").querySelectorAll("button");
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].disabled = true;
      buttons[i].classList.remove("is-picked");
    }
    btn.classList.add("is-picked");

    var earned = 0;
    var answerLabel = "";
    var idx = -1;
    if (item.type === "yesno") {
      var saidYes = (val === "yes");
      answerLabel = saidYes ? "Yes" : "No";
      earned = (saidYes === item.yesScores) ? 1 : 0;
    } else {
      idx = parseInt(val.substring(1), 10);
      var opt = item.options[idx];
      answerLabel = opt.label;
      earned = opt.ai ? 1 : 0;
    }

    state.score += earned;
    state.answers.push({ question_id: item.id, answer: answerLabel });

    var reveal = el("quizReveal");
    var revealText = item.reveal;
    if (idx >= 0 && Array.isArray(item.optionReveals) && item.optionReveals[idx]) {
      revealText = item.optionReveals[idx];
    }
    el("quizRevealText").textContent = revealText;

    // Conditional "Why is this AI?" expander. Used by questions with
    // per-option justifications (musician path only). Questions with a
    // global item.why render their expander before answering instead.
    var whyBox = el("quizRevealWhy");
    whyBox.innerHTML = "";
    if (state.path === "musician" && idx >= 0 &&
        Array.isArray(item.optionWhy) && item.optionWhy[idx]) {
      var d = document.createElement("details");
      d.className = "quiz-why";
      var s = document.createElement("summary");
      s.textContent = "Why is this AI? Click to expand";
      var p = document.createElement("p");
      p.textContent = item.optionWhy[idx];
      d.appendChild(s);
      d.appendChild(p);
      whyBox.appendChild(d);
    }
    reveal.hidden = false;

    var next = el("quizNext");
    next.addEventListener("click", function () {
      if (state.index + 1 === bank.length) {
        finish();
      } else {
        state.index += 1;
        renderQuestion();
      }
    }, { once: true });
    reveal.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  /* ---- Result -------------------------------------------------------- */
  function finish() {
    var cat = categoryFor(state.score);
    location.hash = "result-" + state.path;
    renderResult(cat);
    screens("result");
    logSubmission(cat);
  }

  function breakdown() {
    var bank = BANKS[state.path];
    var byCat = {};
    for (var i = 0; i < state.answers.length; i++) {
      var item = bank[i];
      var a = state.answers[i];
      var scored;
      if (item.type === "yesno") {
        scored = ((a.answer === "Yes") === item.yesScores);
      } else {
        scored = false;
        for (var k = 0; k < item.options.length; k++) {
          if (item.options[k].label === a.answer) scored = !!item.options[k].ai;
        }
      }
      if (!byCat[item.category]) byCat[item.category] = { hit: 0, total: 0 };
      byCat[item.category].total += 1;
      if (scored) byCat[item.category].hit += 1;
    }
    return byCat;
  }

  function renderResult(cat) {
    var other = state.path === "musician" ? "listener" : "musician";
    var bd = breakdown();
    var rows = "";
    Object.keys(bd).forEach(function (c) {
      rows += '<li><span class="bd-cat">' + escapeHtml(c) + '</span>' +
              '<span class="bd-val">' + bd[c].hit + ' of ' + bd[c].total + '</span></li>';
    });

    var html = "";
    html += '<div class="result-score">' + state.score + '<span>/ 10</span></div>';
    html += '<h2 class="result-cat">' + escapeHtml(cat.name) + '</h2>';
    html += '<p class="result-desc">' + escapeHtml(cat.desc) + '</p>';
    html += '<h3 class="result-sub">What you admitted to</h3>';
    html += '<ul class="result-breakdown">' + rows + '</ul>';

    html += '<div class="result-actions">';
    html += '<button class="btn btn--red" id="dlCard">Download your share card</button>';
    html += '<button class="btn btn--ghost" id="swapPath">Take the ' + other + ' quiz</button>';
    html += '<a href="/manifesto" class="btn btn--ghost">Read the Manifesto</a>';
    html += '<a href="https://open.spotify.com/artist/1qxEc4mWmJQY0YjP11L0fG" target="_blank" rel="noopener" class="btn btn--ghost">Listen on Spotify</a>';
    html += '</div>';

    html += '<div class="result-share">';
    html += '<p class="result-share__copy" id="shareCopy"></p>';
    html += '<div class="result-share__btns">';
    html += '<a class="btn btn--ghost" id="shFb" target="_blank" rel="noopener">Facebook</a>';
    html += '<a class="btn btn--ghost" id="shX" target="_blank" rel="noopener">X</a>';
    html += '<button class="btn btn--ghost" id="shCopy">Copy text</button>';
    html += '</div></div>';

    html += '<div class="result-punch">';
    html += '<p>The line was never drawn at AI. It was drawn at AI you can see.</p>';
    html += '</div>';

    el("resultCard").innerHTML = html;

    var shareText = "I took the Are You An AI Band? quiz and scored " +
      state.score + ". " + cat.name +
      ". Find out where you stand: " + SITE_URL;
    el("shareCopy").textContent = shareText;

    el("shFb").href = "https://www.facebook.com/sharer/sharer.php?u=" +
      encodeURIComponent(SHARE_URL);
    el("shX").href = "https://twitter.com/intent/tweet?text=" +
      encodeURIComponent(shareText);

    el("shCopy").addEventListener("click", function () {
      copyText(shareText, el("shCopy"));
      markShared(cat);
    });
    el("shFb").addEventListener("click", function () { markShared(cat); });
    el("shX").addEventListener("click", function () { markShared(cat); });

    el("dlCard").addEventListener("click", function () {
      downloadCard(state.score, cat.name);
      markShared(cat);
    });
    el("swapPath").addEventListener("click", function () {
      startPath(other);
    });
  }

  /* ---- Share card (client side Canvas, no server) -------------------- */
  function drawCard(score, catName) {
    var W = 1200, H = 630;
    var c = document.createElement("canvas");
    c.width = W; c.height = H;
    var x = c.getContext("2d");

    x.fillStyle = "#040404";
    x.fillRect(0, 0, W, H);

    x.strokeStyle = "#c0392b";
    x.lineWidth = 6;
    x.strokeRect(24, 24, W - 48, H - 48);

    x.fillStyle = "#c0392b";
    x.fillRect(24, 24, W - 48, 12);

    x.textAlign = "center";

    x.fillStyle = "#a8a29a";
    x.font = "600 30px Oswald, sans-serif";
    x.fillText("ARE YOU AN AI BAND?", W / 2, 150);

    x.fillStyle = "#f0ebe0";
    x.font = "700 220px 'Bebas Neue', Oswald, sans-serif";
    x.fillText(score + " / 10", W / 2, 360);

    x.fillStyle = "#e74c3c";
    x.font = "600 40px Oswald, sans-serif";
    wrapText(x, catName, W / 2, 440, W - 200, 48);

    x.fillStyle = "#a8a29a";
    x.font = "400 26px 'Roboto Condensed', sans-serif";
    x.fillText(SITE_URL, W / 2, H - 70);

    x.fillStyle = "#c0392b";
    x.font = "700 34px 'Bebas Neue', Oswald, sans-serif";
    x.fillText("SHIELDBEARER", W / 2, 100);

    return c;
  }

  function wrapText(ctx, text, cx, cy, maxW, lh) {
    var words = String(text).split(" ");
    var line = "", lines = [];
    for (var i = 0; i < words.length; i++) {
      var test = line ? line + " " + words[i] : words[i];
      if (ctx.measureText(test).width > maxW && line) {
        lines.push(line); line = words[i];
      } else { line = test; }
    }
    if (line) lines.push(line);
    var startY = cy - ((lines.length - 1) * lh) / 2;
    for (var j = 0; j < lines.length; j++) {
      ctx.fillText(lines[j], cx, startY + j * lh);
    }
  }

  function downloadCard(score, catName) {
    var canvas = drawCard(score, catName);
    canvas.toBlob(function (blob) {
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = "are-you-an-ai-band-" + score + ".png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    }, "image/png");
  }

  /* ---- Logging (best effort, never blocks) --------------------------- */
  function quizApi() {
    try {
      return (window.SHIELDBEARER_CONFIG &&
              window.SHIELDBEARER_CONFIG.quiz &&
              window.SHIELDBEARER_CONFIG.quiz.apiUrl) || "";
    } catch (e) { return ""; }
  }

  function logSubmission(cat) {
    var api = quizApi();
    if (!api) return;
    var payload = {
      path: state.path,
      answers: state.answers,
      score: state.score,
      category: cat.name,
      shared: false,
      user_agent: navigator.userAgent
    };
    var emailField = el("quizEmail");
    if (emailField && emailField.value && emailField.value.indexOf("@") > 0) {
      payload.email = emailField.value.trim();
    }
    fetch(api, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true
    }).then(function (r) {
      return r.ok ? r.json() : null;
    }).then(function (data) {
      if (data && data.submission_id) state.submissionId = data.submission_id;
    }).catch(function () { /* logging is optional */ });
  }

  function markShared(cat) {
    var api = quizApi();
    if (!api || !state.submissionId) return;
    fetch(api, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submission_id: state.submissionId, shared: true }),
      keepalive: true
    }).catch(function () {});
  }

  /* ---- Helpers ------------------------------------------------------- */
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  function copyText(text, btn) {
    var done = function () {
      var old = btn.textContent;
      btn.textContent = "Copied";
      setTimeout(function () { btn.textContent = old; }, 1600);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, done);
    } else {
      var ta = document.createElement("textarea");
      ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); } catch (e) {}
      document.body.removeChild(ta); done();
    }
  }

  /* ---- Boot ---------------------------------------------------------- */
  function boot() {
    var mBtn = el("pathMusician");
    var lBtn = el("pathListener");
    if (mBtn) mBtn.addEventListener("click", function () { startPath("musician"); });
    if (lBtn) lBtn.addEventListener("click", function () { startPath("listener"); });
    screens("landing");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();

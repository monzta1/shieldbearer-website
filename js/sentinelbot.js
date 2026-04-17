(() => {
  const API_URL = "https://g7a5tqlxaj.execute-api.us-east-1.amazonaws.com/sentinel";

  let isOpen = false;
  let history = [];

  const style = document.createElement("style");
  style.textContent = `
    #sentinelbot-launcher {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 9999;
      background: #000;
      color: #00ff41;
      border: 1px solid #00ff41;
      padding: 10px 14px;
      font-family: Courier New, monospace;
      cursor: pointer;
      box-shadow: 0 0 12px rgba(0,255,65,0.35);
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

  const launcher = document.createElement("button");
  launcher.id = "sentinelbot-launcher";
  launcher.textContent = "SENTINELBOT _";

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

  document.body.appendChild(launcher);
  document.body.appendChild(win);

  const closeBtn = win.querySelector("#sentinelbot-close");
  const messages = win.querySelector("#sentinelbot-messages");
  const input = win.querySelector("#sentinelbot-input");
  const sendBtn = win.querySelector("#sentinelbot-send");

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatBotMessage(text) {
    const raw = String(text || "");
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
    return String(text || "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/`(.*?)`/g, "$1")
      .replace(/#{1,6}\s/g, "")
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

  function toggleWindow() {
    isOpen = !isOpen;
    win.style.display = isOpen ? "flex" : "none";
    if (isOpen) input.focus();
    if (!isOpen) {
      history = [];
      messages.innerHTML = "";
    }
  }

  async function sendMessage() {
    const question = input.value.trim();
    if (!question) return;

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

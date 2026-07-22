/* =============================================================
   Lite YouTube facade.

   Swaps every YouTube embed iframe for a thumbnail + play button;
   the real iframe is injected only when the visitor taps play.
   Markup stays untouched in the HTML, so no-JS visitors keep the
   original iframes and nothing about the page content changes.
   Thumbnails come from img.youtube.com (already in the CSP
   img-src allowlist); the injected player autoplays so one tap
   still means one tap.
   ============================================================= */
(function () {
  'use strict';

  var STYLE_ID = 'lite-embed-style';

  function videoIdFrom(src) {
    var m = /youtube\.com\/embed\/([A-Za-z0-9_-]{11})(?:[?&#]|$)/.exec(src || '');
    return m ? m[1] : null;
  }

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent =
      '.lite-yt{position:relative;display:block;width:100%;aspect-ratio:16/9;' +
      'background:#000 center/cover no-repeat;border:0;padding:0;cursor:pointer;overflow:hidden;}' +
      '.lite-yt::before{content:"";position:absolute;inset:0;' +
      'background:linear-gradient(180deg,rgba(0,0,0,.28),transparent 38%,transparent 62%,rgba(0,0,0,.42));}' +
      '.lite-yt__btn{position:absolute;top:50%;left:50%;width:64px;height:44px;' +
      'transform:translate(-50%,-50%);background:rgba(4,4,4,.78);border:1px solid rgba(231,76,60,.6);' +
      'display:flex;align-items:center;justify-content:center;transition:background .2s,border-color .2s;}' +
      '.lite-yt:hover .lite-yt__btn,.lite-yt:focus-visible .lite-yt__btn{background:#c0392b;border-color:#e74c3c;}' +
      '.lite-yt__btn::before{content:"";display:block;width:0;height:0;' +
      'border-style:solid;border-width:9px 0 9px 15px;border-color:transparent transparent transparent #fff;}' +
      '.lite-yt__title{position:absolute;left:0;right:0;top:0;padding:.6rem .8rem;' +
      'font-family:Oswald,sans-serif;font-size:.72rem;font-weight:500;letter-spacing:.12em;' +
      'text-transform:uppercase;color:rgba(240,235,224,.92);text-align:left;' +
      'text-shadow:0 1px 6px rgba(0,0,0,.8);pointer-events:none;}';
    document.head.appendChild(style);
  }

  function activate(facade, src, title, allowValue) {
    var iframe = document.createElement('iframe');
    var joiner = src.indexOf('?') === -1 ? '?' : '&';
    iframe.src = src + joiner + 'autoplay=1';
    iframe.title = title || 'YouTube video';
    iframe.setAttribute('frameborder', '0');
    iframe.allow = allowValue ||
      'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    iframe.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:0;';
    while (facade.firstChild) facade.removeChild(facade.firstChild);
    facade.appendChild(iframe);
    facade.style.cursor = 'default';
    facade.removeAttribute('role');
  }

  function swap(iframe) {
    var src = iframe.getAttribute('src') || '';
    var id = videoIdFrom(src);
    if (!id) return;

    var title = iframe.getAttribute('title') || '';
    var allowValue = iframe.getAttribute('allow') || '';

    var facade = document.createElement('button');
    facade.type = 'button';
    facade.className = 'lite-yt';
    facade.setAttribute('aria-label', 'Play' + (title ? ': ' + title : ' video'));
    facade.style.backgroundImage =
      'url("https://img.youtube.com/vi/' + id + '/hqdefault.jpg")';

    var btn = document.createElement('span');
    btn.className = 'lite-yt__btn';
    btn.setAttribute('aria-hidden', 'true');
    facade.appendChild(btn);

    if (title) {
      var t = document.createElement('span');
      t.className = 'lite-yt__title';
      t.textContent = title;
      facade.appendChild(t);
    }

    facade.addEventListener('click', function () {
      activate(facade, src, title, allowValue);
    }, { once: true });

    /* Keep the layout the iframe was given. Most embeds here are
       sized by a responsive wrapper; the facade fills it the same
       way via aspect-ratio + width:100%. */
    iframe.parentNode.replaceChild(facade, iframe);
  }

  function run() {
    var frames = document.querySelectorAll('iframe[src*="youtube.com/embed/"]');
    if (!frames.length) return;
    ensureStyle();
    for (var i = 0; i < frames.length; i++) swap(frames[i]);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();

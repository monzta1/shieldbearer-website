/* =============================================================
   SHIELDBEARER — Featured Merch
   Pulls one random product from a serverless Shopify proxy.
   Falls back to the static merch card if the request fails.
   ============================================================= */

(function () {
  'use strict';

  var merchRoot = document.getElementById('featuredMerch');
  if (!merchRoot) return;

  function getConfig() {
    var runtime = window.SHOPIFY_CONFIG || {};
    return {
      apiPath: String(runtime.FEATURED_MERCH_API_PATH || '/api/featured-merch').trim()
    };
  }

  function isDevelopment() {
    var host = window.location.hostname || '';
    return host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '' ||
      /\.local$/.test(host);
  }

  function debugLog(message, detail) {
    if (!isDevelopment()) return;
    if (typeof detail === 'undefined') {
      console.info('[featured-merch] ' + message);
      return;
    }
    console.info('[featured-merch] ' + message, detail);
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatPrice(price) {
    if (!price || !price.amount || !price.currencyCode) return '';
    var amount = Number(price.amount);
    if (!isFinite(amount)) return '';
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: price.currencyCode
      }).format(amount);
    } catch (err) {
      return price.currencyCode + ' ' + amount.toFixed(2);
    }
  }

  function withTimeout(url, options, timeoutMs) {
    var controller = new AbortController();
    var timeoutId = window.setTimeout(function () {
      controller.abort();
    }, timeoutMs);

    var mergedOptions = options || {};
    mergedOptions.signal = controller.signal;

    return fetch(url, mergedOptions).finally(function () {
      window.clearTimeout(timeoutId);
    });
  }

  function fetchFeaturedMerch(config, excludeHandle) {
    var apiPath = config.apiPath || '/api/featured-merch';
    var separator = apiPath.indexOf('?') === -1 ? '?' : '&';
    var url = apiPath + (excludeHandle ? separator + 'excludeHandle=' + encodeURIComponent(excludeHandle) : '');

    return withTimeout(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    }, 2500)
      .then(function (response) {
        if (!response.ok) {
          throw new Error('Featured merch proxy failed with status ' + response.status);
        }
        return response.json();
      });
  }

  function getFallbackData() {
    return {
      title: merchRoot.getAttribute('data-fallback-title') || 'Official Shieldbearer Merch',
      copy: merchRoot.getAttribute('data-fallback-copy') || 'Official Shieldbearer merch built around conviction.',
      cta: merchRoot.getAttribute('data-fallback-cta') || 'Shop Now',
      image: merchRoot.getAttribute('data-fallback-image') || 'images/logo-tee.webp',
      url: merchRoot.getAttribute('data-shop-url') || 'https://shop.shieldbearerusa.com'
    };
  }

  function renderDynamicProduct(product) {
    var price = formatPrice(product.price);
    var image = product.image || {};
    var productUrl = product.url || merchRoot.getAttribute('data-shop-url') || 'https://shop.shieldbearerusa.com';
    var altText = image.altText || product.title + ' merch product image';
    var description = 'Randomly selected from the curated Shieldbearer merch collection. Available now from the official store.';

    merchRoot.innerHTML = '' +
      '<div class="featured-merch-art" aria-label="' + escapeHtml(product.title) + ' merch visual">' +
        '<a class="featured-merch-art-link" href="' + escapeHtml(productUrl) + '" target="_blank" rel="noopener">' +
          '<img src="' + escapeHtml(image.url) + '" alt="' + escapeHtml(altText) + '" width="' + escapeHtml(image.width || 720) + '" height="' + escapeHtml(image.height || 720) + '">' +
        '</a>' +
      '</div>' +
      '<div class="featured-merch-copy">' +
        '<span class="eyebrow">Featured Merch</span>' +
        '<h2 class="featured-merch-title" id="featured-merch-heading">' + escapeHtml(product.title) + '</h2>' +
        (price ? '<div class="featured-merch-price">' + escapeHtml(price) + '</div>' : '') +
        '<p>' + escapeHtml(description) + '</p>' +
        '<div class="featured-merch-actions">' +
          '<a href="' + escapeHtml(productUrl) + '" target="_blank" rel="noopener" class="btn btn--red">Shop Now</a>' +
        '</div>' +
      '</div>';

    merchRoot.classList.remove('is-loading');
  }

  function renderFallbackStatic() {
    var fallback = getFallbackData();

    merchRoot.innerHTML = '' +
      '<div class="featured-merch-art" aria-label="' + escapeHtml(fallback.title) + '">' +
        '<a class="featured-merch-art-link" href="' + escapeHtml(fallback.url) + '" target="_blank" rel="noopener">' +
          '<img src="' + escapeHtml(fallback.image) + '" alt="' + escapeHtml(fallback.title) + '" width="720" height="720">' +
        '</a>' +
      '</div>' +
      '<div class="featured-merch-copy">' +
        '<span class="eyebrow">Featured Merch</span>' +
        '<h2 class="featured-merch-title" id="featured-merch-heading">' + escapeHtml(fallback.title) + '</h2>' +
        '<p>' + escapeHtml(fallback.copy) + '</p>' +
        '<div class="featured-merch-actions">' +
          '<a href="' + escapeHtml(fallback.url) + '" target="_blank" rel="noopener" class="btn btn--red">' + escapeHtml(fallback.cta) + '</a>' +
        '</div>' +
      '</div>';

    merchRoot.classList.remove('is-loading');
  }

  function getFeaturedProduct() {
    var config = getConfig();
    var excludeHandle = '';

    try {
      excludeHandle = window.sessionStorage.getItem('sb_featured_merch_handle') || '';
    } catch (err) {
      excludeHandle = '';
    }

    return fetchFeaturedMerch(config, excludeHandle)
      .then(function (product) {
        if (!product || !product.title || !product.image || !product.image.url || !product.url) {
          throw new Error('Invalid featured merch payload');
        }

        try {
          if (product.handle) window.sessionStorage.setItem('sb_featured_merch_handle', product.handle);
        } catch (err) {
          /* Ignore session storage failures */
        }

        debugLog('proxy mode succeeded', {
          handle: product.handle || '',
          title: product.title
        });

        return {
          type: 'dynamic',
          product: product
        };
      })
      .catch(function (err) {
        debugLog('proxy failed, fallback shown', err && err.message ? err.message : err);
        console.warn('Featured merch proxy failed, using fallback', err);
        return { type: 'fallback' };
      });
  }

  getFeaturedProduct().then(function (merchData) {
    if (merchData.type === 'dynamic') {
      renderDynamicProduct(merchData.product);
      return;
    }
    renderFallbackStatic();
  });
})();

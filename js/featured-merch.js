/* =============================================================
   SHIELDBEARER — Featured Merch
   Pulls one random product from a curated Shopify collection.
   Falls back to the static merch card if the request fails.
   ============================================================= */

(function () {
  'use strict';

  var merchRoot = document.getElementById('featuredMerch');
  if (!merchRoot) return;

  var GRAPHQL_QUERY = [
    'query FeaturedCollection($handle: String!) {',
    '  collection(handle: $handle) {',
    '    products(first: 12) {',
    '      edges {',
    '        node {',
    '          id',
    '          title',
    '          handle',
    '          availableForSale',
    '          featuredImage {',
    '            url',
    '            altText',
    '            width',
    '            height',
    '          }',
    '          priceRange {',
    '            minVariantPrice {',
    '              amount',
    '              currencyCode',
    '            }',
    '          }',
    '        }',
    '      }',
    '    }',
    '  }',
    '}'
  ].join('\n');

  function getConfig() {
    var runtime = window.SHIELDBEARER_RUNTIME_CONFIG || {};
    return {
      storeDomain: String(runtime.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || '').trim(),
      storefrontToken: String(runtime.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN || '').trim(),
      collectionHandle: String(runtime.NEXT_PUBLIC_SHOPIFY_FEATURED_COLLECTION_HANDLE || 'featured-homepage').trim()
    };
  }

  function normalizeStoreDomain(domain) {
    return String(domain || '')
      .replace(/^https?:\/\//i, '')
      .replace(/\/+$/, '');
  }

  function storeOrigin(domain) {
    return 'https://' + normalizeStoreDomain(domain);
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

  function fetchShopifyProducts(config) {
    if (!config.storeDomain || !config.storefrontToken) {
      return Promise.reject(new Error('Missing Shopify storefront configuration'));
    }

    return withTimeout(storeOrigin(config.storeDomain) + '/api/2025-01/graphql.json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Shopify-Storefront-Access-Token': config.storefrontToken
      },
      body: JSON.stringify({
        query: GRAPHQL_QUERY,
        variables: { handle: config.collectionHandle }
      })
    }, 2500)
      .then(function (response) {
        if (!response.ok) {
          throw new Error('Shopify request failed with status ' + response.status);
        }
        return response.json();
      })
      .then(function (payload) {
        if (payload.errors && payload.errors.length) {
          throw new Error(payload.errors[0].message || 'Shopify GraphQL error');
        }
        var edges = (((payload || {}).data || {}).collection || {}).products;
        edges = edges && edges.edges ? edges.edges : [];
        return edges.map(function (edge) {
          return edge && edge.node ? edge.node : null;
        }).filter(Boolean);
      });
  }

  function selectRandomProduct(products) {
    var available = products.filter(function (product) {
      return product &&
        product.availableForSale &&
        product.featuredImage &&
        product.featuredImage.url &&
        product.handle;
    });

    if (!available.length) {
      throw new Error('No valid products');
    }

    var randomPool = available.slice();
    try {
      var previousHandle = window.sessionStorage.getItem('sb_featured_merch_handle');
      if (previousHandle && randomPool.length > 1) {
        randomPool = randomPool.filter(function (item) {
          return item.handle !== previousHandle;
        });
        if (!randomPool.length) randomPool = available.slice();
      }
    } catch (err) {
      randomPool = available.slice();
    }

    var randomProduct = randomPool[Math.floor(Math.random() * randomPool.length)];

    try {
      window.sessionStorage.setItem('sb_featured_merch_handle', randomProduct.handle);
    } catch (err) {
      /* Ignore session storage failures */
    }

    return randomProduct;
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

  function renderDynamicProduct(product, config) {
    var price = formatPrice(product.priceRange && product.priceRange.minVariantPrice);
    var image = product.featuredImage || {};
    var origin = merchRoot.getAttribute('data-shop-url') || storeOrigin(config.storeDomain);
    var productUrl = String(origin || '').replace(/\/+$/, '') + '/products/' + product.handle;
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

    return fetchShopifyProducts(config)
      .catch(function () {
        return fetchShopifyProducts(config);
      })
      .then(function (products) {
        if (!products || !products.length) {
          throw new Error('No products');
        }
        return {
          type: 'dynamic',
          product: selectRandomProduct(products),
          config: config
        };
      })
      .catch(function (err) {
        console.warn('Shopify merch fetch failed, using fallback', err);
        return { type: 'fallback' };
      });
  }

  getFeaturedProduct().then(function (merchData) {
    if (merchData.type === 'dynamic') {
      renderDynamicProduct(merchData.product, merchData.config);
      return;
    }
    renderFallbackStatic();
  });
})();

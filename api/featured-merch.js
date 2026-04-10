const GRAPHQL_QUERY = `
  query FeaturedCollection($handle: String!) {
    collection(handle: $handle) {
      products(first: 10) {
        edges {
          node {
            title
            handle
            availableForSale
            featuredImage {
              url
              altText
              width
              height
            }
            priceRange {
              minVariantPrice {
                amount
                currencyCode
              }
            }
          }
        }
      }
    }
  }
`;

function json(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
  res.end(JSON.stringify(payload));
}

function chooseRandomProduct(products, excludeHandle) {
  let pool = products.slice();

  if (excludeHandle && pool.length > 1) {
    const filtered = pool.filter((product) => product.handle !== excludeHandle);
    if (filtered.length) pool = filtered;
  }

  return pool[Math.floor(Math.random() * pool.length)];
}

module.exports = async function handler(req, res) {
  if (req.method && req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return json(res, 405, { error: 'Method not allowed' });
  }

  const storeDomain = String(process.env.SHOPIFY_STORE_DOMAIN || '').trim();
  const storefrontToken = String(process.env.SHOPIFY_STOREFRONT_TOKEN || '').trim();
  const collectionHandle = String(process.env.SHOPIFY_FEATURED_COLLECTION_HANDLE || 'featured-homepage').trim();
  const excludeHandle = String((req.query && req.query.excludeHandle) || '').trim();

  if (!storeDomain || !storefrontToken) {
    return json(res, 500, { error: 'Missing Shopify server configuration' });
  }

  try {
    const response = await fetch(`https://${storeDomain.replace(/^https?:\/\//i, '').replace(/\/+$/, '')}/api/2025-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Shopify-Storefront-Access-Token': storefrontToken
      },
      body: JSON.stringify({
        query: GRAPHQL_QUERY,
        variables: { handle: collectionHandle }
      })
    });

    if (!response.ok) {
      return json(res, response.status, { error: `Shopify request failed with status ${response.status}` });
    }

    const payload = await response.json();

    if (payload.errors && payload.errors.length) {
      return json(res, 502, { error: payload.errors[0].message || 'Shopify GraphQL error' });
    }

    const edges = ((((payload || {}).data || {}).collection || {}).products || {}).edges || [];
    const products = edges
      .map((edge) => (edge && edge.node ? edge.node : null))
      .filter(Boolean)
      .filter((product) => product.availableForSale && product.featuredImage && product.featuredImage.url && product.handle);

    if (!products.length) {
      return json(res, 404, { error: 'No valid featured merch products found' });
    }

    const selected = chooseRandomProduct(products, excludeHandle);
    const price = selected.priceRange && selected.priceRange.minVariantPrice ? selected.priceRange.minVariantPrice : null;

    return json(res, 200, {
      title: selected.title,
      handle: selected.handle,
      image: {
        url: selected.featuredImage.url,
        altText: selected.featuredImage.altText || `${selected.title} merch product image`,
        width: selected.featuredImage.width || 720,
        height: selected.featuredImage.height || 720
      },
      url: `https://shop.shieldbearerusa.com/products/${selected.handle}`,
      price: price ? {
        amount: price.amount,
        currencyCode: price.currencyCode
      } : null
    });
  } catch (error) {
    return json(res, 500, { error: error && error.message ? error.message : 'Unknown server error' });
  }
};

// Calls the Stripe REST API directly — no npm packages needed.

const VALID_PRICES = new Set([
  'price_1Te0DbEHGpx523xpOxmBBi4e', // Básico
  'price_1Te0FzEHGpx523xpxs5xqe4O', // Pro
]);

const HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type':                 'application/json',
};

// Stripe requires application/x-www-form-urlencoded with bracket notation for nested keys
function encodeStripeParams(obj, prefix) {
  return Object.entries(obj)
    .filter(([, v]) => v !== undefined && v !== null)
    .flatMap(([k, v]) => {
      const key = prefix ? `${prefix}[${k}]` : k;
      if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
        return encodeStripeParams(v, key).split('&');
      }
      return [`${encodeURIComponent(key)}=${encodeURIComponent(v)}`];
    })
    .join('&');
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: HEADERS, body: '' };
  if (event.httpMethod !== 'POST')   return { statusCode: 405, headers: HEADERS, body: JSON.stringify({ error: 'Method not allowed' }) };

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    console.error('STRIPE_SECRET_KEY is not set');
    return { statusCode: 500, headers: HEADERS, body: JSON.stringify({ error: 'Stripe no configurado: añade STRIPE_SECRET_KEY en las variables de entorno de Netlify.' }) };
  }

  let priceId, userId, userEmail;
  try {
    const raw = event.isBase64Encoded
      ? Buffer.from(event.body, 'base64').toString('utf8')
      : (event.body ?? '{}');
    ({ priceId, userId, userEmail } = JSON.parse(raw));
  } catch {
    return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'JSON inválido' }) };
  }

  if (!priceId || !VALID_PRICES.has(priceId)) {
    return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Price ID no válido' }) };
  }
  if (!userId) {
    return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Usuario no autenticado' }) };
  }

  const host   = event.headers.host || '';
  const origin = host.startsWith('localhost')
    ? `http://${host}`
    : (process.env.URL || `https://${host}`);

  const params = {
    mode:                  'subscription',
    'payment_method_types[0]': 'card',
    'line_items[0][price]':    priceId,
    'line_items[0][quantity]': '1',
    client_reference_id:   userId,
    locale:                'es',
    success_url:           `${origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:            `${origin}/pricing.html`,
    'subscription_data[metadata][userId]': userId,
  };
  if (userEmail) params.customer_email = userEmail;

  try {
    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type':  'application/x-www-form-urlencoded',
      },
      body: Object.entries(params)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&'),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('Stripe API error:', JSON.stringify(data.error));
      return { statusCode: res.status, headers: HEADERS, body: JSON.stringify({ error: data.error?.message || `Stripe error ${res.status}` }) };
    }

    return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ url: data.url }) };
  } catch (e) {
    console.error('create-checkout fetch error:', e.message);
    return { statusCode: 500, headers: HEADERS, body: JSON.stringify({ error: e.message }) };
  }
};

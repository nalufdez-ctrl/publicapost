// Uses built-in https module — works on any Node.js version, no npm needed.
const https = require('https');

const VALID_PRICES = new Set([
  'price_1Te0DbEHGpx523xpOxmBBi4e',
  'price_1Te0FzEHGpx523xpxs5xqe4O',
]);

const HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type':                 'application/json',
};

function httpsPost(hostname, path, authToken, formBody) {
  return new Promise((resolve, reject) => {
    const bodyBuf = Buffer.from(formBody, 'utf8');
    const req = https.request(
      {
        hostname,
        path,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type':  'application/x-www-form-urlencoded',
          'Content-Length': bodyBuf.length,
        },
      },
      (res) => {
        let raw = '';
        res.on('data', chunk => { raw += chunk; });
        res.on('end', () => {
          try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
          catch { reject(new Error(`Non-JSON response (${res.statusCode}): ${raw}`)); }
        });
      }
    );
    req.on('error', reject);
    req.write(bodyBuf);
    req.end();
  });
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: HEADERS, body: '' };
  if (event.httpMethod !== 'POST')   return { statusCode: 405, headers: HEADERS, body: JSON.stringify({ error: 'Method not allowed' }) };

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    console.error('STRIPE_SECRET_KEY is not set');
    return {
      statusCode: 500, headers: HEADERS,
      body: JSON.stringify({ error: 'STRIPE_SECRET_KEY no está configurada en las variables de entorno de Netlify.' }),
    };
  }

  let priceId, userId, userEmail;
  try {
    const raw = event.isBase64Encoded
      ? Buffer.from(event.body, 'base64').toString('utf8')
      : (event.body ?? '{}');
    ({ priceId, userId, userEmail } = JSON.parse(raw));
  } catch (e) {
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

  // Build form body for Stripe
  const params = new URLSearchParams();
  params.append('mode',                          'subscription');
  params.append('payment_method_types[0]',       'card');
  params.append('line_items[0][price]',          priceId);
  params.append('line_items[0][quantity]',       '1');
  params.append('client_reference_id',           userId);
  params.append('locale',                        'es');
  params.append('success_url',                   `${origin}/success.html?session_id={CHECKOUT_SESSION_ID}`);
  params.append('cancel_url',                    `${origin}/pricing.html`);
  params.append('subscription_data[metadata][userId]', userId);
  if (userEmail) params.append('customer_email', userEmail);

  try {
    const result = await httpsPost(
      'api.stripe.com',
      '/v1/checkout/sessions',
      secretKey,
      params.toString()
    );

    if (result.status >= 400) {
      console.error('Stripe error response:', JSON.stringify(result.body));
      return {
        statusCode: result.status, headers: HEADERS,
        body: JSON.stringify({ error: result.body?.error?.message || `Stripe error ${result.status}` }),
      };
    }

    return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ url: result.body.url }) };
  } catch (e) {
    console.error('create-checkout error:', e.message);
    return { statusCode: 500, headers: HEADERS, body: JSON.stringify({ error: e.message }) };
  }
};

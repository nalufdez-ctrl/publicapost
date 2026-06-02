const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

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

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: HEADERS, body: '' };
  if (event.httpMethod !== 'POST')   return { statusCode: 405, headers: HEADERS, body: JSON.stringify({ error: 'Method not allowed' }) };

  let priceId, userId, userEmail;
  try {
    ({ priceId, userId, userEmail } = JSON.parse(event.body ?? '{}'));
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
  const origin = host.startsWith('localhost') ? `http://${host}` : (process.env.URL || `https://${host}`);

  try {
    const session = await stripe.checkout.sessions.create({
      mode:                 'subscription',
      payment_method_types: ['card'],
      line_items:           [{ price: priceId, quantity: 1 }],
      client_reference_id:  userId,
      customer_email:       userEmail || undefined,
      locale:               'es',
      success_url:          `${origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:           `${origin}/pricing.html`,
      subscription_data: {
        metadata: { userId },
      },
    });

    return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ url: session.url }) };
  } catch (e) {
    console.error('Stripe checkout error:', e);
    return { statusCode: 500, headers: HEADERS, body: JSON.stringify({ error: e.message }) };
  }
};

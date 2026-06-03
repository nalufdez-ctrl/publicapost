// No npm packages — uses built-in crypto + fetch for all external calls.
const crypto = require('crypto');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://znzsjnfqmegnszwyttxe.supabase.co';

const PRICE_TO_PLAN = {
  'price_1Te0DbEHGpx523xpOxmBBi4e': 'basic',
  'price_1Te0FzEHGpx523xpxs5xqe4O': 'pro',
};

// ─── Stripe webhook signature verification ────────────────
function verifySignature(rawBody, header, secret) {
  const parts     = Object.fromEntries(header.split(',').map(p => p.split('=')));
  const timestamp = parts.t;
  const v1        = parts.v1;
  if (!timestamp || !v1) return false;

  const signed   = `${timestamp}.${rawBody}`;
  const expected = crypto.createHmac('sha256', secret).update(signed, 'utf8').digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(v1, 'hex'), Buffer.from(expected, 'hex'));
  } catch {
    return false;
  }
}

// ─── Stripe REST helpers ──────────────────────────────────
async function stripeGet(path, secretKey) {
  const res = await fetch(`https://api.stripe.com${path}`, {
    headers: { 'Authorization': `Bearer ${secretKey}` },
  });
  return res.json();
}

// ─── Supabase REST helpers ────────────────────────────────
async function supabaseUpsert(table, row, serviceKey) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method:  'POST',
    headers: {
      'apikey':        serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Content-Type':  'application/json',
      'Prefer':        'resolution=merge-duplicates',
    },
    body: JSON.stringify(row),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error(`Supabase upsert error (${res.status}):`, err);
  }
}

async function supabaseUpdate(table, row, match, serviceKey) {
  const query = Object.entries(match)
    .map(([k, v]) => `${k}=eq.${encodeURIComponent(v)}`)
    .join('&');
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    method:  'PATCH',
    headers: {
      'apikey':        serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify(row),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error(`Supabase update error (${res.status}):`, err);
  }
}

// ─── Handler ──────────────────────────────────────────────
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };

  const secretKey    = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const serviceKey   = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secretKey || !webhookSecret || !serviceKey) {
    console.error('Missing env vars:', { secretKey: !!secretKey, webhookSecret: !!webhookSecret, serviceKey: !!serviceKey });
    return { statusCode: 500, body: 'Server misconfigured' };
  }

  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body, 'base64').toString('utf8')
    : (event.body ?? '');

  const sig = event.headers['stripe-signature'] || '';

  if (!verifySignature(rawBody, sig, webhookSecret)) {
    console.error('Webhook signature invalid');
    return { statusCode: 400, body: 'Invalid signature' };
  }

  let stripeEvent;
  try {
    stripeEvent = JSON.parse(rawBody);
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const obj = stripeEvent.data.object;

  switch (stripeEvent.type) {

    case 'checkout.session.completed': {
      if (obj.mode !== 'subscription') break;
      const userId         = obj.client_reference_id;
      const customerId     = obj.customer;
      const subscriptionId = obj.subscription;
      if (!userId) { console.error('No client_reference_id'); break; }

      const sub     = await stripeGet(`/v1/subscriptions/${subscriptionId}`, secretKey);
      const priceId = sub.items?.data[0]?.price?.id;
      const plan    = PRICE_TO_PLAN[priceId] || 'basic';

      await supabaseUpsert('subscriptions', {
        user_id:                userId,
        plan,
        stripe_customer_id:     customerId,
        stripe_subscription_id: subscriptionId,
        updated_at:             new Date().toISOString(),
      }, serviceKey);
      break;
    }

    case 'customer.subscription.updated': {
      const priceId = obj.items?.data[0]?.price?.id;
      const plan    = PRICE_TO_PLAN[priceId] || 'basic';
      await supabaseUpdate('subscriptions',
        { plan, updated_at: new Date().toISOString() },
        { stripe_customer_id: obj.customer },
        serviceKey
      );
      break;
    }

    case 'customer.subscription.deleted': {
      await supabaseUpdate('subscriptions',
        { plan: 'free', stripe_subscription_id: null, updated_at: new Date().toISOString() },
        { stripe_customer_id: obj.customer },
        serviceKey
      );
      break;
    }
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};

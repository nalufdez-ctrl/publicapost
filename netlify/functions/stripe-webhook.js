const stripe   = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const PRICE_TO_PLAN = {
  'price_1Te0DbEHGpx523xpOxmBBi4e': 'basic',
  'price_1Te0FzEHGpx523xpxs5xqe4O': 'pro',
};

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL || 'https://znzsjnfqmegnszwyttxe.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };

  const sig     = event.headers['stripe-signature'];
  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body, 'base64').toString('utf8')
    : event.body;

  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  const supabase = getSupabase();

  switch (stripeEvent.type) {

    case 'checkout.session.completed': {
      const session = stripeEvent.data.object;
      if (session.mode !== 'subscription') break;

      const userId         = session.client_reference_id;
      const customerId     = session.customer;
      const subscriptionId = session.subscription;

      if (!userId) { console.error('No client_reference_id'); break; }

      const sub    = await stripe.subscriptions.retrieve(subscriptionId);
      const priceId = sub.items.data[0]?.price?.id;
      const plan    = PRICE_TO_PLAN[priceId] || 'basic';

      const { error } = await supabase.from('subscriptions').upsert({
        user_id:                 userId,
        plan,
        stripe_customer_id:      customerId,
        stripe_subscription_id:  subscriptionId,
        updated_at:              new Date().toISOString(),
      }, { onConflict: 'user_id' });

      if (error) console.error('Supabase upsert error:', error);
      break;
    }

    case 'customer.subscription.updated': {
      const sub     = stripeEvent.data.object;
      const priceId = sub.items.data[0]?.price?.id;
      const plan    = PRICE_TO_PLAN[priceId] || 'basic';

      const { error } = await supabase.from('subscriptions')
        .update({ plan, updated_at: new Date().toISOString() })
        .eq('stripe_customer_id', sub.customer);

      if (error) console.error('Supabase update error:', error);
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = stripeEvent.data.object;

      const { error } = await supabase.from('subscriptions')
        .update({ plan: 'free', stripe_subscription_id: null, updated_at: new Date().toISOString() })
        .eq('stripe_customer_id', sub.customer);

      if (error) console.error('Supabase update error:', error);
      break;
    }

    default:
      break;
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};

// Diagnostic endpoint — visit /.netlify/functions/ping to check config
exports.handler = async () => ({
  statusCode: 200,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    ok:           true,
    nodeVersion:  process.version,
    hasFetch:     typeof fetch !== 'undefined',
    hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
    keyPrefix:    process.env.STRIPE_SECRET_KEY
                    ? process.env.STRIPE_SECRET_KEY.substring(0, 8) + '...'
                    : 'NOT SET',
    hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
    hasSupabaseKey:   !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  }),
});

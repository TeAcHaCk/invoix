/**
 * POST /api/razorpay/webhook
 *
 * Backstop for the primary /api/razorpay/verify path. If the customer's browser
 * dies between paying and returning (closed tab, dead battery, lost signal),
 * Razorpay still calls this and the account still upgrades.
 *
 * Configure in the Razorpay dashboard:
 *   URL     https://www.invoix.app/api/razorpay/webhook
 *   Secret  the value of RAZORPAY_WEBHOOK_SECRET
 *   Events  payment.captured
 *
 * The signature is computed over the UNMODIFIED request body, so body parsing
 * is disabled below.
 */

import crypto from 'node:crypto';
import {
  type ApiRequest,
  type ApiResponse,
  getSupabaseAdmin,
  methodNotAllowed,
  readRawBody,
  requireEnv,
} from '../_lib/server.js';

export const config = { api: { bodyParser: false } };

interface RazorpayPaymentEntity {
  id?: string;
  order_id?: string;
  amount?: number;
  currency?: string;
}

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== 'POST') {
    return methodNotAllowed(res, 'POST');
  }

  let admin;
  let webhookSecret: string;
  try {
    admin = getSupabaseAdmin();
    webhookSecret = requireEnv('RAZORPAY_WEBHOOK_SECRET');
  } catch (err) {
    console.error('Razorpay webhook: server misconfigured:', err);
    return void res.status(500).json({ error: 'Not configured' });
  }

  const rawHeader = req.headers['x-razorpay-signature'];
  const received = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;
  if (!received) {
    return void res.status(400).json({ error: 'Missing signature' });
  }

  let raw: string;
  try {
    raw = await readRawBody(req);
  } catch (err) {
    console.error('Razorpay webhook: could not read body:', err);
    return void res.status(400).json({ error: 'Unreadable body' });
  }

  const expected = crypto.createHmac('sha256', webhookSecret).update(raw).digest('hex');
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(received, 'utf8');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    console.warn('Razorpay webhook: signature mismatch, ignoring.');
    return void res.status(400).json({ error: 'Invalid signature' });
  }

  let event: { event?: string; payload?: { payment?: { entity?: RazorpayPaymentEntity } } };
  try {
    event = JSON.parse(raw);
  } catch {
    return void res.status(400).json({ error: 'Invalid JSON' });
  }

  // Acknowledge anything we do not act on, so Razorpay stops retrying.
  if (event.event !== 'payment.captured') {
    return void res.status(200).json({ received: true, ignored: event.event });
  }

  const payment = event.payload?.payment?.entity;
  const orderId = payment?.order_id;
  const paymentId = payment?.id;

  if (!orderId || !paymentId) {
    return void res.status(200).json({ received: true, ignored: 'missing order/payment id' });
  }

  const { data: intent, error: intentError } = await admin
    .from('payment_transactions')
    .select('id, plan, user_id, status')
    .eq('order_id', orderId)
    .maybeSingle();

  if (intentError || !intent) {
    console.error('Webhook: no intent for order', orderId, intentError?.message);
    return void res.status(200).json({ received: true, ignored: 'unknown order' });
  }

  // /api/razorpay/verify usually wins the race; this is not an error.
  if (intent.status === 'completed') {
    return void res.status(200).json({ received: true, alreadyApplied: true });
  }

  if (intent.user_id) {
    const { error: planError } = await admin
      .from('profiles')
      .update({ plan: intent.plan, updated_at: new Date().toISOString() })
      .eq('id', intent.user_id);

    if (planError) {
      console.error('Webhook: plan upgrade failed:', planError.message);
      // 500 so Razorpay retries.
      return void res.status(500).json({ error: 'Upgrade failed' });
    }
  }

  await admin
    .from('payment_transactions')
    .update({ payment_id: paymentId, status: 'completed', raw_payload: event })
    .eq('id', intent.id);

  return void res.status(200).json({ received: true, upgraded: true });
}

/// <reference types="node" />
/**
 * POST /api/razorpay/verify
 *
 * Primary upgrade path. The browser hands back the three values Razorpay gives
 * it on success; the server recomputes the HMAC with the secret key and only
 * then flips the plan. The plan is read from the payment_transactions row that
 * /api/razorpay/order wrote, NOT from the request — so the client cannot ask
 * for a plan it did not pay for.
 *
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 * Header: Authorization: Bearer <supabase access token>
 */

import crypto from 'node:crypto';
import {
  type ApiRequest,
  type ApiResponse,
  getSupabaseAdmin,
  getUserFromRequest,
  methodNotAllowed,
  readJsonBody,
  requireEnv,
} from '../_lib/server.js';

function signaturesMatch(expected: string, received: string): boolean {
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(received, 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== 'POST') {
    return methodNotAllowed(res, 'POST');
  }

  let admin;
  let keySecret: string;
  try {
    admin = getSupabaseAdmin();
    keySecret = requireEnv('RAZORPAY_KEY_SECRET');
  } catch (err) {
    console.error('Razorpay verify: server misconfigured:', err);
    return void res.status(500).json({ error: 'Payment service is not configured.' });
  }

  const user = await getUserFromRequest(req, admin);
  if (!user) {
    return void res.status(401).json({ error: 'You must be signed in.' });
  }

  const body = readJsonBody(req);
  const orderId = typeof body.razorpay_order_id === 'string' ? body.razorpay_order_id : '';
  const paymentId = typeof body.razorpay_payment_id === 'string' ? body.razorpay_payment_id : '';
  const signature = typeof body.razorpay_signature === 'string' ? body.razorpay_signature : '';

  if (!orderId || !paymentId || !signature) {
    return void res.status(400).json({ error: 'Incomplete payment confirmation.' });
  }

  const expected = crypto
    .createHmac('sha256', keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  if (!signaturesMatch(expected, signature)) {
    console.warn('Razorpay signature mismatch for order', orderId, 'user', user.id);
    return void res.status(400).json({ error: 'Payment could not be verified.' });
  }

  // The order row is the record of what was actually purchased.
  const { data: intent, error: intentError } = await admin
    .from('payment_transactions')
    .select('id, plan, user_id, status')
    .eq('order_id', orderId)
    .maybeSingle();

  if (intentError || !intent) {
    console.error('No payment intent found for order', orderId, intentError?.message);
    return void res.status(400).json({ error: 'Payment could not be matched to an order.' });
  }

  if (intent.user_id !== user.id) {
    console.warn('Order', orderId, 'belongs to a different user than the caller.');
    return void res.status(403).json({ error: 'This payment belongs to another account.' });
  }

  const plan = intent.plan as 'pro' | 'agency' | 'enterprise';

  const { error: planError } = await admin
    .from('profiles')
    .update({ plan, updated_at: new Date().toISOString() })
    .eq('id', user.id);

  if (planError) {
    console.error('Verified payment but could not upgrade plan:', planError.message);
    return void res.status(500).json({ error: 'Payment succeeded but the upgrade failed. Contact support.' });
  }

  await admin
    .from('payment_transactions')
    .update({ payment_id: paymentId, status: 'completed' })
    .eq('id', intent.id);

  return void res.status(200).json({ success: true, plan });
}

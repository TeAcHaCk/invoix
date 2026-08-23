/// <reference types="node" />
/**
 * POST /api/razorpay/order
 *
 * Creates a Razorpay order server-side, at a price the server chooses, for the
 * user identified by their Supabase access token. Records the intent in
 * payment_transactions so that the later verify/webhook step knows which plan
 * was actually paid for — the browser never gets to assert that.
 *
 * Body:  { planId: 'pro'|'agency', currency: 'INR'|'USD', isAnnual: boolean }
 * Header: Authorization: Bearer <supabase access token>
 */

import {
  type ApiRequest,
  type ApiResponse,
  getSupabaseAdmin,
  getUserFromRequest,
  methodNotAllowed,
  readJsonBody,
  requireEnv,
} from '../_lib/server.js';
import { isPlanCurrency, isPlanId, resolveAmount } from '../_lib/plans.js';

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== 'POST') {
    return methodNotAllowed(res, 'POST');
  }

  let admin;
  let keyId: string;
  let keySecret: string;
  try {
    admin = getSupabaseAdmin();
    keyId = requireEnv('RAZORPAY_KEY_ID');
    keySecret = requireEnv('RAZORPAY_KEY_SECRET');
  } catch (err) {
    console.error('Razorpay order: server misconfigured:', err);
    return void res.status(500).json({ error: 'Payment service is not configured.' });
  }

  const user = await getUserFromRequest(req, admin);
  if (!user) {
    return void res.status(401).json({ error: 'You must be signed in to upgrade.' });
  }

  const body = readJsonBody(req);
  const { planId, currency } = body;
  const isAnnual = body.isAnnual === true;

  if (!isPlanId(planId) || !isPlanCurrency(currency)) {
    return void res.status(400).json({ error: 'Unknown plan or currency.' });
  }

  const amount = resolveAmount(planId, currency, isAnnual);

  try {
    const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
      },
      body: JSON.stringify({
        amount,
        currency,
        receipt: `invoix_${Date.now()}`.slice(0, 40),
        notes: {
          plan_id: planId,
          billing_cycle: isAnnual ? 'annual' : 'monthly',
          supabase_user_id: user.id,
          platform: 'invoix_web',
        },
      }),
    });

    if (!rzpRes.ok) {
      const detail = await rzpRes.text();
      console.error('Razorpay order creation failed:', rzpRes.status, detail);
      return void res.status(502).json({ error: 'Could not start checkout. Please try again.' });
    }

    const order = (await rzpRes.json()) as { id: string; amount: number; currency: string };

    // Record the intent. status stays 'created' until a signature is verified.
    const { error: insertError } = await admin.from('payment_transactions').insert({
      user_id: user.id,
      payment_id: `order_pending_${order.id}`,
      order_id: order.id,
      plan: planId,
      gateway: 'razorpay',
      amount,
      currency,
      interval: isAnnual ? 'year' : 'month',
      status: 'created',
    });

    if (insertError) {
      console.error('Could not record payment intent:', insertError.message);
      return void res.status(500).json({ error: 'Could not start checkout. Please try again.' });
    }

    return void res.status(200).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
    });
  } catch (err) {
    console.error('Razorpay order error:', err);
    return void res.status(500).json({ error: 'Could not start checkout. Please try again.' });
  }
}

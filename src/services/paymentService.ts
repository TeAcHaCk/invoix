import { getSupabaseClient } from '../lib/supabase';

export interface PlanPricing {
  id: 'pro' | 'agency';
  name: string;
  currency: 'INR' | 'USD';
  amount: number; // in lowest denomination: paise for INR (49900 = ₹499), cents for USD (900 = $9)
  displayAmount: string;
  interval: 'monthly' | 'annual';
}

/**
 * Display-only pricing for the upgrade UI.
 *
 * The amount actually charged is decided by the server in api/_lib/plans.ts and
 * is never taken from the browser. Keep the two in sync when prices change.
 */
export const RAZORPAY_PLANS: Record<'INR' | 'USD', Record<'pro' | 'agency', { monthly: number; annual: number; displayMonthly: string; displayAnnual: string }>> = {
  INR: {
    pro: {
      monthly: 49900,      // ₹499
      annual: 39900 * 12,  // ₹399/mo (₹4,788/yr)
      displayMonthly: '₹499/mo',
      displayAnnual: '₹399/mo (billed annually)',
    },
    agency: {
      monthly: 149900,     // ₹1,499
      annual: 119900 * 12, // ₹1,199/mo (₹14,388/yr)
      displayMonthly: '₹1,499/mo',
      displayAnnual: '₹1,199/mo (billed annually)',
    },
  },
  USD: {
    pro: {
      monthly: 900,        // $9
      annual: 720 * 12,    // $7.20/mo ($86.40/yr)
      displayMonthly: '$9/mo',
      displayAnnual: '$7.20/mo (billed annually)',
    },
    agency: {
      monthly: 2900,       // $29
      annual: 2320 * 12,   // $23.20/mo ($278.40/yr)
      displayMonthly: '$29/mo',
      displayAnnual: '$23.20/mo (billed annually)',
    },
  },
};

/**
 * Dynamically loads the official Razorpay Checkout v1 JavaScript SDK
 */
export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

/** Current user's Supabase access token, used to authenticate the API calls. */
const getAccessToken = async (): Promise<string | null> => {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
};

interface CreatedOrder {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

export interface RazorpayCheckoutParams {
  planId: 'pro' | 'agency';
  planName: string;
  currency: 'INR' | 'USD';
  isAnnual: boolean;
  userEmail?: string;
  userName?: string;
  userPhone?: string;
  /** Fires only after the server has cryptographically verified the payment. */
  onSuccess: (paymentId: string) => void;
  onError?: (error: any) => void;
}

/**
 * Runs the full checkout: server-created order → Razorpay modal → server-side
 * signature verification → plan upgrade.
 *
 * The browser never writes the plan itself. If the tab dies after payment, the
 * Razorpay webhook (api/razorpay/webhook.ts) still completes the upgrade.
 */
export const initiateRazorpayPayment = async ({
  planId,
  planName,
  currency,
  isAnnual,
  userEmail,
  userName,
  userPhone,
  onSuccess,
  onError,
}: RazorpayCheckoutParams): Promise<void> => {
  const fail = (message: string, cause?: unknown) => {
    console.error('Checkout:', message, cause ?? '');
    if (onError) onError(cause ?? new Error(message));
    alert(message);
  };

  const token = await getAccessToken();
  if (!token) {
    return fail('Please sign in again before upgrading.');
  }

  const isLoaded = await loadRazorpayScript();
  if (!isLoaded) {
    return fail('Razorpay payment gateway failed to load. Please check your internet connection.');
  }

  // 1. Ask the server to create the order at its own price.
  let order: CreatedOrder;
  try {
    const res = await fetch('/api/razorpay/order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ planId, currency, isAnnual }),
    });

    if (!res.ok) {
      const detail = await res.json().catch(() => ({ error: 'Could not start checkout.' }));
      return fail(detail.error || 'Could not start checkout. Please try again.');
    }

    order = (await res.json()) as CreatedOrder;
  } catch (err) {
    return fail('Could not reach the payment service. Please try again.', err);
  }

  const cycleText = isAnnual ? 'Annual Subscription' : 'Monthly Subscription';

  const options = {
    key: order.keyId,
    order_id: order.orderId,
    amount: order.amount,
    currency: order.currency,
    name: 'Invoix Cloud Platform',
    description: `${planName} - ${cycleText}`,
    image: '/invoix-logo.png',
    // 2. Razorpay hands back a signature; only the server can validate it.
    handler: async (response: {
      razorpay_payment_id: string;
      razorpay_order_id: string;
      razorpay_signature: string;
    }) => {
      try {
        const verifyRes = await fetch('/api/razorpay/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(response),
        });

        if (!verifyRes.ok) {
          const detail = await verifyRes.json().catch(() => ({}));
          return fail(
            detail.error ||
              'Your payment went through but we could not confirm it yet. It will be applied shortly.'
          );
        }

        onSuccess(response.razorpay_payment_id);
      } catch (err) {
        fail(
          'Your payment went through but confirmation failed. Refresh in a moment — the upgrade will apply automatically.',
          err
        );
      }
    },
    prefill: {
      name: userName || '',
      email: userEmail || '',
      contact: userPhone || '',
    },
    notes: {
      plan_id: planId,
      billing_cycle: isAnnual ? 'annual' : 'monthly',
      platform: 'invoix_web',
    },
    theme: {
      color: '#f59e0b', // Invoix amber
      backdrop_color: '#020617',
    },
    modal: {
      ondismiss: () => {
        console.log('Razorpay payment modal dismissed by user');
      },
    },
  };

  try {
    const razorpayInstance = new (window as any).Razorpay(options);
    razorpayInstance.on('payment.failed', function (response: any) {
      console.error('Razorpay Payment Failed:', response.error);
      if (onError) onError(response.error);
      alert(`Payment failed: ${response.error.description || response.error.reason}`);
    });
    razorpayInstance.open();
  } catch (err) {
    fail('Could not open the payment window.', err);
  }
};

import { getSupabaseClient } from '../lib/supabase';

export interface PlanPricing {
  id: 'pro' | 'agency';
  name: string;
  currency: 'INR' | 'USD';
  amount: number; // in lowest denomination: paise for INR (49900 = ₹499), cents for USD (900 = $9)
  displayAmount: string;
  interval: 'monthly' | 'annual';
}

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

export interface RazorpayCheckoutParams {
  planId: 'pro' | 'agency';
  planName: string;
  currency: 'INR' | 'USD';
  isAnnual: boolean;
  userEmail?: string;
  userName?: string;
  userPhone?: string;
  onSuccess: (paymentId: string) => void;
  onError?: (error: any) => void;
}

/**
 * Initiates Razorpay Checkout
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
  const isLoaded = await loadRazorpayScript();
  if (!isLoaded) {
    alert('Razorpay payment gateway failed to load. Please check your internet connection.');
    return;
  }

  const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_TTFNEUNYO7Pdzm';
  const planConfig = RAZORPAY_PLANS[currency][planId];
  const amount = isAnnual ? planConfig.annual : planConfig.monthly;
  const cycleText = isAnnual ? 'Annual Subscription' : 'Monthly Subscription';

  const options = {
    key: keyId,
    amount: amount,
    currency: currency,
    name: 'Invoix Cloud Platform',
    description: `${planName} - ${cycleText}`,
    image: '/invoix-logo.png',
    handler: async (response: { razorpay_payment_id: string; razorpay_order_id?: string; razorpay_signature?: string }) => {
      console.log('Razorpay Payment Success:', response);
      onSuccess(response.razorpay_payment_id);
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
    console.error('Error opening Razorpay:', err);
    if (onError) onError(err);
  }
};

/**
 * Updates user profile plan in Supabase and saves payment receipt
 */
export const upgradeUserPlanInDatabase = async (
  userId: string,
  newPlan: 'pro' | 'agency',
  paymentId: string
): Promise<boolean> => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.warn('Supabase not connected. Upgraded locally.');
    return true;
  }

  try {
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ plan: newPlan })
      .eq('id', userId);

    if (profileError) {
      console.error('Error updating user plan in profiles:', profileError);
    }

    // Try logging payment transaction
    await supabase.from('payment_transactions').insert({
      user_id: userId,
      payment_id: paymentId,
      plan: newPlan,
      gateway: 'razorpay',
      status: 'completed',
      created_at: new Date().toISOString(),
    }).select().maybeSingle();

    return true;
  } catch (e) {
    console.error('Database plan update error:', e);
    return true;
  }
};

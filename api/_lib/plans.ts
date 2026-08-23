/**
 * Server-authoritative pricing.
 *
 * The browser is never trusted for the amount. The client asks for a plan id,
 * a currency and a billing interval; the server looks the price up here and
 * creates the Razorpay order with THAT amount. A tampered client can therefore
 * only ever buy a real plan at a real price.
 *
 * Amounts are in the smallest unit: paise for INR, cents for USD.
 * Keep in sync with RAZORPAY_PLANS in src/services/paymentService.ts (display only).
 */

export type PlanId = 'pro' | 'agency';
export type PlanCurrency = 'INR' | 'USD';

interface PlanPrice {
  monthly: number;
  annual: number;
}

export const PLAN_PRICING: Record<PlanCurrency, Record<PlanId, PlanPrice>> = {
  INR: {
    pro: { monthly: 49900, annual: 39900 * 12 },
    agency: { monthly: 149900, annual: 119900 * 12 },
  },
  USD: {
    pro: { monthly: 900, annual: 720 * 12 },
    agency: { monthly: 2900, annual: 2320 * 12 },
  },
};

export function isPlanId(value: unknown): value is PlanId {
  return value === 'pro' || value === 'agency';
}

export function isPlanCurrency(value: unknown): value is PlanCurrency {
  return value === 'INR' || value === 'USD';
}

export function resolveAmount(
  planId: PlanId,
  currency: PlanCurrency,
  isAnnual: boolean
): number {
  const price = PLAN_PRICING[currency][planId];
  return isAnnual ? price.annual : price.monthly;
}

import React, { useState } from 'react';
import { X, Check, Crown, Zap, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { initiateRazorpayPayment } from '../services/paymentService';

interface UpgradePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPlan?: 'pro' | 'agency';
  onOpenAuth?: () => void;
}

export const UpgradePlanModal: React.FC<UpgradePlanModalProps> = ({
  isOpen,
  onClose,
  defaultPlan = 'pro',
  onOpenAuth,
}) => {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'agency'>(defaultPlan);
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');
  const [isAnnual, setIsAnnual] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const currentPlan = profile?.plan || 'free';

  const triggerConfetti = () => {
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#f59e0b', '#fbbf24', '#10b981', '#6366f1'],
    });
  };

  const handleCheckout = async (planId: 'pro' | 'agency') => {
    if (!user) {
      toast.warning('Please log in or create an account first to upgrade your plan.');
      if (onOpenAuth) {
        onClose();
        onOpenAuth();
      }
      return;
    }

    setIsProcessing(true);
    const planName = planId === 'pro' ? 'Invoix Pro Plan' : 'Invoix Agency Plan';

    await initiateRazorpayPayment({
      planId,
      planName,
      currency,
      isAnnual,
      userEmail: user.email || profile?.email || '',
      userName: profile?.full_name || profile?.business_name || '',
      onSuccess: async () => {
        setIsProcessing(false);
        // The server already applied the upgrade after verifying the signature.
        // Re-read the profile, retrying briefly in case the write is still landing.
        for (let attempt = 0; attempt < 3; attempt++) {
          await refreshProfile();
          if (attempt < 2) {
            await new Promise((resolve) => setTimeout(resolve, 600));
          }
        }
        triggerConfetti();
        toast.success(`🎉 Payment Successful! Your account has been upgraded to ${planName}.`, 6000);
        onClose();
      },
      onError: (err) => {
        setIsProcessing(false);
        console.error('Checkout error:', err);
        toast.error((err as any)?.message || 'Payment could not be completed.');
      },
    });
    setIsProcessing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn select-none font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="bg-slate-900 border border-amber-500/30 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl shadow-black/80 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-br from-amber-500/20 to-amber-600/20 text-amber-400 rounded-xl border border-amber-500/30">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 font-['Outfit'] flex items-center gap-2">
                <span>Upgrade Your Invoix Workspace</span>
                {currentPlan !== 'free' && (
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full uppercase font-mono font-bold">
                    Current: {currentPlan}
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                Unlock high-ticket client proposals, custom branding, and instant payments.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Controls: Currency & Billing Interval */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3">
            {/* Currency Selector */}
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-400">Currency:</span>
              <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 flex items-center">
                <button
                  type="button"
                  onClick={() => setCurrency('INR')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    currency === 'INR'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  INR (₹ India UPI/Cards)
                </button>
                <button
                  type="button"
                  onClick={() => setCurrency('USD')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    currency === 'USD'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  USD ($ Global Cards)
                </button>
              </div>
            </div>

            {/* Billing Interval Toggle */}
            <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 flex items-center">
              <button
                type="button"
                onClick={() => setIsAnnual(false)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  !isAnnual
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setIsAnnual(true)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                  isAnnual
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>Annual Billing</span>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold uppercase">
                  20% OFF
                </span>
              </button>
            </div>
          </div>

          {/* Pricing Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pro Plan */}
            <div
              onClick={() => setSelectedPlan('pro')}
              className={`rounded-2xl p-6 border transition-all cursor-pointer flex flex-col justify-between relative ${
                selectedPlan === 'pro'
                  ? 'bg-amber-500/10 border-amber-500/80 ring-2 ring-amber-500/30'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-100 font-['Outfit'] flex items-center gap-2">
                      <Zap className="w-5 h-5 text-amber-400" />
                      <span>Invoix Pro</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">For Freelancers & Solo Consultants</p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 bg-amber-500/20 text-amber-300 rounded-full border border-amber-500/30 font-mono">
                    Popular
                  </span>
                </div>

                <div className="pt-2">
                  <div className="flex items-baseline space-x-1.5">
                    <span className="text-3xl font-extrabold text-slate-100 font-['Outfit']">
                      {currency === 'INR' ? (isAnnual ? '₹399' : '₹499') : (isAnnual ? '$7.20' : '$9')}
                    </span>
                    <span className="text-xs text-slate-400">/ month</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {isAnnual ? (currency === 'INR' ? 'Billed ₹4,788 annually' : 'Billed $86.40 annually') : 'Billed monthly'}
                  </p>
                </div>

                <div className="space-y-2.5 pt-3 border-t border-slate-800/80 text-xs text-slate-300">
                  {[
                    'Unlimited Proposal & Invoice Generation',
                    'High-Fidelity PDF Exports (300 DPI vector)',
                    'Remove Invoix Watermark',
                    'White-Label Client Pages (no Invoix branding)',
                    'Custom Studio Branding & Logo Sizing',
                    'Interactive Live Client Links with Addons',
                    'Dynamic Payment QR Codes (UPI & Cards)',
                  ].map((feat) => (
                    <div key={feat} className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCheckout('pro');
                }}
                disabled={isProcessing || currentPlan === 'pro'}
                className="mt-6 w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {isProcessing && selectedPlan === 'pro' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : currentPlan === 'pro' ? (
                  <span>Active Plan</span>
                ) : (
                  <>
                    <span>Upgrade to Pro with Razorpay</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </>
                )}
              </button>
            </div>

            {/* Agency Plan */}
            <div
              onClick={() => setSelectedPlan('agency')}
              className={`rounded-2xl p-6 border transition-all cursor-pointer flex flex-col justify-between relative ${
                selectedPlan === 'agency'
                  ? 'bg-amber-500/10 border-amber-500/80 ring-2 ring-amber-500/30'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-100 font-['Outfit'] flex items-center gap-2">
                      <Crown className="w-5 h-5 text-amber-400" />
                      <span>Invoix Agency</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">For Digital Agencies & Multi-team Studios</p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 bg-purple-500/20 text-purple-300 rounded-full border border-purple-500/30 font-mono">
                    Unlimited
                  </span>
                </div>

                <div className="pt-2">
                  <div className="flex items-baseline space-x-1.5">
                    <span className="text-3xl font-extrabold text-slate-100 font-['Outfit']">
                      {currency === 'INR' ? (isAnnual ? '₹1,199' : '₹1,499') : (isAnnual ? '$23.20' : '$29')}
                    </span>
                    <span className="text-xs text-slate-400">/ month</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {isAnnual ? (currency === 'INR' ? 'Billed ₹14,388 annually' : 'Billed $278.40 annually') : 'Billed monthly'}
                  </p>
                </div>

                <div className="space-y-2.5 pt-3 border-t border-slate-800/80 text-xs text-slate-300">
                  {[
                    'Everything in Pro included',
                    'Multi-User Team Collaboration (Up to 10 seats)',
                    'Custom Domain Proposal Hosting (proposals.youragency.com)',
                    'Custom Legal Contracts & Retainer Terms',
                    'Direct Client Payment Collection Integration',
                    'Priority 24/7 VIP Support SLA',
                  ].map((feat) => (
                    <div key={feat} className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCheckout('agency');
                }}
                disabled={isProcessing || currentPlan === 'agency'}
                className="mt-6 w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {isProcessing && selectedPlan === 'agency' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : currentPlan === 'agency' ? (
                  <span>Active Plan</span>
                ) : (
                  <>
                    <span>Upgrade to Agency with Razorpay</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Secure Payment Footer Badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs text-slate-400">
            <div className="flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Secured by 256-bit Razorpay Encryption</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-300">UPI</span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-300">Visa / MC</span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-300">NetBanking</span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-300">International</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

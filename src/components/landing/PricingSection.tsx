import React, { useState, useEffect, useRef } from 'react';
import { Check, Sparkles, ArrowRight, Crown } from 'lucide-react';
import { useScrollReveal } from '../../hooks/useScrollReveal';

interface PricingSectionProps {
  onSelectPlan: (plan: 'free' | 'pro' | 'agency') => void;
}

// Animated counter hook
function useAnimatedPrice(target: number, duration = 400) {
  const [value, setValue] = useState(target);
  const prevRef = useRef(target);

  useEffect(() => {
    const from = prevRef.current;
    const to = target;
    prevRef.current = target;
    if (from === to) return;

    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setValue(from + (to - from) * eased);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);

  return value;
}

export const PricingSection: React.FC<PricingSectionProps> = ({ onSelectPlan }) => {
  const [isAnnual, setIsAnnual] = useState(true);
  const [currency, setCurrency] = useState<'USD' | 'INR'>('USD');
  const sectionRef = useScrollReveal();

  const pricingData = {
    USD: {
      symbol: '$',
      free: 0,
      proMonthly: 9,
      proAnnual: 7.2,
      agencyMonthly: 29,
      agencyAnnual: 23.2,
    },
    INR: {
      symbol: '₹',
      free: 0,
      proMonthly: 499,
      proAnnual: 399,
      agencyMonthly: 1499,
      agencyAnnual: 1199,
    },
  };

  const curr = pricingData[currency];
  const proPrice = isAnnual ? curr.proAnnual : curr.proMonthly;
  const agencyPrice = isAnnual ? curr.agencyAnnual : curr.agencyMonthly;
  const animatedPro = useAnimatedPrice(proPrice);
  const animatedAgency = useAnimatedPrice(agencyPrice);

  return (
    <section id="pricing" ref={sectionRef} className="py-28 px-4 sm:px-8 font-['Plus_Jakarta_Sans',sans-serif] relative">
      {/* Ambient */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-purple-500/4 blur-[160px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto space-y-14">
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto reveal-on-scroll">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-[0.2em] font-['Outfit']">
            Transparent Pricing
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-100 font-['Outfit']">
            Invest in Deals, Not Overpriced Software
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Start for free, then scale as your deal pipeline grows. No credit card required to start.
          </p>
        </div>

        {/* Currency & Interval Toggles — larger, pill-style */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 reveal-on-scroll">
          {/* Currency */}
          <div className="glass p-1.5 rounded-2xl flex items-center">
            {(['USD', 'INR'] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCurrency(c)}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                  currency === c
                    ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {c === 'USD' ? 'USD ($)' : 'INR (₹)'}
              </button>
            ))}
          </div>

          {/* Interval */}
          <div className="glass p-1.5 rounded-2xl flex items-center">
            <button
              type="button"
              onClick={() => setIsAnnual(false)}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                !isAnnual
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setIsAnnual(true)}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center space-x-2 cursor-pointer ${
                isAnnual
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Annual Billing</span>
              <span className={`text-[9px] px-2 py-0.5 rounded-full font-extrabold uppercase ${
                isAnnual ? 'bg-slate-950 text-amber-300' : 'bg-emerald-500/20 text-emerald-400'
              }`}>
                2 Months Free
              </span>
            </button>
          </div>
        </div>

        {/* 3 Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {/* Free Tier */}
          <div className="reveal-on-scroll reveal-delay-1 glass rounded-3xl p-7 sm:p-8 space-y-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover-glow-blue">
            <div className="space-y-5">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-100 font-['Outfit']">Starter Free</h3>
                <p className="text-xs text-slate-400">Great for getting started & exploring presets.</p>
              </div>

              <div className="py-2">
                <span className="text-3xl font-extrabold font-mono text-slate-100">{curr.symbol}0</span>
                <span className="text-xs text-slate-500"> / forever</span>
              </div>

              <ul className="space-y-3 text-xs text-slate-300 pt-4 border-t border-slate-700/50">
                {[
                  '3 proposals or invoices / month',
                  '6 industry presets & templates',
                  'Multi-currency & tax engine',
                  'Dynamic offline payment QR',
                  'Local browser vault storage',
                ].map((item, i) => (
                  <li key={i} className="flex items-center space-x-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              type="button"
              onClick={() => onSelectPlan('free')}
              className="w-full py-3.5 glass hover:bg-slate-800/80 text-slate-200 font-bold rounded-2xl text-xs transition-all cursor-pointer"
            >
              Get Started Free
            </button>
          </div>

          {/* Pro Solo (Most Popular) — Animated gradient border */}
          <div className="reveal-on-scroll reveal-delay-2 relative">
            <div className="absolute -inset-[2px] bg-gradient-to-br from-amber-400 via-orange-500 to-amber-400 rounded-[26px] opacity-60 blur-[1px]" />
            <div className="relative bg-gradient-to-b from-slate-900/95 via-slate-900/95 to-amber-950/40 rounded-3xl p-7 sm:p-8 space-y-6 flex flex-col justify-between h-full">
              {/* Most Popular Badge */}
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 px-5 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider shadow-xl shadow-amber-500/30">
                ★ Most Popular
              </div>

              <div className="space-y-5 pt-2">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-amber-200 font-['Outfit'] flex items-center space-x-2">
                    <span>Pro Solo</span>
                    <Sparkles className="w-4 h-4 text-amber-400" />
                  </h3>
                  <p className="text-xs text-slate-300">For active agencies, freelancers & contractors.</p>
                </div>

                <div className="py-2">
                  <span className="text-4xl font-extrabold font-mono text-amber-300">
                    {curr.symbol}{animatedPro % 1 === 0 ? animatedPro.toFixed(0) : animatedPro.toFixed(1)}
                  </span>
                  <span className="text-xs text-slate-400"> / month</span>
                  {isAnnual && (
                    <p className="text-[10px] text-emerald-400 font-semibold mt-1">
                      Billed annually ({curr.symbol}{(proPrice * 12).toFixed(0)}/yr)
                    </p>
                  )}
                </div>

                <ul className="space-y-3 text-xs text-slate-200 pt-4 border-t border-slate-700/50">
                  {[
                    { text: 'Unlimited proposals & invoices', bold: true },
                    { text: 'Supabase PostgreSQL Cloud Sync' },
                    { text: 'Live client proposal links & view tracking' },
                    { text: 'Interactive add-on upselling engine' },
                    { text: 'Digital canvas e-signatures & acceptance' },
                    { text: 'Custom studio branding & logo' },
                    { text: 'Remove platform watermark' },
                  ].map((item, i) => (
                    <li key={i} className={`flex items-center space-x-2.5 ${item.bold ? 'font-bold text-slate-100' : ''}`}>
                      <Check className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>{item.text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                onClick={() => onSelectPlan('pro')}
                className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold rounded-2xl shadow-xl shadow-amber-500/25 text-xs transition-all flex items-center justify-center space-x-1.5 animate-pulse-glow cursor-pointer"
              >
                <span>Upgrade to Pro Solo</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Agency Scale */}
          <div className="reveal-on-scroll reveal-delay-3 glass rounded-3xl p-7 sm:p-8 space-y-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover-glow-purple">
            <div className="space-y-5">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-100 font-['Outfit'] flex items-center space-x-2">
                  <span>Agency Scale</span>
                  <Crown className="w-4 h-4 text-purple-400" />
                </h3>
                <p className="text-xs text-slate-400">For teams, design studios & multi-brand agencies.</p>
              </div>

              <div className="py-2">
                <span className="text-3xl font-extrabold font-mono text-purple-300">
                  {curr.symbol}{animatedAgency % 1 === 0 ? animatedAgency.toFixed(0) : animatedAgency.toFixed(1)}
                </span>
                <span className="text-xs text-slate-400"> / month</span>
                {isAnnual && (
                  <p className="text-[10px] text-emerald-400 font-semibold mt-1">
                    Billed annually ({curr.symbol}{(agencyPrice * 12).toFixed(0)}/yr)
                  </p>
                )}
              </div>

              <ul className="space-y-3 text-xs text-slate-300 pt-4 border-t border-slate-700/50">
                {[
                  { text: 'Everything in Pro Solo', bold: true },
                  { text: 'Up to 10 team seats' },
                  { text: 'Custom domain for proposal links' },
                  { text: 'Priority server-side rendering' },
                  { text: 'Dedicated WhatsApp & onboarding support' },
                ].map((item, i) => (
                  <li key={i} className={`flex items-center space-x-2.5 ${item.bold ? 'font-bold text-slate-100' : ''}`}>
                    <Check className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              type="button"
              onClick={() => onSelectPlan('agency')}
              className="w-full py-3.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-200 border border-purple-500/40 font-bold rounded-2xl text-xs transition-all cursor-pointer"
            >
              Get Agency Scale
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

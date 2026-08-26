import React, { useState, useEffect, useRef } from 'react';
import { Check, Sparkles, ArrowRight, Crown } from 'lucide-react';
import { useScrollReveal } from '../../hooks/useScrollReveal';

interface PricingSectionProps {
  theme?: 'dark' | 'light';
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

export const PricingSection: React.FC<PricingSectionProps> = ({
  theme = 'dark',
  onSelectPlan,
}) => {
  const isDark = theme === 'dark';
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
    <section
      id="pricing"
      ref={sectionRef}
      className={`py-24 px-4 sm:px-8 font-['Plus_Jakarta_Sans',sans-serif] relative transition-colors duration-300 ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Ambient Lighting */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-amber-500/5 blur-[160px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto space-y-14">
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto reveal-on-scroll">
          <span className="text-xs font-bold text-amber-500 uppercase tracking-[0.2em] font-['Outfit']">
            Transparent Pricing
          </span>
          <h2
            className={`text-2xl sm:text-4xl font-extrabold font-['Outfit'] ${
              isDark ? 'text-white' : 'text-slate-950'
            }`}
          >
            Invest in Deals, Not Overpriced Software
          </h2>
          <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Start for free, then scale as your deal pipeline grows. No credit card required to start.
          </p>
        </div>

        {/* Currency & Billing Period Switchers */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 reveal-on-scroll">
          {/* Currency Toggle */}
          <div className={`p-1.5 rounded-2xl flex items-center border ${isDark ? 'glass-dark border-slate-800' : 'bg-white border-slate-300/80 shadow-sm'}`}>
            {(['USD', 'INR'] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCurrency(c)}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                  currency === c
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                {c === 'USD' ? 'USD ($)' : 'INR (₹)'}
              </button>
            ))}
          </div>

          {/* Billing Cycle Toggle */}
          <div className={`p-1.5 rounded-2xl flex items-center border ${isDark ? 'glass-dark border-slate-800' : 'bg-white border-slate-300/80 shadow-sm'}`}>
            <button
              type="button"
              onClick={() => setIsAnnual(false)}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                !isAnnual
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setIsAnnual(true)}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center space-x-2 cursor-pointer ${
                isAnnual
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              <span>Annual Billing</span>
              <span className={`text-[9.5px] px-2 py-0.5 rounded-full font-extrabold uppercase ${
                isAnnual
                  ? 'bg-slate-950 text-amber-300'
                  : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
              }`}>
                2 Months Free
              </span>
            </button>
          </div>
        </div>

        {/* 3 Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-7 items-stretch">
          {/* Free Tier */}
          <div className={`reveal-on-scroll reveal-delay-1 rounded-3xl p-7 sm:p-8 space-y-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 border ${
            isDark
              ? 'glass-dark border-slate-800/80 hover-glow-blue'
              : 'bg-white border-slate-200/90 shadow-md shadow-slate-200/60 hover:shadow-xl hover:border-slate-300'
          }`}>
            <div className="space-y-5">
              <div className="space-y-1">
                <h3 className={`text-lg font-bold font-['Outfit'] ${isDark ? 'text-white' : 'text-slate-950'}`}>Starter Free</h3>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Great for exploring presets and sending quick proposals.</p>
              </div>

              <div className="py-2">
                <span className={`text-3.5xl font-extrabold font-mono ${isDark ? 'text-white' : 'text-slate-950'}`}>{curr.symbol}0</span>
                <span className="text-xs text-slate-500"> / forever</span>
              </div>

              <ul className={`space-y-3 text-xs pt-4 border-t ${isDark ? 'text-slate-300 border-slate-800' : 'text-slate-700 border-slate-200'}`}>
                {[
                  '3 active proposals / month',
                  '6 pre-configured industry presets',
                  'Multi-currency & tax engines',
                  'Dynamic offline payment QR',
                  'Local browser vault storage',
                ].map((item, i) => (
                  <li key={i} className="flex items-center space-x-2.5">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              type="button"
              onClick={() => onSelectPlan('free')}
              className={`w-full py-3.5 font-bold rounded-2xl text-xs transition-all cursor-pointer border ${
                isDark
                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-900 border-slate-300/80 shadow-sm'
              }`}
            >
              Get Started Free
            </button>
          </div>

          {/* Pro Solo (Most Popular) */}
          <div className="reveal-on-scroll reveal-delay-2 relative">
            <div className="absolute -inset-[2px] bg-gradient-to-br from-amber-400 via-orange-500 to-amber-400 rounded-[26px] opacity-75 blur-[1.5px]" />
            <div className={`relative rounded-3xl p-7 sm:p-8 space-y-6 flex flex-col justify-between h-full border ${
              isDark
                ? 'bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-amber-500/30 text-white'
                : 'bg-white border-amber-400/80 text-slate-950 shadow-2xl shadow-amber-500/10'
            }`}>
              {/* Most Popular Badge */}
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 px-4 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider shadow-lg shadow-amber-500/30">
                ⭐ Most Popular Choice
              </div>

              <div className="space-y-5 pt-2">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-bold text-amber-500 font-['Outfit']">Pro Creator</h3>
                    <Sparkles className="w-4 h-4 text-amber-500" />
                  </div>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>For freelancers, studio owners & active deal closers.</p>
                </div>

                <div className="py-2">
                  <span className={`text-4xl font-extrabold font-mono ${isDark ? 'text-white' : 'text-slate-950'}`}>
                    {curr.symbol}
                    {isAnnual ? animatedPro.toFixed(0) : curr.proMonthly}
                  </span>
                  <span className="text-xs text-slate-500"> / month {isAnnual && '(billed annually)'}</span>
                </div>

                <ul className={`space-y-3 text-xs pt-4 border-t ${isDark ? 'text-slate-200 border-slate-800' : 'text-slate-800 border-slate-200'}`}>
                  {[
                    'Unlimited active proposals & invoices',
                    'Interactive client links with e-signatures',
                    'Real-time client view notifications',
                    'No Invoix branding / 100% white label',
                    'Full 15 Google Typography Fonts suite',
                    'Crisp vector multi-page A4 PDF exports',
                    'Supabase cloud synchronization & history',
                  ].map((item, i) => (
                    <li key={i} className="flex items-center space-x-2.5">
                      <Check className="w-4 h-4 text-amber-500 shrink-0" />
                      <span className="font-semibold">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                onClick={() => onSelectPlan('pro')}
                className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold rounded-2xl text-xs shadow-xl shadow-amber-500/25 flex items-center justify-center space-x-2 transition-all transform hover:scale-[1.02] cursor-pointer"
              >
                <span>Upgrade to Pro Creator</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Agency Plan */}
          <div className={`reveal-on-scroll reveal-delay-3 rounded-3xl p-7 sm:p-8 space-y-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 border ${
            isDark
              ? 'glass-dark border-slate-800/80 hover-glow-purple'
              : 'bg-white border-slate-200/90 shadow-md shadow-slate-200/60 hover:shadow-xl hover:border-purple-300'
          }`}>
            <div className="space-y-5">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h3 className={`text-lg font-bold font-['Outfit'] ${isDark ? 'text-white' : 'text-slate-950'}`}>Agency Growth</h3>
                  <Crown className="w-4 h-4 text-purple-500" />
                </div>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>For multi-person teams, consultancies & agencies.</p>
              </div>

              <div className="py-2">
                <span className={`text-3.5xl font-extrabold font-mono ${isDark ? 'text-white' : 'text-slate-950'}`}>
                  {curr.symbol}
                  {isAnnual ? animatedAgency.toFixed(0) : curr.agencyMonthly}
                </span>
                <span className="text-xs text-slate-500"> / month</span>
              </div>

              <ul className={`space-y-3 text-xs pt-4 border-t ${isDark ? 'text-slate-300 border-slate-800' : 'text-slate-700 border-slate-200'}`}>
                {[
                  'Everything in Pro plan included',
                  'Multi-team seat allocations (up to 5)',
                  'Custom domain share links (coming soon)',
                  'Custom payment webhook integrations',
                  'Priority 24/7 WhatsApp & email support',
                ].map((item, i) => (
                  <li key={i} className="flex items-center space-x-2.5">
                    <Check className="w-4 h-4 text-purple-500 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              type="button"
              onClick={() => onSelectPlan('agency')}
              className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-2xl text-xs shadow-lg shadow-purple-500/20 flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              <span>Get Agency Growth</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

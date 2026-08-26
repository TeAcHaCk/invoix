import React, { useState } from 'react';
import { INDUSTRY_PRESETS } from '../../constants/industryPresets';
import { SUPPORTED_CURRENCIES } from '../../constants/currencies';
import type { IndustryCategory } from '../../types';
import {
  Palette,
  Code,
  Briefcase,
  Building,
  Camera,
  Package,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { useScrollReveal } from '../../hooks/useScrollReveal';

interface IndustryShowcaseSectionProps {
  theme?: 'dark' | 'light';
  onSelectIndustry: (industry: IndustryCategory) => void;
}

export const IndustryShowcaseSection: React.FC<IndustryShowcaseSectionProps> = ({
  theme = 'dark',
  onSelectIndustry,
}) => {
  const isDark = theme === 'dark';
  const [activeCategory, setActiveCategory] = useState<IndustryCategory>('creative_agency');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const sectionRef = useScrollReveal();

  const categories: { id: IndustryCategory; label: string; icon: React.ReactNode }[] = [
    { id: 'creative_agency', label: 'Creative Agency', icon: <Palette className="w-4 h-4" /> },
    { id: 'software_tech', label: 'Software & Tech', icon: <Code className="w-4 h-4" /> },
    { id: 'construction', label: 'Construction & Interiors', icon: <Building className="w-4 h-4" /> },
    { id: 'consulting', label: 'Consulting & Strategy', icon: <Briefcase className="w-4 h-4" /> },
    { id: 'photography_events', label: 'Photo & Events', icon: <Camera className="w-4 h-4" /> },
    { id: 'general_business', label: 'B2B Trading', icon: <Package className="w-4 h-4" /> },
  ];

  const switchCategory = (id: IndustryCategory) => {
    if (id === activeCategory) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveCategory(id);
      setIsTransitioning(false);
    }, 200);
  };

  const currentPreset = INDUSTRY_PRESETS[activeCategory] || INDUSTRY_PRESETS.creative_agency;
  const currency = SUPPORTED_CURRENCIES.find((c) => c.code === currentPreset.defaultCurrencyCode) || SUPPORTED_CURRENCIES[0];

  const totalEstimate = currentPreset.pricingItems.reduce((sum, item) => {
    const itemTotal = item.qty && item.rate ? item.qty * item.rate : item.amount || 0;
    return sum + itemTotal;
  }, 0);

  return (
    <section
      id="industries"
      ref={sectionRef}
      className={`py-28 px-4 sm:px-8 font-['Plus_Jakarta_Sans',sans-serif] relative transition-colors duration-300 ${
        isDark ? 'bg-slate-950/70 text-slate-100' : 'bg-slate-100/70 text-slate-900'
      }`}
    >
      {/* Subtle ambient */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-emerald-500/5 blur-[140px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto space-y-14">
        {/* Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto reveal-on-scroll">
          <span className="text-xs font-bold text-amber-500 uppercase tracking-[0.2em] font-['Outfit']">
            Tailored Industry Workflows
          </span>
          <h2
            className={`text-2xl sm:text-4xl font-extrabold font-['Outfit'] ${
              isDark ? 'text-slate-100' : 'text-slate-950'
            }`}
          >
            Built For Your Exact Business Domain
          </h2>
          <p
            className={`text-sm leading-relaxed ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}
          >
            Never start from a blank page again. Choose your industry to load realistic scopes, milestone deliverables, line items, and compliant contract terms in 1 click.
          </p>
        </div>

        {/* Industry Switcher Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 reveal-on-scroll">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => switchCategory(cat.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20'
                    : isDark
                    ? 'glass-dark text-slate-400 hover:text-slate-200 border border-slate-800'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 shadow-sm'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Preset Preview Card — with cross-fade */}
        <div className="reveal-on-scroll">
          <div
            className={`rounded-3xl p-6 sm:p-10 border grid grid-cols-1 lg:grid-cols-12 gap-8 items-center transition-all duration-300 ${
              isDark
                ? 'glass-dark border-slate-800/80 text-slate-100 shadow-2xl'
                : 'glass-light border-slate-200 text-slate-900 shadow-xl shadow-slate-200/50'
            } ${isTransitioning ? 'opacity-0 scale-[0.98]' : 'opacity-100 scale-100'}`}
          >
            {/* Left: Preset Details */}
            <div className="lg:col-span-6 space-y-5">
              <div className="flex items-center space-x-3">
                <span className="text-3xl">{currentPreset.icon}</span>
                <div>
                  <h3 className={`text-xl font-bold font-['Outfit'] ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                    {currentPreset.name}
                  </h3>
                  <p className="text-xs text-amber-500 font-semibold">{currentPreset.tagline}</p>
                </div>
              </div>

              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                Default Package: <strong className={isDark ? 'text-slate-100' : 'text-slate-900'}>{currentPreset.defaultPackageTitle}</strong>
              </p>

              {/* Scope Highlights */}
              <div className="space-y-2.5 pt-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] font-['Outfit'] block">
                  {currentPreset.scopeSectionTitle || 'Deliverables & Phases'}:
                </span>
                <div className="space-y-1.5">
                  {currentPreset.eventCoverage.slice(0, 3).map((scope, idx) => (
                    <div key={idx} className="flex items-start space-x-2 text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                      <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{scope.dayTitle}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA to launch this specific preset */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => onSelectIndustry(activeCategory)}
                  className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-amber-500/20 flex items-center space-x-2 transition-all cursor-pointer"
                >
                  <span>Launch {currentPreset.name} Template</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Right: Mock Document Line Items */}
            <div
              className={`lg:col-span-6 border rounded-2xl p-5 space-y-4 ${
                isDark ? 'bg-slate-950/90 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between border-b pb-3 border-slate-200/20 text-xs">
                <span className={`font-bold font-['Outfit'] ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Sample Line-Item Breakdown
                </span>
                <span className="font-mono text-amber-500 text-[11px] font-bold">
                  {currency.code} ({currency.symbol})
                </span>
              </div>

              <div className="space-y-2">
                {currentPreset.pricingItems.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className={`p-3.5 border rounded-xl flex items-center justify-between text-xs transition-all ${
                      isDark
                        ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                        : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                    }`}
                  >
                    <div>
                      <p className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{item.description}</p>
                      {item.qty && item.rate && (
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {item.qty} {item.unit || 'units'} × {currency.symbol}
                          {item.rate.toLocaleString()}
                        </p>
                      )}
                    </div>
                    <strong className={`font-mono font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                      {currency.symbol}
                      {((item.qty && item.rate ? item.qty * item.rate : item.amount) || 0).toLocaleString()}
                    </strong>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-200/20 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Estimated Package Investment</span>
                <span className="text-lg font-mono text-amber-500 font-extrabold">
                  {currency.symbol}
                  {totalEstimate.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

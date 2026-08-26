import React, { useState, useEffect } from 'react';
import { LandingHeader } from './LandingHeader';
import { LandingHero } from './LandingHero';
import { IndustryShowcaseSection } from './IndustryShowcaseSection';
import { FeatureGridSection } from './FeatureGridSection';
import { PricingSection } from './PricingSection';
import { FaqSection } from './FaqSection';
import { InvoixBrandLogo } from './InvoixBrandLogo';
import { AdBanner } from '../AdBanner';
import type { IndustryCategory } from '../../types';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { useScrollReveal } from '../../hooks/useScrollReveal';

interface LandingPageProps {
  onLaunchStudio: () => void;
  onOpenAuth: () => void;
  onOpenAdmin: () => void;
  onNavigateToPrivacy?: () => void;
  onNavigateToTerms?: () => void;
  onSelectIndustryPreset: (industry: IndustryCategory) => void;
  onSelectPlan: (plan: 'free' | 'pro' | 'agency') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onLaunchStudio,
  onOpenAuth,
  onOpenAdmin,
  onNavigateToPrivacy,
  onNavigateToTerms,
  onSelectIndustryPreset,
  onSelectPlan,
}) => {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('invoix_landing_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    }
    return 'dark';
  });

  useEffect(() => {
    localStorage.setItem('invoix_landing_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const isDark = theme === 'dark';
  const ctaRef = useScrollReveal();
  const footerRef = useScrollReveal();

  return (
    <div
      className={`min-h-screen font-['Plus_Jakarta_Sans',sans-serif] selection:bg-amber-500 selection:text-slate-950 transition-colors duration-300 ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Sticky Header with Brand Logo & Theme Toggle */}
      <LandingHeader
        theme={theme}
        onToggleTheme={toggleTheme}
        onLaunchStudio={onLaunchStudio}
        onOpenAuth={onOpenAuth}
        onOpenAdmin={onOpenAdmin}
      />

      <main>
        {/* Overhauled Hero with Mac Chrome live interactive demo */}
        <LandingHero
          theme={theme}
          onStartFree={onLaunchStudio}
        />

        {/* Dynamic AdSense Horizontal Banner (Free visitors) */}
        <div className="max-w-5xl mx-auto px-4 py-2">
          <AdBanner format="horizontal" onUpgradeClick={() => onSelectPlan('pro')} />
        </div>

        {/* Feature Grid */}
        <FeatureGridSection theme={theme} />

        {/* Industry Showcase Carousel */}
        <IndustryShowcaseSection
          theme={theme}
          onSelectIndustry={onSelectIndustryPreset}
        />

        {/* Pricing Table */}
        <PricingSection
          theme={theme}
          onSelectPlan={onSelectPlan}
        />

        {/* FAQ Accordion */}
        <FaqSection theme={theme} />

        {/* Bottom CTA Closing Banner */}
        <section ref={ctaRef} className="py-28 px-4 sm:px-8">
          <div className="reveal-on-scroll max-w-5xl mx-auto bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 rounded-3xl p-8 sm:p-14 text-slate-950 shadow-2xl shadow-amber-500/20 relative overflow-hidden text-center space-y-7">
            {/* Decorative blurred circles */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/20 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-4 max-w-2xl mx-auto relative z-10">
              <span className="text-xs font-extrabold uppercase tracking-[0.2em] bg-slate-950 text-amber-300 px-4 py-1.5 rounded-full inline-block font-['Outfit'] shadow-md">
                Start Closing High-Ticket Deals Today
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold font-['Outfit'] leading-tight text-slate-950">
                Ready to Upgrade Your Business Proposals?
              </h2>
              <p className="text-xs sm:text-sm font-semibold text-slate-900/90 leading-relaxed max-w-lg mx-auto">
                Join hundreds of creative studios, engineers, consultants, and contractors creating beautiful interactive proposals in minutes.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 relative z-10">
              <button
                type="button"
                onClick={onLaunchStudio}
                className="w-full sm:w-auto px-8 py-4 bg-slate-950 hover:bg-slate-900 text-slate-100 font-extrabold text-sm rounded-2xl shadow-2xl flex items-center justify-center space-x-2 transition-all transform hover:scale-[1.02] cursor-pointer"
              >
                <span>Launch Proposal Studio Free</span>
                <ArrowRight className="w-4 h-4 text-amber-400" />
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 pt-3 text-[11px] font-bold text-slate-950 relative z-10">
              {[
                'No Credit Card Required',
                '6 Pre-Configured Industry Templates',
                'Instant Offline Payment QR',
              ].map((item, i) => (
                <span key={i} className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{item}</span>
                </span>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer & Crawlable Template Directory */}
      <footer
        ref={footerRef}
        className={`border-t py-16 px-4 sm:px-8 text-xs transition-colors duration-300 ${
          isDark
            ? 'border-slate-800/80 bg-slate-950 text-slate-400'
            : 'border-slate-200 bg-white text-slate-600'
        }`}
      >
        <div className="reveal-on-scroll max-w-7xl mx-auto space-y-12">
          {/* Top Columns Grid */}
          <div className={`grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b ${isDark ? 'border-slate-800/80' : 'border-slate-200'}`}>
            {/* Brand Column */}
            <div className="space-y-3 md:col-span-1">
              <InvoixBrandLogo
                theme={theme}
                size="md"
                showQuote={true}
                onClick={onLaunchStudio}
              />
              <p className="text-xs leading-relaxed pt-1">
                The high-converting quotation, proposal, and invoicing SaaS. Interactive client links, touchscreen e-signatures, live upsells, and instant payments.
              </p>
            </div>

            {/* Template Directory Column (Key SEO mesh) */}
            <div className="space-y-2 md:col-span-2">
              <span className={`font-bold uppercase tracking-wider text-[11px] font-['Outfit'] block ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                Free Quotation & Invoice Templates
              </span>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <li>
                  <a href="/?template=photography-quotation" className="hover:text-amber-500 transition-colors flex items-center space-x-1">
                    <span>•</span>
                    <span>Photography Quotation Template</span>
                  </a>
                </li>
                <li>
                  <a href="/?template=web-development-proposal" className="hover:text-amber-500 transition-colors flex items-center space-x-1">
                    <span>•</span>
                    <span>Web & Software SOW Proposal</span>
                  </a>
                </li>
                <li>
                  <a href="/?template=creative-agency-proposal" className="hover:text-amber-500 transition-colors flex items-center space-x-1">
                    <span>•</span>
                    <span>Creative Agency & Design Proposal</span>
                  </a>
                </li>
                <li>
                  <a href="/?template=consulting-agreement" className="hover:text-amber-500 transition-colors flex items-center space-x-1">
                    <span>•</span>
                    <span>Management Consulting Proposal</span>
                  </a>
                </li>
                <li>
                  <a href="/?template=gst-invoice" className="hover:text-amber-500 transition-colors flex items-center space-x-1">
                    <span>•</span>
                    <span>GST Tax Invoice & Billing Template</span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Platform & Navigation Column */}
            <div className="space-y-2">
              <span className={`font-bold uppercase tracking-wider text-[11px] font-['Outfit'] block ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                Platform & Legal
              </span>
              <ul className="space-y-1.5 text-[11px]">
                {['Features', 'Industries', 'Pricing', 'FAQ'].map((link) => (
                  <li key={link}>
                    <a href={`#${link.toLowerCase()}`} className="hover:text-amber-500 transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
                <li>
                  <button
                    type="button"
                    onClick={onNavigateToPrivacy}
                    className="hover:text-amber-500 transition-colors cursor-pointer"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={onNavigateToTerms}
                    className="hover:text-amber-500 transition-colors cursor-pointer"
                  >
                    Terms of Service
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={onOpenAdmin}
                    className="text-amber-500 hover:text-amber-400 transition-colors cursor-pointer"
                  >
                    Super Admin
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <p>© {new Date().getFullYear()} Invoix. All rights reserved.</p>
            <p>Your Proposals. Their Applause.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

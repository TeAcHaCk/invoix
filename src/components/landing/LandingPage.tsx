import React from 'react';
import { LandingHeader } from './LandingHeader';
import { LandingHero } from './LandingHero';
import { IndustryShowcaseSection } from './IndustryShowcaseSection';
import { FeatureGridSection } from './FeatureGridSection';
import { PricingSection } from './PricingSection';
import { FaqSection } from './FaqSection';
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
  const ctaRef = useScrollReveal();
  const footerRef = useScrollReveal();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-['Plus_Jakarta_Sans',sans-serif] selection:bg-amber-500 selection:text-slate-950">
      {/* Sticky Header */}
      <LandingHeader
        onLaunchStudio={onLaunchStudio}
        onOpenAuth={onOpenAuth}
        onOpenAdmin={onOpenAdmin}
      />

      <main>
        {/* Hero Section */}
        <LandingHero onStartFree={onLaunchStudio} />

        {/* Dynamic AdSense Horizontal Banner (Free visitors) */}
        <div className="max-w-5xl mx-auto px-4 py-2">
          <AdBanner format="horizontal" onUpgradeClick={() => onSelectPlan('pro')} />
        </div>

        {/* Feature Grid */}
        <FeatureGridSection />

        {/* Industry Showcase Carousel */}
        <IndustryShowcaseSection onSelectIndustry={onSelectIndustryPreset} />

        {/* Pricing Table */}
        <PricingSection onSelectPlan={onSelectPlan} />

        {/* FAQ Accordion */}
        <FaqSection />

        {/* Bottom CTA Closing Banner */}
        <section ref={ctaRef} className="py-28 px-4 sm:px-8">
          <div className="reveal-on-scroll max-w-5xl mx-auto bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 rounded-3xl p-8 sm:p-14 text-slate-950 shadow-2xl shadow-amber-500/15 relative overflow-hidden text-center space-y-7">
            {/* Decorative blurred circles */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-4 max-w-2xl mx-auto relative z-10">
              <span className="text-xs font-extrabold uppercase tracking-[0.2em] bg-slate-950 text-amber-300 px-4 py-1.5 rounded-full inline-block font-['Outfit']">
                Start Closing High-Ticket Deals Today
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold font-['Outfit'] leading-tight">
                Ready to Upgrade Your Business Proposals?
              </h2>
              <p className="text-xs sm:text-sm font-medium text-slate-900 leading-relaxed max-w-lg mx-auto">
                Join hundreds of creative studios, engineers, consultants, and contractors creating beautiful interactive proposals in minutes.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 relative z-10">
              <button
                type="button"
                onClick={onLaunchStudio}
                className="w-full sm:w-auto px-8 py-4 bg-slate-950 hover:bg-slate-900 text-slate-100 font-extrabold text-sm rounded-2xl shadow-2xl flex items-center justify-center space-x-2 transition-all cursor-pointer animate-pulse-glow"
              >
                <span>Launch Proposal Studio Free</span>
                <ArrowRight className="w-4 h-4 text-amber-400" />
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 pt-3 text-[11px] font-semibold text-slate-900 relative z-10">
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
      <footer ref={footerRef} className="border-t border-slate-800/60 bg-slate-950/90 py-16 px-4 sm:px-8 text-xs text-slate-400">
        <div className="reveal-on-scroll max-w-7xl mx-auto space-y-12">
          {/* Top Columns Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-800/80">
            {/* Brand Column */}
            <div className="space-y-3 md:col-span-1">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <span className="font-extrabold text-slate-950 font-['Outfit'] text-sm tracking-tight">IX</span>
                </div>
                <span className="font-extrabold text-lg text-slate-100 font-['Outfit'] tracking-tight">
                  Invoix<span className="text-amber-400">.</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                The high-converting quotation, proposal, and invoicing SaaS. Interactive client links, touch-screen e-signatures, live upsells, and instant payments.
              </p>
            </div>

            {/* Template Directory Column (Key SEO mesh) */}
            <div className="space-y-2 md:col-span-2">
              <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px] font-['Outfit'] block">
                Free Quotation & Invoice Templates
              </span>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <li>
                  <a href="/?template=photography-quotation" className="hover:text-amber-300 transition-colors flex items-center space-x-1">
                    <span>•</span>
                    <span>Photography Quotation Template</span>
                  </a>
                </li>
                <li>
                  <a href="/?template=web-development-proposal" className="hover:text-amber-300 transition-colors flex items-center space-x-1">
                    <span>•</span>
                    <span>Web & Software SOW Proposal</span>
                  </a>
                </li>
                <li>
                  <a href="/?template=creative-agency-proposal" className="hover:text-amber-300 transition-colors flex items-center space-x-1">
                    <span>•</span>
                    <span>Creative Agency & Design Proposal</span>
                  </a>
                </li>
                <li>
                  <a href="/?template=consulting-agreement" className="hover:text-amber-300 transition-colors flex items-center space-x-1">
                    <span>•</span>
                    <span>Management Consulting Proposal</span>
                  </a>
                </li>
                <li>
                  <a href="/?template=gst-invoice" className="hover:text-amber-300 transition-colors flex items-center space-x-1">
                    <span>•</span>
                    <span>GST Tax Invoice & Billing Template</span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Platform & Navigation Column */}
            <div className="space-y-2">
              <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px] font-['Outfit'] block">
                Platform & Legal
              </span>
              <ul className="space-y-1.5 text-[11px]">
                {['Features', 'Industries', 'Pricing', 'FAQ'].map((link) => (
                  <li key={link}>
                    <a href={`#${link.toLowerCase()}`} className="hover:text-amber-300 transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
                <li>
                  <button
                    type="button"
                    onClick={onNavigateToPrivacy}
                    className="hover:text-amber-300 transition-colors cursor-pointer"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={onNavigateToTerms}
                    className="hover:text-amber-300 transition-colors cursor-pointer"
                  >
                    Terms of Service
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={onOpenAdmin}
                    className="text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
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
            <p>Designed for fast conversion, mobile signing & crisp vector exports.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

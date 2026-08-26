import React, { useEffect } from 'react';
import type { IndustryCategory } from '../../types';
import { TEMPLATE_LANDING_PAGES, type TemplateLandingPageData } from '../../constants/templateLandingData';
import {
  Sparkles,
  ArrowRight,
  Download,
  FileCheck,
  Zap,
  Clock,
  QrCode,
  Layers,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';

interface TemplateLandingPageProps {
  slug: string;
  onUseTemplate: (industry: IndustryCategory) => void;
  onNavigateHome: () => void;
  onNavigatePricing: () => void;
}

export const TemplateLandingPage: React.FC<TemplateLandingPageProps> = ({
  slug,
  onUseTemplate,
  onNavigateHome,
  onNavigatePricing,
}) => {
  /*
    An unknown slug used to fall back to the photography page, so
    ?template=anything returned a full 200 page of identical content. That is a
    soft-404 generator: crawlers can mint unlimited URLs all serving the same
    copy, competing with the real template pages for the same terms.

    Undefined here is deliberate — the effect below sends the visitor home.
  */
  const data: TemplateLandingPageData | undefined = TEMPLATE_LANDING_PAGES[slug];

  useEffect(() => {
    if (!data) {
      window.history.replaceState(null, '', '/');
      onNavigateHome();
    }
  }, [data, onNavigateHome]);

  useEffect(() => {
    if (!data) return;
    // Dynamic SEO Title & Meta Description update
    document.title = data.metaTitle;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', data.metaDescription);
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [data]);

  /*
    Must come AFTER both hooks so hook order stays stable, but before the JSX:
    effects run post-render, so without this the render would dereference an
    undefined `data` and throw before the redirect above ever fires.

    Note this was not caught by the type checker — tsconfig.app.json does not
    enable `strict`, so strictNullChecks is off across the app.
  */
  if (!data) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-['Plus_Jakarta_Sans',sans-serif] selection:bg-amber-500 selection:text-slate-950">
      {/* Top Sticky Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-lg border-b border-slate-800/80 px-4 sm:px-8 py-3.5 select-none">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            type="button"
            onClick={onNavigateHome}
            className="flex items-center space-x-2.5 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <span className="font-extrabold text-slate-950 font-['Outfit'] text-sm tracking-tight">IX</span>
            </div>
            <span className="font-extrabold text-lg text-slate-100 font-['Outfit'] tracking-tight">
              Invoix<span className="text-amber-400">.</span>
            </span>
          </button>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onNavigatePricing}
              className="text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors hidden sm:inline"
            >
              Pricing
            </button>
            <button
              type="button"
              onClick={() => onUseTemplate(data.industryKey)}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-amber-500/20 flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <span>Use This Template Free</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-8 overflow-hidden dot-grid-bg">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 glass rounded-full border border-amber-500/30 text-amber-300 text-xs font-semibold shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>{data.badge} • Ready-to-Use Free Template</span>
          </div>

          {/* Primary H1 */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold font-['Outfit'] tracking-tight text-slate-100 leading-[1.15]">
            {data.h1}
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-lg text-slate-400 max-w-3xl mx-auto leading-relaxed">
            {data.subtitle}
          </p>

          {/* Key Metrics Bar */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2 text-xs text-slate-300">
            <div className="flex items-center space-x-1.5 glass px-3 py-1.5 rounded-lg border border-slate-800">
              <span className="text-slate-400">Target:</span>
              <span className="font-semibold text-slate-200">{data.targetAudience}</span>
            </div>
            <div className="flex items-center space-x-1.5 glass px-3 py-1.5 rounded-lg border border-slate-800">
              <span className="text-slate-400">Typical Deal Size:</span>
              <span className="font-semibold text-emerald-400">{data.avgDealValue}</span>
            </div>
          </div>

          {/* Primary Action CTAs */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => onUseTemplate(data.industryKey)}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-sm font-extrabold rounded-2xl shadow-xl shadow-amber-500/25 flex items-center justify-center space-x-2 transition-all transform hover:scale-[1.02] cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-slate-950" />
              <span>Customize This Template in Studio (Free)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="#preview-section"
              className="w-full sm:w-auto px-6 py-4 glass hover:bg-slate-800/80 text-slate-200 text-sm font-semibold rounded-2xl border border-slate-700/80 transition-colors flex items-center justify-center space-x-2"
            >
              <span>Inspect Sample Scope & Pricing</span>
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="py-20 px-4 sm:px-8 border-y border-slate-800/60 bg-slate-900/40">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold font-['Outfit'] text-slate-100">
              Why This Template Closes Deals Faster
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto">
              Traditional PDF attachments sit unread in client inboxes. Invoix interactive links turn passive estimates into engaging digital signing experiences.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {data.features.map((feat, idx) => (
              <div
                key={idx}
                className="glass rounded-2xl p-6 border border-slate-800/80 space-y-3 hover:border-amber-500/40 transition-colors group"
              >
                <div className="text-2xl">{feat.icon}</div>
                <h3 className="text-base font-bold text-slate-100 font-['Outfit'] group-hover:text-amber-300 transition-colors">
                  {feat.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {feat.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Sample Document Preview Section */}
      <section id="preview-section" className="py-20 px-4 sm:px-8">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold font-['Outfit'] text-slate-100">
              What’s Included in This Template
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto">
              Pre-configured SOW milestones, itemized rate cards, terms of engagement, and signature blocks. 100% editable in our browser editor.
            </p>
          </div>

          {/* Sample Card Mockup */}
          <div className="glass rounded-3xl p-6 sm:p-8 border border-slate-800/90 shadow-2xl space-y-8 max-w-4xl mx-auto">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
              <div>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-bold uppercase">
                  {data.docType === 'INVOICE' ? 'Official Tax Invoice' : 'Official Commercial Proposal'}
                </span>
                <h3 className="text-lg font-bold text-slate-100 mt-2 font-['Outfit']">{data.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Multi-page layout • Crisp Vector PDF & Client Portal Link</p>
              </div>

              <button
                type="button"
                onClick={() => onUseTemplate(data.industryKey)}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-amber-500/20 flex items-center space-x-1.5 transition-all cursor-pointer shrink-0"
              >
                <span>Load Into Editor</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Milestones & Deliverables Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-['Outfit'] flex items-center space-x-2">
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  <span>SOW Project Phases & Milestones</span>
                </h4>
                <div className="space-y-2">
                  {data.keyMilestones.map((m, idx) => (
                    <div key={idx} className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-xs flex items-start space-x-2.5">
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="text-slate-300 leading-snug">{m}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sample Pricing Table */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-['Outfit'] flex items-center space-x-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Sample Itemized Rate Schedule</span>
                </h4>
                <div className="border border-slate-800 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-900 text-slate-400 text-[10px] uppercase font-bold">
                      <tr>
                        <th className="p-2.5">Item Description</th>
                        <th className="p-2.5 text-right">Est. Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {data.sampleItems.map((item, idx) => (
                        <tr key={idx} className="bg-slate-950/40">
                          <td className="p-2.5 font-medium">{item.description}</td>
                          <td className="p-2.5 text-right font-mono text-amber-400 font-semibold">
                            ₹{item.rate.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Interactive Feature Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800 text-center">
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80">
                <FileCheck className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                <p className="text-[11px] font-bold text-slate-200">E-Signature</p>
                <p className="text-[9px] text-slate-400">Touchscreen sign</p>
              </div>
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80">
                <QrCode className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                <p className="text-[11px] font-bold text-slate-200">Payment QR</p>
                <p className="text-[9px] text-slate-400">Dynamic UPI / wire</p>
              </div>
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80">
                <Download className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                <p className="text-[11px] font-bold text-slate-200">Vector PDF</p>
                <p className="text-[9px] text-slate-400">Selectable text</p>
              </div>
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80">
                <Clock className="w-4 h-4 text-violet-400 mx-auto mb-1" />
                <p className="text-[11px] font-bold text-slate-200">View Tracking</p>
                <p className="text-[9px] text-slate-400">Realtime open alert</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="py-20 px-4 sm:px-8 border-t border-slate-800/60 bg-slate-900/30">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-extrabold font-['Outfit'] text-slate-100 flex items-center justify-center space-x-2">
              <HelpCircle className="w-5 h-5 text-amber-400" />
              <span>Frequently Asked Questions</span>
            </h2>
            <p className="text-xs text-slate-400">Everything you need to know about using this proposal template</p>
          </div>

          <div className="space-y-4">
            {data.faqs.map((faq, idx) => (
              <div key={idx} className="glass rounded-2xl p-5 border border-slate-800 space-y-2">
                <h3 className="text-sm font-bold text-slate-200 font-['Outfit']">{faq.question}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-20 px-4 sm:px-8 text-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold font-['Outfit'] text-slate-100">
            Ready to Win More High-Ticket Deals?
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            Start creating stunning, interactive quotations and proposals in seconds. No credit card required.
          </p>
          <button
            type="button"
            onClick={() => onUseTemplate(data.industryKey)}
            className="px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-sm font-extrabold rounded-2xl shadow-xl shadow-amber-500/25 inline-flex items-center space-x-2 transition-all transform hover:scale-[1.02] cursor-pointer"
          >
            <Sparkles className="w-4 h-4 fill-slate-950" />
            <span>Open {data.h1} (Free)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-slate-800/80 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} Invoix. The high-converting proposal & quotation platform.</p>
      </footer>
    </div>
  );
};

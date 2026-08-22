import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  PenTool,
  Check,
  Star,
} from 'lucide-react';

interface LandingHeroProps {
  onStartFree: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({ onStartFree }) => {
  const [selectedAddons, setSelectedAddons] = useState<string[]>(['addon-seo']);
  const [signerName, setSignerName] = useState('');
  const [isSigned, setIsSigned] = useState(false);
  const sectionRef = useScrollReveal();

  const basePrice = 3500;
  const addonsList = [
    { id: 'addon-seo', name: 'Search Engine Optimization & Schema', price: 650 },
    { id: 'addon-maintenance', name: 'Priority 24/7 SLA Maintenance', price: 450 },
  ];

  const currentTotal =
    basePrice +
    addonsList
      .filter((a) => selectedAddons.includes(a.id))
      .reduce((sum, a) => sum + a.price, 0);

  const toggleAddon = (id: string) => {
    if (selectedAddons.includes(id)) {
      setSelectedAddons(selectedAddons.filter((a) => a !== id));
    } else {
      setSelectedAddons([...selectedAddons, id]);
    }
  };

  const handleSignDemo = () => {
    if (!signerName.trim()) setSignerName('Alex Mercer');
    setIsSigned(true);
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
  };

  const resetDemo = () => {
    setIsSigned(false);
    setSignerName('');
  };

  return (
    <section ref={sectionRef} className="relative pt-32 pb-24 px-4 sm:px-8 overflow-hidden font-['Plus_Jakarta_Sans',sans-serif] dot-grid-bg">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-amber-500/8 blur-[160px] rounded-full pointer-events-none -z-10" />
      <div className="absolute top-[60%] left-[20%] w-[300px] h-[300px] bg-purple-500/5 blur-[120px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        {/* Left Copy & Value Proposition */}
        <div className="lg:col-span-7 space-y-7 text-center lg:text-left">
          {/* Floating Badge */}
          <div className="reveal-on-scroll inline-flex items-center space-x-2 px-4 py-2 rounded-full glass text-amber-300 text-xs font-semibold animate-float">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>The Universal Proposal & Invoice Platform</span>
          </div>

          {/* Main Headline */}
          <h1 className="reveal-on-scroll text-3xl sm:text-5xl lg:text-[3.5rem] font-extrabold text-slate-100 tracking-tight font-['Outfit'] leading-[1.12]">
            Create Proposals & Invoices That{' '}
            <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-orange-400 bg-clip-text text-transparent animate-shimmer">
              Win High-Ticket Deals.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="reveal-on-scroll text-sm sm:text-base text-slate-400 max-w-xl leading-relaxed mx-auto lg:mx-0">
            Tailored for Agencies, Freelance Engineers, Contractors & Consultants. Send live interactive proposals with optional client upsells, digital e-signatures, multi-currency pricing, and instant payment QR codes.
          </p>

          {/* CTA Buttons */}
          <div className="reveal-on-scroll flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
            <button
              type="button"
              onClick={onStartFree}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-sm rounded-2xl shadow-xl shadow-amber-500/25 flex items-center justify-center space-x-2 transition-all animate-pulse-glow cursor-pointer"
            >
              <span>Start Creating Free</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <a
              href="#industries"
              className="w-full sm:w-auto px-6 py-4 glass hover:bg-slate-800/60 text-slate-200 font-semibold text-sm rounded-2xl flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              <span>Explore Industry Presets</span>
            </a>
          </div>

          {/* Social Proof Stats */}
          <div className="reveal-on-scroll pt-10 border-t border-slate-800/50 grid grid-cols-3 gap-6 text-center lg:text-left">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold font-mono text-slate-100">10,000+</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Proposals Generated</p>
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold font-mono text-amber-300">$4.2M+</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Closed Deal Volume</p>
            </div>
            <div>
              <div className="flex items-center justify-center lg:justify-start space-x-0.5 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-current" />
                ))}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">4.9/5 from 850+ Agencies</p>
            </div>
          </div>
        </div>

        {/* Right: Live Interactive Mini Proposal Widget */}
        <div className="lg:col-span-5 relative reveal-on-scroll">
          {/* Glowing card wrapper */}
          <div className="absolute -inset-[2px] bg-gradient-to-br from-amber-500/30 via-transparent to-emerald-500/20 rounded-[26px] blur-sm opacity-60 pointer-events-none" />

          <div className="relative glass rounded-3xl p-6 shadow-2xl space-y-5 glow-amber">
            {/* Top Widget Bar */}
            <div className="flex items-center justify-between border-b border-slate-700/50 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400/20 to-amber-600/20 text-amber-300 border border-amber-500/30 flex items-center justify-center font-bold text-xs">
                  ✨
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-100 font-['Outfit']">Interactive Client Portal</h3>
                  <p className="text-[10px] text-slate-500">Try toggling add-ons & signing live!</p>
                </div>
              </div>
              <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase border ${
                isSigned
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
              }`}>
                {isSigned ? '✓ Approved' : 'Live Demo'}
              </span>
            </div>

            {/* Proposal Scope Title */}
            <div>
              <span className="text-[9px] font-bold text-amber-400/80 uppercase tracking-[0.2em] font-['Outfit'] block">
                Commercial Estimate
              </span>
              <h4 className="text-base font-bold text-slate-100 font-['Outfit'] mt-0.5">
                Full-Stack Next.js Platform Build
              </h4>
              <p className="text-[11px] text-slate-500">Prepared for Acme International</p>
            </div>

            {/* Interactive Addon Checkboxes */}
            <div className="space-y-2 text-xs">
              {/* Fixed core item */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-700/50 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span className="text-slate-200 font-medium">Core Web Application & API</span>
                </div>
                <span className="font-mono text-slate-100 font-bold">$3,500</span>
              </div>

              {/* Optional add-ons */}
              {addonsList.map((addon) => {
                const isChecked = selectedAddons.includes(addon.id);
                return (
                  <div
                    key={addon.id}
                    onClick={() => !isSigned && toggleAddon(addon.id)}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all duration-200 ${
                      isChecked
                        ? 'bg-slate-950/80 border-amber-500/40 shadow-sm'
                        : 'bg-slate-950/30 border-slate-800/40 opacity-50 hover:opacity-70'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <div
                        className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-colors duration-200 ${
                          isChecked
                            ? 'bg-amber-500 border-amber-400 text-slate-950'
                            : 'border-slate-600 bg-transparent'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <div>
                        <span className="text-slate-200 font-medium block">{addon.name}</span>
                        <span className="text-[9px] text-amber-400/70 font-semibold uppercase tracking-wide">Optional Add-on</span>
                      </div>
                    </div>
                    <span className="font-mono text-slate-100 font-bold">+${addon.price}</span>
                  </div>
                );
              })}
            </div>

            {/* Total Investment */}
            <div className="bg-slate-950/70 border border-slate-700/50 rounded-xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold font-['Outfit'] block tracking-wide">
                  Total Deal Investment
                </span>
                <span className="text-[10.5px] text-emerald-400/80 font-semibold">30% Advance: ${(currentTotal * 0.3).toFixed(0)}</span>
              </div>
              <strong className="text-2xl font-mono text-amber-300 font-extrabold tracking-tight">
                ${currentTotal.toLocaleString()}
              </strong>
            </div>

            {/* Sign & Accept */}
            {isSigned ? (
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Proposal Signed by {signerName || 'Client'}</span>
                </div>
                <button type="button" onClick={resetDemo} className="text-[10px] text-slate-500 hover:text-slate-300 underline cursor-pointer">
                  Reset Demo
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                <input
                  type="text"
                  placeholder="Enter signatory name (e.g. Alex Mercer)..."
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500/50 focus:shadow-[0_0_0_3px_rgba(245,158,11,0.1)] transition-all input-premium"
                />
                <button
                  type="button"
                  onClick={handleSignDemo}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center space-x-1.5 transition-all text-xs cursor-pointer"
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>Accept & Legally Approve Proposal</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

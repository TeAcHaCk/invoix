import React, { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  PenTool,
  Check,
  Star,
  Lock,
  Eye,
  ShieldCheck,
  QrCode,
  RotateCcw,
  Zap,
  Flame,
} from 'lucide-react';

interface LandingHeroProps {
  theme?: 'dark' | 'light';
  onStartFree: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  theme = 'dark',
  onStartFree,
}) => {
  const isDark = theme === 'dark';

  const [selectedAddons, setSelectedAddons] = useState<string[]>(['addon-seo']);
  const [signerName, setSignerName] = useState('Alex Mercer');
  const [signMode, setSignMode] = useState<'draw' | 'type'>('type');
  const [isSigned, setIsSigned] = useState(false);
  const [signedTimestamp, setSignedTimestamp] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const basePrice = 3500;
  const addonsList = [
    {
      id: 'addon-seo',
      name: 'SEO & Structured Schema Architecture',
      badge: 'Most Popular',
      price: 650,
      icon: <Flame className="w-3 h-3 text-amber-500" />,
    },
    {
      id: 'addon-maintenance',
      name: 'Priority 24/7 SLA & Cloud DevOps',
      badge: 'Save 15%',
      price: 450,
      icon: <Zap className="w-3 h-3 text-emerald-500" />,
    },
    {
      id: 'addon-security',
      name: 'Enterprise Security Hardening & Pentest',
      badge: 'Certified',
      price: 550,
      icon: <ShieldCheck className="w-3 h-3 text-cyan-500" />,
    },
  ];

  const currentTotal =
    basePrice +
    addonsList
      .filter((a) => selectedAddons.includes(a.id))
      .reduce((sum, a) => sum + a.price, 0);

  const advanceAmount = Math.round(currentTotal * 0.3);

  const toggleAddon = (id: string) => {
    if (isSigned) return;
    if (selectedAddons.includes(id)) {
      setSelectedAddons(selectedAddons.filter((a) => a !== id));
    } else {
      setSelectedAddons([...selectedAddons, id]);
    }
  };

  // Canvas drawing helpers
  useEffect(() => {
    if (signMode === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = isDark ? '#38bdf8' : '#0284c7';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [signMode, isDark]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || isSigned) return;
    if ('touches' in e) {
      e.stopPropagation();
    }
    setIsDrawing(true);
    setHasDrawn(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.beginPath();
    ctx.moveTo((clientX - rect.left) * scaleX, (clientY - rect.top) * scaleY);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current || isSigned) return;
    if ('touches' in e) {
      e.stopPropagation();
    }
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.lineTo((clientX - rect.left) * scaleX, (clientY - rect.top) * scaleY);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasDrawn(false);
    }
  };

  const handleSignDemo = () => {
    setIsSigned(true);
    const now = new Date();
    setSignedTimestamp(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    confetti({
      particleCount: 90,
      spread: 75,
      origin: { y: 0.6 },
      colors: ['#f59e0b', '#10b981', '#38bdf8', '#fbbf24'],
    });
  };

  const resetDemo = () => {
    setIsSigned(false);
    clearCanvas();
  };

  return (
    <section
      className={`relative pt-32 sm:pt-36 pb-20 px-4 sm:px-8 overflow-hidden font-['Plus_Jakarta_Sans',sans-serif] transition-colors duration-300 ${
        isDark ? 'dot-grid-bg-dark bg-slate-950 text-slate-100' : 'dot-grid-bg-light bg-slate-50 text-slate-900'
      }`}
    >
      {/* Ambient Lighting Gradients */}
      <div
        className={`absolute top-1/4 left-1/2 -translate-x-1/2 w-[850px] h-[450px] rounded-full pointer-events-none -z-10 blur-[150px] ${
          isDark ? 'bg-amber-500/10' : 'bg-amber-400/20'
        }`}
      />
      <div
        className={`absolute top-[60%] left-[15%] w-[400px] h-[400px] rounded-full pointer-events-none -z-10 blur-[130px] ${
          isDark ? 'bg-emerald-500/8' : 'bg-emerald-400/15'
        }`}
      />

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
        {/* Left Column: Value Prop & High-Converting Pitch (Instantly Visible) */}
        <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
          {/* Floating Pill Badge */}
          <div
            className={`inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              isDark
                ? 'bg-slate-900/90 border-amber-500/30 text-amber-300'
                : 'bg-amber-50 border-amber-300/80 text-amber-900 shadow-sm'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            <span>The High-Converting Proposal & Invoicing Platform</span>
          </div>

          {/* Main Headline */}
          <h1
            className={`text-3.5xl sm:text-5xl lg:text-[3.5rem] font-extrabold tracking-tight font-['Outfit'] leading-[1.12] ${
              isDark ? 'text-white' : 'text-slate-950'
            }`}
          >
            Your Proposals.
            <br />
            <span className="bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 bg-clip-text text-transparent">
              Their Standing Ovation.
            </span>
          </h1>

          {/* Subtitle */}
          <p
            className={`text-sm sm:text-base max-w-xl leading-relaxed mx-auto lg:mx-0 ${
              isDark ? 'text-slate-300' : 'text-slate-700'
            }`}
          >
            Stop emailing flat, forgotten PDFs. Send{' '}
            <strong className={isDark ? 'text-white' : 'text-slate-950'}>
              interactive client portals
            </strong>{' '}
            with live package add-ons, instant touch-screen e-signatures, real-time view notifications, and dynamic scan-to-pay QR codes.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
            <button
              type="button"
              onClick={onStartFree}
              className="w-full sm:w-auto px-7 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-sm rounded-2xl shadow-xl shadow-amber-500/25 flex items-center justify-center space-x-2 transition-all transform hover:scale-[1.02] cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-slate-950" />
              <span>Create Your First Proposal (Free)</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <a
              href="#industries"
              className={`w-full sm:w-auto px-6 py-3.5 rounded-2xl text-sm font-bold border transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                isDark
                  ? 'bg-slate-900/70 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-sm'
              }`}
            >
              <span>Explore Industry Presets</span>
            </a>
          </div>

          {/* Social Proof Stats */}
          <div
            className={`pt-7 border-t grid grid-cols-3 gap-4 sm:gap-6 text-center lg:text-left ${
              isDark ? 'border-slate-800/80' : 'border-slate-200'
            }`}
          >
            <div>
              <h3 className={`text-xl sm:text-2xl font-bold font-mono ${isDark ? 'text-white' : 'text-slate-950'}`}>
                10,000+
              </h3>
              <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Proposals Created</p>
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold font-mono text-amber-500">
                $4.8M+
              </h3>
              <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Closed Deal Volume</p>
            </div>
            <div>
              <div className="flex items-center justify-center lg:justify-start space-x-0.5 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-current" />
                ))}
              </div>
              <p className={`text-[11px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>4.9/5 from 900+ Studios</p>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Proposal Widget with Mac Chrome Frame */}
        <div className="lg:col-span-6 relative perspective-container">
          {/* Floating live activity badge */}
          <div
            className={`absolute -top-3.5 right-4 z-20 px-3 py-1.5 rounded-full text-[10.5px] font-bold shadow-lg border flex items-center space-x-2 animate-float ${
              isDark
                ? 'bg-slate-900 text-emerald-300 border-emerald-500/40 shadow-emerald-950/40'
                : 'bg-white text-emerald-800 border-emerald-300 shadow-slate-200/80'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <Eye className="w-3.5 h-3.5 text-emerald-500" />
            <span>Client viewed proposal 2m ago</span>
          </div>

          {/* Interactive Card */}
          <div
            className={`tilt-card rounded-3xl shadow-2xl overflow-hidden border transition-all duration-300 animated-gradient-border ${
              isDark
                ? 'glass-dark text-slate-100'
                : 'glass-light text-slate-900'
            }`}
          >
            {/* Top Mac Chrome Header Bar */}
            <div
              className={`px-4 py-3 border-b flex items-center justify-between text-xs ${
                isDark ? 'bg-slate-950/90 border-slate-800' : 'bg-slate-100/95 border-slate-200'
              }`}
            >
              {/* Window Dots */}
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-rose-500 inline-block shadow-sm" />
                <span className="w-3 h-3 rounded-full bg-amber-400 inline-block shadow-sm" />
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block shadow-sm" />
              </div>

              {/* URL Address Bar */}
              <div
                className={`px-3 py-1 rounded-lg text-[10.5px] font-mono flex items-center space-x-1.5 border max-w-[200px] truncate ${
                  isDark
                    ? 'bg-slate-900/90 border-slate-800 text-slate-300'
                    : 'bg-white border-slate-300 text-slate-700 shadow-inner'
                }`}
              >
                <Lock className="w-3 h-3 text-emerald-500 shrink-0" />
                <span className="truncate">invoix.app/p/acme-q1</span>
              </div>

              {/* Live Badge */}
              <span
                className={`text-[9.5px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                  isSigned
                    ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-500 border-amber-500/30'
                }`}
              >
                {isSigned ? '✓ Signed' : 'Live Interactive'}
              </span>
            </div>

            {/* Proposal Body */}
            <div className="p-5 sm:p-6 space-y-4">
              {/* Proposal Header Meta */}
              <div className={`flex items-start justify-between border-b pb-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <div>
                  <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-amber-500 block font-['Outfit']">
                    Commercial Proposal
                  </span>
                  <h4 className={`text-base sm:text-lg font-bold font-['Outfit'] leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Full-Stack Next.js Platform Build
                  </h4>
                  <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Prepared for Acme International Corp
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-slate-400 block">EST-2026-08</span>
                  <span className="text-[10px] text-emerald-500 font-bold">Valid for 14 Days</span>
                </div>
              </div>

              {/* Core Fixed Line Item */}
              <div
                className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                  isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <div>
                    <span className={`font-semibold block ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                      Core Application Architecture & API
                    </span>
                    <span className="text-[9.5px] text-slate-400">Included Scope Base</span>
                  </div>
                </div>
                <span className={`font-mono font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>$3,500</span>
              </div>

              {/* Optional Upsell Add-ons */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-extrabold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Optional Add-ons (Toggle to calculate):
                  </span>
                  <span className="text-[10px] text-amber-500 font-bold">Try clicking!</span>
                </div>

                {addonsList.map((addon) => {
                  const isChecked = selectedAddons.includes(addon.id);
                  return (
                    <div
                      key={addon.id}
                      onClick={() => toggleAddon(addon.id)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all duration-200 select-none ${
                        isChecked
                          ? isDark
                            ? 'bg-slate-900/90 border-amber-500/50 shadow-md shadow-amber-500/5'
                            : 'bg-amber-50/90 border-amber-300 shadow-sm'
                          : isDark
                          ? 'bg-slate-950/40 border-slate-800/60 opacity-60 hover:opacity-90'
                          : 'bg-white border-slate-200 text-slate-700 opacity-70 hover:opacity-100 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                            isChecked
                              ? 'bg-amber-500 border-amber-500 text-slate-950'
                              : isDark ? 'border-slate-500 bg-transparent' : 'border-slate-400 bg-white'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <span className={`text-xs font-semibold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                              {addon.name}
                            </span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase bg-amber-500/15 text-amber-600 dark:text-amber-400">
                              {addon.badge}
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-xs text-amber-500">+${addon.price}</span>
                    </div>
                  );
                })}
              </div>

              {/* Total Investment Card — Perfectly Themed */}
              <div
                className={`p-3.5 rounded-xl border flex items-center justify-between transition-colors ${
                  isDark
                    ? 'bg-slate-950/90 border-slate-800 text-white'
                    : 'bg-gradient-to-br from-amber-50/90 via-orange-50/60 to-amber-50/90 border-amber-200/90 text-slate-950 shadow-sm'
                }`}
              >
                <div>
                  <span className={`text-[10px] font-extrabold uppercase tracking-wide block ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>
                    Total Investment Value
                  </span>
                  <span className={`text-[10.5px] font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                    30% Advance Booking: ${advanceAmount.toLocaleString()}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xl sm:text-2xl font-mono text-amber-500 font-black tracking-tight">
                    ${currentTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* E-Signature Approval Interaction */}
              {isSigned ? (
                <div
                  className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs animate-fadeIn ${
                    isDark
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    <div>
                      <p className="font-extrabold">Digitally Signed & Legally Approved!</p>
                      <p className="text-[10px] opacity-80">
                        Signatory: {signerName} • Verified at {signedTimestamp}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="p-1 bg-white rounded-lg border border-emerald-300 shrink-0 shadow-sm">
                      <QrCode className="w-6 h-6 text-slate-900" />
                    </div>
                    <button
                      type="button"
                      onClick={resetDemo}
                      className="px-2.5 py-1 text-[10.5px] font-bold rounded-lg border border-emerald-500/40 hover:bg-emerald-500/20 transition-colors flex items-center space-x-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {/* Switch Sign Mode */}
                  <div className="flex items-center justify-between text-[11px]">
                    <span className={`font-bold ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>Acceptance Signature:</span>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setSignMode('type')}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                          signMode === 'type'
                            ? 'bg-amber-500 text-slate-950'
                            : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Type Name
                      </button>
                      <button
                        type="button"
                        onClick={() => setSignMode('draw')}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                          signMode === 'draw'
                            ? 'bg-amber-500 text-slate-950'
                            : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Draw Signature
                      </button>
                    </div>
                  </div>

                  {signMode === 'type' ? (
                    <input
                      type="text"
                      placeholder="Type your full legal name..."
                      value={signerName}
                      onChange={(e) => setSignerName(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold border focus:outline-none transition-all ${
                        isDark
                          ? 'bg-slate-950/80 border-slate-700/80 text-slate-100 focus:border-amber-500/60'
                          : 'bg-white border-slate-300 text-slate-900 focus:border-amber-500 shadow-sm'
                      }`}
                    />
                  ) : (
                    <div className="relative">
                      <canvas
                        ref={canvasRef}
                        width={400}
                        height={65}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        className={`w-full h-[65px] rounded-xl border cursor-crosshair touch-none ${
                          isDark ? 'bg-slate-950/80 border-slate-700' : 'bg-white border-slate-300 shadow-sm'
                        }`}
                      />
                      {!hasDrawn && (
                        <span className="absolute inset-0 flex items-center justify-center text-[10.5px] text-slate-400 pointer-events-none italic">
                          ✍️ Draw signature with mouse or touch
                        </span>
                      )}
                      {hasDrawn && (
                        <button
                          type="button"
                          onClick={clearCanvas}
                          className="absolute right-2 top-2 text-[9.5px] text-slate-400 hover:text-slate-200 bg-slate-800/80 px-2 py-0.5 rounded cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleSignDemo}
                    className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold rounded-xl shadow-lg shadow-emerald-600/25 flex items-center justify-center space-x-2 transition-all transform hover:scale-[1.01] text-xs cursor-pointer"
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    <span>Approve & Sign Proposal Digitally</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

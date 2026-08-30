import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  ArrowRight,
  Check,
  Star,
  Zap,
  ShieldCheck,
  Layers,
  Code,
  Palette,
  Camera,
  FileText,
  QrCode,
  ExternalLink,
} from 'lucide-react';

interface LandingHeroProps {
  theme?: 'dark' | 'light';
  onStartFree: () => void;
}

type IndustryPresetKey = 'web_dev' | 'agency' | 'photo' | 'invoice';

interface IndustryPresetData {
  name: string;
  icon: React.ReactNode;
  studioName: string;
  clientName: string;
  projectTitle: string;
  basePrice: number;
  docType: 'QUOTATION' | 'INVOICE';
  items: { title: string; desc: string; amount: number }[];
  addons: { id: string; name: string; price: number; badge?: string }[];
}

const PRESET_OPTIONS: Record<IndustryPresetKey, IndustryPresetData> = {
  web_dev: {
    name: 'Web & Software',
    icon: <Code className="w-3.5 h-3.5" />,
    studioName: 'Apex Software Studio',
    clientName: 'Acme International Corp',
    projectTitle: 'Next.js 15 Platform & API Architecture',
    basePrice: 4500,
    docType: 'QUOTATION',
    items: [
      { title: 'System Architecture & Database Schema', desc: 'PostgreSQL + Prisma models', amount: 1500 },
      { title: 'Frontend UI/UX & Responsive Views', desc: 'React 19, Tailwind CSS, Dark/Light', amount: 1800 },
      { title: 'Payment Webhooks & Production Cloud Deploy', desc: 'Stripe/Razorpay + Vercel Edge', amount: 1200 },
    ],
    addons: [
      { id: 'seo', name: 'SEO & Structured Schema Architecture', price: 650, badge: 'Hot' },
      { id: 'devops', name: 'Priority 24/7 SLA & Cloud DevOps', price: 450 },
      { id: 'security', name: 'Enterprise Pentest & Security Audit', price: 550 },
    ],
  },
  agency: {
    name: 'Creative Agency',
    icon: <Palette className="w-3.5 h-3.5" />,
    studioName: 'Nexus Brand Agency',
    clientName: 'Luminary Ventures',
    projectTitle: 'Complete Brand Identity & Visual System',
    basePrice: 3800,
    docType: 'QUOTATION',
    items: [
      { title: 'Brand Discovery & Visual Positioning', desc: 'Competitor audit & moodboards', amount: 1200 },
      { title: 'Vector Logo Suite & Typography System', desc: 'Primary, Secondary, Monograms', amount: 1600 },
      { title: 'Design System & Social Media Kit', desc: 'Figma tokens, 20+ banner templates', amount: 1000 },
    ],
    addons: [
      { id: 'guidelines', name: 'Comprehensive 40-Page Brand Book', price: 750, badge: 'Popular' },
      { id: 'motion', name: '3D Animated Logo Stingers (4K)', price: 600 },
      { id: 'stationery', name: 'Luxury Print Stationery & Packaging', price: 450 },
    ],
  },
  photo: {
    name: 'Photo & Film',
    icon: <Camera className="w-3.5 h-3.5" />,
    studioName: 'Lumina Cine Studio',
    clientName: 'Sarah & Michael Wedding',
    projectTitle: 'Full-Day Signature Cinema & 4K Teaser',
    basePrice: 3200,
    docType: 'QUOTATION',
    items: [
      { title: 'Pre-Wedding Consultation & Location Scouting', desc: 'Detailed storyboard & timeline', amount: 500 },
      { title: 'Dual 4K Camera Coverage (10 Hours)', desc: 'Drone aerials & live audio capture', amount: 1800 },
      { title: 'Master Color Grading & 5-Min Teaser Film', desc: 'Licensed soundtrack & raw footage archive', amount: 900 },
    ],
    addons: [
      { id: 'drone', name: 'Extended Drone 4K Reel & Social Cuts', price: 450, badge: 'Popular' },
      { id: 'album', name: 'Handcrafted Italian Leather Photo Album', price: 800 },
      { id: 'express', name: '48-Hour Rush Delivery & Teaser', price: 500 },
    ],
  },
  invoice: {
    name: 'Tax Invoice',
    icon: <FileText className="w-3.5 h-3.5" />,
    studioName: 'Vanguard Digital Solutions',
    clientName: 'Horizon Global Tech LLC',
    projectTitle: 'Milestone 2 Delivery & Production Release',
    basePrice: 2800,
    docType: 'INVOICE',
    items: [
      { title: 'Sprint 3: Real-Time WebSockets Engine', desc: 'Zero-latency push notifications', amount: 1200 },
      { title: 'Sprint 4: Role-Based Access & OAuth2', desc: 'Multi-tenant auth and audit log', amount: 1100 },
      { title: 'Cloud Infrastructure & DB Optimization', desc: 'Redis caching and query indexing', amount: 500 },
    ],
    addons: [
      { id: 'support', name: '30-Day Post-Launch Bug Warranty', price: 350 },
      { id: 'analytics', name: 'Telemetry Dashboard & User Metrics', price: 450 },
      { id: 'docs', name: 'Interactive Swagger API Documentation', price: 300 },
    ],
  },
};

export const LandingHero: React.FC<LandingHeroProps> = ({
  theme = 'dark',
  onStartFree,
}) => {
  const isDark = theme === 'dark';

  const [activePreset, setActivePreset] = useState<IndustryPresetKey>('web_dev');
  const currentPresetData = PRESET_OPTIONS[activePreset];

  // Editable live state
  const [studioName, setStudioName] = useState(currentPresetData.studioName);
  const [clientName, setClientName] = useState(currentPresetData.clientName);
  const [projectTitle, setProjectTitle] = useState(currentPresetData.projectTitle);
  const [basePrice, setBasePrice] = useState(currentPresetData.basePrice);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([currentPresetData.addons[0]?.id || '']);

  // Switch preset helper
  const handleSelectPreset = (key: IndustryPresetKey) => {
    setActivePreset(key);
    const data = PRESET_OPTIONS[key];
    setStudioName(data.studioName);
    setClientName(data.clientName);
    setProjectTitle(data.projectTitle);
    setBasePrice(data.basePrice);
    setSelectedAddons([data.addons[0]?.id || '']);
  };

  const toggleAddon = (id: string) => {
    if (selectedAddons.includes(id)) {
      setSelectedAddons(selectedAddons.filter((a) => a !== id));
    } else {
      setSelectedAddons([...selectedAddons, id]);
    }
  };

  // Calculations
  const addonsTotal = currentPresetData.addons
    .filter((a) => selectedAddons.includes(a.id))
    .reduce((sum, a) => sum + a.price, 0);

  const totalInvestment = basePrice + addonsTotal;
  const advanceDeposit = Math.round(totalInvestment * 0.3);

  const handleLaunchStudio = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#f59e0b', '#10b981', '#38bdf8', '#fbbf24'],
    });
    onStartFree();
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

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
        {/* Left Column: Value Prop & High-Converting Pitch */}
        <div className="lg:col-span-5 space-y-6 text-center lg:text-left">
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
            className={`text-3.5xl sm:text-5xl lg:text-[3.25rem] font-extrabold tracking-tight font-['Outfit'] leading-[1.12] ${
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
              onClick={handleLaunchStudio}
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
              <span>Explore Templates</span>
            </a>
          </div>

          {/* Social Proof Stats */}
          <div
            className={`pt-6 border-t grid grid-cols-3 gap-4 sm:gap-6 text-center lg:text-left ${
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

        {/* Right Column: Interactive Mini Studio Playground ("Type & Watch Live") */}
        <div className="lg:col-span-7 relative">
          {/* Floating live sync badge */}
          <div
            className={`absolute -top-3.5 right-4 z-20 px-3 py-1.5 rounded-full text-[10.5px] font-bold shadow-lg border flex items-center space-x-2 ${
              isDark
                ? 'bg-slate-900 text-amber-300 border-amber-500/40 shadow-amber-950/40'
                : 'bg-white text-amber-800 border-amber-300 shadow-slate-200/80'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Live Interactive Studio Demo</span>
          </div>

          {/* Mini Studio Container Window */}
          <div
            className={`rounded-3xl shadow-2xl overflow-hidden border transition-all duration-300 ${
              isDark
                ? 'bg-slate-950/95 border-slate-800 text-slate-100 shadow-black/60'
                : 'bg-white border-slate-200 text-slate-900 shadow-xl'
            }`}
          >
            {/* Top Mac Window Chrome Bar */}
            <div
              className={`px-4 py-3 border-b flex flex-wrap items-center justify-between gap-2 text-xs ${
                isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-100 border-slate-200'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-rose-500 inline-block shadow-sm" />
                <span className="w-3 h-3 rounded-full bg-amber-400 inline-block shadow-sm" />
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block shadow-sm" />
                <span className="text-[11px] font-mono font-bold text-slate-400 ml-2 hidden sm:inline">
                  invoix.app/studio
                </span>
              </div>

              {/* Industry Preset Selector Pills */}
              <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar py-0.5">
                {(Object.keys(PRESET_OPTIONS) as IndustryPresetKey[]).map((key) => {
                  const opt = PRESET_OPTIONS[key];
                  const isActive = activePreset === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleSelectPreset(key)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                        isActive
                          ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                          : isDark
                          ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                      }`}
                    >
                      {opt.icon}
                      <span>{opt.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Split Playground Workspace: Left Form Inputs + Right Live A4 Sheet */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
              {/* Left Mini Form Controls (5 cols) */}
              <div
                className={`md:col-span-5 p-4 sm:p-5 border-b md:border-b-0 md:border-r space-y-3.5 text-xs ${
                  isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50/70 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between pb-1 border-b border-slate-800/40">
                  <span className="font-bold text-[11px] font-['Outfit'] uppercase tracking-wider text-amber-500 flex items-center space-x-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Live Form Editor</span>
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono">Type to see updates</span>
                </div>

                {/* Input: Studio Name */}
                <div className="space-y-1">
                  <label className={`text-[10.5px] font-bold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Your Studio Name:
                  </label>
                  <input
                    type="text"
                    value={studioName}
                    onChange={(e) => setStudioName(e.target.value)}
                    className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold border outline-none transition-all ${
                      isDark
                        ? 'bg-slate-900 border-slate-700 focus:border-amber-500 text-slate-100'
                        : 'bg-white border-slate-300 focus:border-amber-500 text-slate-900'
                    }`}
                  />
                </div>

                {/* Input: Client Name */}
                <div className="space-y-1">
                  <label className={`text-[10.5px] font-bold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Client / Customer Name:
                  </label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold border outline-none transition-all ${
                      isDark
                        ? 'bg-slate-900 border-slate-700 focus:border-amber-500 text-slate-100'
                        : 'bg-white border-slate-300 focus:border-amber-500 text-slate-900'
                    }`}
                  />
                </div>

                {/* Input: Project Scope Title */}
                <div className="space-y-1">
                  <label className={`text-[10.5px] font-bold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Project Scope Title:
                  </label>
                  <input
                    type="text"
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold border outline-none transition-all ${
                      isDark
                        ? 'bg-slate-900 border-slate-700 focus:border-amber-500 text-slate-100'
                        : 'bg-white border-slate-300 focus:border-amber-500 text-slate-900'
                    }`}
                  />
                </div>

                {/* Slider / Budget */}
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-[10.5px]">
                    <span className={`font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Base Rate:</span>
                    <span className="font-mono font-extrabold text-amber-500">${basePrice.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min={1000}
                    max={10000}
                    step={100}
                    value={basePrice}
                    onChange={(e) => setBasePrice(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>

                {/* Optional Scope Upsell Toggles */}
                <div className="space-y-1.5 pt-1">
                  <span className={`text-[10px] font-extrabold uppercase tracking-wider block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Upsell Add-ons:
                  </span>
                  {currentPresetData.addons.map((addon) => {
                    const isChecked = selectedAddons.includes(addon.id);
                    return (
                      <div
                        key={addon.id}
                        onClick={() => toggleAddon(addon.id)}
                        className={`p-2 rounded-lg border flex items-center justify-between cursor-pointer transition-all select-none ${
                          isChecked
                            ? isDark
                              ? 'bg-amber-500/15 border-amber-500/50 text-amber-200'
                              : 'bg-amber-50 border-amber-300 text-amber-900'
                            : isDark
                            ? 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200'
                            : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <div
                            className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
                              isChecked
                                ? 'bg-amber-500 border-amber-500 text-slate-950'
                                : 'border-slate-500 bg-transparent'
                            }`}
                          >
                            {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                          <span className="text-[10.5px] truncate font-medium">{addon.name}</span>
                        </div>
                        <span className="font-mono font-bold text-[10px] text-amber-500 shrink-0 ml-1">
                          +${addon.price}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Live Rendered A4 Document Canvas (7 cols) */}
              <div
                className={`md:col-span-7 p-4 sm:p-5 flex flex-col justify-between space-y-4 ${
                  isDark ? 'bg-slate-900/60' : 'bg-slate-100/60'
                }`}
              >
                {/* Mini A4 Document Sheet */}
                <div
                  className={`p-4 sm:p-5 rounded-2xl border shadow-lg space-y-3.5 transition-all relative ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-slate-100 shadow-black/40'
                      : 'bg-white border-slate-200 text-slate-900 shadow-slate-200/50'
                  }`}
                >
                  {/* Top Sheet Header */}
                  <div className="flex items-start justify-between border-b border-slate-800/60 pb-3">
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="p-1 rounded bg-amber-500/20 text-amber-400 font-bold text-xs">
                          {currentPresetData.icon}
                        </span>
                        <h4 className="font-bold text-xs sm:text-sm font-['Outfit'] tracking-wide truncate max-w-[150px] sm:max-w-[200px] text-amber-300">
                          {studioName || 'Your Studio Name'}
                        </h4>
                      </div>
                      <p className="text-[9.5px] text-slate-400 mt-0.5">Commercial Service Proposal</p>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          currentPresetData.docType === 'INVOICE'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {currentPresetData.docType}
                      </span>
                      <span className="text-[9px] text-emerald-400 font-bold block mt-1">✓ Live Sync Active</span>
                    </div>
                  </div>

                  {/* Billed To / Client Banner */}
                  <div
                    className={`p-2.5 rounded-xl border text-xs ${
                      isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block font-mono">
                          Billed To / Client:
                        </span>
                        <span className="font-bold text-xs sm:text-sm text-slate-100 block transition-all">
                          {clientName || 'Client Name'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block font-mono">
                          Project Scope:
                        </span>
                        <span className="font-semibold text-[11px] text-amber-400 truncate max-w-[140px] block">
                          {projectTitle || 'Project Title'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Line Items Table */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[9px] uppercase tracking-wider font-bold text-slate-400 px-1">
                      <span>Scope Deliverables</span>
                      <span>Amount</span>
                    </div>
                    {currentPresetData.items.map((item, idx) => (
                      <div
                        key={idx}
                        className={`p-2 rounded-lg border text-xs flex items-center justify-between ${
                          isDark ? 'bg-slate-900/40 border-slate-800/80' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="truncate mr-2">
                          <span className="font-semibold block truncate text-[11px]">{item.title}</span>
                          <span className="text-[9px] text-slate-400 block truncate">{item.desc}</span>
                        </div>
                        <span className="font-mono font-bold text-xs text-slate-200 shrink-0">
                          ${item.amount.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Total Investment & Advance Breakdown */}
                  <div
                    className={`p-3 rounded-xl border flex items-center justify-between ${
                      isDark
                        ? 'bg-gradient-to-r from-amber-950/40 to-slate-900 border-amber-500/30'
                        : 'bg-amber-50 border-amber-200 text-slate-900'
                    }`}
                  >
                    <div>
                      <span className="text-[9.5px] uppercase font-extrabold tracking-wider text-slate-400 block">
                        Total Deal Investment
                      </span>
                      <span className="text-[10px] font-bold text-emerald-400">
                        30% Advance Deposit: ${advanceDeposit.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-lg sm:text-xl font-mono font-black text-amber-400">
                        ${totalInvestment.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* E-Signature & Scan-to-Pay Badges */}
                  <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400 border-t border-slate-800/50">
                    <div className="flex items-center space-x-1.5 text-emerald-400 font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>E-Signature Enabled</span>
                    </div>
                    <div className="flex items-center space-x-1 text-slate-300 font-mono">
                      <QrCode className="w-3.5 h-3.5 text-amber-400" />
                      <span>Instant UPI / QR Pay</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Launch Button CTA */}
                <button
                  type="button"
                  onClick={handleLaunchStudio}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2 transition-all transform hover:scale-[1.01] cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 fill-slate-950" />
                  <span>Open This in Full Studio (Free)</span>
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};


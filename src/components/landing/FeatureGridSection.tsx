import {
  CheckSquare,
  PenTool,
  QrCode,
  Globe2,
  Eye,
  Share2,
} from 'lucide-react';
import { useScrollReveal } from '../../hooks/useScrollReveal';

export const FeatureGridSection: React.FC = () => {
  const sectionRef = useScrollReveal();

  const features = [
    {
      icon: <CheckSquare className="w-5 h-5" />,
      title: 'Interactive Client Upsells',
      description:
        'Let your clients toggle optional add-on services on their phone. Subtotals and deposit requirements update automatically in real-time.',
      iconBg: 'from-amber-500/20 to-amber-600/10',
      iconColor: 'text-amber-400',
      glowClass: 'hover-glow-amber',
    },
    {
      icon: <PenTool className="w-5 h-5" />,
      title: 'Built-in Digital E-Signatures',
      description:
        'Close deals on the spot with digital canvas signatures, legal signatory verification, and celebratory acceptance feedback.',
      iconBg: 'from-emerald-500/20 to-emerald-600/10',
      iconColor: 'text-emerald-400',
      glowClass: 'hover-glow-emerald',
    },
    {
      icon: <QrCode className="w-5 h-5" />,
      title: 'Offline Dynamic Payment QR',
      description:
        'Embed crisp QR codes for India UPI payments, Stripe links, and PayPal checkout without requiring third-party API keys.',
      iconBg: 'from-blue-500/20 to-blue-600/10',
      iconColor: 'text-blue-400',
      glowClass: 'hover-glow-blue',
    },
    {
      icon: <Globe2 className="w-5 h-5" />,
      title: 'Multi-Currency & Global Taxes',
      description:
        'Native formatting for USD, INR, EUR, GBP, AED, CAD, AUD, SGD. Compliant GST, VAT, and Sales Tax calculation engines.',
      iconBg: 'from-purple-500/20 to-purple-600/10',
      iconColor: 'text-purple-400',
      glowClass: 'hover-glow-purple',
    },
    {
      icon: <Eye className="w-5 h-5" />,
      title: 'Client View Tracking & Vault',
      description:
        'Get notified when a client opens your proposal. Save drafts locally or automatically synchronize to Supabase PostgreSQL.',
      iconBg: 'from-teal-500/20 to-teal-600/10',
      iconColor: 'text-teal-400',
      glowClass: 'hover-glow-teal',
    },
    {
      icon: <Share2 className="w-5 h-5" />,
      title: 'WhatsApp & Vector A4 PDF',
      description:
        'Generate richly formatted WhatsApp proposal summaries with direct online links, or export pixel-perfect multi-page A4 PDFs in seconds.',
      iconBg: 'from-rose-500/20 to-rose-600/10',
      iconColor: 'text-rose-400',
      glowClass: 'hover-glow-rose',
    },
  ];

  return (
    <section id="features" ref={sectionRef} className="py-28 px-4 sm:px-8 font-['Plus_Jakarta_Sans',sans-serif] relative">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-amber-500/4 blur-[140px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto space-y-16">
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto reveal-on-scroll">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-[0.2em] font-['Outfit']">
            Engineered For Speed & Conversion
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-100 font-['Outfit'] leading-tight">
            Everything You Need To Close Deals Faster
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed max-w-lg mx-auto">
            Replace clunky spreadsheets and static PDF attachments with responsive, interactive proposals your clients will love.
          </p>
        </div>

        {/* 6 Feature Grid — staggered reveal */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div
              key={i}
              className={`reveal-on-scroll reveal-delay-${i + 1} glass rounded-2xl p-7 space-y-4 transition-all duration-300 hover:-translate-y-1.5 group cursor-default ${f.glowClass}`}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.iconBg} border border-slate-700/50 flex items-center justify-center ${f.iconColor} group-hover:scale-110 transition-transform duration-300`}>
                {f.icon}
              </div>
              <h3 className="text-[15px] font-bold text-slate-100 font-['Outfit']">{f.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

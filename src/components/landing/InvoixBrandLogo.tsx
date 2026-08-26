import React from 'react';

interface InvoixBrandLogoProps {
  theme?: 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg';
  showQuote?: boolean;
  className?: string;
  onClick?: () => void;
}

export const InvoixBrandLogo: React.FC<InvoixBrandLogoProps> = ({
  theme = 'dark',
  size = 'md',
  showQuote = true,
  className = '',
  onClick,
}) => {
  const isDark = theme === 'dark';

  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center space-x-3 select-none cursor-pointer group ${className}`}
    >
      {/* Illuminated Vector Monogram Mark */}
      <div className="relative shrink-0">
        {/* Ambient Glow */}
        <div
          className={`absolute -inset-1 rounded-2xl blur-sm transition-opacity duration-300 ${
            isDark
              ? 'bg-gradient-to-br from-amber-500/40 via-amber-400/20 to-emerald-500/30 opacity-70 group-hover:opacity-100'
              : 'bg-gradient-to-br from-amber-500/20 via-amber-400/10 to-emerald-500/20 opacity-40 group-hover:opacity-80'
          }`}
        />

        {/* Monogram Icon Container */}
        <div
          className={`relative ${iconSizes[size]} rounded-2xl flex items-center justify-center p-1.5 shadow-xl transition-all duration-300 group-hover:scale-105 ${
            isDark
              ? 'bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-700/80 shadow-amber-500/10'
              : 'bg-white border border-slate-200/90 shadow-slate-300/50'
          }`}
        >
          <svg viewBox="0 0 512 512" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="logoPrimaryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>
              <linearGradient id="logoAccentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>
            {/* Monogram geometry */}
            <g transform="translate(48, 48)">
              <rect x="76" y="280" width="280" height="56" rx="28" transform="rotate(-45 76 280)" fill="url(#logoPrimaryGrad)" />
              <rect x="274" y="82" width="130" height="56" rx="28" transform="rotate(45 274 82)" fill="url(#logoPrimaryGrad)" />
              <path d="M96 230 L168 302 L320 150" fill="none" stroke="url(#logoAccentGrad)" strokeWidth="52" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          </svg>
        </div>
      </div>

      {/* Brand Logotype & Slogan Quote */}
      <div className="flex flex-col">
        <div className="flex items-center space-x-2">
          <span
            className={`font-extrabold tracking-tight font-['Outfit'] leading-none ${textSizes[size]} ${
              isDark ? 'text-slate-100' : 'text-slate-900'
            }`}
          >
            Invoix
            <span className="text-amber-500 font-black">.</span>
          </span>
          <span
            className={`text-[9.5px] px-1.5 py-0.5 rounded-md font-extrabold tracking-wide uppercase leading-none border transition-colors ${
              isDark
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
          >
            Studio
          </span>
        </div>

        {showQuote && (
          <p
            className={`text-[10px] font-medium tracking-normal mt-0.5 whitespace-nowrap transition-colors ${
              isDark ? 'text-amber-300/90' : 'text-amber-700'
            }`}
          >
            Your Proposals. Their Applause<span className="text-amber-500">.</span>
          </p>
        )}
      </div>
    </div>
  );
};

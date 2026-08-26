import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { InvoixBrandLogo } from './InvoixBrandLogo';
import { ArrowRight, User, Crown, Sun, Moon } from 'lucide-react';

interface LandingHeaderProps {
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  onLaunchStudio: () => void;
  onOpenAuth: () => void;
  onOpenAdmin: () => void;
}

export const LandingHeader: React.FC<LandingHeaderProps> = ({
  theme = 'dark',
  onToggleTheme,
  onLaunchStudio,
  onOpenAuth,
  onOpenAdmin,
}) => {
  const { user, profile, isAdmin } = useAuth();
  const isDark = theme === 'dark';

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b px-4 sm:px-8 py-3 select-none font-['Plus_Jakarta_Sans',sans-serif] transition-colors duration-300 ${
        isDark
          ? 'bg-slate-950/85 border-slate-800/80 text-slate-100'
          : 'bg-white/85 border-slate-200/90 text-slate-900 shadow-sm shadow-slate-200/40'
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo & Illuminated Monogram */}
        <InvoixBrandLogo
          theme={theme}
          size="md"
          showQuote={true}
          onClick={onLaunchStudio}
        />

        {/* Center Navigation Links */}
        <nav
          className={`hidden md:flex items-center space-x-8 text-xs font-semibold transition-colors ${
            isDark ? 'text-slate-300' : 'text-slate-600'
          }`}
        >
          <a href="#features" className="hover:text-amber-500 transition-colors">
            Features
          </a>
          <a href="#industries" className="hover:text-amber-500 transition-colors">
            Industries
          </a>
          <a href="#pricing" className="hover:text-amber-500 transition-colors">
            Pricing
          </a>
          <a href="#faq" className="hover:text-amber-500 transition-colors">
            FAQ
          </a>
        </nav>

        {/* Right CTA Actions */}
        <div className="flex items-center space-x-2.5 sm:space-x-3">
          {/* Light / Dark Theme Toggle */}
          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
              className={`p-2 rounded-xl border text-xs transition-all cursor-pointer flex items-center justify-center ${
                isDark
                  ? 'bg-slate-900 hover:bg-slate-800 text-amber-400 border-slate-700/80 hover:border-amber-500/40'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300/80 hover:text-amber-600'
              }`}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          )}

          {isAdmin && (
            <button
              type="button"
              onClick={onOpenAdmin}
              className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 text-xs font-semibold rounded-xl border border-amber-500/30 transition-all cursor-pointer"
            >
              <Crown className="w-3.5 h-3.5" />
              <span>Admin Panel</span>
            </button>
          )}

          {user ? (
            <button
              type="button"
              onClick={onOpenAuth}
              className={`flex items-center space-x-2 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                isDark
                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
              }`}
            >
              <User className="w-3.5 h-3.5 text-amber-500" />
              <span className="max-w-[110px] truncate">{profile?.business_name || user.email?.split('@')[0]}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className={`text-xs font-semibold px-3 py-1.5 transition-colors cursor-pointer ${
                isDark ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              Sign In
            </button>
          )}

          <button
            type="button"
            onClick={onLaunchStudio}
            className="flex items-center space-x-1.5 sm:space-x-2 px-3.5 py-2 sm:px-4 sm:py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all cursor-pointer shrink-0"
          >
            <span>Launch Studio</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </header>
  );
};

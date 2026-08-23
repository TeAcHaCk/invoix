import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ArrowRight, User, Crown } from 'lucide-react';

interface LandingHeaderProps {
  onLaunchStudio: () => void;
  onOpenAuth: () => void;
  onOpenAdmin: () => void;
}

export const LandingHeader: React.FC<LandingHeaderProps> = ({
  onLaunchStudio,
  onOpenAuth,
  onOpenAdmin,
}) => {
  const { user, profile, isAdmin } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-lg border-b border-slate-800/80 px-4 sm:px-8 py-3.5 select-none font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={onLaunchStudio}>
          <div className="p-1 rounded-xl bg-white/95 shadow-lg flex items-center justify-center">
            <img src="/invoix-logo.png" alt="Invoix Logo" className="h-7 max-w-[120px] object-contain" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-base font-extrabold text-slate-100 tracking-tight font-['Outfit']">
                Invoix
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded font-bold uppercase">
                Studio
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">Universal Proposals & Invoices</p>
          </div>
        </div>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center space-x-8 text-xs font-semibold text-slate-300">
          <a href="#features" className="hover:text-amber-400 transition-colors">
            Features
          </a>
          <a href="#industries" className="hover:text-amber-400 transition-colors">
            Industries
          </a>
          <a href="#pricing" className="hover:text-amber-400 transition-colors">
            Pricing
          </a>
          <a href="#faq" className="hover:text-amber-400 transition-colors">
            FAQ
          </a>
        </nav>

        {/* Right CTA Actions */}
        <div className="flex items-center space-x-3">
          {isAdmin && (
            <button
              type="button"
              onClick={onOpenAdmin}
              className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold rounded-xl border border-amber-500/30 transition-all"
            >
              <Crown className="w-3.5 h-3.5" />
              <span>Admin Panel</span>
            </button>
          )}

          {user ? (
            <button
              type="button"
              onClick={onOpenAuth}
              className="flex items-center space-x-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all"
            >
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span className="max-w-[110px] truncate">{profile?.business_name || user.email?.split('@')[0]}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5"
            >
              Sign In
            </button>
          )}

          <button
            type="button"
            onClick={onLaunchStudio}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all cursor-pointer"
          >
            <span>Launch Studio</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </header>
  );
};

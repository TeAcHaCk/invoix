import React, { useState, useRef, useEffect } from 'react';
import type { QuotationDocument } from '../types';
import { INDUSTRY_PRESETS } from '../constants/industryPresets';
import { useAuth } from '../context/AuthContext';
import { useInstallApp } from './InstallAppPrompt';
import {
  Download,
  Printer,
  Share2,
  Save,
  Archive,
  Settings,
  Sparkles,
  Eye,
  Plus,
  Link,
  Check,
  User,
  Cloud,
  CloudOff,
  Crown,
  Globe,
  ChevronDown,
  MoreHorizontal,
} from 'lucide-react';

interface NavbarProps {
  document: QuotationDocument;
  onExportPdf: () => void;
  onPrint: () => void;
  onOpenWhatsApp: () => void;
  onOpenClientInteractive: () => void;
  onSaveToVault: () => void;
  onOpenVault: () => void;
  onOpenSettings: () => void;
  onOpenAuth: () => void;
  onOpenAdmin?: () => void;
  onNavigateToHome?: () => void;
  onResetSample?: () => void;
  onNewDocument?: () => void;
  isExporting: boolean;
  onToggleWatermark: () => void;
}

// Dropdown hook
function useDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return { isOpen, setIsOpen, ref };
}

export const Navbar: React.FC<NavbarProps> = ({
  document: doc,
  onExportPdf,
  onPrint,
  onOpenWhatsApp,
  onOpenClientInteractive,
  onSaveToVault,
  onOpenVault,
  onOpenSettings,
  onOpenAuth,
  onOpenAdmin,
  onNavigateToHome,
  onNewDocument,
  isExporting,
  onToggleWatermark,
}) => {
  const { user, profile, isAdmin, isCloudConnected } = useAuth();
  const { canInstall, triggerInstall } = useInstallApp();
  const [copiedLink, setCopiedLink] = useState(false);
  const preset = INDUSTRY_PRESETS[doc.industry] || INDUSTRY_PRESETS.creative_agency;
  const shareDropdown = useDropdown();
  const moreDropdown = useDropdown();

  const handleCopyPublicLink = () => {
    const publicUrl = `${window.location.origin}/?view=${doc.id}`;
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
    shareDropdown.setIsOpen(false);
  };

  return (
    <header className="bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/60 sticky top-0 z-40 px-4 lg:px-8 py-3 select-none font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="max-w-[1700px] mx-auto flex items-center justify-between gap-4">
        {/* Left: Studio Brand & Title */}
        <div className="flex items-center space-x-2.5 min-w-0 shrink">
          {onNavigateToHome && (
            <button
              type="button"
              onClick={onNavigateToHome}
              className="p-1.5 rounded-xl glass text-slate-400 hover:text-amber-400 transition-colors hidden sm:flex items-center space-x-1 cursor-pointer shrink-0"
              title="Return to Landing Page"
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="text-[10.5px] font-semibold">Home</span>
            </button>
          )}

          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 p-0.5 shadow-lg shadow-amber-500/20 flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-base sm:text-lg">
              {preset.icon || '💼'}
            </div>
          </div>
          <div className="min-w-0 max-w-[130px] sm:max-w-none">
            <div className="flex items-center space-x-1.5">
              <h1 className="text-xs sm:text-sm md:text-base font-bold text-amber-100 tracking-wide font-['Outfit'] truncate">
                {doc.studio.name || 'INVOIX STUDIO'}
              </h1>
              <span
                className={`hidden sm:inline-flex text-[9.5px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 ${
                  doc.type === 'INVOICE'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}
              >
                {doc.type} Mode
              </span>

              {/* Cloud Sync Status Indicator */}
              <div
                className={`hidden md:flex items-center space-x-1 text-[10px] px-2 py-0.5 rounded-full border shrink-0 ${
                  user && isCloudConnected
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                }`}
                title={user ? 'Synced with Supabase Cloud' : 'Local storage mode'}
              >
                {user ? (
                  <>
                    <Cloud className="w-3 h-3 text-emerald-400" />
                    <span>Cloud Active</span>
                  </>
                ) : (
                  <>
                    <CloudOff className="w-3 h-3 text-amber-400" />
                    <span>Local Mode</span>
                  </>
                )}
              </div>
            </div>
            <p className="text-[10px] text-slate-400 font-medium hidden sm:block truncate">
              {doc.studio.tagline || 'Universal Multi-Industry Proposal & Invoicing Platform'}
            </p>
          </div>
        </div>

        {/* Right: Grouped Actions */}
        {/* Right: Grouped Actions */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
          {/* === PRIMARY: Save (Desktop only; on mobile accessible via More dropdown) === */}
          <button
            type="button"
            onClick={onSaveToVault}
            className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 glass hover:bg-slate-800/70 text-slate-200 text-xs font-semibold rounded-xl transition-all cursor-pointer"
            title="Save draft to vault & cloud"
          >
            <Save className="w-3.5 h-3.5 text-emerald-400" />
            <span>Save</span>
          </button>

          {/* === SHARE DROPDOWN === */}
          <div ref={shareDropdown.ref} className="relative">
            <button
              type="button"
              onClick={() => shareDropdown.setIsOpen(!shareDropdown.isOpen)}
              className="flex items-center space-x-1 px-2.5 py-1.5 sm:px-3.5 sm:py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-bold rounded-xl border border-emerald-500/30 transition-all cursor-pointer"
              title="Share quotation link or WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Share</span>
              <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${shareDropdown.isOpen ? 'rotate-180' : ''}`} />
            </button>

            {shareDropdown.isOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 glass rounded-2xl p-2 shadow-2xl shadow-black/40 border border-slate-700/50 z-50 modal-enter">
                <button
                  type="button"
                  onClick={handleCopyPublicLink}
                  className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs text-slate-200 hover:bg-slate-800/60 transition-colors cursor-pointer"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Link className="w-4 h-4 text-slate-400" />}
                  <span>{copiedLink ? 'Link Copied!' : 'Copy Client Link'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => { onOpenClientInteractive(); shareDropdown.setIsOpen(false); }}
                  className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs text-slate-200 hover:bg-slate-800/60 transition-colors cursor-pointer"
                >
                  <Eye className="w-4 h-4 text-emerald-400" />
                  <span>Interactive Preview</span>
                </button>
                <button
                  type="button"
                  onClick={() => { onOpenWhatsApp(); shareDropdown.setIsOpen(false); }}
                  className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs text-slate-200 hover:bg-slate-800/60 transition-colors cursor-pointer"
                >
                  <Share2 className="w-4 h-4 text-emerald-400" />
                  <span>Share via WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={() => { onPrint(); shareDropdown.setIsOpen(false); }}
                  className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs text-slate-200 hover:bg-slate-800/60 transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-slate-400" />
                  <span>Print Document</span>
                </button>
              </div>
            )}
          </div>

          {/* === PRIMARY: PDF Export === */}
          <button
            type="button"
            onClick={onExportPdf}
            disabled={isExporting}
            className="flex items-center space-x-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-extrabold rounded-xl shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 cursor-pointer"
            title="Download crisp A4 PDF"
          >
            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{isExporting ? '...' : 'PDF'}</span>
          </button>

          {/* === MORE DROPDOWN (Document Management & Mobile Settings) === */}
          <div ref={moreDropdown.ref} className="relative">
            <button
              type="button"
              onClick={() => moreDropdown.setIsOpen(!moreDropdown.isOpen)}
              className="p-1.5 sm:p-2 glass hover:bg-slate-800/70 text-slate-400 hover:text-slate-200 rounded-xl transition-colors cursor-pointer"
              title="More options"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {moreDropdown.isOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 glass rounded-2xl p-2 shadow-2xl shadow-black/40 border border-slate-700/50 z-50 modal-enter">
                <button
                  type="button"
                  onClick={() => { onSaveToVault(); moreDropdown.setIsOpen(false); }}
                  className="sm:hidden w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs text-slate-200 hover:bg-slate-800/60 transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4 text-emerald-400" />
                  <span>Save to Vault</span>
                </button>

                {onNewDocument && (
                  <button
                    type="button"
                    onClick={() => { onNewDocument(); moreDropdown.setIsOpen(false); }}
                    className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs text-slate-200 hover:bg-slate-800/60 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-amber-400" />
                    <span>New Document</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => { onOpenVault(); moreDropdown.setIsOpen(false); }}
                  className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs text-slate-200 hover:bg-slate-800/60 transition-colors cursor-pointer"
                >
                  <Archive className="w-4 h-4 text-amber-400" />
                  <span>Document Vault</span>
                </button>

                <button
                  type="button"
                  onClick={() => { onOpenSettings(); moreDropdown.setIsOpen(false); }}
                  className="sm:hidden w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs text-slate-200 hover:bg-slate-800/60 transition-colors cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span>Business Settings</span>
                </button>

                {canInstall && (
                  <button
                    type="button"
                    onClick={() => { triggerInstall(); moreDropdown.setIsOpen(false); }}
                    className="md:hidden w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs text-amber-300 hover:bg-slate-800/60 transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-amber-400" />
                    <span>Install Invoix App</span>
                  </button>
                )}

                {isAdmin && onOpenAdmin && (
                  <button
                    type="button"
                    onClick={() => { onOpenAdmin(); moreDropdown.setIsOpen(false); }}
                    className="md:hidden w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs text-amber-300 hover:bg-slate-800/60 transition-colors cursor-pointer"
                  >
                    <Crown className="w-4 h-4 text-amber-400" />
                    <span>Super Admin Panel</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => { onToggleWatermark(); moreDropdown.setIsOpen(false); }}
                  className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs text-slate-200 hover:bg-slate-800/60 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Watermark: {doc.watermark.enabled ? 'ON' : 'OFF'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="w-px h-5 bg-slate-800 hidden sm:block" />

          {/* === INSTALL PWA APP BUTTON (Desktop) === */}
          {canInstall && (
            <button
              type="button"
              onClick={triggerInstall}
              className="hidden md:flex p-2 bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/30 rounded-xl transition-colors items-center space-x-1.5 cursor-pointer"
              title="Install Invoix Desktop/Mobile App"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span className="text-[10px] font-bold uppercase hidden lg:inline font-['Outfit']">Install App</span>
            </button>
          )}

          {/* === ACCOUNT CLUSTER === */}
          {isAdmin && onOpenAdmin && (
            <button
              type="button"
              onClick={onOpenAdmin}
              className="hidden md:flex p-2 bg-gradient-to-br from-amber-400/15 to-amber-600/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 rounded-xl transition-colors items-center space-x-1 cursor-pointer"
              title="Open SaaS Super Admin Control Panel"
            >
              <Crown className="w-4 h-4 text-amber-400" />
              <span className="text-[10px] font-bold uppercase hidden lg:inline font-['Outfit']">Admin</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenSettings}
            className="hidden sm:flex p-2 text-slate-400 hover:text-amber-300 hover:bg-slate-800/50 rounded-xl transition-colors cursor-pointer"
            title="Business & Profile Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onOpenAuth}
            className={`p-1.5 sm:p-2 rounded-xl border transition-colors flex items-center space-x-1.5 cursor-pointer ${
              user
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25'
                : 'glass text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
            title={user ? `Signed in as ${user.email}` : 'Sign In / Connect Cloud'}
          >
            <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            {user && (
              <span className="text-[11px] font-bold hidden xl:inline max-w-[80px] truncate">
                {profile?.business_name || user.email?.split('@')[0]}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

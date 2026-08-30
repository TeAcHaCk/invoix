import React, { useState, useRef, useEffect } from 'react';
import type { QuotationDocument } from '../types';
import { INDUSTRY_PRESETS } from '../constants/industryPresets';
import { useAuth } from '../context/AuthContext';
import { isPaidPlan } from '../utils/planLimits';
import { getShareLinkState } from '../services/documentService';
import { auditDocument, countBlocking } from '../utils/documentAudit';
import {
  Download,
  Printer,
  Share2,
  Save,
  Archive,
  Settings,
  Sparkles,
  Eye,
  Edit3,
  Columns,
  Plus,
  Link,
  Check,
  User,
  Crown,
  Globe,
  ChevronDown,
  MoreHorizontal,
  Zap,
  Lock,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface NavbarProps {
  document: QuotationDocument;
  viewMode?: 'split' | 'editor' | 'preview';
  onViewModeChange?: (mode: 'split' | 'editor' | 'preview') => void;
  saveStatus?: 'saved' | 'saving' | 'error';
  lastSavedTime?: Date | null;
  onExportPdf: (quality?: 'text' | 'image') => void;
  onPrint: () => void;
  onOpenWhatsApp: () => void;
  onOpenClientInteractive: () => void;
  onSaveToVault: () => void;
  onOpenVault: () => void;
  onOpenSettings: () => void;
  onOpenAuth: () => void;
  onOpenAdmin?: () => void;
  onOpenUpgrade?: (plan?: 'pro' | 'agency') => void;
  onOpenHealth?: () => void;
  onNavigateToHome?: () => void;
  onResetSample?: () => void;
  onNewDocument?: () => void;
  onUpdateTitle?: (newTitle: string) => void;
  isExporting: boolean;
  onToggleWatermark: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  document: doc,
  viewMode = 'split',
  onViewModeChange,
  saveStatus = 'saved',
  lastSavedTime,
  onExportPdf,
  onPrint,
  onOpenWhatsApp,
  onOpenClientInteractive,
  onSaveToVault,
  onOpenVault,
  onOpenSettings,
  onOpenAuth,
  onOpenAdmin,
  onOpenUpgrade,
  onOpenHealth,
  onNavigateToHome,
  onResetSample,
  onNewDocument,
  onUpdateTitle,
  isExporting,
  onToggleWatermark,
}) => {
  const { user, profile, isAdmin } = useAuth();
  const isPro = isPaidPlan(profile);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isPdfMenuOpen, setIsPdfMenuOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(doc.packageBannerTitle || doc.client.nameOfEvent || doc.details.invoiceNo || '');
  const shareRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  const pdfMenuRef = useRef<HTMLDivElement>(null);
  const preset = INDUSTRY_PRESETS[doc.industry] || INDUSTRY_PRESETS.creative_agency;

  const issues = auditDocument(doc);
  const blockingCount = countBlocking(issues);
  const warningCount = issues.filter((i) => i.severity === 'warning').length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) {
        setIsShareOpen(false);
      }
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setIsMoreOpen(false);
      }
      if (pdfMenuRef.current && !pdfMenuRef.current.contains(e.target as Node)) {
        setIsPdfMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCopyPublicLink = () => {
    const linkState = getShareLinkState(doc, user?.id);

    if (!linkState.shareable) {
      if (linkState.reason === 'not_signed_in') {
        onOpenAuth();
      } else if (linkState.reason === 'not_synced') {
        onSaveToVault();
      }
      setIsShareOpen(false);
      return;
    }

    if (linkState.url) {
      navigator.clipboard.writeText(linkState.url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
    setIsShareOpen(false);
  };

  return (
    <header className="bg-slate-950/95 backdrop-blur-xl border-b border-slate-800/80 sticky top-0 z-40 px-3 sm:px-5 lg:px-7 py-2.5 select-none font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="max-w-[1800px] mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Studio Brand & Title */}
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 shrink">
          {onNavigateToHome && (
            <button
              type="button"
              onClick={onNavigateToHome}
              className="p-1.5 rounded-xl glass text-slate-400 hover:text-amber-400 transition-colors flex items-center space-x-1 cursor-pointer shrink-0"
              title="Return to Landing Page"
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="text-[10px] font-semibold hidden md:inline">Home</span>
            </button>
          )}

          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 p-0.5 shadow-md shadow-amber-500/20 flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[9px] flex items-center justify-center text-sm sm:text-base">
              {preset.icon || '💼'}
            </div>
          </div>

          <div className="min-w-0 flex items-center space-x-1.5 sm:space-x-2">
            <h1 className="text-xs sm:text-sm font-bold text-amber-100 tracking-wide font-['Outfit'] truncate max-w-[90px] sm:max-w-[140px] md:max-w-[180px]">
              {doc.studio.name || 'INVOIX STUDIO'}
            </h1>

            <span
              className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 ${
                doc.type === 'INVOICE'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}
            >
              {doc.type}
            </span>

            {/* Inline Editable Document Title (Desktop xl+ screens) */}
            <div className="hidden xl:flex items-center space-x-1 text-slate-500">
              <span className="text-xs">›</span>
              {isEditingTitle ? (
                <input
                  type="text"
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  onBlur={() => {
                    setIsEditingTitle(false);
                    if (tempTitle.trim() && onUpdateTitle) {
                      onUpdateTitle(tempTitle.trim());
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setIsEditingTitle(false);
                      if (tempTitle.trim() && onUpdateTitle) {
                        onUpdateTitle(tempTitle.trim());
                      }
                    } else if (e.key === 'Escape') {
                      setIsEditingTitle(false);
                      setTempTitle(doc.packageBannerTitle || doc.client.nameOfEvent || doc.details.invoiceNo || '');
                    }
                  }}
                  autoFocus
                  className="bg-slate-900 border border-amber-500/80 rounded px-2 py-0.5 text-xs text-amber-300 font-mono outline-none shadow-inner"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setTempTitle(doc.packageBannerTitle || doc.client.nameOfEvent || doc.details.invoiceNo || '');
                    setIsEditingTitle(true);
                  }}
                  className="group flex items-center space-x-1 hover:text-amber-300 transition-colors text-slate-300 font-mono text-[11px] cursor-pointer"
                  title="Click to rename document"
                >
                  <span className="truncate max-w-[140px] 2xl:max-w-[200px] font-bold text-amber-300/90">
                    [{doc.packageBannerTitle || doc.client.nameOfEvent || doc.details.invoiceNo || 'Draft'}]
                  </span>
                  <span className="opacity-0 group-hover:opacity-100 text-[10px]">✏️</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Center: Auto-Save Status & 3-Way Mode Switcher */}
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          {/* Live Auto-Save Status Pill */}
          <div className="flex items-center">
            {saveStatus === 'saving' ? (
              <div
                className="flex items-center space-x-1 px-2 py-1 sm:px-2.5 sm:py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-semibold animate-pulse"
                title="Saving changes..."
              >
                <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
                <span className="hidden sm:inline">Saving...</span>
              </div>
            ) : saveStatus === 'error' ? (
              <div
                className="flex items-center space-x-1 px-2 py-1 sm:px-2.5 sm:py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[10px] font-semibold"
                title="Auto-save failed. Click manual Save button to retry."
              >
                <AlertCircle className="w-3 h-3 text-rose-400" />
                <span className="hidden sm:inline">Save failed</span>
              </div>
            ) : (
              <div
                className="flex items-center space-x-1 px-2 py-1 sm:px-2.5 sm:py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-[10px] font-medium transition-all"
                title={
                  lastSavedTime
                    ? `All changes saved (${lastSavedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })})`
                    : 'All changes saved'
                }
              >
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="hidden md:inline">{user ? 'Saved to Cloud' : 'Saved locally'}</span>
                <span className="md:hidden">Saved</span>
                {lastSavedTime && (
                  <span className="hidden 2xl:inline text-[9px] text-emerald-400/60 ml-0.5">
                    • {lastSavedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* 3-Way Studio View Mode Switcher (Visible on md, lg, xl screens) */}
          {onViewModeChange && (
            <div className="hidden md:flex items-center bg-slate-900/90 rounded-xl p-0.5 border border-slate-800 shadow-inner shrink-0">
              <button
                type="button"
                onClick={() => onViewModeChange('split')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                  viewMode === 'split'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 scale-[1.02]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
                title="Split View: Side by Side [Alt+1]"
              >
                <Columns className="w-3.5 h-3.5" />
                <span>Split</span>
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange('editor')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                  viewMode === 'editor'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 scale-[1.02]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
                title="Editor Focus: Full Width Form [Alt+2]"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editor</span>
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange('preview')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                  viewMode === 'preview'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 scale-[1.02]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
                title="Canvas Review: Full Width Document [Alt+3]"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Canvas</span>
              </button>
            </div>
          )}
        </div>

        {/* Right: Grouped Actions */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
          {/* === PRE-FLIGHT HEALTH INSPECTOR === */}
          {onOpenHealth && (
            <button
              type="button"
              onClick={onOpenHealth}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                blockingCount > 0
                  ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-rose-500/40 shadow-sm shadow-rose-500/20 animate-pulse'
                  : warningCount > 0
                  ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40'
                  : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
              }`}
              title="Inspect document readiness, verify no truncated text, and run pre-flight checks"
            >
              {blockingCount > 0 ? (
                <ShieldAlert className="w-3.5 h-3.5" />
              ) : warningCount > 0 ? (
                <AlertTriangle className="w-3.5 h-3.5" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">
                {blockingCount > 0
                  ? `${blockingCount} Issue${blockingCount > 1 ? 's' : ''}`
                  : warningCount > 0
                  ? `${warningCount} Warn`
                  : 'Health: Ready'}
              </span>
            </button>
          )}

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
          <div ref={shareRef} className="relative">
            <button
              type="button"
              onClick={() => setIsShareOpen(!isShareOpen)}
              className="flex items-center space-x-1 px-2.5 py-1.5 sm:px-3.5 sm:py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-bold rounded-xl border border-emerald-500/30 transition-all cursor-pointer"
              title="Share quotation link or WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Share</span>
              <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isShareOpen ? 'rotate-180' : ''}`} />
            </button>

            {isShareOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 glass rounded-2xl p-2 shadow-2xl shadow-black/40 border border-slate-700/50 z-50 modal-enter">
                <button
                  type="button"
                  onClick={handleCopyPublicLink}
                  className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs text-slate-200 hover:bg-slate-800/60 transition-colors cursor-pointer"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Link className="w-4 h-4 text-slate-400" />}
                  <span>{copiedLink ? 'Link Copied!' : 'Copy Client Link'}</span>
                </button>

                {/* Interactive Preview — PRO ONLY */}
                <button
                  type="button"
                  onClick={() => {
                    if (!isPro && onOpenUpgrade) { onOpenUpgrade('pro'); setIsShareOpen(false); return; }
                    onOpenClientInteractive(); setIsShareOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs transition-colors cursor-pointer ${
                    isPro ? 'text-slate-200 hover:bg-slate-800/60' : 'text-slate-500'
                  }`}
                >
                  <Eye className="w-4 h-4 text-emerald-400" />
                  <span className="flex-1 text-left">Interactive Preview</span>
                  {!isPro && <Lock className="w-3 h-3 text-amber-400" />}
                </button>

                {/* WhatsApp Share — PRO ONLY */}
                <button
                  type="button"
                  onClick={() => {
                    if (!isPro && onOpenUpgrade) { onOpenUpgrade('pro'); setIsShareOpen(false); return; }
                    onOpenWhatsApp(); setIsShareOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs transition-colors cursor-pointer ${
                    isPro ? 'text-slate-200 hover:bg-slate-800/60' : 'text-slate-500'
                  }`}
                >
                  <Share2 className="w-4 h-4 text-emerald-400" />
                  <span className="flex-1 text-left">Share via WhatsApp</span>
                  {!isPro && <Lock className="w-3 h-3 text-amber-400" />}
                </button>

                <button
                  type="button"
                  onClick={() => { onPrint(); setIsShareOpen(false); }}
                  className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs text-slate-200 hover:bg-slate-800/60 transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-slate-400" />
                  <span>Print Document</span>
                </button>
              </div>
            )}
          </div>

          {/* === PRIMARY: PDF & Print Export Menu === */}
          <div ref={pdfMenuRef} className="relative">
            <div className="inline-flex rounded-xl shadow-lg shadow-amber-500/20 bg-gradient-to-r from-amber-500 to-amber-600">
              <button
                type="button"
                onClick={() => onExportPdf('text')}
                disabled={isExporting}
                className="flex items-center space-x-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 text-slate-950 text-xs font-extrabold hover:opacity-95 transition-all cursor-pointer disabled:opacity-50"
                title="Save as Crisp Vector PDF"
              >
                <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="hidden sm:inline">{isExporting ? 'Exporting...' : 'Save PDF'}</span>
                <span className="sm:hidden">{isExporting ? '...' : 'PDF'}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsPdfMenuOpen(!isPdfMenuOpen)}
                className="px-1.5 py-1.5 sm:py-2 text-slate-950 border-l border-amber-600/50 hover:bg-amber-400/40 rounded-r-xl transition-colors cursor-pointer"
                title="PDF Export Options"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {isPdfMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 glass rounded-2xl p-2 shadow-2xl shadow-black/50 border border-slate-700/60 z-50 modal-enter text-xs">
                <div className="px-3 py-2 border-b border-slate-800">
                  <p className="font-bold text-slate-200 text-[11px] font-['Outfit'] uppercase tracking-wider">
                    Export Options
                  </p>
                  <p className="text-[10px] text-slate-400">Choose your preferred PDF format</p>
                </div>

                <button
                  type="button"
                  onClick={() => { onExportPdf('text'); setIsPdfMenuOpen(false); }}
                  className="w-full flex items-start space-x-2.5 p-2.5 rounded-xl hover:bg-slate-800/70 transition-colors text-left cursor-pointer group mt-1"
                >
                  <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-slate-100">Save as PDF (Crisp Text)</span>
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded font-semibold">
                        Vector
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                      True vector PDF: selectable text, ultra-sharp fonts, ~100 KB file size.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => { onExportPdf('image'); setIsPdfMenuOpen(false); }}
                  disabled={isExporting}
                  className="w-full flex items-start space-x-2.5 p-2.5 rounded-xl hover:bg-slate-800/70 transition-colors text-left cursor-pointer group disabled:opacity-50"
                >
                  <div className="p-1.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 group-hover:bg-slate-700 group-hover:text-white transition-colors shrink-0">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-slate-200">Download PDF (Image)</span>
                      <span className="text-[9px] bg-slate-800 text-slate-400 border border-slate-700 px-1.5 py-0.2 rounded">
                        Raster
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                      Direct canvas download snapshot (standard export).
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => { onPrint(); setIsPdfMenuOpen(false); }}
                  className="w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-xl text-slate-300 hover:bg-slate-800/60 transition-colors text-left cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
                  <span className="text-xs">Print / Physical Paper</span>
                </button>
              </div>
            )}
          </div>

          {/* === MORE DROPDOWN (Document Management & Mobile Settings) === */}
          <div ref={moreRef} className="relative">
            <button
              type="button"
              onClick={() => setIsMoreOpen(!isMoreOpen)}
              className="p-1.5 sm:p-2 glass hover:bg-slate-800/70 text-slate-400 hover:text-slate-200 rounded-xl transition-colors cursor-pointer"
              title="More options"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {isMoreOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 glass rounded-2xl p-2 shadow-2xl shadow-black/40 border border-slate-700/50 z-50 modal-enter">
                <button
                  type="button"
                  onClick={() => { onSaveToVault(); setIsMoreOpen(false); }}
                  className="sm:hidden w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs text-slate-200 hover:bg-slate-800/60 transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4 text-emerald-400" />
                  <span>Save to Vault</span>
                </button>

                {onNewDocument && (
                  <button
                    type="button"
                    onClick={() => { onNewDocument(); setIsMoreOpen(false); }}
                    className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs text-slate-200 hover:bg-slate-800/60 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-amber-400" />
                    <span>New Document</span>
                  </button>
                )}

                {onResetSample && (
                  <button
                    type="button"
                    onClick={() => { onResetSample(); setIsMoreOpen(false); }}
                    className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs text-slate-200 hover:bg-slate-800/60 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Reset Sample Data</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => { onOpenVault(); setIsMoreOpen(false); }}
                  className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs text-slate-200 hover:bg-slate-800/60 transition-colors cursor-pointer"
                >
                  <Archive className="w-4 h-4 text-amber-400" />
                  <span>Document Vault</span>
                </button>

                <button
                  type="button"
                  onClick={() => { onOpenSettings(); setIsMoreOpen(false); }}
                  className="sm:hidden w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs text-slate-200 hover:bg-slate-800/60 transition-colors cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span>Business Settings</span>
                </button>

                {isAdmin && onOpenAdmin && (
                  <button
                    type="button"
                    onClick={() => { onOpenAdmin(); setIsMoreOpen(false); }}
                    className="md:hidden w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs text-amber-300 hover:bg-slate-800/60 transition-colors cursor-pointer"
                  >
                    <Crown className="w-4 h-4 text-amber-400" />
                    <span>Super Admin Panel</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => { onToggleWatermark(); setIsMoreOpen(false); }}
                  className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs text-slate-200 hover:bg-slate-800/60 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Watermark: {doc.watermark.enabled ? 'ON' : 'OFF'}</span>
                </button>
              </div>
            )}
          </div>

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

          {/* === UPGRADE PRO BUTTON === */}
          {(!profile || profile.plan === 'free') && onOpenUpgrade && (
            <button
              type="button"
              onClick={() => onOpenUpgrade('pro')}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 transition-all cursor-pointer"
              title="Upgrade to Invoix Pro with Razorpay"
            >
              <Zap className="w-3.5 h-3.5 fill-slate-950" />
              <span className="hidden md:inline font-['Outfit']">Upgrade Pro</span>
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
            {isPro && (
              <span className="text-[8px] bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 px-1.5 py-0.5 rounded-full font-extrabold uppercase tracking-wider hidden sm:inline-flex items-center gap-0.5">
                <Crown className="w-2.5 h-2.5" />
                {profile?.plan === 'agency' ? 'AGENCY' : 'PRO'}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

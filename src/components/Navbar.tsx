import React from 'react';
import type { QuotationDocument } from '../types';
import {
  Download,
  Printer,
  Share2,
  Save,
  Archive,
  Settings,
  Sparkles,
  RotateCcw,
  Camera,
  Lock,
  Plus,
} from 'lucide-react';

interface NavbarProps {
  document: QuotationDocument;
  onExportPdf: () => void;
  onPrint: () => void;
  onOpenWhatsApp: () => void;
  onSaveToVault: () => void;
  onOpenVault: () => void;
  onOpenSettings: () => void;
  onResetSample: () => void;
  onNewDocument?: () => void;
  isExporting: boolean;
  onToggleWatermark: () => void;
  onLockStudio?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  document: doc,
  onExportPdf,
  onPrint,
  onOpenWhatsApp,
  onSaveToVault,
  onOpenVault,
  onOpenSettings,
  onResetSample,
  onNewDocument,
  isExporting,
  onToggleWatermark,
  onLockStudio,
}) => {
  return (
    <header className="bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-40 px-4 lg:px-8 py-3 select-none">
      <div className="max-w-[1700px] mx-auto flex items-center justify-between gap-4">
        {/* Left: Studio Brand & Title */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 p-0.5 shadow-lg flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Camera className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-sm md:text-base font-bold text-amber-100 tracking-wide font-['Outfit']">
                {doc.studio.name || 'FUSION BELLS FILMS'}
              </h1>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  doc.type === 'INVOICE'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}
              >
                {doc.type} Mode
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium hidden sm:block">
              {doc.studio.tagline || 'Quotation & Invoice Studio'}
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-2 sm:space-x-2.5">
          {/* Quick Watermark Toggle */}
          <button
            type="button"
            onClick={onToggleWatermark}
            className={`hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              doc.watermark.enabled
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
            title="Toggle background watermark"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Watermark: {doc.watermark.enabled ? 'ON' : 'OFF'}</span>
          </button>

          {/* New Blank Document */}
          {onNewDocument && (
            <button
              type="button"
              onClick={onNewDocument}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold rounded-lg border border-amber-500/30 transition-colors"
              title="Start a new blank quotation"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>New</span>
            </button>
          )}

          {/* Save to Vault */}
          <button
            type="button"
            onClick={onSaveToVault}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-amber-300 text-xs font-medium rounded-lg border border-slate-800 transition-colors"
            title="Save to local database"
          >
            <Save className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Save</span>
          </button>

          {/* Vault History */}
          <button
            type="button"
            onClick={onOpenVault}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-amber-300 text-xs font-medium rounded-lg border border-slate-800 transition-colors"
            title="Open Document History"
          >
            <Archive className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Vault</span>
          </button>

          {/* WhatsApp Share */}
          <button
            type="button"
            onClick={onOpenWhatsApp}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-300 text-xs font-medium rounded-lg border border-green-500/30 transition-colors"
            title="Share quotation via WhatsApp"
          >
            <Share2 className="w-3.5 h-3.5 text-green-400" />
            <span className="hidden md:inline">WhatsApp</span>
          </button>

          {/* Print */}
          <button
            type="button"
            onClick={onPrint}
            className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-amber-300 text-xs font-medium rounded-lg border border-slate-800 transition-colors"
            title="Print Quotation"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            <span>Print</span>
          </button>

          {/* Export PDF Button (Primary) */}
          <button
            type="button"
            onClick={onExportPdf}
            disabled={isExporting}
            className="flex items-center space-x-2 px-4 py-1.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 text-xs font-bold rounded-lg shadow-lg shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-50"
          >
            <Download className={`w-4 h-4 ${isExporting ? 'animate-bounce' : ''}`} />
            <span>{isExporting ? 'Generating PDF...' : 'Download PDF'}</span>
          </button>

          {/* Studio Profile Settings */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="p-2 text-slate-400 hover:text-amber-300 hover:bg-slate-900 rounded-lg border border-slate-800 transition-colors"
            title="Studio Branding Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Lock Studio Portal */}
          {onLockStudio && (
            <button
              type="button"
              onClick={onLockStudio}
              className="p-2 text-slate-400 hover:text-amber-300 hover:bg-slate-900 rounded-lg border border-slate-800 transition-colors"
              title="Lock Studio Portal"
            >
              <Lock className="w-4 h-4 text-amber-400" />
            </button>
          )}

          {/* Reset to Sample */}
          <button
            type="button"
            onClick={onResetSample}
            className="p-2 text-slate-400 hover:text-red-300 hover:bg-slate-900 rounded-lg border border-slate-800 transition-colors"
            title="Reset to Default Template"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

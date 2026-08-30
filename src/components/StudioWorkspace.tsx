/**
 * The signed-in editor workspace.
 *
 * Extracted from App.tsx so it can be lazy-loaded. Everything it pulls in —
 * FormEditor (the largest component in the app), the document views, and every
 * modal — used to sit in the initial bundle, which meant a visitor reading the
 * landing page downloaded the entire editor before first paint.
 */
import { useState, useEffect, useRef } from 'react';
import type { QuotationDocument, IndustryCategory } from '../types';
import {
  getDefaultDocument,
  saveWatermarkConfigToStorage,
  createDocumentFromPreset,
} from '../constants/defaultData';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Navbar } from './Navbar';
import { FormEditor } from './FormEditor';
import { InvoiceDocumentView } from './InvoiceDocumentView';
import { HistoryVaultModal } from './HistoryVaultModal';
import { WhatsAppShareModal } from './WhatsAppShareModal';
import { ClientInteractiveModal } from './ClientInteractiveModal';
import { AuthModal } from './AuthModal';
import { UpgradePlanModal } from './UpgradePlanModal';
import { DocumentHealthModal } from './DocumentHealthModal';
import { saveDocument } from '../services/documentService';
import { downloadPdf, type PdfQuality } from '../services/pdfExportService';
import { printDocument } from '../utils/pdfGenerator';
import { getVaultDocuments } from '../utils/vaultStorage';
import { isPaidPlan, FREE_PLAN_MAX_DOCUMENTS } from '../utils/planLimits';
import confetti from 'canvas-confetti';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Edit3,
  Eye,
  CheckCircle2,
  AlertTriangle,
  X,
} from 'lucide-react';

interface StudioWorkspaceProps {
  initialIndustry?: IndustryCategory;
  onNavigateToAdmin: () => void;
  onNavigateToHome: () => void;
}

export default function StudioWorkspace({ initialIndustry, onNavigateToAdmin, onNavigateToHome }: StudioWorkspaceProps) {
  const { user, profile } = useAuth();
  const { confirm } = useToast();

  const [document, setDocument] = useState<QuotationDocument>(() => {
    if (initialIndustry) {
      return createDocumentFromPreset(initialIndustry);
    }

    const savedLast = localStorage.getItem('fbf_current_document_v4');
    if (savedLast) {
      try {
        const parsed = JSON.parse(savedLast);
        if (parsed && parsed.details && parsed.pricingItems) {
          return parsed;
        }
      } catch (e) {
        console.error('Error loading last document', e);
      }
    }
    return getDefaultDocument();
  });

  const [zoomScale, setZoomScale] = useState<number>(0.92);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isVaultOpen, setIsVaultOpen] = useState<boolean>(false);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState<boolean>(false);
  const [isInteractiveOpen, setIsInteractiveOpen] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState<boolean>(false);
  const [isHealthOpen, setIsHealthOpen] = useState<boolean>(false);
  const [editorActiveTab, setEditorActiveTab] = useState<string>('industry');
  const [upgradePlan, setUpgradePlan] = useState<'pro' | 'agency'>('pro');
  const [mobileActiveView, setMobileActiveView] = useState<'editor' | 'preview'>('editor');
  const [viewMode, setViewMode] = useState<'split' | 'editor' | 'preview'>(() => {
    try {
      const saved = localStorage.getItem('invoix_view_mode');
      if (saved === 'split' || saved === 'editor' || saved === 'preview') {
        return saved;
      }
    } catch {
      /* ignore */
    }
    return 'split';
  });
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(() => new Date());
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  // Persistent (not auto-dismissing) banner for save failures. A toast is the
  // wrong shape for "your work was not stored" — it vanishes before it is read.
  const [saveError, setSaveError] = useState<string | null>(null);
  const draftWarnedRef = useRef(false);

  // Keyboard Shortcuts for View Modes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Alt+1, Alt+2, Alt+3
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        if (e.key === '1') {
          e.preventDefault();
          setViewMode('split');
          localStorage.setItem('invoix_view_mode', 'split');
        } else if (e.key === '2') {
          e.preventDefault();
          setViewMode('editor');
          localStorage.setItem('invoix_view_mode', 'editor');
        } else if (e.key === '3') {
          e.preventDefault();
          setViewMode('preview');
          localStorage.setItem('invoix_view_mode', 'preview');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Adjustable / Resizable Side Panel State
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('invoix_sidebar_width');
      if (saved) {
        const val = Number(saved);
        if (val >= 340 && val <= 900) return val;
      }
    } catch {
      /* ignore */
    }
    return 500;
  });
  const [isResizing, setIsResizing] = useState<boolean>(false);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.max(340, Math.min(window.innerWidth * 0.7, e.clientX));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      try {
        localStorage.setItem('invoix_sidebar_width', String(sidebarWidth));
      } catch {
        /* ignore */
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.document.body.style.cursor = 'col-resize';
    window.document.body.style.userSelect = 'none';

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.document.body.style.cursor = '';
      window.document.body.style.userSelect = '';
    };
  }, [isResizing, sidebarWidth]);

  // Responsive mobile canvas auto-fit
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        const fitScale = Math.max(0.40, Math.min(0.55, (window.innerWidth - 32) / 794));
        setZoomScale(fitScale);
      } else if (window.innerWidth < 1024) {
        setZoomScale(0.72);
      } else {
        setZoomScale(0.92);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  /**
   * Merges the server's authoritative token and sync stamp back into state.
   *
   * Guarded so it only fires the first time (or if the token changes): the
   * timestamp differs on every save, so an unguarded merge would mutate the
   * document, retrigger the autosave effect, and loop forever.
   */
  const reconcileSynced = (synced?: { shareToken?: string; cloudSyncedAt: string }) => {
    if (!synced) return;
    setDocument((prev) => {
      const tokenMatches = !synced.shareToken || prev.shareToken === synced.shareToken;
      if (prev.cloudSyncedAt && tokenMatches) return prev;
      return {
        ...prev,
        shareToken: synced.shareToken || prev.shareToken,
        cloudSyncedAt: prev.cloudSyncedAt || synced.cloudSyncedAt,
      };
    });
  };

  const isInitialMount = useRef(true);

  // Autosave current draft: Instant (0ms) to localStorage scratchpad + Debounced (1000ms) to Vault & Supabase Cloud
  useEffect(() => {
    // 1. Instant local scratchpad write
    try {
      localStorage.setItem('fbf_current_document_v4', JSON.stringify(document));
    } catch (e) {
      console.warn('LocalStorage quota limit warning:', e);
      if (!draftWarnedRef.current) {
        draftWarnedRef.current = true;
        setSaveError(
          'Your browser storage is full, so this draft is not being auto-saved. ' +
            'Delete older documents from the vault, or sign in to sync to the cloud.'
        );
      }
    }

    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // 2. Transition to 'saving' status shortly after user edits
    const savingIndicatorTimer = setTimeout(() => {
      setSaveStatus('saving');
    }, 50);

    // 3. Debounced (1000ms) save to Vault & Supabase Cloud
    const saveTimer = setTimeout(async () => {
      try {
        const res = await saveDocument(document, user?.id, isPaidPlan(profile));
        if (res.success) {
          reconcileSynced(res.synced);
          setSaveStatus('saved');
          setLastSavedTime(new Date());
        } else {
          setSaveStatus(user ? 'error' : 'saved');
        }
      } catch (err) {
        console.error('Auto-save error:', err);
        setSaveStatus('error');
      }
    }, 1000);

    return () => {
      clearTimeout(savingIndicatorTimer);
      clearTimeout(saveTimer);
    };
  }, [document, user, profile]);

  // Protect against tab closing while a save is in-flight
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (saveStatus === 'saving') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveStatus]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleExportPdf = async (quality: PdfQuality = 'text') => {
    setIsExporting(true);
    showToast(
      quality === 'text'
        ? 'Generating crisp vector PDF (server render)...'
        : 'Rendering PDF image snapshot...'
    );
    try {
      const res = await downloadPdf(document, quality, 'quotation-preview-container');
      if (res.success) {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
        if (res.fallbackReason) {
          showToast(res.fallbackReason);
        } else {
          showToast(
            res.usedQuality === 'text'
              ? 'Crisp vector PDF downloaded!'
              : 'PDF downloaded successfully!'
          );
        }
      } else {
        showToast(res.error || 'Failed to export PDF. Please try printing.');
      }
    } catch (err) {
      console.error(err);
      showToast('Error exporting PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    printDocument();
  };

  const handleSaveToVault = async () => {
    setSaveStatus('saving');
    const vaultDocs = getVaultDocuments();
    const isExisting = vaultDocs.some((d) => d.id === document.id);
    if (!isPaidPlan(profile) && !isExisting && vaultDocs.length >= FREE_PLAN_MAX_DOCUMENTS) {
      setUpgradePlan('pro');
      setIsUpgradeOpen(true);
      showToast(`Free plan limit (${FREE_PLAN_MAX_DOCUMENTS} proposals). Upgrade to Pro for unlimited storage.`);
      setSaveStatus('saved');
      return;
    }

    const res = await saveDocument(document, user?.id, isPaidPlan(profile));
    reconcileSynced(res.synced);

    if (!res.success) {
      // The document reached neither the cloud nor local storage. Never
      // celebrate this: the user's work is genuinely gone.
      setSaveStatus('error');
      setSaveError(res.error || 'This document could not be saved. Please try again.');
      showToast('Could not save — your work is not stored.');
      return;
    }

    setSaveStatus('saved');
    setLastSavedTime(new Date());
    confetti({ particleCount: 50, spread: 50, origin: { y: 0.8 } });
    showToast(res.isCloud ? 'Synced to Supabase Cloud!' : 'Saved to Local Vault!');

    // Saved to the cloud, but the offline copy failed. Worth telling them,
    // because the vault and offline access will be out of date.
    if (res.quotaExceeded) {
      setSaveError(
        'Saved to the cloud, but your browser storage is full so the offline copy was skipped. ' +
          'Delete older documents from the vault to restore offline access.'
      );
    }
  };

  const handleLoadDocument = (doc: QuotationDocument) => {
    setDocument(doc);
    showToast(`Loaded ${doc.details.invoiceNo}`);
  };

  const handleNewDocument = async () => {
    const ok = await confirm({
      title: 'New Blank Document',
      message: 'Create a new blank document? Any unsaved changes in your current draft will be reset.',
      confirmText: 'Create New',
      variant: 'warning',
    });
    if (ok) {
      const fresh = getDefaultDocument();
      setDocument(fresh);
      localStorage.setItem('fbf_current_document_v4', JSON.stringify(fresh));
      showToast('Created new proposal draft');
    }
  };

  const handleResetSample = async () => {
    const ok = await confirm({
      title: 'Reset to Sample Data',
      message: 'Reset this workspace to sample industry data? Any current edits will be replaced.',
      confirmText: 'Reset Workspace',
      variant: 'warning',
    });
    if (ok) {
      const fresh = getDefaultDocument();
      setDocument(fresh);
      localStorage.setItem('fbf_current_document_v4', JSON.stringify(fresh));
      showToast('Reset to default sample data.');
    }
  };

  const handleToggleWatermark = () => {
    if (document.watermark?.enabled && !isPaidPlan(profile)) {
      setUpgradePlan('pro');
      setIsUpgradeOpen(true);
      showToast('Watermark removal is exclusive to Invoix Pro.');
      return;
    }

    setDocument((prev) => {
      const updated = {
        ...prev,
        watermark: {
          ...prev.watermark,
          enabled: !prev.watermark?.enabled,
        },
      };
      saveWatermarkConfigToStorage(updated.watermark);
      return updated;
    });
  };

  const handleApproveFromClientView = (record: any) => {
    setDocument((prev) => ({
      ...prev,
      signatory: record,
      status: 'APPROVED',
      approvedAt: new Date().toISOString(),
      acceptanceAudit: {
        signatoryName: record.clientSignedName || 'Client Signatory',
        signatoryEmail: record.clientSignedEmail,
        signedAt: new Date().toISOString(),
        formattedDate: record.clientSignedDate || new Date().toLocaleString(),
        userAgent: navigator.userAgent,
        signatureDataUrl: record.clientSignatureDataUrl,
        acceptedTotalInvestment: document.totalInvestment,
      },
      updatedAt: new Date().toISOString(),
    }));
    showToast('Proposal signed and accepted!');
  };

  const handleViewModeChange = (mode: 'split' | 'editor' | 'preview') => {
    setViewMode(mode);
    if (mode === 'editor') {
      setMobileActiveView('editor');
    } else if (mode === 'preview') {
      setMobileActiveView('preview');
    }
    try {
      localStorage.setItem('invoix_view_mode', mode);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Save Failure Banner — stays until dismissed */}
      {saveError && (
        <div
          role="alert"
          className="sticky top-0 z-50 bg-rose-950 border-b border-rose-500/50 px-4 py-2.5 flex items-start gap-3 shrink-0"
        >
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <p className="flex-1 text-xs text-rose-100 leading-relaxed">{saveError}</p>
          <button
            type="button"
            onClick={() => setSaveError(null)}
            aria-label="Dismiss"
            className="p-1 text-rose-300 hover:text-rose-100 hover:bg-rose-900/60 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-amber-500/50 text-amber-200 px-4 py-2.5 rounded-2xl shadow-2xl flex items-center space-x-2 text-xs font-semibold animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <div className="shrink-0 z-40">
        <Navbar
          document={document}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          saveStatus={saveStatus}
          lastSavedTime={lastSavedTime}
          onExportPdf={handleExportPdf}
          onPrint={handlePrint}
          onOpenWhatsApp={() => setIsWhatsAppOpen(true)}
          onOpenClientInteractive={() => setIsInteractiveOpen(true)}
          onSaveToVault={handleSaveToVault}
          onOpenVault={() => setIsVaultOpen(true)}
          onOpenSettings={() => {
            setMobileActiveView('editor');
            setEditorActiveTab('business');
          }}
          onOpenAuth={() => setIsAuthOpen(true)}
          onOpenAdmin={onNavigateToAdmin}
          onOpenUpgrade={(plan) => {
            setUpgradePlan(plan || 'pro');
            setIsUpgradeOpen(true);
          }}
          onOpenHealth={() => setIsHealthOpen(true)}
          onNavigateToHome={onNavigateToHome}
          onNewDocument={handleNewDocument}
          onResetSample={handleResetSample}
          isExporting={isExporting}
          onToggleWatermark={handleToggleWatermark}
        />
      </div>

      {/* Mobile / Tablet View Toggle Bar (Only when screen is compact) */}
      <div className="md:hidden shrink-0 flex items-center justify-center p-2 bg-slate-900/95 border-b border-slate-800 z-30 space-x-2">
        <button
          type="button"
          onClick={() => {
            setMobileActiveView('editor');
            setViewMode('editor');
          }}
          className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
            mobileActiveView === 'editor'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-slate-800 text-slate-400'
          }`}
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Form Editor</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setMobileActiveView('preview');
            setViewMode('preview');
          }}
          className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
            mobileActiveView === 'preview'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-slate-800 text-slate-400'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Live Document</span>
        </button>
      </div>

      {/* Main Workspace Split View */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Left Side: Form Editor (Moveable / Resizable Width or Full Width in Editor Focus) */}
        <div
          style={{
            width:
              typeof window !== 'undefined' && window.innerWidth >= 1024
                ? viewMode === 'editor'
                  ? '100%'
                  : viewMode === 'preview'
                  ? '0px'
                  : `${sidebarWidth}px`
                : undefined,
          }}
          className={`w-full shrink-0 border-r border-slate-800/80 bg-slate-950 flex flex-col h-full min-h-0 overflow-hidden ${
            viewMode === 'preview'
              ? 'hidden'
              : mobileActiveView === 'preview' && viewMode === 'split'
              ? 'hidden lg:flex'
              : 'flex'
          }`}
        >
          <FormEditor
            document={document}
            onChange={setDocument}
            activeTab={editorActiveTab}
            onTabChange={setEditorActiveTab}
            onOpenHealth={() => setIsHealthOpen(true)}
            onOpenUpgrade={(plan) => {
              setUpgradePlan(plan || 'pro');
              setIsUpgradeOpen(true);
            }}
          />
        </div>

        {/* Draggable Resizer Handle Bar (Desktop split mode only) */}
        {viewMode === 'split' && (
          <div
            onMouseDown={(e) => {
              e.preventDefault();
              setIsResizing(true);
            }}
            onDoubleClick={() => {
              setSidebarWidth(500);
              try {
                localStorage.setItem('invoix_sidebar_width', '500');
              } catch {
                /* ignore */
              }
            }}
            title="Drag to resize panel / Double-click to reset"
            className={`hidden lg:flex items-center justify-center w-2 -ml-1 z-30 cursor-col-resize hover:bg-amber-500/50 active:bg-amber-500 transition-colors select-none group relative ${
              isResizing ? 'bg-amber-500 shadow-md shadow-amber-500/50' : 'bg-transparent'
            }`}
          >
            <div className="w-1 h-8 rounded-full bg-slate-700/80 group-hover:bg-amber-400 group-hover:scale-y-125 transition-all" />
          </div>
        )}

        {/* Right Side: Live Document Preview Canvas */}
        <div
          className={`flex-1 min-w-0 h-full min-h-0 bg-slate-900/60 overflow-y-auto p-4 sm:p-8 flex flex-col items-center justify-start relative ${
            viewMode === 'editor'
              ? 'hidden'
              : mobileActiveView === 'editor' && viewMode === 'split'
              ? 'max-lg:fixed max-lg:-left-[9999px] max-lg:top-0 max-lg:w-[850px] max-lg:h-screen max-lg:overflow-hidden max-lg:opacity-0 max-lg:pointer-events-none'
              : 'flex'
          }`}
        >
          {/* Floating Zoom & Fit Toolbar */}
          <div className="sticky top-4 z-20 mb-4 bg-slate-950/90 backdrop-blur-md border border-slate-800 px-2.5 py-1 rounded-2xl shadow-xl flex items-center space-x-1.5 text-xs">
            {/* Zoom Controls */}
            <button
              type="button"
              onClick={() => setZoomScale((prev) => Math.max(0.4, Number((prev - 0.05).toFixed(2))))}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="font-mono text-[11px] text-slate-300 min-w-[42px] text-center font-bold">
              {Math.round(zoomScale * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoomScale((prev) => Math.min(1.3, Number((prev + 0.05).toFixed(2))))}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-slate-800" />
            <button
              type="button"
              onClick={() => setZoomScale(0.92)}
              className="px-2 py-1 text-[10.5px] text-slate-400 hover:text-amber-300 font-semibold hover:bg-slate-800 rounded-lg transition-colors cursor-pointer flex items-center space-x-1"
            >
              <Maximize2 className="w-3 h-3" />
              <span>Fit A4</span>
            </button>
          </div>

          {/* Scaled Printable Document Paper */}
          <div
            className="print-zoom-wrapper transition-transform duration-150 origin-top flex flex-col items-center pb-20 select-text"
            style={{ transform: `scale(${zoomScale})` }}
          >
            <div id="quotation-preview-container">
              <InvoiceDocumentView
                document={document}
                onSelectSection={(tabId) => {
                  setEditorActiveTab(tabId);
                  if (viewMode === 'preview') {
                    setViewMode('split');
                    localStorage.setItem('invoix_view_mode', 'split');
                  }
                  setMobileActiveView('editor');
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Global Modals */}
      <HistoryVaultModal
        isOpen={isVaultOpen}
        onClose={() => setIsVaultOpen(false)}
        onLoadDocument={handleLoadDocument}
        currentDocumentId={document.id}
        onOpenUpgrade={(plan) => {
          setUpgradePlan(plan || 'pro');
          setIsUpgradeOpen(true);
        }}
      />

      <WhatsAppShareModal
        isOpen={isWhatsAppOpen}
        onClose={() => setIsWhatsAppOpen(false)}
        document={document}
      />

      <ClientInteractiveModal
        isOpen={isInteractiveOpen}
        onClose={() => setIsInteractiveOpen(false)}
        document={document}
        onApprove={handleApproveFromClientView}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      <UpgradePlanModal
        isOpen={isUpgradeOpen}
        onClose={() => setIsUpgradeOpen(false)}
        defaultPlan={upgradePlan}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      <DocumentHealthModal
        isOpen={isHealthOpen}
        onClose={() => setIsHealthOpen(false)}
        document={document}
        onJumpToTab={(tabId) => {
          setEditorActiveTab(tabId);
          setMobileActiveView('editor');
        }}
      />
    </div>
  );
}

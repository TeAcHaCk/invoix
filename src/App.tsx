import { useState, useEffect, useRef } from 'react';
import type { QuotationDocument, StudioProfile, IndustryCategory } from './types';
import {
  getDefaultDocument,
  saveStudioProfileToStorage,
  saveWatermarkConfigToStorage,
  createDocumentFromPreset,
} from './constants/defaultData';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { FormEditor } from './components/FormEditor';
import { InvoiceDocumentView } from './components/InvoiceDocumentView';
import { StudioSettingsModal } from './components/StudioSettingsModal';
import { HistoryVaultModal } from './components/HistoryVaultModal';
import { WhatsAppShareModal } from './components/WhatsAppShareModal';
import { ClientInteractiveModal } from './components/ClientInteractiveModal';
import { AuthModal } from './components/AuthModal';
import { PublicProposalPage } from './components/PublicProposalPage';
import { AdminLayout } from './components/admin/AdminLayout';
import { LandingPage } from './components/landing/LandingPage';
import { PrivacyPolicyPage } from './components/landing/PrivacyPolicyPage';
import { TermsOfServicePage } from './components/landing/TermsOfServicePage';
import { InstallAppPrompt } from './components/InstallAppPrompt';
import { UpgradePlanModal } from './components/UpgradePlanModal';
import { DocumentHealthModal } from './components/DocumentHealthModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { saveDocument } from './services/documentService';
import { downloadPdf, type PdfQuality } from './services/pdfExportService';
import { printDocument } from './utils/pdfGenerator';
import { getVaultDocuments } from './utils/vaultStorage';
import { isPaidPlan, FREE_PLAN_MAX_DOCUMENTS } from './utils/planLimits';
import confetti from 'canvas-confetti';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Eye,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  X,
} from 'lucide-react';

interface StudioWorkspaceProps {
  initialIndustry?: IndustryCategory;
  onNavigateToAdmin: () => void;
  onNavigateToHome: () => void;
}

function StudioWorkspace({ initialIndustry, onNavigateToAdmin, onNavigateToHome }: StudioWorkspaceProps) {
  const { user, profile } = useAuth();

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
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isVaultOpen, setIsVaultOpen] = useState<boolean>(false);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState<boolean>(false);
  const [isInteractiveOpen, setIsInteractiveOpen] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState<boolean>(false);
  const [isHealthOpen, setIsHealthOpen] = useState<boolean>(false);
  const [editorActiveTab, setEditorActiveTab] = useState<string>('industry');
  const [upgradePlan, setUpgradePlan] = useState<'pro' | 'agency'>('pro');
  const [mobileActiveView, setMobileActiveView] = useState<'editor' | 'preview'>('editor');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  // Persistent (not auto-dismissing) banner for save failures. A toast is the
  // wrong shape for "your work was not stored" — it vanishes before it is read.
  const [saveError, setSaveError] = useState<string | null>(null);
  const draftWarnedRef = useRef(false);

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

  // Autosave current draft to localStorage & Cloud
  useEffect(() => {
    try {
      localStorage.setItem('fbf_current_document_v4', JSON.stringify(document));
    } catch (e) {
      // Draft autosave failed (almost always a full quota). Warn once rather
      // than on every keystroke, but do not stay silent — without this the
      // draft is lost on refresh with no indication anything went wrong.
      console.warn('LocalStorage quota limit warning:', e);
      if (!draftWarnedRef.current) {
        draftWarnedRef.current = true;
        setSaveError(
          'Your browser storage is full, so this draft is not being auto-saved. ' +
            'Delete older documents from the vault, or sign in to sync to the cloud.'
        );
      }
    }
    if (user) {
      const timer = setTimeout(() => {
        // Reconcile so the in-memory copy learns it is synced. Without this the
        // text-PDF export and the share-link check stay permanently disabled
        // even though every save succeeds.
        saveDocument(document, user.id, isPaidPlan(profile)).then((res) =>
          reconcileSynced(res.synced)
        );
      }, 1200);
      return () => clearTimeout(timer);
    }
    // profile is a dependency so an upgrade re-stamps showInvoixBranding on the
    // next save, clearing the footer CTA from the user's client links.
  }, [document, user, profile]);

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
    const vaultDocs = getVaultDocuments();
    const isExisting = vaultDocs.some((d) => d.id === document.id);
    if (!isPaidPlan(profile) && !isExisting && vaultDocs.length >= FREE_PLAN_MAX_DOCUMENTS) {
      setUpgradePlan('pro');
      setIsUpgradeOpen(true);
      showToast(`Free plan limit (${FREE_PLAN_MAX_DOCUMENTS} proposals). Upgrade to Pro for unlimited storage.`);
      return;
    }

    const res = await saveDocument(document, user?.id, isPaidPlan(profile));
    reconcileSynced(res.synced);

    if (!res.success) {
      // The document reached neither the cloud nor local storage. Never
      // celebrate this: the user's work is genuinely gone.
      setSaveError(res.error || 'This document could not be saved. Please try again.');
      showToast('Could not save — your work is not stored.');
      return;
    }

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

  const handleSaveStudioProfile = (profile: StudioProfile) => {
    saveStudioProfileToStorage(profile);
    setDocument((prev) => ({
      ...prev,
      studio: profile,
      updatedAt: new Date().toISOString(),
    }));
    showToast('Studio branding updated!');
  };

  const handleNewDocument = () => {
    if (window.confirm('Create a new blank document? (Unsaved changes in draft will be reset)')) {
      const fresh = getDefaultDocument();
      setDocument(fresh);
      localStorage.setItem('fbf_current_document_v4', JSON.stringify(fresh));
      showToast('Created new proposal draft');
    }
  };

  const handleResetSample = () => {
    if (window.confirm('Reset this workspace to sample industry data?')) {
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Save Failure Banner — stays until dismissed */}
      {saveError && (
        <div
          role="alert"
          className="sticky top-0 z-50 bg-rose-950 border-b border-rose-500/50 px-4 py-2.5 flex items-start gap-3"
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
      <Navbar
        document={document}
        onExportPdf={handleExportPdf}
        onPrint={handlePrint}
        onOpenWhatsApp={() => setIsWhatsAppOpen(true)}
        onOpenClientInteractive={() => setIsInteractiveOpen(true)}
        onSaveToVault={handleSaveToVault}
        onOpenVault={() => setIsVaultOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
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

      {/* Mobile View Toggle Bar */}
      <div className="lg:hidden flex items-center justify-center p-2 bg-slate-900/90 border-b border-slate-800 sticky top-[57px] z-30 space-x-2">
        <button
          type="button"
          onClick={() => setMobileActiveView('editor')}
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
          onClick={() => setMobileActiveView('preview')}
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
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Left Side: Form Editor (Moveable / Resizable Width) */}
        <div
          style={{ width: typeof window !== 'undefined' && window.innerWidth >= 1024 ? `${sidebarWidth}px` : undefined }}
          className={`w-full shrink-0 border-r border-slate-800/80 bg-slate-950 flex flex-col overflow-y-auto ${
            mobileActiveView === 'preview' ? 'hidden lg:flex' : 'flex'
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

        {/* Draggable Resizer Handle Bar (Desktop only) */}
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

        {/* Right Side: Live Document Preview Canvas */}
        <div
          className={`flex-1 bg-slate-900/60 overflow-y-auto p-4 sm:p-8 flex flex-col items-center justify-start relative ${
            mobileActiveView === 'editor'
              ? 'max-lg:fixed max-lg:-left-[9999px] max-lg:top-0 max-lg:w-[850px] max-lg:h-screen max-lg:overflow-hidden max-lg:opacity-0 max-lg:pointer-events-none'
              : 'flex'
          }`}
        >
          {/* Zoom & Canvas Floating Action Bar */}
          <div className="sticky top-4 z-20 mb-4 bg-slate-950/80 backdrop-blur-md border border-slate-800 px-3 py-1.5 rounded-2xl shadow-xl flex items-center space-x-2 text-xs">
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
              <InvoiceDocumentView document={document} />
            </div>
          </div>
        </div>
      </div>

      {/* Global Modals */}
      <StudioSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        studio={document.studio}
        onSave={handleSaveStudioProfile}
      />

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

// URL Route Resolver Helper
function parseCurrentRoute(): {
  type: 'landing' | 'studio' | 'admin' | 'public_proposal' | 'privacy' | 'terms';
  docId?: string;
  section?: string;
} {
  const urlParams = new URLSearchParams(window.location.search);
  const viewParam = urlParams.get('view');
  const pageParam = urlParams.get('page');
  const rawHash = window.location.hash.replace('#', '').toLowerCase();

  // 1. Direct Public Proposal Link (?view=<shareToken> or #view/<shareToken>)
  if (viewParam) return { type: 'public_proposal', docId: viewParam };
  if (rawHash.startsWith('view/')) return { type: 'public_proposal', docId: rawHash.replace('view/', '') };

  // 2. Landing Page Anchor Navigation (#features, #industries, #pricing, #faq, #home)
  const isLandingAnchor = ['features', 'industries', 'pricing', 'faq', 'home', ''].includes(rawHash);
  if (isLandingAnchor && rawHash !== '') {
    if (pageParam) {
      window.history.replaceState(null, '', `/#${rawHash}`);
    }
    return { type: 'landing', section: rawHash };
  }

  // 3. Page Routes (by hash or query param)
  if (rawHash === 'admin' || pageParam === 'admin') return { type: 'admin' };
  if (rawHash === 'studio' || pageParam === 'studio') return { type: 'studio' };
  if (rawHash === 'privacy' || pageParam === 'privacy') return { type: 'privacy' };
  if (rawHash === 'terms' || pageParam === 'terms') return { type: 'terms' };

  // 4. Default to Landing Page
  return { type: 'landing' };
}

export function App() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [upgradePlan, setUpgradePlan] = useState<'pro' | 'agency'>('pro');
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryCategory | undefined>(undefined);
  const [currentView, setCurrentView] = useState(parseCurrentRoute);

  useEffect(() => {
    const handleUrlChange = () => {
      const route = parseCurrentRoute();
      setCurrentView(route);

      // Smooth scroll if an anchor section was clicked
      if (route.type === 'landing' && route.section && route.section !== 'home') {
        setTimeout(() => {
          const el = document.getElementById(route.section!);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 60);
      }
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  const navigateToAdmin = () => {
    window.history.pushState(null, '', '/#admin');
    setCurrentView({ type: 'admin' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToStudio = () => {
    window.history.pushState(null, '', '/#studio');
    setCurrentView({ type: 'studio' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToHome = (section?: string) => {
    const targetHash = section ? `#${section}` : '';
    window.history.pushState(null, '', `/${targetHash}`);
    setCurrentView({ type: 'landing', section });

    if (section) {
      setTimeout(() => {
        const el = document.getElementById(section);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 60);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const navigateToPrivacy = () => {
    window.history.pushState(null, '', '/#privacy');
    setCurrentView({ type: 'privacy' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToTerms = () => {
    window.history.pushState(null, '', '/#terms');
    setCurrentView({ type: 'terms' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectIndustryFromLanding = (industry: IndustryCategory) => {
    setSelectedIndustry(industry);
    navigateToStudio();
  };

  return (
    <AuthProvider>
      {currentView.type === 'public_proposal' && currentView.docId ? (
        // The audience here is the USER'S CLIENT, not the user. A crash on this
        // route must not show them a stack trace or a blank page — they cannot
        // act on either, and it reflects on the person who sent the proposal.
        <ErrorBoundary
          label="public-proposal"
          fallback={
            <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 font-['Plus_Jakarta_Sans',sans-serif]">
              <div className="max-w-sm w-full text-center space-y-3">
                <h1 className="text-lg font-bold font-['Outfit']">This proposal could not be displayed</h1>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Something went wrong while loading this document. Please refresh the page, or
                  contact the sender if it keeps happening.
                </p>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="mt-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Refresh
                </button>
              </div>
            </div>
          }
        >
          <PublicProposalPage documentId={currentView.docId} />
        </ErrorBoundary>
      ) : currentView.type === 'admin' ? (
        <AdminLayout onBackToStudio={navigateToStudio} />
      ) : currentView.type === 'privacy' ? (
        <PrivacyPolicyPage
          onBack={() => navigateToHome()}
          onNavigateSection={(sec) => navigateToHome(sec)}
          onLaunchStudio={navigateToStudio}
        />
      ) : currentView.type === 'terms' ? (
        <TermsOfServicePage
          onBack={() => navigateToHome()}
          onNavigateSection={(sec) => navigateToHome(sec)}
          onLaunchStudio={navigateToStudio}
        />
      ) : currentView.type === 'landing' ? (
        <>
          <LandingPage
            onLaunchStudio={navigateToStudio}
            onOpenAuth={() => setIsAuthOpen(true)}
            onOpenAdmin={navigateToAdmin}
            onNavigateToPrivacy={navigateToPrivacy}
            onNavigateToTerms={navigateToTerms}
            onSelectIndustryPreset={handleSelectIndustryFromLanding}
            onSelectPlan={(plan) => {
              if (plan === 'free') {
                navigateToStudio();
              } else {
                setUpgradePlan(plan);
                setIsUpgradeOpen(true);
              }
            }}
          />
          <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
          <UpgradePlanModal
            isOpen={isUpgradeOpen}
            onClose={() => setIsUpgradeOpen(false)}
            defaultPlan={upgradePlan}
          />
        </>
      ) : (
        <StudioWorkspace
          initialIndustry={selectedIndustry}
          onNavigateToAdmin={navigateToAdmin}
          onNavigateToHome={() => navigateToHome()}
        />
      )}
      <InstallAppPrompt />
    </AuthProvider>
  );
}

export default App;

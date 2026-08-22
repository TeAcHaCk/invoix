import { useState, useEffect } from 'react';
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
import { saveDocument } from './services/documentService';
import { exportDocumentToPdf, printDocument } from './utils/pdfGenerator';
import confetti from 'canvas-confetti';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Eye,
  Edit3,
  CheckCircle2,
  FileCheck,
} from 'lucide-react';

interface StudioWorkspaceProps {
  initialIndustry?: IndustryCategory;
  onNavigateToAdmin: () => void;
  onNavigateToHome: () => void;
}

function StudioWorkspace({ initialIndustry, onNavigateToAdmin, onNavigateToHome }: StudioWorkspaceProps) {
  const { user } = useAuth();

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
  const [mobileActiveView, setMobileActiveView] = useState<'editor' | 'preview'>('editor');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  // Autosave current draft to localStorage & Cloud
  useEffect(() => {
    localStorage.setItem('fbf_current_document_v4', JSON.stringify(document));
  }, [document]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleExportPdf = async () => {
    setIsExporting(true);
    const clientSlug = (document.client.clientName || document.client.nameOfEvent || 'Proposal').replace(
      /[^a-zA-Z0-9]/g,
      '_'
    );
    const fileName = `${document.type}_${clientSlug}_${document.details.invoiceNo || 'Doc'}.pdf`;

    const success = await exportDocumentToPdf('quotation-invoice-canvas', fileName);
    setIsExporting(false);

    if (success) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 },
      });
      showToast('Crisp A4 PDF generated and downloaded!');
    } else {
      showToast('Failed to generate PDF. You can also use the Print button.');
    }
  };

  const handlePrint = () => {
    printDocument();
  };

  const handleSaveToVault = async () => {
    const result = await saveDocument(document, user?.id);
    confetti({
      particleCount: 40,
      spread: 45,
      origin: { y: 0.85 },
    });

    if (result.isCloud) {
      showToast('Saved to Supabase Cloud & Local Vault!');
    } else {
      showToast('Saved to Document Vault locally.');
    }
  };

  const handleLoadDocument = (loadedDoc: QuotationDocument) => {
    setDocument(loadedDoc);
    showToast(`Loaded ${loadedDoc.type}: ${loadedDoc.client.nameOfEvent || loadedDoc.details.invoiceNo}`);
  };

  const handleStudioSave = (updatedStudio: StudioProfile) => {
    saveStudioProfileToStorage(updatedStudio);
    setDocument((prev) => ({
      ...prev,
      studio: updatedStudio,
    }));
    showToast('Business profile saved as permanent default!');
  };

  const handleNewDocument = () => {
    if (window.confirm('Start a fresh blank proposal / quotation?')) {
      const fresh = getDefaultDocument();
      setDocument(fresh);
      localStorage.setItem('fbf_current_document_v4', JSON.stringify(fresh));
      showToast('New blank quotation started!');
    }
  };

  const handleResetSample = () => {
    if (window.confirm('Reset all fields to the default sample template?')) {
      const fresh = getDefaultDocument();
      setDocument(fresh);
      localStorage.setItem('fbf_current_document_v4', JSON.stringify(fresh));
      showToast('Reset to fresh proposal template');
    }
  };

  const handleToggleWatermark = () => {
    const nextEnabled = !document.watermark.enabled;
    const updatedWatermark = {
      ...document.watermark,
      enabled: nextEnabled,
    };
    saveWatermarkConfigToStorage(updatedWatermark);
    setDocument((prev) => ({
      ...prev,
      watermark: updatedWatermark,
    }));
    showToast(`Watermark ${nextEnabled ? 'Enabled' : 'Disabled'}`);
  };

  const handleApproveFromClientView = (approvedDoc: QuotationDocument) => {
    setDocument(approvedDoc);
    saveDocument(approvedDoc, user?.id);
    showToast('Proposal signed and approved by client!');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Universal Navbar */}
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
        onNavigateToHome={onNavigateToHome}
        onResetSample={handleResetSample}
        onNewDocument={handleNewDocument}
        isExporting={isExporting}
        onToggleWatermark={handleToggleWatermark}
      />

      {/* Mobile View Toggle Bar */}
      <div className="lg:hidden flex bg-slate-900 border-b border-slate-800 p-2 gap-2 print:hidden no-print">
        <button
          type="button"
          onClick={() => setMobileActiveView('editor')}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
            mobileActiveView === 'editor'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'bg-slate-950 text-slate-400'
          }`}
        >
          <Edit3 className="w-4 h-4" />
          <span>Editor & Form</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileActiveView('preview')}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
            mobileActiveView === 'preview'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'bg-slate-950 text-slate-400'
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>Live Document Preview</span>
        </button>
      </div>

      {/* Main Workspace Split Layout */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden max-w-[1900px] w-full mx-auto p-3 lg:p-6 gap-6 print:p-0 print:m-0 print:max-w-none print:block">
        {/* Left Side: Interactive Form Editor (Hidden on Print) */}
        <section
          className={`w-full lg:w-[48%] xl:w-[45%] flex flex-col h-full print:hidden no-print ${
            mobileActiveView === 'editor' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          <FormEditor document={document} onChange={setDocument} />
        </section>

        {/* Right Side: Live Document Canvas Preview */}
        <section
          className={`w-full lg:w-[52%] xl:w-[55%] flex flex-col h-full print:w-full print:p-0 print:m-0 print:block print:border-none print:shadow-none ${
            mobileActiveView === 'preview' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col h-full shadow-2xl overflow-hidden print:p-0 print:m-0 print:border-none print:shadow-none print:bg-transparent print:rounded-none">
            {/* Canvas Toolbar (Hidden on Print) */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4 px-2 print:hidden no-print">
              <div className="flex items-center space-x-2">
                <FileCheck className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-semibold text-amber-100 uppercase tracking-wide font-['Outfit']">
                  Live {document.type === 'INVOICE' ? 'Tax Invoice' : 'Proposal'} Canvas
                </span>
                <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded font-mono">
                  A4 Print Ready (210×297mm)
                </span>
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setZoomScale((prev) => Math.max(0.55, prev - 0.08))}
                  className="p-1 text-slate-400 hover:text-amber-300 rounded hover:bg-slate-800 transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-mono text-slate-300 min-w-[38px] text-center font-medium">
                  {Math.round(zoomScale * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomScale((prev) => Math.min(1.2, prev + 0.08))}
                  className="p-1 text-slate-400 hover:text-amber-300 rounded hover:bg-slate-800 transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomScale(0.92)}
                  className="p-1 text-slate-400 hover:text-amber-300 rounded hover:bg-slate-800 transition-colors"
                  title="Reset Zoom"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Scrollable Canvas Viewport */}
            <div className="flex-1 overflow-auto bg-slate-950/70 rounded-xl p-4 lg:p-8 flex justify-center items-start shadow-inner border border-slate-800/60 print:p-0 print:m-0 print:bg-transparent print:border-none print:shadow-none print:overflow-visible print:block">
              <InvoiceDocumentView
                document={document}
                elementId="quotation-invoice-canvas"
                zoomScale={zoomScale}
              />
            </div>
          </div>
        </section>
      </main>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2 bg-slate-900 border border-amber-500/50 text-amber-200 px-4 py-2.5 rounded-xl shadow-2xl animate-fadeIn text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modals */}
      <StudioSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        studio={document.studio}
        onSave={handleStudioSave}
      />

      <HistoryVaultModal
        isOpen={isVaultOpen}
        onClose={() => setIsVaultOpen(false)}
        onLoadDocument={handleLoadDocument}
        currentDocumentId={document.id}
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
    </div>
  );
}

export function App() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryCategory | undefined>(undefined);

  const [currentView, setCurrentView] = useState<{
    type: 'landing' | 'studio' | 'admin' | 'public_proposal' | 'privacy' | 'terms';
    docId?: string;
  }>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const viewParam = urlParams.get('view');
    const pageParam = urlParams.get('page');
    const hash = window.location.hash;

    if (viewParam) {
      return { type: 'public_proposal', docId: viewParam };
    }
    if (hash.startsWith('#view/')) {
      return { type: 'public_proposal', docId: hash.replace('#view/', '') };
    }
    if (pageParam === 'admin' || hash === '#admin') {
      return { type: 'admin' };
    }
    if (pageParam === 'studio' || hash === '#studio') {
      return { type: 'studio' };
    }
    if (pageParam === 'privacy' || hash === '#privacy') {
      return { type: 'privacy' };
    }
    if (pageParam === 'terms' || hash === '#terms') {
      return { type: 'terms' };
    }
    if (pageParam === 'home' || hash === '#home') {
      return { type: 'landing' };
    }
    // Default to landing
    return { type: 'landing' };
  });

  useEffect(() => {
    const handleUrlChange = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const viewParam = urlParams.get('view');
      const pageParam = urlParams.get('page');
      const hash = window.location.hash;

      if (viewParam) {
        setCurrentView({ type: 'public_proposal', docId: viewParam });
      } else if (hash.startsWith('#view/')) {
        setCurrentView({ type: 'public_proposal', docId: hash.replace('#view/', '') });
      } else if (pageParam === 'admin' || hash === '#admin') {
        setCurrentView({ type: 'admin' });
      } else if (pageParam === 'studio' || hash === '#studio') {
        setCurrentView({ type: 'studio' });
      } else if (pageParam === 'privacy' || hash === '#privacy') {
        setCurrentView({ type: 'privacy' });
      } else if (pageParam === 'terms' || hash === '#terms') {
        setCurrentView({ type: 'terms' });
      } else if (pageParam === 'home' || hash === '#home') {
        setCurrentView({ type: 'landing' });
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
    window.location.hash = 'admin';
    setCurrentView({ type: 'admin' });
  };

  const navigateToStudio = () => {
    window.location.hash = 'studio';
    setCurrentView({ type: 'studio' });
  };

  const navigateToHome = () => {
    window.location.hash = 'home';
    setCurrentView({ type: 'landing' });
  };

  const handleSelectIndustryFromLanding = (industry: IndustryCategory) => {
    setSelectedIndustry(industry);
    window.location.hash = 'studio';
    setCurrentView({ type: 'studio' });
  };

  return (
    <AuthProvider>
      {currentView.type === 'public_proposal' && currentView.docId ? (
        <PublicProposalPage documentId={currentView.docId} />
      ) : currentView.type === 'admin' ? (
        <AdminLayout onBackToStudio={navigateToStudio} />
      ) : currentView.type === 'privacy' ? (
        <PrivacyPolicyPage onBack={navigateToHome} />
      ) : currentView.type === 'terms' ? (
        <TermsOfServicePage onBack={navigateToHome} />
      ) : currentView.type === 'landing' ? (
        <>
          <LandingPage
            onLaunchStudio={navigateToStudio}
            onOpenAuth={() => setIsAuthOpen(true)}
            onOpenAdmin={navigateToAdmin}
            onSelectIndustryPreset={handleSelectIndustryFromLanding}
            onSelectPlan={() => setIsAuthOpen(true)}
          />
          <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
        </>
      ) : (
        <StudioWorkspace
          initialIndustry={selectedIndustry}
          onNavigateToAdmin={navigateToAdmin}
          onNavigateToHome={navigateToHome}
        />
      )}
    </AuthProvider>
  );
}

export default App;

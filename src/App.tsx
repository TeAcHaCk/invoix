import { useState, useEffect, lazy, Suspense } from 'react';
import type { IndustryCategory } from './types';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { LandingPage } from './components/landing/LandingPage';
import { InstallAppPrompt } from './components/InstallAppPrompt';
import { AuthModal } from './components/AuthModal';
import { UpgradePlanModal } from './components/UpgradePlanModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { RouteFallback } from './components/RouteFallback';
import { Analytics } from '@vercel/analytics/react';

/*
  Route-level code splitting.

  The landing page is the entry point for every search visitor, so it stays
  eager. Everything else is reachable only after a click or via a share link and
  has no business blocking first paint — the editor alone pulls in FormEditor,
  three document views, the PDF stack and every modal.
*/
const StudioWorkspace = lazy(() => import('./components/StudioWorkspace'));
const InvoiceDocumentView = lazy(() =>
  import('./components/InvoiceDocumentView').then((m) => ({ default: m.InvoiceDocumentView }))
);
const PublicProposalPage = lazy(() =>
  import('./components/PublicProposalPage').then((m) => ({ default: m.PublicProposalPage }))
);
const AdminLayout = lazy(() =>
  import('./components/admin/AdminLayout').then((m) => ({ default: m.AdminLayout }))
);
const PrivacyPolicyPage = lazy(() =>
  import('./components/landing/PrivacyPolicyPage').then((m) => ({ default: m.PrivacyPolicyPage }))
);
const TermsOfServicePage = lazy(() =>
  import('./components/landing/TermsOfServicePage').then((m) => ({ default: m.TermsOfServicePage }))
);
const TemplateLandingPage = lazy(() =>
  import('./components/landing/TemplateLandingPage').then((m) => ({ default: m.TemplateLandingPage }))
);

// URL Route Resolver Helper
function parseCurrentRoute(): {
  type: 'landing' | 'studio' | 'admin' | 'public_proposal' | 'privacy' | 'terms' | 'template' | 'render_pdf';
  docId?: string;
  section?: string;
  templateSlug?: string;
} {
  const urlParams = new URLSearchParams(window.location.search);
  const renderPdfParam = urlParams.get('render_pdf');
  const viewParam = urlParams.get('view');
  const pageParam = urlParams.get('page');
  const templateParam = urlParams.get('template');
  const rawHash = window.location.hash.replace('#', '').toLowerCase();

  // 0. Direct Headless PDF Render Endpoint (?render_pdf=1)
  if (renderPdfParam) return { type: 'render_pdf' };

  // 1. Direct Public Proposal Link (?view=<shareToken> or #view/<shareToken>)
  if (viewParam) return { type: 'public_proposal', docId: viewParam };
  if (rawHash.startsWith('view/')) return { type: 'public_proposal', docId: rawHash.replace('view/', '') };

  // 2. Template Landing Pages (?template=<slug> or #template/<slug>)
  if (templateParam) return { type: 'template', templateSlug: templateParam };
  if (rawHash.startsWith('template/')) {
    return { type: 'template', templateSlug: rawHash.replace('template/', '') };
  }

  // 3. Landing Page Anchor Navigation (#features, #industries, #pricing, #faq, #home)
  const isLandingAnchor = ['features', 'industries', 'pricing', 'faq', 'home', ''].includes(rawHash);
  if (isLandingAnchor && rawHash !== '') {
    if (pageParam) {
      window.history.replaceState(null, '', `/#${rawHash}`);
    }
    return { type: 'landing', section: rawHash };
  }

  // 4. Page Routes (by hash or query param)
  if (rawHash === 'admin' || pageParam === 'admin') return { type: 'admin' };
  if (rawHash === 'studio' || pageParam === 'studio') return { type: 'studio' };
  if (rawHash === 'privacy' || pageParam === 'privacy') return { type: 'privacy' };
  if (rawHash === 'terms' || pageParam === 'terms') return { type: 'terms' };

  // 5. Default to Landing Page
  return { type: 'landing' };
}

export function App() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [upgradePlan, setUpgradePlan] = useState<'pro' | 'agency'>('pro');
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryCategory | undefined>(undefined);
  const [currentView, setCurrentView] = useState(parseCurrentRoute);
  const [renderDoc, setRenderDoc] = useState<any>(null);

  useEffect(() => {
    (window as unknown as { __invoixSetDocument?: (doc: unknown) => void }).__invoixSetDocument = (doc: unknown) => {
      setRenderDoc(doc);
    };
  }, []);

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
      <ToastProvider>
        {currentView.type === 'render_pdf' ? (
        <div className="bg-slate-900 min-h-screen p-4 flex justify-center">
          {renderDoc ? (
            <Suspense fallback={null}>
              <InvoiceDocumentView document={renderDoc} elementId="quotation-invoice-canvas" zoomScale={1} />
            </Suspense>
          ) : (
            <div className="text-white text-xs font-mono">Waiting for document payload...</div>
          )}
        </div>
      ) : currentView.type === 'public_proposal' ? (
        <ErrorBoundary
          label="public_proposal"
          fallback={
            <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
              <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-3 shadow-2xl">
                <h2 className="text-base font-bold text-slate-100 font-['Outfit']">Something went wrong</h2>
                <p className="text-xs text-slate-400">This proposal could not be displayed properly.</p>
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
          <Suspense fallback={<RouteFallback label="Loading Secure Proposal…" />}>
            <PublicProposalPage documentId={currentView.docId || ''} />
          </Suspense>
        </ErrorBoundary>
      ) : currentView.type === 'admin' ? (
        <Suspense fallback={<RouteFallback label="Loading Admin Panel…" />}>
          <AdminLayout onBackToStudio={navigateToStudio} />
        </Suspense>
      ) : currentView.type === 'privacy' ? (
        <Suspense fallback={<RouteFallback />}>
          <PrivacyPolicyPage
          onBack={() => navigateToHome()}
          onNavigateSection={(sec) => navigateToHome(sec)}
          onLaunchStudio={navigateToStudio}
          />
        </Suspense>
      ) : currentView.type === 'terms' ? (
        <Suspense fallback={<RouteFallback />}>
          <TermsOfServicePage
          onBack={() => navigateToHome()}
          onNavigateSection={(sec) => navigateToHome(sec)}
          onLaunchStudio={navigateToStudio}
          />
        </Suspense>
      ) : currentView.type === 'template' ? (
        <Suspense fallback={<RouteFallback label="Loading Proposal Template…" />}>
          <TemplateLandingPage
            slug={currentView.templateSlug || 'photography-quotation'}
            onUseTemplate={(industry) => {
              setSelectedIndustry(industry);
              window.history.pushState(null, '', '/#studio');
              setCurrentView({ type: 'studio' });
            }}
            onNavigateHome={() => navigateToHome()}
            onNavigatePricing={() => navigateToHome('pricing')}
          />
        </Suspense>
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
            onOpenAuth={() => setIsAuthOpen(true)}
          />
        </>
      ) : (
        <Suspense fallback={<RouteFallback label="Loading Studio…" />}>
          <StudioWorkspace
            initialIndustry={selectedIndustry}
            onNavigateToAdmin={navigateToAdmin}
            onNavigateToHome={() => navigateToHome()}
          />
        </Suspense>
      )}
        <InstallAppPrompt />
        <Analytics />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;

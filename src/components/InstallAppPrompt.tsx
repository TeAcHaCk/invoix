import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, Share, PlusSquare } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallAppPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS] = useState(() =>
    typeof window !== 'undefined' ? /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase()) : false
  );
  const [isStandalone] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true
      : false
  );
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isVisible, setIsVisible] = useState(() => !isStandalone);

  const triggerDismiss = React.useCallback(() => {
    setIsLeaving(true);
    setTimeout(() => {
      setIsVisible(false);
    }, 650);
  }, []);

  useEffect(() => {
    if (isStandalone) {
      return;
    }

    // Listen for native install prompt event (Android / Chrome / Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Auto-dismiss with smooth disappearing animation after 6 seconds
    const autoDismissTimer = setTimeout(() => {
      triggerDismiss();
    }, 6000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearTimeout(autoDismissTimer);
    };
  }, [isStandalone, triggerDismiss]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setDeferredPrompt(null);
      }
      triggerDismiss();
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      alert('To install Invoix, tap the Install icon in your browser address bar or menu.');
      triggerDismiss();
    }
  };

  if (!isVisible || isStandalone) {
    return null;
  }

  return (
    <>
      {/* Floating Bottom App Install Bar with Smooth In/Out Transition */}
      <aside
        aria-label="Install Invoix App"
        className={`fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-40 bg-slate-900/95 backdrop-blur-xl border border-amber-500/40 p-3.5 rounded-2xl shadow-2xl shadow-black/80 flex items-center justify-between space-x-3 transform transition-all duration-500 ${
          isLeaving
            ? 'opacity-0 translate-y-8 scale-95 pointer-events-none'
            : 'opacity-100 translate-y-0 scale-100'
        }`}
      >
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-slate-950 p-1 border border-slate-800 shrink-0 flex items-center justify-center">
            <img src="/invoix-logo.png" alt="Invoix" className="w-full h-full object-contain" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xs font-bold text-slate-100 font-['Outfit'] flex items-center space-x-1">
              <span>Install Invoix App</span>
              <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-mono">PWA</span>
            </h2>
            <p className="text-[11px] text-slate-400 truncate">
              {isIOS ? 'Add to Home Screen for offline access' : 'Fast, offline proposal creator'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 shrink-0">
          <button
            type="button"
            onClick={handleInstallClick}
            className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold rounded-xl shadow-md shadow-amber-500/20 flex items-center space-x-1 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Install</span>
          </button>
          <button
            type="button"
            onClick={triggerDismiss}
            className="p-1.5 text-slate-500 hover:text-slate-300 rounded-lg transition-colors cursor-pointer"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* iOS Instructions Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-end sm:items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Smartphone className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold font-['Outfit']">Install on iPhone / iPad</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="p-1 text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex items-start space-x-3 p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80">
                <div className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 font-bold text-[11px]">
                  1
                </div>
                <p>
                  Tap the <strong className="text-slate-100 inline-flex items-center gap-1"><Share className="w-3.5 h-3.5 inline" /> Share</strong> button at the bottom of Safari.
                </p>
              </div>

              <div className="flex items-start space-x-3 p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80">
                <div className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 font-bold text-[11px]">
                  2
                </div>
                <p>
                  Scroll down and tap <strong className="text-slate-100 inline-flex items-center gap-1"><PlusSquare className="w-3.5 h-3.5 inline" /> Add to Home Screen</strong>.
                </p>
              </div>

              <div className="flex items-start space-x-3 p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80">
                <div className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 font-bold text-[11px]">
                  3
                </div>
                <p>
                  Tap <strong className="text-slate-100">Add</strong> in the top-right corner.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-lg transition-colors cursor-pointer"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
};

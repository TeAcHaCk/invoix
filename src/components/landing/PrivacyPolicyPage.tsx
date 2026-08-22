import React from 'react';
import { ArrowLeft, ShieldCheck, ArrowRight } from 'lucide-react';

interface PrivacyPolicyPageProps {
  onBack: () => void;
  onNavigateSection?: (section: string) => void;
  onLaunchStudio?: () => void;
}

export const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({
  onBack,
  onNavigateSection,
  onLaunchStudio,
}) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/60 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={onBack}>
            <div className="p-1 rounded-xl bg-white/95 shadow-lg flex items-center justify-center">
              <img src="/invoix-logo.png" alt="Invoix Logo" className="h-7 max-w-[120px] object-contain" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h1 className="text-base font-extrabold text-slate-100 tracking-tight font-['Outfit']">
                  Invoix
                </h1>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded font-bold uppercase">
                  Privacy
                </span>
              </div>
            </div>
          </div>

          {/* Center Nav */}
          <nav className="hidden md:flex items-center space-x-8 text-xs font-semibold text-slate-300">
            <button
              type="button"
              onClick={() => (onNavigateSection ? onNavigateSection('features') : onBack())}
              className="hover:text-amber-400 transition-colors cursor-pointer"
            >
              Features
            </button>
            <button
              type="button"
              onClick={() => (onNavigateSection ? onNavigateSection('industries') : onBack())}
              className="hover:text-amber-400 transition-colors cursor-pointer"
            >
              Industries
            </button>
            <button
              type="button"
              onClick={() => (onNavigateSection ? onNavigateSection('pricing') : onBack())}
              className="hover:text-amber-400 transition-colors cursor-pointer"
            >
              Pricing
            </button>
            <button
              type="button"
              onClick={() => (onNavigateSection ? onNavigateSection('faq') : onBack())}
              className="hover:text-amber-400 transition-colors cursor-pointer"
            >
              FAQ
            </button>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onBack}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl border border-slate-800 flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </button>

            {onLaunchStudio && (
              <button
                type="button"
                onClick={onLaunchStudio}
                className="hidden sm:flex px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-amber-500/20 items-center space-x-1.5 transition-all cursor-pointer"
              >
                <span>Launch Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-8 py-12 space-y-10 text-sm leading-relaxed text-slate-300">
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100 font-['Outfit']">Privacy Policy</h2>
          </div>
          <p className="text-xs text-slate-400">Last updated: August 23, 2026</p>
          <p>
            At <strong className="text-slate-100">Invoix</strong> ("we," "our," or "us"), we are committed to protecting your privacy.
            This Privacy Policy describes how we collect, use, and safeguard your information when you use our
            web application at <a href="https://invoix.app" className="text-amber-400 hover:underline">invoix.app</a>.
          </p>
        </div>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-slate-100 font-['Outfit']">1. Information We Collect</h3>
          <p><strong className="text-slate-200">a) Information You Provide:</strong></p>
          <ul className="list-disc pl-6 space-y-1.5">
            <li>Account information (email address, name) if you create an account via Google OAuth or email/password authentication through Supabase</li>
            <li>Business/studio profile data (studio name, address, phone numbers, email, tax IDs) entered into quotation and invoice forms</li>
            <li>Client information (client names, addresses, contact details, event details) entered for generating proposals</li>
            <li>Document content (line items, pricing, terms and conditions, deliverables) created within the platform</li>
          </ul>
          <p><strong className="text-slate-200">b) Information Collected Automatically:</strong></p>
          <ul className="list-disc pl-6 space-y-1.5">
            <li>Browser type and version, device type, screen resolution</li>
            <li>IP address (anonymized, used only for audit trail on document acceptance)</li>
            <li>Usage data: pages visited, features used, document views</li>
            <li>Local storage data: documents saved to your browser's local storage ("Document Vault")</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-slate-100 font-['Outfit']">2. How We Use Your Information</h3>
          <ul className="list-disc pl-6 space-y-1.5">
            <li>To provide and maintain the quotation and invoice generation service</li>
            <li>To sync your documents across devices via Supabase cloud storage (if you opt in)</li>
            <li>To generate PDF exports and shareable public proposal links</li>
            <li>To record digital acceptance audit trails when clients approve proposals</li>
            <li>To improve the platform based on usage patterns</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-slate-100 font-['Outfit']">3. Data Storage & Security</h3>
          <ul className="list-disc pl-6 space-y-1.5">
            <li><strong className="text-slate-200">Local Storage:</strong> Documents saved to the "Document Vault" are stored in your browser's localStorage. This data remains on your device and is not transmitted to our servers unless you explicitly enable cloud sync.</li>
            <li><strong className="text-slate-200">Cloud Storage:</strong> If you sign in and enable cloud sync, your documents are stored securely in Supabase (PostgreSQL) with row-level security policies. Data is encrypted in transit (TLS 1.3) and at rest.</li>
            <li><strong className="text-slate-200">Authentication:</strong> We use Supabase Auth with Google OAuth 2.0. We never store or have access to your Google password.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-slate-100 font-['Outfit']">4. Cookies & Tracking</h3>
          <p>
            Invoix uses minimal cookies strictly necessary for authentication session management. We do not use
            third-party tracking cookies. We may use privacy-respecting analytics to understand aggregate usage patterns.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-slate-100 font-['Outfit']">5. Data Sharing</h3>
          <p>We do <strong className="text-slate-100">not</strong> sell, rent, or trade your personal information.</p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-slate-100 font-['Outfit']">6. Your Rights</h3>
          <ul className="list-disc pl-6 space-y-1.5">
            <li><strong className="text-slate-200">Access & Export:</strong> You can export your entire vault as a JSON backup file or download PDFs at any time</li>
            <li><strong className="text-slate-200">Deletion:</strong> You can delete individual documents or your entire account. Contact privacy@invoix.app for full account deletion</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-slate-100 font-['Outfit']">7. Contact Us</h3>
          <p>If you have any questions or concerns about this Privacy Policy, please contact us at:</p>
          <p className="font-semibold text-amber-300">privacy@invoix.app</p>
        </section>

        <div className="border-t border-slate-800 pt-8 text-center text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Invoix. All rights reserved.</p>
        </div>
      </main>
    </div>
  );
};

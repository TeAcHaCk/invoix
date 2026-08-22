import React from 'react';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

interface PrivacyPolicyPageProps {
  onBack: () => void;
}

export const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/60 px-4 sm:px-8 py-3.5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onBack}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-400 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h1 className="text-sm font-bold text-slate-100 font-['Outfit']">Privacy Policy</h1>
            </div>
          </div>
          <span className="text-[11px] text-slate-500">Last updated: August 2026</span>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-8 py-12 space-y-10 text-sm leading-relaxed text-slate-300">
        <div className="space-y-3">
          <h2 className="text-2xl font-extrabold text-slate-100 font-['Outfit']">Privacy Policy</h2>
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
            <li>Business/studio profile data (studio name, address, phone numbers, email, tax IDs) that you enter into quotation and invoice forms</li>
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
            <li>To communicate important updates about the service</li>
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
            third-party tracking cookies. We may use privacy-respecting analytics (such as Google Analytics with
            IP anonymization) to understand aggregate usage patterns.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-slate-100 font-['Outfit']">5. Data Sharing</h3>
          <p>We do <strong className="text-slate-100">not</strong> sell, rent, or trade your personal information. We may share data only in the following limited circumstances:</p>
          <ul className="list-disc pl-6 space-y-1.5">
            <li><strong className="text-slate-200">Service Providers:</strong> Supabase (database hosting), Vercel (website hosting), Google (authentication) — under strict data processing agreements</li>
            <li><strong className="text-slate-200">Legal Requirements:</strong> If required by law, court order, or governmental authority</li>
            <li><strong className="text-slate-200">Public Proposal Links:</strong> When you generate a shareable link for a client, only the specific document data is accessible via that link</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-slate-100 font-['Outfit']">6. Your Rights</h3>
          <ul className="list-disc pl-6 space-y-1.5">
            <li><strong className="text-slate-200">Access:</strong> You can view all your data within the platform at any time</li>
            <li><strong className="text-slate-200">Export:</strong> You can export your entire vault as a JSON backup file</li>
            <li><strong className="text-slate-200">Deletion:</strong> You can delete individual documents or your entire account. Contact us at privacy@invoix.app for full account deletion</li>
            <li><strong className="text-slate-200">Portability:</strong> Export your data in JSON format and PDF documents at any time</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-slate-100 font-['Outfit']">7. Children's Privacy</h3>
          <p>
            Invoix is not intended for use by individuals under 16 years of age. We do not knowingly collect
            personal information from children.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-slate-100 font-['Outfit']">8. Changes to This Policy</h3>
          <p>
            We may update this Privacy Policy from time to time. We will notify registered users of any material
            changes via email or an in-app notification. The "Last updated" date at the top of this page will be revised accordingly.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-slate-100 font-['Outfit']">9. Contact Us</h3>
          <p>
            If you have any questions or concerns about this Privacy Policy, please contact us at:
          </p>
          <p className="font-semibold text-amber-300">privacy@invoix.app</p>
        </section>

        <div className="border-t border-slate-800 pt-8 text-center text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Invoix. All rights reserved.</p>
        </div>
      </main>
    </div>
  );
};

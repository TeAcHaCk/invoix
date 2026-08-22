import React from 'react';
import { ArrowLeft, FileText, ArrowRight } from 'lucide-react';

interface TermsOfServicePageProps {
  onBack: () => void;
  onNavigateSection?: (section: string) => void;
  onLaunchStudio?: () => void;
}

export const TermsOfServicePage: React.FC<TermsOfServicePageProps> = ({
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
                  Terms
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
            <FileText className="w-6 h-6 text-amber-400" />
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100 font-['Outfit']">Terms of Service</h2>
          </div>
          <p className="text-xs text-slate-400">Last updated: August 23, 2026</p>
          <p>
            Welcome to <strong className="text-slate-100">Invoix</strong>. By accessing or using our web application at{' '}
            <a href="https://invoix.app" className="text-amber-400 hover:underline">invoix.app</a>,
            you agree to be bound by these Terms of Service ("Terms"). Please read them carefully.
          </p>
        </div>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-slate-100 font-['Outfit']">1. Service Description</h3>
          <p>
            Invoix is a web-based quotation, proposal, and invoice generation platform. The Service allows users to:
          </p>
          <ul className="list-disc pl-6 space-y-1.5">
            <li>Create, customize, and manage professional quotations and invoices</li>
            <li>Generate shareable client proposal links with interactive features</li>
            <li>Export documents as PDF files</li>
            <li>Store documents locally (browser storage) or in the cloud (via Supabase)</li>
            <li>Collect digital signatures and acceptance from clients</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-slate-100 font-['Outfit']">2. Account & Registration</h3>
          <ul className="list-disc pl-6 space-y-1.5">
            <li>You may use Invoix without creating an account (local-only mode)</li>
            <li>To use cloud sync features, you must register via Google OAuth or email/password</li>
            <li>You are responsible for maintaining the security of your account credentials</li>
            <li>You must be at least 16 years old to use the Service</li>
            <li>You must provide accurate and complete information during registration</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-slate-100 font-['Outfit']">3. Subscription Plans & Billing</h3>
          <ul className="list-disc pl-6 space-y-1.5">
            <li><strong className="text-slate-200">Free Plan:</strong> Core features with local vault storage and proposal builder</li>
            <li><strong className="text-slate-200">Pro Plan:</strong> Cloud storage, custom branding, and audit certificate features at listed rate</li>
            <li><strong className="text-slate-200">Agency Plan:</strong> Full-feature access with multi-client management at listed rate</li>
            <li>Prices are subject to change with 30 days advance notice to existing subscribers</li>
            <li>Refunds: We offer a 7-day money-back guarantee for new paid subscriptions</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-slate-100 font-['Outfit']">4. Acceptable Use</h3>
          <p>You agree <strong className="text-slate-100">not</strong> to:</p>
          <ul className="list-disc pl-6 space-y-1.5">
            <li>Use the Service for any illegal, fraudulent, or unauthorized purpose</li>
            <li>Generate fake invoices or quotations intended to deceive or defraud</li>
            <li>Attempt to access other users' data or accounts</li>
            <li>Reverse-engineer, decompile, or disassemble the Service</li>
            <li>Interfere with or disrupt the Service's infrastructure</li>
            <li>Use automated scripts or bots to access the Service</li>
            <li>Upload malicious content, viruses, or harmful code</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-slate-100 font-['Outfit']">5. Intellectual Property</h3>
          <ul className="list-disc pl-6 space-y-1.5">
            <li><strong className="text-slate-200">Our Property:</strong> The Invoix platform, including its code, design, logos, and documentation, is owned by Invoix and protected by intellectual property laws</li>
            <li><strong className="text-slate-200">Your Content:</strong> You retain full ownership of all documents, data, and content you create using the Service. We do not claim any rights over your content</li>
            <li><strong className="text-slate-200">License:</strong> You grant us a limited license to store, process, and display your content solely for the purpose of providing the Service to you</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-slate-100 font-['Outfit']">6. Digital Signatures & Legal Validity</h3>
          <ul className="list-disc pl-6 space-y-1.5">
            <li>Invoix provides digital signature and acceptance features for convenience</li>
            <li>The legal validity of digital signatures varies by jurisdiction</li>
            <li>Users are responsible for verifying the legal requirements for electronic signatures in their jurisdiction</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-slate-100 font-['Outfit']">7. Limitation of Liability</h3>
          <ul className="list-disc pl-6 space-y-1.5">
            <li>The Service is provided "as is" and "as available" without warranties of any kind</li>
            <li>We are not liable for financial losses, missed business opportunities, or damages arising from use of documents generated through the Service</li>
            <li>Our total liability shall not exceed the amount you paid us in the 12 months preceding the claim</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-slate-100 font-['Outfit']">8. Governing Law</h3>
          <p>
            These Terms are governed by and construed in accordance with the laws of India.
            Any disputes shall be subject to the exclusive jurisdiction of the courts in Bangalore, Karnataka, India.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-slate-100 font-['Outfit']">9. Contact Us</h3>
          <p>For questions about these Terms, please contact us at:</p>
          <p className="font-semibold text-amber-300">legal@invoix.app</p>
        </section>

        <div className="border-t border-slate-800 pt-8 text-center text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Invoix. All rights reserved.</p>
        </div>
      </main>
    </div>
  );
};

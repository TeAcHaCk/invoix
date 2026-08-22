import React from 'react';
import { ArrowLeft, FileText } from 'lucide-react';

interface TermsOfServicePageProps {
  onBack: () => void;
}

export const TermsOfServicePage: React.FC<TermsOfServicePageProps> = ({ onBack }) => {
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
              <FileText className="w-5 h-5 text-amber-400" />
              <h1 className="text-sm font-bold text-slate-100 font-['Outfit']">Terms of Service</h1>
            </div>
          </div>
          <span className="text-[11px] text-slate-500">Last updated: August 2026</span>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-8 py-12 space-y-10 text-sm leading-relaxed text-slate-300">
        <div className="space-y-3">
          <h2 className="text-2xl font-extrabold text-slate-100 font-['Outfit']">Terms of Service</h2>
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
            <li><strong className="text-slate-200">Free Plan:</strong> Core features with limited cloud storage and document generation</li>
            <li><strong className="text-slate-200">Pro Plan:</strong> Enhanced features at the monthly or annual rate displayed on our pricing page</li>
            <li><strong className="text-slate-200">Agency Plan:</strong> Full-feature access with multi-client management at the displayed rate</li>
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
          <h3 className="text-lg font-bold text-slate-100 font-['Outfit']">6. Data & Privacy</h3>
          <p>
            Your use of the Service is also governed by our{' '}
            <a href="/?page=privacy" className="text-amber-400 hover:underline">Privacy Policy</a>,
            which describes how we collect, use, and protect your information.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-slate-100 font-['Outfit']">7. Digital Signatures & Legal Validity</h3>
          <ul className="list-disc pl-6 space-y-1.5">
            <li>Invoix provides digital signature and acceptance features for convenience</li>
            <li>The legal validity of digital signatures varies by jurisdiction</li>
            <li>Invoix does not guarantee that digitally signed documents will be legally enforceable in all jurisdictions</li>
            <li>Users are responsible for verifying the legal requirements for electronic signatures in their jurisdiction</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-slate-100 font-['Outfit']">8. Limitation of Liability</h3>
          <ul className="list-disc pl-6 space-y-1.5">
            <li>The Service is provided "as is" and "as available" without warranties of any kind</li>
            <li>We are not liable for any financial losses, missed business opportunities, or damages arising from the use of documents generated through the Service</li>
            <li>Our total liability shall not exceed the amount you paid us in the 12 months preceding the claim</li>
            <li>We are not responsible for data loss due to browser storage clearing, device failure, or user error</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-slate-100 font-['Outfit']">9. Service Availability</h3>
          <p>
            We strive to maintain 99.9% uptime but do not guarantee uninterrupted access. The Service may be
            temporarily unavailable due to maintenance, updates, or circumstances beyond our control.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-slate-100 font-['Outfit']">10. Termination</h3>
          <ul className="list-disc pl-6 space-y-1.5">
            <li>You may stop using the Service and delete your account at any time</li>
            <li>We may suspend or terminate your account for violations of these Terms</li>
            <li>Upon termination, your cloud-stored data will be deleted within 30 days</li>
            <li>Locally stored data on your device is not affected by account termination</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-slate-100 font-['Outfit']">11. Changes to Terms</h3>
          <p>
            We reserve the right to modify these Terms at any time. Material changes will be communicated via
            email or in-app notification at least 15 days before taking effect. Continued use of the Service
            after changes take effect constitutes acceptance of the new Terms.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-slate-100 font-['Outfit']">12. Governing Law</h3>
          <p>
            These Terms are governed by and construed in accordance with the laws of India.
            Any disputes shall be subject to the exclusive jurisdiction of the courts in Bangalore, Karnataka, India.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-bold text-slate-100 font-['Outfit']">13. Contact Us</h3>
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

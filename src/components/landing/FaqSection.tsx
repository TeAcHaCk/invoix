import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useScrollReveal } from '../../hooks/useScrollReveal';

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const sectionRef = useScrollReveal();

  const faqs = [
    {
      q: 'How do my clients view and sign the proposals?',
      a: 'When you click "Copy Client Link" or send via WhatsApp, your client receives a private URL secured by a unique, unguessable link token. They can open it on their smartphone or laptop, select any optional upsell services they want, draw their digital signature on the touchscreen, and legally approve the proposal in seconds.',
    },
    {
      q: 'Are the digital e-signatures legally binding?',
      a: 'Yes. Every approval captures the client\'s handwritten signature data URL, authorized signatory name, timestamp, and agreed scope of work, creating an audit-ready digital contract record.',
    },
    {
      q: 'Can I customize my company branding, logo, and taxes?',
      a: 'Absolutely! You can upload your high-resolution logo, set your business contact details, bank wire instructions, UPI ID, and choose from 10+ global currencies with compliant GST, VAT, or Sales Tax rates.',
    },
    {
      q: 'How do the offline dynamic payment QR codes work?',
      a: 'Our QR engine renders 100% in your browser using standard UPI and payment protocol formats. You do not need to connect complex API keys — just enter your UPI ID or Stripe/PayPal payment link, and the QR code is automatically generated on your invoices.',
    },
    {
      q: 'Can I export clean multi-page A4 PDFs?',
      a: 'Yes. With one click, the platform generates pixel-perfect A4 vector PDFs (210×297mm standard) ready for formal email attachments or print.',
    },
    {
      q: 'Can I switch plans or cancel my subscription anytime?',
      a: 'Yes. You can start with the free starter tier and upgrade to Pro or Agency whenever you are ready. Subscriptions can be canceled with one click in your account settings.',
    },
  ];

  const toggleFaq = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" ref={sectionRef} className="py-28 px-4 sm:px-8 font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="max-w-3xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4 reveal-on-scroll">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-[0.2em] font-['Outfit']">
            Got Questions?
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-100 font-['Outfit']">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-slate-400">
            Everything you need to know about the platform, signatures, and payments.
          </p>
        </div>

        {/* Accordion */}
        <div className="space-y-3 reveal-on-scroll">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                className={`glass rounded-2xl overflow-hidden transition-all duration-300 ${
                  isOpen ? 'border-l-2 border-l-amber-500' : 'border-l-2 border-l-transparent'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(i)}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between space-x-4 cursor-pointer"
                >
                  <span className={`text-xs sm:text-sm font-bold font-['Outfit'] transition-colors duration-200 ${
                    isOpen ? 'text-amber-200' : 'text-slate-200'
                  }`}>
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-amber-400 transition-transform duration-300 shrink-0 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                <div className={`accordion-content ${isOpen ? 'open' : ''}`}>
                  <div className="px-5 sm:px-6 pb-5 sm:pb-6 text-xs text-slate-400 leading-relaxed">
                    {faq.a}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

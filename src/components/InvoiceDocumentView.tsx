import React from 'react';
import type { QuotationDocument } from '../types';
import { WatermarkLayer } from './WatermarkLayer';
import { FormalInvoiceView } from './FormalInvoiceView';
import { formatCurrency } from '../utils/formatters';
import { Users, Sparkles, ShieldCheck } from 'lucide-react';

interface InvoiceDocumentViewProps {
  document: QuotationDocument;
  elementId?: string;
  zoomScale?: number;
}

export const InvoiceDocumentView: React.FC<InvoiceDocumentViewProps> = ({
  document: doc,
  elementId = 'quotation-invoice-canvas',
  zoomScale = 1,
}) => {
  // If INVOICE mode is selected, render the dedicated Formal Tax/Payment Invoice layout!
  if (doc.type === 'INVOICE') {
    return (
      <div
        className="canvas-viewport flex justify-center items-start transition-all duration-200"
        style={{
          transform: `scale(${zoomScale})`,
          transformOrigin: 'top center',
        }}
      >
        <div id={elementId} className="space-y-6">
          <div
            className="print-page bg-white shadow-2xl transition-all duration-200"
            style={{
              width: '794px',
              minHeight: '1123px',
              boxSizing: 'border-box',
            }}
          >
            <FormalInvoiceView document={doc} />
          </div>
        </div>
      </div>
    );
  }

  // Otherwise, render the Luxury Studio Quotation Proposal Layout!
  const getEventDateDisplay = () => {
    if (doc.details.eventDateMode === 'single') {
      return doc.details.eventDate || 'DD/MM/YYYY';
    }
    if (doc.details.eventDateFrom && doc.details.eventDateTo) {
      if (doc.details.eventDateFrom === doc.details.eventDateTo) {
        return doc.details.eventDateFrom;
      }
      return `${doc.details.eventDateFrom} to ${doc.details.eventDateTo}`;
    }
    return doc.details.eventDateFrom || doc.details.eventDateTo || 'DD/MM/YYYY';
  };

  // Calculations for payment terms
  const totalAmount = doc.totalInvestment || 0;
  const advanceAmount = doc.paymentTerms?.isCustomAmounts
    ? doc.paymentTerms?.advanceCustomAmount ?? Math.round((totalAmount * doc.paymentTerms?.advancePercent) / 100)
    : Math.round((totalAmount * (doc.paymentTerms?.advancePercent || 30)) / 100);

  const afterEventAmount = doc.paymentTerms?.isCustomAmounts
    ? doc.paymentTerms?.afterEventCustomAmount ?? Math.round((totalAmount * doc.paymentTerms?.afterEventPercent) / 100)
    : Math.round((totalAmount * (doc.paymentTerms?.afterEventPercent || 50)) / 100);

  const balanceAmount = doc.paymentTerms?.isCustomAmounts
    ? doc.paymentTerms?.balanceCustomAmount ?? Math.round((totalAmount * doc.paymentTerms?.balancePercent) / 100)
    : Math.max(0, totalAmount - advanceAmount - afterEventAmount);

  // Split terms into 2 balanced columns
  const termsList = doc.termsAndConditions || [];
  const halfLength = Math.ceil(termsList.length / 2);
  const leftTerms = termsList.slice(0, halfLength);
  const rightTerms = termsList.slice(halfLength);

  const activeCrew = (doc.crewMembers || []).filter((c) => c.enabled);
  const activeWhyChoose = (doc.whyChooseUs || []).filter((w) => w.enabled);
  const hasPage2 = (doc.includeCrewSection !== false && activeCrew.length > 0) || (doc.includeWhyChooseUs !== false && activeWhyChoose.length > 0);

  const logoWidth = doc.studio.logoWidth || 320;
  const logoHeight = doc.studio.logoHeight || 130;

  return (
    <div
      className="canvas-viewport flex justify-center items-start transition-all duration-200"
      style={{
        transform: `scale(${zoomScale})`,
        transformOrigin: 'top center',
      }}
    >
      <div id={elementId} className="space-y-8 print:space-y-0">
        {/* ========================================================= */}
        {/* PAGE 1: PRIMARY QUOTATION & PACKAGE OVERVIEW               */}
        {/* ========================================================= */}
        <div
          className="print-page bg-white shadow-2xl relative transition-all duration-200"
          style={{
            width: '794px',
            minHeight: '1123px',
            boxSizing: 'border-box',
          }}
        >
          {/* Dynamic Watermark Background Layer */}
          <WatermarkLayer config={doc.watermark} />

          {/* Content Container */}
          <div className="relative z-10 p-8 sm:p-10 text-left font-['Plus_Jakarta_Sans',sans-serif] text-slate-900 flex flex-col justify-between h-full min-h-[1123px]">
            <div>
              {/* TOP HEADER SECTION */}
              <div className="flex flex-col items-center justify-center text-center">
                {doc.studio.logoUrl ? (
                  <div className="flex items-center justify-center mb-1">
                    <img
                      src={doc.studio.logoUrl}
                      alt={doc.studio.name}
                      style={{
                        width: `${logoWidth}px`,
                        maxHeight: `${logoHeight}px`,
                        objectFit: 'contain',
                      }}
                    />
                  </div>
                ) : (
                  <>
                    <h1 className="text-3xl font-bold tracking-[0.05em] text-[#111111] font-['Outfit',sans-serif]">
                      {doc.studio.name}
                    </h1>
                    <p className="text-[10px] tracking-[0.25em] text-[#8C692D] uppercase font-semibold mt-0.5">
                      {doc.studio.tagline}
                    </p>
                  </>
                )}

                {/* Decorative top separator line */}
                <div className="w-full border-b border-[#8C692D] mt-2 mb-2"></div>

                {/* Document Type Title Header */}
                <div className="relative w-full flex items-center justify-center my-1">
                  <span className="text-[10.5px] text-slate-400 font-medium absolute left-0 whitespace-nowrap">
                    Page 1 of {hasPage2 ? '2' : '1'}
                  </span>
                  <h2 className="font-bold tracking-[0.2em] text-[16px] text-[#111111] uppercase font-['Outfit',sans-serif] whitespace-nowrap">
                    QUOTATION & PROPOSAL
                  </h2>
                  <span className="text-[10.5px] text-amber-700 font-bold uppercase tracking-wider font-['Outfit'] absolute right-0 whitespace-nowrap">
                    Official Proposal
                  </span>
                </div>
              </div>

              {/* Bill To & Quotation Details Grid */}
              <div className="grid grid-cols-2 gap-8 my-2.5 text-[12.5px] leading-relaxed">
                {/* Left Column: Bill To */}
                <div>
                  <div className="font-bold text-[#111111] text-[13px] tracking-wide mb-1 uppercase font-['Outfit',sans-serif] whitespace-nowrap">
                    BILL TO
                  </div>
                  <div className="flex items-start text-slate-800">
                    <span className="text-slate-600 min-w-[95px]">Name of Event:</span>
                    <span className="font-bold text-[#111111] ml-1">{doc.client.nameOfEvent || '—'}</span>
                  </div>
                  <div className="flex items-start text-slate-800">
                    <span className="text-slate-600 min-w-[95px]">Address:</span>
                    <span className="font-bold text-[#111111] ml-1">{doc.client.address || '—'}</span>
                  </div>
                  <div className="flex items-start text-slate-800">
                    <span className="text-slate-600 min-w-[95px]">Contact No.:</span>
                    <span className="font-bold text-[#111111] ml-1">{doc.client.contactNo || '—'}</span>
                  </div>
                </div>

                {/* Right Column: Quotation Details */}
                <div className="pl-4">
                  <div className="font-bold text-[#8C692D] text-[13px] tracking-wide mb-1 uppercase font-['Outfit',sans-serif] whitespace-nowrap">
                    QUOTATION DETAILS
                  </div>
                  <div className="flex items-start text-slate-800">
                    <span className="text-slate-600 min-w-[95px]">Quotation No.:</span>
                    <span className="font-bold text-[#111111] ml-1">{doc.details.invoiceNo || '—'}</span>
                  </div>
                  <div className="flex items-start text-slate-800">
                    <span className="text-slate-600 min-w-[95px]">Date of Quote:</span>
                    <span className="font-bold text-[#111111] ml-1">{doc.details.invoiceDate || '—'}</span>
                  </div>
                  <div className="flex items-start text-slate-800">
                    <span className="text-slate-600 min-w-[95px]">Event Date(s):</span>
                    <span className="font-bold text-[#111111] ml-1">{getEventDateDisplay()}</span>
                  </div>
                </div>
              </div>

              {/* Golden Bronze Package Ribbon Banner */}
              {doc.packageBannerTitle && (
                <div className="bg-[#7A551E] text-white text-center font-bold text-[13px] tracking-wider py-1.5 px-4 my-2.5 uppercase rounded-[2px] shadow-sm font-['Outfit',sans-serif]">
                  {doc.packageBannerTitle}
                </div>
              )}

              {/* 2-Column: Event Coverage & Deliverables */}
              <div className="grid grid-cols-2 gap-8 my-2.5 text-[12px] leading-normal">
                {/* Event Coverage Column */}
                <div>
                  <div className="font-bold text-[#111111] text-[13px] tracking-wide uppercase mb-1.5 font-['Outfit',sans-serif] whitespace-nowrap">
                    EVENT COVERAGE
                  </div>
                  {doc.eventCoverage && doc.eventCoverage.length > 0 ? (
                    doc.eventCoverage.map((item) => (
                      <div key={item.id} className="mb-2">
                        {item.dayTitle && (
                          <div className="font-bold text-[#111111] mb-1">
                            {item.dayTitle}
                          </div>
                        )}
                        <div className="space-y-1 text-slate-800 font-medium">
                          {item.services
                            .filter((svc) => svc.trim().length > 0)
                            .map((svc, idx) => (
                              <div key={idx} className="flex items-start space-x-1.5 leading-snug">
                                <span className="text-slate-900 font-bold select-none shrink-0">•</span>
                                <span className="flex-1">{svc}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 italic">No services selected</p>
                  )}
                </div>

                {/* Deliverables Column */}
                <div className="pl-4">
                  <div className="font-bold text-[#111111] text-[13px] tracking-wide uppercase mb-1.5 font-['Outfit',sans-serif] whitespace-nowrap">
                    DELIVERABLES
                  </div>
                  <div className="space-y-1 text-slate-800 font-medium">
                    {doc.deliverables.filter((del) => del.included).length > 0 ? (
                      doc.deliverables
                        .filter((del) => del.included)
                        .map((del) => (
                          <div key={del.id} className="flex items-start space-x-1.5 leading-tight">
                            <span className="text-slate-900 font-bold select-none shrink-0">•</span>
                            <span className="flex-1">{del.text}</span>
                          </div>
                        ))
                    ) : (
                      <div className="text-slate-400 italic">No deliverables selected</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Description & Amount Table */}
              <div className="mt-3 mb-1">
                <div className="flex justify-between border-b border-slate-300 pb-1 text-[12.5px] font-bold tracking-wider uppercase font-['Outfit',sans-serif]">
                  <span>DESCRIPTION</span>
                  <span>AMOUNT</span>
                </div>
                <div className="divide-y divide-slate-200">
                  {doc.pricingItems.map((item) => (
                    <div key={item.id} className="flex justify-between py-1.5 text-[12px]">
                      <span className="text-slate-800 font-medium">{item.description}</span>
                      <span className="text-slate-900 font-medium">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                </div>

                {/* Total Investment Row */}
                <div className="flex justify-between items-center py-1.5 border-t border-b border-[#111111] mt-1">
                  <span className="font-bold text-[13.5px] tracking-wide uppercase text-[#111111] font-['Outfit',sans-serif]">
                    TOTAL INVESTMENT
                  </span>
                  <span className="font-bold text-[14px] text-[#111111]">
                    {formatCurrency(doc.totalInvestment)}
                  </span>
                </div>
              </div>

              {/* Booking Confirmation & Payment Terms */}
              <div className="mt-2 mb-2">
                <div className="font-bold text-[#8C692D] text-[13.5px] mb-1 font-['Outfit',sans-serif]">
                  Booking Confirmation
                </div>
                <div className="text-[11.5px] leading-relaxed text-slate-800">
                  <div className="font-bold text-[#111111] uppercase tracking-wide text-[11px] mb-0.5 font-['Outfit',sans-serif]">
                    PAYMENT TERMS
                  </div>
                  <div className="space-y-0.5 font-medium">
                    <div>
                      {doc.paymentTerms.advancePercent}% Advance:{' '}
                      <span className="font-bold text-[#111111]">{formatCurrency(advanceAmount)}</span> — at booking
                    </div>
                    <div>
                      {doc.paymentTerms.afterEventPercent}% After the event:{' '}
                      <span className="font-bold text-[#111111]">{formatCurrency(afterEventAmount)}</span>
                    </div>
                    <div>
                      {doc.paymentTerms.balancePercent}% Balance after final delivery:{' '}
                      <span className="font-bold text-[#111111]">{formatCurrency(balanceAmount)}</span>
                    </div>
                    <div className="font-bold text-[#111111] mt-0.5">
                      Total = {formatCurrency(totalAmount)}
                    </div>
                  </div>
                </div>
                {/* Separator under Payment Terms */}
                <div className="w-full border-b border-[#8C692D] mt-2 mb-2"></div>
              </div>

              {/* Terms & Conditions Section (2 Columns with Proper Hanging Indent) */}
              <div className="mt-1">
                <div className="font-bold text-[#8C692D] text-[13px] mb-2 font-['Outfit',sans-serif] flex items-center whitespace-nowrap">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-[#8C692D] shrink-0" />
                  <span>Standard Booking Terms</span>
                </div>
                <div className="grid grid-cols-2 gap-x-8 text-[10.2px] leading-[1.38] text-slate-800">
                  {/* Left Terms Column */}
                  <div className="space-y-1.5">
                    {leftTerms.map((term, idx) => (
                      <div key={idx} className="flex items-start space-x-1.5">
                        <span className="text-slate-900 font-bold select-none shrink-0 leading-[1.35]">•</span>
                        <span className="flex-1 leading-[1.35]">{term}</span>
                      </div>
                    ))}
                  </div>

                  {/* Right Terms Column */}
                  <div className="space-y-1.5">
                    {rightTerms.map((term, idx) => (
                      <div key={idx} className="flex items-start space-x-1.5">
                        <span className="text-slate-900 font-bold select-none shrink-0 leading-[1.35]">•</span>
                        <span className="flex-1 leading-[1.35]">{term}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* PAGE 1 FOOTER */}
            <div className="mt-4 pt-2 border-t border-[#8C692D] text-center">
              <p className="text-[11px] text-slate-600 font-medium mb-1">
                {doc.footerNote || 'Thank you for choosing Fusion Bells Films to capture your special moments.'}
              </p>
              <p className="text-[10.5px] font-bold text-slate-800 tracking-wide">
                <span>{doc.studio.address}</span>
                <span className="mx-2 text-[#8C692D]">|</span>
                <span>{doc.studio.phoneNumbers}</span>
                {doc.studio.website && (
                  <>
                    <span className="mx-2 text-[#8C692D]">|</span>
                    <span className="text-[#8C692D]">{doc.studio.website}</span>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* PAGE 2: CREW & ROLES, WHY CHOOSE US & STUDIO GUARANTEES   */}
        {/* ========================================================= */}
        {hasPage2 && (
          <div
            className="print-page bg-white shadow-2xl relative transition-all duration-200 page-break-before"
            style={{
              width: '794px',
              minHeight: '1123px',
              boxSizing: 'border-box',
            }}
          >
            {/* Dynamic Watermark Background Layer */}
            <WatermarkLayer config={doc.watermark} />

            {/* Content Container */}
            <div className="relative z-10 p-8 sm:p-10 text-left font-['Plus_Jakarta_Sans',sans-serif] text-slate-900 flex flex-col justify-between h-full min-h-[1123px]">
              <div>
                {/* TOP HEADER SECTION */}
                <div className="flex flex-col items-center justify-center text-center">
                  {doc.studio.logoUrl ? (
                    <div className="flex items-center justify-center mb-1">
                      <img
                        src={doc.studio.logoUrl}
                        alt={doc.studio.name}
                        style={{
                          width: `${Math.min(logoWidth, 260)}px`,
                          maxHeight: `${Math.min(logoHeight, 100)}px`,
                          objectFit: 'contain',
                        }}
                      />
                    </div>
                  ) : (
                    <h1 className="text-2xl font-bold tracking-[0.05em] text-[#111111] font-['Outfit',sans-serif]">
                      {doc.studio.name}
                    </h1>
                  )}

                  {/* Decorative top separator line */}
                  <div className="w-full border-b border-[#8C692D] mt-2 mb-2"></div>

                  {/* Document Subtitle Title */}
                  <div className="relative w-full flex items-center justify-center my-1">
                    <span className="text-[10.5px] text-slate-400 font-medium absolute left-0 whitespace-nowrap">
                      Page 2 of 2
                    </span>
                    <h2 className="font-bold tracking-[0.2em] text-[15px] text-[#111111] uppercase font-['Outfit',sans-serif] whitespace-nowrap">
                      STUDIO PROPOSAL & CREW ROLES
                    </h2>
                    <span className="text-[10.5px] text-amber-700 font-bold uppercase tracking-wider font-['Outfit'] absolute right-0 whitespace-nowrap">
                      Service Scope
                    </span>
                  </div>
                </div>

                {/* SECTION 1: WHY WORK WITH FUSION BELLS FILMS */}
                {doc.includeWhyChooseUs !== false && activeWhyChoose.length > 0 && (
                  <div className="my-4">
                    <div className="bg-amber-50/70 border border-amber-500/30 rounded-xl p-4">
                      <div className="font-bold text-[#8C692D] text-[14.5px] mb-1 font-['Outfit',sans-serif] flex items-center whitespace-nowrap">
                        <Sparkles className="w-4 h-4 mr-2 text-[#8C692D] shrink-0" />
                        <span>Why Work With Fusion Bells Films?</span>
                      </div>
                      <p className="text-[11.5px] text-slate-700 leading-relaxed mb-3 font-medium">
                        Your wedding is a once-in-a-lifetime celebration, and every moment deserves to be preserved beautifully. At Fusion Bells Films, we don't just take photos—we tell your love story with creativity, emotion, and attention to detail.
                      </p>

                      <div className="grid grid-cols-2 gap-3.5">
                        {activeWhyChoose.map((item) => (
                          <div
                            key={item.id}
                            className="bg-white/80 border border-amber-200/80 rounded-lg p-2.5 flex items-start space-x-2.5 shadow-sm"
                          >
                            <span className="text-lg shrink-0 pt-0.5">{item.icon}</span>
                            <div>
                              <h5 className="font-bold text-slate-900 text-[12px] font-['Outfit']">
                                {item.title}
                              </h5>
                              <p className="text-[10.5px] text-slate-600 leading-snug mt-0.5">
                                {item.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* SECTION 2: CREW AND ROLE AT THE EVENT (From Reference Image 1) */}
                {doc.includeCrewSection !== false && activeCrew.length > 0 && (
                  <div className="my-5">
                    <div className="font-bold text-[#111111] text-[14.5px] mb-2.5 font-['Outfit',sans-serif] flex items-center justify-between">
                      <div className="flex items-center whitespace-nowrap">
                        <Users className="w-4 h-4 mr-2 text-[#8C692D] shrink-0" />
                        <span>Crew and Role at the Event</span>
                      </div>
                      <span className="text-[10.5px] text-slate-500 font-normal whitespace-nowrap">
                        Dedicated On-Site Production Team
                      </span>
                    </div>

                    <div className="border-2 border-slate-900 rounded-xl overflow-hidden shadow-sm">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-[#8fa6a0]/35 border-b-2 border-slate-900 text-slate-950 font-['Outfit'] font-extrabold uppercase text-[11.5px] tracking-wider">
                            <th className="py-2.5 px-4 w-1/3 border-r border-slate-400">Team</th>
                            <th className="py-2.5 px-4">Role & On-Site Responsibility</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-300">
                          {activeCrew.map((crew) => (
                            <tr key={crew.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-2.5 px-4 font-bold text-slate-900 border-r border-slate-300 align-top text-[11.5px] font-['Outfit']">
                                {crew.team}
                              </td>
                              <td className="py-2.5 px-4 text-slate-700 leading-relaxed text-[11px]">
                                {crew.role}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* SECTION 3: CONTRACTUAL POLICIES & DELIVERABLES TIMELINE */}
                <div className="my-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider font-['Outfit'] flex items-center whitespace-nowrap">
                    <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-amber-700 shrink-0" />
                    <span>Booking, Cancellation & Data Delivery Policy</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-[10.5px] leading-relaxed">
                    <div className="flex items-start space-x-1.5">
                      <span className="text-slate-900 font-bold select-none shrink-0">•</span>
                      <div>
                        <p className="font-semibold text-slate-900 mb-0.5">Data Backup & SSD:</p>
                        <p className="text-slate-600">Client should provide a Hard Disk or SSD (preferably 2TB) for complete high-resolution raw data backup after the event.</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-1.5">
                      <span className="text-slate-900 font-bold select-none shrink-0">•</span>
                      <div>
                        <p className="font-semibold text-slate-900 mb-0.5">Event Cancellation Policy:</p>
                        <p className="text-slate-600">More than 1 month before event = 50% advance refund. Within 1 month = No refund.</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-1.5">
                      <span className="text-slate-900 font-bold select-none shrink-0">•</span>
                      <div>
                        <p className="font-semibold text-slate-900 mb-0.5">Album Delivery Timeline:</p>
                        <p className="text-slate-600">Albums will be delivered approximately within 30 days after the client completes photo selection.</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-1.5">
                      <span className="text-slate-900 font-bold select-none shrink-0">•</span>
                      <div>
                        <p className="font-semibold text-slate-900 mb-0.5">Outstation & Logistics:</p>
                        <p className="text-slate-600">Travel, food and accommodation outside Bangalore will be provided by the client or billed separately.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* PAGE 2 FOOTER */}
              <div className="mt-4 pt-3 border-t border-[#8C692D] flex items-center justify-between text-xs text-slate-600">
                <div className="space-y-0.5">
                  <p className="font-bold text-slate-900 leading-none">{doc.studio.name}</p>
                  <p className="text-[10px] text-slate-500 leading-none">{doc.studio.phoneNumbers} • {doc.studio.website}</p>
                </div>
                <div className="text-right space-y-0.5">
                  <p className="text-[10.5px] font-bold text-amber-800 font-['Outfit'] uppercase whitespace-nowrap leading-none">
                    Real Moments, Timeless Stories
                  </p>
                  <p className="text-[9.5px] text-slate-400 whitespace-nowrap leading-none">
                    Quotation Ref: {doc.details.invoiceNo}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import React from 'react';
import type { QuotationDocument } from '../types';
import { WatermarkLayer } from './WatermarkLayer';
import { formatCurrency } from '../utils/formatters';

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
  // Format event date(s)
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
  const advanceAmount = doc.paymentTerms.isCustomAmounts
    ? doc.paymentTerms.advanceCustomAmount ?? Math.round((totalAmount * doc.paymentTerms.advancePercent) / 100)
    : Math.round((totalAmount * doc.paymentTerms.advancePercent) / 100);

  const afterEventAmount = doc.paymentTerms.isCustomAmounts
    ? doc.paymentTerms.afterEventCustomAmount ?? Math.round((totalAmount * doc.paymentTerms.afterEventPercent) / 100)
    : Math.round((totalAmount * doc.paymentTerms.afterEventPercent) / 100);

  const balanceAmount = doc.paymentTerms.isCustomAmounts
    ? doc.paymentTerms.balanceCustomAmount ?? Math.round((totalAmount * doc.paymentTerms.balancePercent) / 100)
    : Math.max(0, totalAmount - advanceAmount - afterEventAmount);

  // Split terms into 2 balanced columns
  const halfLength = Math.ceil(doc.termsAndConditions.length / 2);
  const leftTerms = doc.termsAndConditions.slice(0, halfLength);
  const rightTerms = doc.termsAndConditions.slice(halfLength);

  return (
    <div
      className="transition-transform origin-top flex justify-center print:transform-none print:m-0"
      style={{
        transform: zoomScale !== 1 ? `scale(${zoomScale})` : undefined,
      }}
    >
      <div
        id={elementId}
        className="w-[794px] min-h-[1123px] bg-white text-[#111111] relative p-8 shadow-2xl flex flex-col justify-between select-text print:shadow-none print:w-full print:p-6 print:min-h-0 print:border-none font-['Montserrat',sans-serif]"
        style={{
          boxSizing: 'border-box',
        }}
      >
        {/* Dynamic Watermark Background Layer */}
        <WatermarkLayer config={doc.watermark} />

        {/* Content Container (Layered above watermark) */}
        <div className="relative z-10 flex flex-col h-full justify-between flex-1">
          {/* TOP SECTION */}
          <div>
            {/* Header / Logo */}
            <div className="flex flex-col items-center justify-center pb-1">
              {doc.studio.logoUrl ? (
                <img
                  src={doc.studio.logoUrl}
                  alt={doc.studio.name}
                  style={{
                    width: `${doc.studio.logoWidth || 320}px`,
                    maxHeight: `${doc.studio.logoHeight || 130}px`,
                  }}
                  className="max-w-[460px] object-contain mb-1 transition-all"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="text-center py-1">
                  <h1 className="text-2xl font-bold tracking-wider font-serif text-[#111111]">
                    {doc.studio.name}
                  </h1>
                  <p className="text-[10px] tracking-[0.25em] text-[#666666] uppercase mt-0.5">
                    {doc.studio.tagline}
                  </p>
                </div>
              )}

              {/* Decorative top separator line matching reference */}
              <div className="w-full border-b border-[#8C692D] mt-2 mb-2"></div>

              {/* Document Type Title */}
              <h2 className="text-center font-bold tracking-[0.2em] text-[17px] text-[#111111] uppercase font-['Outfit',sans-serif]">
                {doc.type}
              </h2>
            </div>

            {/* Bill To & Invoice Details Grid */}
            <div className="grid grid-cols-2 gap-8 my-2 text-[12.5px] leading-relaxed">
              {/* Left Column: Bill To */}
              <div>
                <div className="font-bold text-[#111111] text-[13px] tracking-wide mb-1 uppercase font-['Outfit',sans-serif]">
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

              {/* Right Column: Invoice Details */}
              <div className="pl-4">
                <div className="font-bold text-[#8C692D] text-[13px] tracking-wide mb-1 uppercase font-['Outfit',sans-serif]">
                  {doc.type === 'INVOICE' ? 'INVOICE DETAILS' : 'INVOICE DETAILS'}
                </div>
                <div className="flex items-start text-slate-800">
                  <span className="text-slate-600 min-w-[95px]">
                    {doc.type === 'INVOICE' ? 'Invoice No.:' : 'Invoice No.:'}
                  </span>
                  <span className="font-bold text-[#111111] ml-1">{doc.details.invoiceNo || '—'}</span>
                </div>
                <div className="flex items-start text-slate-800">
                  <span className="text-slate-600 min-w-[95px]">
                    {doc.type === 'INVOICE' ? 'Invoice Date:' : 'Invoice Date:'}
                  </span>
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
                <div className="font-bold text-[#111111] text-[13px] tracking-wide uppercase mb-1.5 font-['Outfit',sans-serif]">
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
                      <ul className="space-y-0.5 text-slate-800 font-medium">
                        {item.services
                          .filter((svc) => svc.trim().length > 0)
                          .map((svc, idx) => (
                            <li key={idx} className="leading-snug">{svc}</li>
                          ))}
                      </ul>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 italic">No services selected</p>
                )}
              </div>

              {/* Deliverables Column */}
              <div className="pl-4">
                <div className="font-bold text-[#111111] text-[13px] tracking-wide uppercase mb-1.5 font-['Outfit',sans-serif]">
                  DELIVERABLES
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-800 font-medium marker:text-[#111111]">
                  {doc.deliverables
                    .filter((d) => d.included)
                    .map((del) => (
                      <li key={del.id} className="leading-snug text-[11.5px]">
                        <span className="-ml-1">{del.text}</span>
                      </li>
                    ))}
                </ul>
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

            {/* Terms & Conditions Section (2 Columns) */}
            <div className="mt-1">
              <div className="font-bold text-[#8C692D] text-[13.5px] mb-1.5 font-['Outfit',sans-serif]">
                Terms & Conditions
              </div>
              <div className="grid grid-cols-2 gap-x-8 text-[10.2px] leading-[1.38] text-slate-800">
                {/* Left Terms Column */}
                <ul className="list-disc list-inside space-y-1.5 marker:text-[#111111]">
                  {leftTerms.map((term, idx) => (
                    <li key={idx} className="leading-[1.35]">
                      <span className="-ml-1">{term}</span>
                    </li>
                  ))}
                </ul>

                {/* Right Terms Column */}
                <ul className="list-disc list-inside space-y-1.5 marker:text-[#111111]">
                  {rightTerms.map((term, idx) => (
                    <li key={idx} className="leading-[1.35]">
                      <span className="-ml-1">{term}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* BOTTOM FOOTER SECTION */}
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
    </div>
  );
};

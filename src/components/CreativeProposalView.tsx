import React from 'react';
import type { QuotationDocument } from '../types';
import { formatCurrency } from '../utils/formatters';
import { WatermarkLayer } from './WatermarkLayer';
import { INDUSTRY_PRESETS } from '../constants/industryPresets';
import { Users, ShieldCheck } from 'lucide-react';

interface CreativeProposalViewProps {
  document: QuotationDocument;
  onSelectSection?: (tabId: string) => void;
}

export const CreativeProposalView: React.FC<CreativeProposalViewProps> = ({ document: doc, onSelectSection }) => {
  const preset = INDUSTRY_PRESETS[doc.industry] || INDUSTRY_PRESETS.photography_events;
  const currency = doc.currency;

  const sectionClass = (_tabId?: string) =>
    onSelectSection
      ? 'relative group/canvas-section transition-all cursor-pointer hover:outline hover:outline-2 hover:outline-amber-500/80 hover:outline-offset-2 hover:rounded-xl'
      : '';

  const renderEditBadge = (label: string) =>
    onSelectSection ? (
      <span className="absolute top-1 right-1 opacity-0 group-hover/canvas-section:opacity-100 transition-opacity bg-slate-950/90 text-amber-300 text-[9px] font-bold px-2 py-0.5 rounded shadow-md border border-amber-500/40 pointer-events-none z-20 print:hidden">
        ✏️ {label}
      </span>
    ) : null;

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

  // Pricing calculations
  const selectedItems = doc.pricingItems.filter((i) => !i.isOptional || i.selected);
  const subtotal =
    selectedItems.reduce((sum, item) => {
      const itemTotal = item.qty && item.rate ? item.qty * item.rate : item.amount || 0;
      return sum + itemTotal;
    }, 0) || doc.totalInvestment || 0;

  const discountAmount = doc.discount || 0;
  const taxableAmount = Math.max(0, subtotal - discountAmount);

  let taxAmount = 0;
  if (doc.taxConfig?.type && doc.taxConfig.type !== 'none') {
    taxAmount = Math.round((taxableAmount * (doc.taxConfig.percent || 0)) / 100);
  } else if (doc.taxType && doc.taxType !== 'none') {
    taxAmount = Math.round((taxableAmount * (doc.taxPercent || 0)) / 100);
  }

  const totalAmount = taxableAmount + taxAmount;

  // Milestone payments
  const advPct = doc.paymentTerms?.advancePercent ?? 30;
  const midPct = doc.paymentTerms?.afterEventPercent ?? 50;
  const balPct = doc.paymentTerms?.balancePercent ?? 20;

  const advanceAmount = doc.paymentTerms?.isCustomAmounts
    ? doc.paymentTerms?.advanceCustomAmount ?? Math.round((totalAmount * advPct) / 100)
    : Math.round((totalAmount * advPct) / 100);

  const afterEventAmount = doc.paymentTerms?.isCustomAmounts
    ? doc.paymentTerms?.afterEventCustomAmount ?? Math.round((totalAmount * midPct) / 100)
    : Math.round((totalAmount * midPct) / 100);

  const balanceAmount = doc.paymentTerms?.isCustomAmounts
    ? doc.paymentTerms?.balanceCustomAmount ?? Math.round((totalAmount * balPct) / 100)
    : Math.max(0, totalAmount - advanceAmount - afterEventAmount);

  // Split terms into 2 balanced columns
  const termsList = doc.termsAndConditions || [];
  const halfLength = Math.ceil(termsList.length / 2);
  const leftTerms = termsList.slice(0, halfLength);
  const rightTerms = termsList.slice(halfLength);

  const activeCrew = (doc.crewMembers || []).filter((c) => c.enabled);
  const activeWhyChoose = (doc.whyChooseUs || []).filter((w) => w.enabled);
  const hasPage2 =
    (doc.includeCrewSection !== false && activeCrew.length > 0) ||
    (doc.includeWhyChooseUs !== false && activeWhyChoose.length > 0);

  const logoWidth = doc.studio.logoWidth || 320;
  const logoHeight = doc.studio.logoHeight || 130;
  const fontFamily = doc.fontFamily || 'Plus Jakarta Sans';

  return (
    <div className="space-y-8 print:space-y-0" style={{ fontFamily: `"${fontFamily}", sans-serif` }}>
      {/* ========================================================= */}
      {/* PAGE 1: PRIMARY PROPOSAL & PACKAGE OVERVIEW               */}
      {/* ========================================================= */}
      <div
        className="print-page bg-white shadow-2xl relative transition-all duration-200"
        style={{
          width: '794px',
          minHeight: '1123px',
          boxSizing: 'border-box',
        }}
      >
        <WatermarkLayer config={doc.watermark} />

        <div className="relative z-10 p-10 text-left text-slate-900 flex flex-col justify-between h-full min-h-[1123px]">
          <div>
            {/* TOP HEADER SECTION */}
            <div
              onClick={() => onSelectSection?.('business')}
              className={`w-full text-center pb-1 ${sectionClass('business')}`}
              title={onSelectSection ? 'Click to edit business branding' : undefined}
            >
              {renderEditBadge('Brand')}
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
                <div className="w-full flex flex-col items-center">
                  <h1 className="text-2xl font-extrabold tracking-[0.05em] text-[#111111] whitespace-nowrap leading-normal mb-1">
                    {doc.studio.name}
                  </h1>
                  <p className="text-[10px] tracking-[0.15em] text-[#8C692D] uppercase font-semibold whitespace-nowrap leading-normal">
                    {doc.studio.tagline}
                  </p>
                </div>
              )}

              {/* Decorative top separator line */}
              <div className="w-full border-b border-[#8C692D] mt-2 mb-2"></div>

              {/* Document Type Title Header */}
              <div className="relative w-full flex items-center justify-center my-1">
                <span className="text-[10.5px] text-slate-400 font-medium absolute left-0 whitespace-nowrap">
                  Page 1 of {hasPage2 ? '2' : '1'}
                </span>
                <h2 className="font-bold tracking-[0.2em] text-[16px] text-[#111111] uppercase whitespace-nowrap">
                  QUOTATION & PROPOSAL
                </h2>
                <span className="text-[10.5px] text-amber-700 font-bold uppercase tracking-normal absolute right-0 whitespace-nowrap">
                  Official Proposal
                </span>
              </div>
            </div>

            {/* CLIENT & PROPOSAL METADATA BAR */}
            <div
              onClick={() => onSelectSection?.('client')}
              className={`grid grid-cols-2 gap-4 mt-3 mb-4 bg-slate-50/80 border border-slate-200/90 rounded-lg p-3 text-[11.5px] leading-relaxed ${sectionClass('client')}`}
              title={onSelectSection ? 'Click to edit client & project metadata' : undefined}
            >
              {renderEditBadge('Client & Scope')}
              <div className="space-y-0.5">
                <p>
                  <strong className="text-slate-900 font-semibold">Client / Project:</strong>{' '}
                  <span className="text-slate-800">{doc.client.nameOfEvent || 'Client Project'}</span>
                </p>
                {doc.client.clientName && (
                  <p>
                    <strong className="text-slate-900 font-semibold">Contact Person:</strong>{' '}
                    <span className="text-slate-700">{doc.client.clientName}</span>
                  </p>
                )}
                <p>
                  <strong className="text-slate-900 font-semibold">Location / Venue:</strong>{' '}
                  <span className="text-slate-700">{doc.client.address || 'Address'}</span>
                </p>
                <p>
                  <strong className="text-slate-900 font-semibold">Contact No:</strong>{' '}
                  <span className="text-slate-700">{doc.client.contactNo || 'Phone Number'}</span>
                </p>
              </div>

              <div className="space-y-0.5 text-right flex flex-col items-end">
                <p>
                  <strong className="text-slate-900 font-semibold">Quotation No:</strong>{' '}
                  <span className="font-mono text-slate-800 font-bold">{doc.details.invoiceNo || 'QUO-001'}</span>
                </p>
                <p>
                  <strong className="text-slate-900 font-semibold">Date of Issue:</strong>{' '}
                  <span className="text-slate-700">{doc.details.invoiceDate}</span>
                </p>
                <p>
                  <strong className="text-slate-900 font-semibold">Schedule Date(s):</strong>{' '}
                  <span className="text-slate-800 font-medium">{getEventDateDisplay()}</span>
                </p>
                <p>
                  <strong className="text-slate-900 font-semibold">Validity:</strong>{' '}
                  <span className="text-amber-800 font-medium">{doc.details.validUntilDate || '30 Days'}</span>
                </p>
              </div>
            </div>

            {/* PACKAGE BANNER TITLE */}
            <div
              onClick={() => onSelectSection?.('client')}
              className={`bg-[#111111] text-amber-300 py-2.5 px-4 text-center rounded-sm font-bold tracking-[0.12em] text-[13px] uppercase shadow-md my-3 ${sectionClass('client')}`}
            >
              {doc.packageBannerTitle || preset.defaultPackageTitle}
            </div>

            {/* SCOPE & SCHEDULE MATRIX SECTION */}
            {doc.sectionVisibility?.scope !== false && doc.includeScopeSection !== false && doc.eventCoverage && doc.eventCoverage.length > 0 && (
              <div
                onClick={() => onSelectSection?.('scope')}
                className={`my-3 ${sectionClass('scope')}`}
                title={onSelectSection ? 'Click to edit event coverage & phases' : undefined}
              >
                {renderEditBadge('Phases')}
                <h3 className="font-bold text-[12px] uppercase tracking-[0.08em] text-[#111111] mb-2 border-b border-slate-200 pb-1 flex items-center justify-between whitespace-nowrap">
                  <span>{doc.sectionTitles?.scopeTitle || preset.scopeSectionTitle || 'EVENT SCHEDULE & SERVICES COVERAGE'}</span>
                  <span className="text-[10px] text-amber-700 font-normal lowercase tracking-normal">
                    {doc.eventCoverage.length} phase(s) planned
                  </span>
                </h3>

                <div className="space-y-2">
                  {doc.eventCoverage.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="bg-slate-50/60 border border-slate-200 rounded p-2.5 text-[11px]"
                    >
                      <div className="font-bold text-slate-900 mb-2 flex items-start space-x-2">
                        <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[9px] font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="font-['Outfit'] uppercase tracking-normal text-[11px] text-amber-950 leading-snug block flex-1">
                          {item.dayTitle}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 pl-6 mt-1.5">
                        {item.services.map((service, sIdx) => (
                          <div key={sIdx} className="flex items-start space-x-1.5 text-slate-700 leading-tight">
                            <span className="text-amber-600 text-[10px] shrink-0 mt-0.5">◆</span>
                            <span className="font-medium text-[10.5px] leading-tight">{service}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* DELIVERABLES INCLUDED SECTION */}
            {doc.sectionVisibility?.deliverables !== false && doc.deliverables && doc.deliverables.length > 0 && (
              <div
                onClick={() => onSelectSection?.('deliverables')}
                className={`my-3 ${sectionClass('deliverables')}`}
                title={onSelectSection ? 'Click to edit deliverables' : undefined}
              >
                {renderEditBadge('Deliverables')}
                <h3 className="font-bold text-[12px] uppercase tracking-[0.08em] text-[#111111] mb-2 border-b border-slate-200 pb-1 whitespace-nowrap">
                  {doc.sectionTitles?.deliverablesTitle || 'DELIVERABLES INCLUDED'}
                </h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 bg-amber-50/40 border border-amber-200/60 rounded p-3 text-[11px]">
                  {doc.deliverables
                    .filter((d) => d.included)
                    .map((del) => (
                      <div key={del.id} className="flex items-start space-x-1.5">
                        <span className="text-emerald-700 font-bold text-[12px] leading-none shrink-0">✓</span>
                        <span className="text-slate-800 font-medium leading-tight">{del.text}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* TOTAL INVESTMENT & PAYMENT TERMS SUMMARY */}
            <div
              onClick={() => onSelectSection?.('pricing')}
              className={`mt-4 border-2 border-slate-900 rounded-lg overflow-hidden bg-white shadow-sm ${sectionClass('pricing')}`}
              title={onSelectSection ? 'Click to edit pricing & discount' : undefined}
            >
              {renderEditBadge('Pricing')}
              <div className="bg-[#111111] text-white px-4 py-2.5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] tracking-[0.2em] text-amber-300 uppercase font-semibold block">
                    TOTAL INVESTMENT VALUE
                  </span>
                  <span className="text-xs text-slate-300">All deliverables, crew deployment & post-production included</span>
                </div>
                <div className="text-right font-mono font-bold text-[20px] text-amber-400 tracking-tight">
                  {formatCurrency(totalAmount, currency)}
                </div>
              </div>

              {/* 3-Step Milestone Terms Bar */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectSection?.('tax-payment');
                }}
                className="grid grid-cols-3 divide-x divide-slate-200 bg-slate-50 p-3 text-center text-[10.5px] cursor-pointer hover:bg-amber-50/40 transition-colors"
                title={onSelectSection ? 'Click to edit payment milestones' : undefined}
              >
                <div className="flex flex-col justify-between items-center px-1.5 min-h-[50px]">
                  <span className="text-[9.5px] text-slate-500 font-bold uppercase leading-tight block mb-1">
                    {doc.paymentTerms?.paymentMilestoneLabels?.advanceLabel || `${advPct}% Advance Booking`}
                  </span>
                  <strong className="text-slate-900 font-mono text-[12px] block mt-auto whitespace-nowrap">
                    {formatCurrency(advanceAmount, currency)}
                  </strong>
                </div>

                <div className="flex flex-col justify-between items-center px-1.5 min-h-[50px]">
                  <span className="text-[9.5px] text-slate-500 font-bold uppercase leading-tight block mb-1">
                    {doc.paymentTerms?.paymentMilestoneLabels?.afterEventLabel || `${midPct}% Interim Phase`}
                  </span>
                  <strong className="text-slate-900 font-mono text-[12px] block mt-auto whitespace-nowrap">
                    {formatCurrency(afterEventAmount, currency)}
                  </strong>
                </div>

                <div className="flex flex-col justify-between items-center px-1.5 min-h-[50px]">
                  <span className="text-[9.5px] text-slate-500 font-bold uppercase leading-tight block mb-1">
                    {doc.paymentTerms?.paymentMilestoneLabels?.balanceLabel || `${balPct}% Final Handover`}
                  </span>
                  <strong className="text-slate-900 font-mono text-[12px] block mt-auto whitespace-nowrap">
                    {formatCurrency(balanceAmount, currency)}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* PAGE 1 FOOTER */}
          <div className="mt-4 pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
            <span>
              {doc.studio.name} • {doc.studio.phoneNumbers} • {doc.studio.website}
            </span>
            <span className="font-semibold text-slate-700">Official Commercial Proposal</span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* PAGE 2: CREW DETAILS, WHY CHOOSE US & TERMS               */}
      {/* ========================================================= */}
      {hasPage2 && (
        <div
          className="print-page bg-white shadow-2xl relative transition-all duration-200"
          style={{
            width: '794px',
            minHeight: '1123px',
            boxSizing: 'border-box',
          }}
        >
          <WatermarkLayer config={doc.watermark} />

          <div className="relative z-10 p-10 text-left text-slate-900 flex flex-col justify-between h-full min-h-[1123px]">
            <div>
              {/* PAGE 2 HEADER */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-4">
                <span className="font-bold text-[12px] tracking-[0.08em] text-[#111111] uppercase whitespace-nowrap">
                  {doc.studio.name} — Proposal Annexure
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Page 2 of 2</span>
              </div>

              {/* CREW / TEAM ALLOCATION SECTION */}
              {doc.sectionVisibility?.crew !== false && doc.includeCrewSection !== false && activeCrew.length > 0 && (
                <div
                  onClick={() => onSelectSection?.('industry')}
                  className={`mb-4 ${sectionClass('industry')}`}
                  title={onSelectSection ? 'Click to edit team allocation' : undefined}
                >
                  {renderEditBadge('Team')}
                  <div className="flex items-center space-x-1.5 mb-2 pb-1 border-b border-slate-200">
                    <Users className="w-3.5 h-3.5 text-amber-700" />
                    <h3 className="font-bold text-[12px] uppercase tracking-[0.08em] text-[#111111] whitespace-nowrap">
                      {doc.sectionTitles?.crewTitle || preset.teamSectionTitle || 'Dedicated Team & Equipment Deployment'}
                    </h3>
                  </div>

                  <div className="space-y-1.5">
                    {activeCrew.map((c) => (
                      <div
                        key={c.id}
                        className="bg-slate-50 border border-slate-200/90 rounded p-2 text-[11px] flex items-start space-x-2"
                      >
                        <span className="text-amber-700 font-bold text-[12px] mt-0.5 shrink-0">◆</span>
                        <div>
                          <strong className="text-slate-900 font-bold uppercase tracking-normal text-[11px]">
                            {c.team}:
                          </strong>{' '}
                          <span className="text-slate-700 text-[10.5px]">{c.role}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* WHY WORK WITH US SECTION */}
              {doc.sectionVisibility?.whyChooseUs !== false && doc.includeWhyChooseUs !== false && activeWhyChoose.length > 0 && (
                <div
                  onClick={() => onSelectSection?.('industry')}
                  className={`mb-4 ${sectionClass('industry')}`}
                  title={onSelectSection ? 'Click to edit guarantees & value proposition' : undefined}
                >
                  {renderEditBadge('Why Us')}
                  <div className="flex items-center space-x-1.5 mb-2 pb-1 border-b border-slate-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                    <h3 className="font-bold text-[12px] uppercase tracking-[0.08em] text-[#111111] whitespace-nowrap">
                      {doc.sectionTitles?.whyChooseUsTitle || `Why Partner With ${doc.studio.name}`}
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {activeWhyChoose.map((why) => (
                      <div
                        key={why.id}
                        className="bg-amber-50/30 border border-amber-200/60 rounded p-2 text-[10.5px]"
                      >
                        <div className="font-bold text-slate-900 flex items-center space-x-1 mb-0.5">
                          <span>{why.icon}</span>
                          <span className="font-['Outfit']">{why.title}</span>
                        </div>
                        <p className="text-slate-600 text-[10px] leading-tight pl-4">{why.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TERMS & CONDITIONS (2-Column Layout) */}
              {doc.sectionVisibility?.terms !== false && (
                <div
                  onClick={() => onSelectSection?.('tax-payment')}
                  className={`mb-4 ${sectionClass('tax-payment')}`}
                  title={onSelectSection ? 'Click to edit terms & conditions' : undefined}
                >
                  {renderEditBadge('Terms')}
                  <h3 className="font-bold text-[12px] uppercase tracking-[0.08em] text-[#111111] mb-2 border-b border-slate-200 pb-1 whitespace-nowrap">
                    {doc.sectionTitles?.termsTitle || 'TERMS & CONDITIONS'}
                  </h3>

                  <div className="grid grid-cols-2 gap-4 text-[10px] text-slate-700 leading-relaxed">
                    <ol className="space-y-1 pl-4 list-decimal">
                      {leftTerms.map((term, tIdx) => (
                        <li key={tIdx} className="leading-tight">
                          {term}
                      </li>
                    ))}
                  </ol>

                  <ol start={halfLength + 1} className="space-y-1 pl-4 list-decimal">
                    {rightTerms.map((term, tIdx) => (
                      <li key={tIdx + halfLength} className="leading-tight">
                        {term}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
              )}

              {/* SIGNATURE & CLIENT APPROVAL SECTION */}
              <div
                onClick={() => onSelectSection?.('watermark-terms')}
                className={`mt-4 pt-3 border-t-2 border-slate-900 grid grid-cols-2 gap-6 ${sectionClass('watermark-terms')}`}
                title={onSelectSection ? 'Click to edit signatory details' : undefined}
              >
                {renderEditBadge('Signatures')}
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-normal mb-1 whitespace-nowrap">
                    ISSUED BY:
                  </p>
                  <p className="font-bold text-xs text-slate-900">{doc.studio.name}</p>
                  <div className="h-12 border-b border-slate-300 flex items-end pb-1 my-1">
                    {doc.signatory?.signatureDataUrl ? (
                      <img src={doc.signatory.signatureDataUrl} alt="Signature" className="max-h-10 object-contain" />
                    ) : (
                      <span className="text-[10.5px] font-mono text-slate-400 italic">
                        {doc.signatory?.signerName || 'Authorized Signatory'}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between text-[9.5px] text-slate-500">
                    <span>{doc.signatory?.signerTitle || 'Managing Director'}</span>
                    <span>Date: {doc.signatory?.signatureDate || doc.details.invoiceDate}</span>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-normal mb-1 whitespace-nowrap">
                    CLIENT ACCEPTANCE:
                  </p>
                  <p className="font-bold text-xs text-slate-900">
                    {doc.client.clientName || doc.client.nameOfEvent || 'Client Authorized Representative'}
                  </p>
                  <div className="h-12 border-b border-slate-300 flex items-end pb-1 my-1">
                    {doc.signatory?.clientSignatureDataUrl ? (
                      <img src={doc.signatory.clientSignatureDataUrl} alt="Client Signature" className="max-h-10 object-contain" />
                    ) : doc.signatory?.clientSignedName ? (
                      <span className="text-xs font-serif text-emerald-800 font-bold italic">
                        Digitally Signed: {doc.signatory.clientSignedName}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">Sign / Draw here to approve</span>
                    )}
                  </div>
                  <div className="flex justify-between text-[9.5px] text-slate-500">
                    <span>Date: {doc.signatory?.clientSignedDate || '___/___/______'}</span>
                    <span>Status: {doc.signatory?.clientSignedName ? 'APPROVED' : 'AWAITING APPROVAL'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* PAGE 2 FOOTER */}
            <div className="border-t border-slate-200 pt-2 flex items-center justify-between text-[10px] text-slate-400">
              <span>{doc.footerNote || `Real Moments, Timeless Stories • ${doc.studio.name}`}</span>
              <span>End of Document</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

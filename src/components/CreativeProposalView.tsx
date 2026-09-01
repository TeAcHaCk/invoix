import React from 'react';
import type { QuotationDocument, ProposalSectionKey } from '../types';
import { formatCurrency } from '../utils/formatters';
import { WatermarkLayer } from './WatermarkLayer';
import { INDUSTRY_PRESETS } from '../constants/industryPresets';
import { resolveCanvasSpacing } from '../utils/canvasSpacingResolver';
import { Users, ShieldCheck } from 'lucide-react';

interface CreativeProposalViewProps {
  document: QuotationDocument;
  onSelectSection?: (tabId: string, sectionKey?: string) => void;
}

export const CreativeProposalView: React.FC<CreativeProposalViewProps> = ({ document: doc, onSelectSection }) => {
  const preset = INDUSTRY_PRESETS[doc.industry] || INDUSTRY_PRESETS.photography_events;
  const currency = doc.currency;

  const { sectionGapPx, pagePaddingPx, dividerStyle } = resolveCanvasSpacing(doc);

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

  const allPhases = (doc.eventCoverage || []).filter((p) => p.dayTitle || (p.services || []).length > 0);
  const activeDeliverables = (doc.deliverables || []).filter((d) => d.included);
  const activeCrew = (doc.crewMembers || []).filter((c) => c.enabled);
  const activeWhyChoose = (doc.whyChooseUs || []).filter((w) => w.enabled);

  const defaultOrder: ProposalSectionKey[] = [
    'scope',
    'deliverables',
    'pricing',
    'crew',
    'whyChooseUs',
    'terms',
    'signatory',
  ];

  const currentSectionOrder: ProposalSectionKey[] =
    doc.sectionOrder && doc.sectionOrder.length === defaultOrder.length
      ? doc.sectionOrder
      : defaultOrder;

  const logoWidth = doc.studio.logoWidth || 320;
  const logoHeight = doc.studio.logoHeight || 130;
  const fontFamily = doc.fontFamily || 'Plus Jakarta Sans';

  const renderScopeSection = (phasesToRender: typeof allPhases = allPhases, isContinued = false) => {
    if (doc.sectionVisibility?.scope === false || doc.includeScopeSection === false || phasesToRender.length === 0) return null;
    return (
      <div
        key={isContinued ? 'scope-cont' : 'scope'}
        onClick={() => onSelectSection?.('scope', 'scope')}
        style={{ marginBottom: `${sectionGapPx}px` }}
        className={sectionClass('scope')}
        title={onSelectSection ? 'Click to edit event coverage & phases' : undefined}
      >
        {renderEditBadge('Phases')}
        <h3 className="font-bold text-[11.5px] uppercase tracking-[0.08em] text-[#111111] mb-1.5 border-b border-slate-200 pb-1 flex items-center justify-between whitespace-nowrap">
          <span>{doc.sectionTitles?.scopeTitle || preset.scopeSectionTitle || 'PROJECT PHASES & SOW MILESTONES'} {isContinued ? '(CONTINUED)' : ''}</span>
          <span className="text-[10px] text-amber-700 font-normal lowercase tracking-normal">
            {isContinued ? `Phases 5 to ${allPhases.length}` : `${allPhases.length} phase(s) planned`}
          </span>
        </h3>

        <div className="space-y-1.5">
          {phasesToRender.map((item, idx) => (
            <div
              key={item.id || idx}
              className="bg-slate-50/60 border border-slate-200 rounded p-2 text-[11px]"
            >
              <div className="font-bold text-slate-900 mb-1 flex items-start space-x-2">
                <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[9px] font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                  {isContinued ? idx + 5 : idx + 1}
                </span>
                <span className="font-['Outfit'] uppercase tracking-normal text-[11px] text-amber-950 leading-snug block flex-1">
                  {item.dayTitle}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 pl-6 mt-1">
                {item.services.map((service, sIdx) => (
                  <div key={sIdx} className="flex items-start space-x-1.5 text-slate-700 leading-tight">
                    <span className="text-amber-600 text-[10px] shrink-0 mt-0.5">◆</span>
                    <span className="font-medium text-[10px] leading-tight">{service}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDeliverablesBox = () => {
    if (doc.sectionVisibility?.deliverables === false || activeDeliverables.length === 0) return null;
    return (
      <div
        key="deliverables"
        onClick={() => onSelectSection?.('deliverables', 'deliverables')}
        style={{ marginBottom: `${sectionGapPx}px` }}
        className={sectionClass('deliverables')}
        title={onSelectSection ? 'Click to edit deliverables' : undefined}
      >
        {renderEditBadge('Deliverables')}
        <h3 className="font-bold text-[11.5px] uppercase tracking-[0.08em] text-[#111111] mb-1.5 border-b border-slate-200 pb-1 whitespace-nowrap">
          {doc.sectionTitles?.deliverablesTitle || 'DELIVERABLES INCLUDED'}
        </h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 bg-amber-50/40 border border-amber-200/60 rounded p-2.5 text-[10.5px]">
          {activeDeliverables.map((del) => (
            <div key={del.id} className="flex items-start space-x-1.5">
              <span className="text-emerald-700 font-bold text-[11px] leading-none shrink-0 mt-0.5">✓</span>
              <span className="text-slate-800 font-medium leading-tight">{del.text}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderInvestmentBox = () => {
    if (doc.sectionVisibility?.pricingTable === false) return null;
    return (
      <div
        key="pricing"
        onClick={() => onSelectSection?.('pricing', 'pricing')}
        style={{ marginBottom: `${sectionGapPx}px` }}
        className={`border-2 border-slate-900 rounded-lg overflow-hidden bg-white shadow-sm ${sectionClass('pricing')}`}
        title={onSelectSection ? 'Click to edit pricing & discount' : undefined}
      >
        {renderEditBadge('Pricing')}
        <div className="bg-[#111111] text-white px-4 py-2 flex items-center justify-between">
          <div>
            <span className="text-[10px] tracking-[0.2em] text-amber-300 uppercase font-semibold block">
              TOTAL INVESTMENT VALUE
            </span>
            <span className="text-[11px] text-slate-300">All deliverables, crew deployment & post-production included</span>
          </div>
          <div className="text-right font-mono font-bold text-[19px] text-amber-400 tracking-tight">
            {formatCurrency(totalAmount, currency)}
          </div>
        </div>

        {/* 3-Step Milestone Terms Bar */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            onSelectSection?.('tax-payment', 'payment-milestones');
          }}
          className="grid grid-cols-3 divide-x divide-slate-200 bg-slate-50 p-2.5 text-center text-[10.5px] cursor-pointer hover:bg-amber-50/40 transition-colors"
          title={onSelectSection ? 'Click to edit payment milestones' : undefined}
        >
          <div className="flex flex-col justify-between items-center px-1.5 min-h-[46px]">
            <span className="text-[9px] text-slate-500 font-bold uppercase leading-tight block mb-0.5">
              {doc.paymentTerms?.paymentMilestoneLabels?.advanceLabel || `${advPct}% Advance Booking`}
            </span>
            <strong className="text-slate-900 font-mono text-[11.5px] block mt-auto whitespace-nowrap">
              {formatCurrency(advanceAmount, currency)}
            </strong>
          </div>

          <div className="flex flex-col justify-between items-center px-1.5 min-h-[46px]">
            <span className="text-[9px] text-slate-500 font-bold uppercase leading-tight block mb-0.5">
              {doc.paymentTerms?.paymentMilestoneLabels?.afterEventLabel || `${midPct}% Interim Phase`}
            </span>
            <strong className="text-slate-900 font-mono text-[11.5px] block mt-auto whitespace-nowrap">
              {formatCurrency(afterEventAmount, currency)}
            </strong>
          </div>

          <div className="flex flex-col justify-between items-center px-1.5 min-h-[46px]">
            <span className="text-[9px] text-slate-500 font-bold uppercase leading-tight block mb-0.5">
              {doc.paymentTerms?.paymentMilestoneLabels?.balanceLabel || `${balPct}% Final Handover`}
            </span>
            <strong className="text-slate-900 font-mono text-[11.5px] block mt-auto whitespace-nowrap">
              {formatCurrency(balanceAmount, currency)}
            </strong>
          </div>
        </div>
      </div>
    );
  };

  const renderCrewSection = () => {
    if (doc.sectionVisibility?.crew === false || doc.includeCrewSection === false || activeCrew.length === 0) return null;
    return (
      <div
        key="crew"
        onClick={() => onSelectSection?.('deliverables', 'crew')}
        style={{ marginBottom: `${sectionGapPx}px` }}
        className={sectionClass('deliverables')}
        title={onSelectSection ? 'Click to edit team allocation' : undefined}
      >
        {renderEditBadge('Team')}
        <div className="flex items-center space-x-1.5 mb-1.5 pb-1 border-b border-slate-200">
          <Users className="w-3.5 h-3.5 text-amber-700" />
          <h3 className="font-bold text-[11.5px] uppercase tracking-[0.08em] text-[#111111] whitespace-nowrap">
            {doc.sectionTitles?.crewTitle || preset.teamSectionTitle || 'Dedicated Team & Specialist Deployment'}
          </h3>
        </div>

        <div className="space-y-1.5">
          {activeCrew.map((c) => (
            <div
              key={c.id}
              className="bg-slate-50 border border-slate-200/90 rounded p-2 text-[11px] flex items-start space-x-2"
            >
              <span className="text-amber-700 font-bold text-[11px] mt-0.5 shrink-0">◆</span>
              <div>
                <strong className="text-slate-900 font-bold uppercase tracking-normal text-[10.5px]">
                  {c.team}:
                </strong>{' '}
                <span className="text-slate-700 text-[10px]">{c.role}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderWhyChooseUsSection = () => {
    if (doc.sectionVisibility?.whyChooseUs === false || doc.includeWhyChooseUs === false || activeWhyChoose.length === 0) return null;
    return (
      <div
        key="whyChooseUs"
        onClick={() => onSelectSection?.('deliverables', 'why-choose-us')}
        style={{ marginBottom: `${sectionGapPx}px` }}
        className={sectionClass('deliverables')}
        title={onSelectSection ? 'Click to edit guarantees & value proposition' : undefined}
      >
        {renderEditBadge('Why Us')}
        <div className="flex items-center space-x-1.5 mb-1.5 pb-1 border-b border-slate-200">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
          <h3 className="font-bold text-[11.5px] uppercase tracking-[0.08em] text-[#111111] whitespace-nowrap">
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
                {why.icon ? <span>{why.icon}</span> : null}
                <span className="font-['Outfit'] text-[10.5px]">{why.title}</span>
              </div>
              <p className="text-slate-600 text-[10px] leading-tight pl-4">{why.description}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderTermsSection = () => {
    if (doc.sectionVisibility?.terms === false || termsList.length === 0) return null;
    return (
      <div
        key="terms"
        onClick={() => onSelectSection?.('watermark-terms', 'terms')}
        style={{ marginBottom: `${sectionGapPx}px` }}
        className={sectionClass('watermark-terms')}
        title={onSelectSection ? 'Click to edit terms & conditions' : undefined}
      >
        {renderEditBadge('Terms')}
        <h3 className="font-bold text-[11.5px] uppercase tracking-[0.08em] text-[#111111] mb-1.5 border-b border-slate-200 pb-1 whitespace-nowrap">
          {doc.sectionTitles?.termsTitle || 'TERMS OF ENGAGEMENT & ACCEPTANCE CRITERIA'}
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
    );
  };

  const renderSignatorySection = () => {
    if (doc.sectionVisibility?.signatory === false || doc.signatory?.enabled === false) return null;
    return (
      <div
        key="signatory"
        onClick={() => onSelectSection?.('watermark-terms', 'signatory')}
        style={{ marginBottom: `${sectionGapPx}px` }}
        className={`pt-2.5 border-t-2 border-slate-900 grid grid-cols-2 gap-6 ${sectionClass('watermark-terms')}`}
        title={onSelectSection ? 'Click to edit signatory details' : undefined}
      >
        {renderEditBadge('Signatures')}
        <div>
          <p className="text-[9.5px] font-bold text-slate-400 uppercase tracking-normal mb-0.5 whitespace-nowrap">
            ISSUED BY:
          </p>
          <p className="font-bold text-xs text-slate-900">{doc.studio.name}</p>
          <div className="h-11 border-b border-slate-300 flex items-end pb-1 my-1">
            {doc.signatory?.signatureDataUrl ? (
              <img src={doc.signatory.signatureDataUrl} alt="Signature" className="max-h-9 object-contain" />
            ) : (
              <span className="text-[10px] font-mono text-slate-400 italic">
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
          <p className="text-[9.5px] font-bold text-slate-400 uppercase tracking-normal mb-0.5 whitespace-nowrap">
            CLIENT ACCEPTANCE:
          </p>
          <p className="font-bold text-xs text-slate-900">
            {doc.client.clientName || doc.client.nameOfEvent || 'Client Authorized Representative'}
          </p>
          <div className="h-11 border-b border-slate-300 flex items-end pb-1 my-1">
            {doc.signatory?.clientSignatureDataUrl ? (
              <img src={doc.signatory.clientSignatureDataUrl} alt="Client Signature" className="max-h-9 object-contain" />
            ) : doc.signatory?.clientSignedName ? (
              <span className="text-xs font-serif text-emerald-800 font-bold italic">
                Digitally Signed: {doc.signatory.clientSignedName}
              </span>
            ) : (
              <span className="text-[9.5px] text-slate-400 italic">Sign / Draw here to approve</span>
            )}
          </div>
          <div className="flex justify-between text-[9.5px] text-slate-500">
            <span>Date: {doc.signatory?.clientSignedDate || '___/___/______'}</span>
            <span>Status: {doc.signatory?.clientSignedName ? 'APPROVED' : 'AWAITING APPROVAL'}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderSectionByKey = (key: ProposalSectionKey, isLast = false) => {
    const rendered = (() => {
      switch (key) {
        case 'scope':
          return renderScopeSection(allPhases, false);
        case 'deliverables':
          return renderDeliverablesBox();
        case 'pricing':
          return renderInvestmentBox();
        case 'crew':
          return renderCrewSection();
        case 'whyChooseUs':
          return renderWhyChooseUsSection();
        case 'terms':
          return renderTermsSection();
        case 'signatory':
          return renderSignatorySection();
        default:
          return null;
      }
    })();

    if (!rendered) return null;

    return (
      <React.Fragment key={key}>
        {rendered}
        {dividerStyle !== 'none' && !isLast && (
          <div
            className={`my-2 ${
              dividerStyle === 'accent'
                ? 'border-b border-amber-400/60'
                : 'border-b border-slate-200/80'
            }`}
          />
        )}
      </React.Fragment>
    );
  };

  const renderPage1Header = () => (
    <>
      {/* TOP HEADER SECTION */}
      <div
        onClick={() => onSelectSection?.('business', 'branding')}
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
            <h1 className="text-2xl font-extrabold tracking-[0.05em] text-[#111111] whitespace-nowrap leading-normal mb-0.5">
              {doc.studio.name}
            </h1>
            <p className="text-[10px] tracking-[0.15em] text-[#8C692D] uppercase font-semibold whitespace-nowrap leading-normal">
              {doc.studio.tagline}
            </p>
          </div>
        )}

        {/* Decorative top separator line */}
        <div className="w-full border-b border-[#8C692D] mt-1.5 mb-1.5"></div>

        {/* Document Type Title Header */}
        <div className="relative w-full flex items-center justify-center my-0.5">
          <span className="text-[10.5px] text-slate-400 font-medium absolute left-0 whitespace-nowrap">
            Page 1 of {totalPages}
          </span>
          <h2 className="font-bold tracking-[0.2em] text-[15px] text-[#111111] uppercase whitespace-nowrap">
            QUOTATION & PROPOSAL
          </h2>
          <span className="text-[10.5px] text-amber-700 font-bold uppercase tracking-normal absolute right-0 whitespace-nowrap">
            Official Proposal
          </span>
        </div>
      </div>

      {/* CLIENT & PROPOSAL METADATA BAR */}
      <div
        onClick={() => onSelectSection?.('client', 'client')}
        className={`grid grid-cols-2 gap-4 mt-2.5 mb-3 bg-slate-50/80 border border-slate-200/90 rounded-lg p-3 text-[11px] leading-relaxed ${sectionClass('client')}`}
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
            <span className="text-amber-800 font-medium">{doc.details.validUntilDate || '30 Days from issue'}</span>
          </p>
        </div>
      </div>

      {/* PACKAGE BANNER TITLE */}
      <div
        onClick={() => onSelectSection?.('client', 'client')}
        className={`bg-[#111111] text-amber-300 py-2 px-4 text-center rounded-sm font-bold tracking-[0.12em] text-[12.5px] uppercase shadow-md my-2.5 ${sectionClass('client')}`}
      >
        {doc.packageBannerTitle || preset.defaultPackageTitle}
      </div>
    </>
  );

  const getSectionEstimatedHeight = (key: ProposalSectionKey): number => {
    const baseGap = sectionGapPx;
    switch (key) {
      case 'scope': {
        if (doc.sectionVisibility?.scope === false || doc.includeScopeSection === false || allPhases.length === 0) return 0;
        // Each phase is a vertical block ~60px (title + services in 2-col), + header 35px
        return 35 + Math.min(allPhases.length, 8) * 60 + baseGap;
      }
      case 'pricing': {
        if (doc.sectionVisibility?.pricingTable === false) return 0;
        // Total banner ~55px + 3-col milestone bar ~70px + padding
        return 140 + baseGap;
      }
      case 'deliverables': {
        if (doc.sectionVisibility?.deliverables === false || activeDeliverables.length === 0) return 0;
        // Header 30px + 2-col grid rows ~28px each + padding
        return 30 + Math.ceil(activeDeliverables.length / 2) * 28 + 16 + baseGap;
      }
      case 'whyChooseUs': {
        if (doc.sectionVisibility?.whyChooseUs === false || doc.includeWhyChooseUs === false || activeWhyChoose.length === 0) return 0;
        // Header 30px + 2-col grid, each card ~68px (title + desc wrapping)
        const whyRows = Math.ceil(activeWhyChoose.length / 2);
        return 30 + whyRows * 68 + baseGap;
      }
      case 'crew': {
        if (doc.sectionVisibility?.crew === false || doc.includeCrewSection === false || activeCrew.length === 0) return 0;
        // Header 30px + 2-col grid, each card ~48px
        const crewRows = Math.ceil(activeCrew.length / 2);
        return 30 + crewRows * 48 + baseGap;
      }
      case 'terms': {
        if (doc.sectionVisibility?.terms === false || termsList.length === 0) return 0;
        // Header 30px + 2-col layout, each side ~22px per term
        return 30 + Math.ceil(termsList.length / 2) * 22 + baseGap;
      }
      case 'signatory': {
        if (doc.sectionVisibility?.signatory === false || doc.signatory?.enabled === false) return 0;
        return 150 + baseGap;
      }
      default:
        return 0;
    }
  };

  // Build Pages dynamically based on user's exact currentSectionOrder
  const pages: ProposalSectionKey[][] = [];
  let currentPage: ProposalSectionKey[] = [];
  let currentHeight = 0;
  // Page 1: creative header is taller (~260px logo+separator+title+client metadata+package banner) + footer (~40px)
  const page1HeaderFooter = 260 + 40;
  let maxCapacity = Math.max(500, 1123 - (pagePaddingPx * 2) - page1HeaderFooter);

  for (const key of currentSectionOrder) {
    const h = getSectionEstimatedHeight(key);
    if (h === 0) continue;

    if (currentHeight + h > maxCapacity && currentPage.length > 0) {
      pages.push(currentPage);
      currentPage = [key];
      currentHeight = h;
      // Subsequent pages: smaller header (~50px) + footer (~40px)
      maxCapacity = Math.max(600, 1123 - (pagePaddingPx * 2) - 90);
    } else {
      currentPage.push(key);
      currentHeight += h;
    }
  }

  if (currentPage.length > 0) {
    pages.push(currentPage);
  }

  if (pages.length === 0) {
    pages.push(['scope', 'pricing']);
  }

  const totalPages = pages.length;

  return (
    <div className="space-y-8 print:space-y-0" style={{ fontFamily: `"${fontFamily}", sans-serif` }}>
      {pages.map((pageSections, pageIdx) => {
        const isFirstPage = pageIdx === 0;
        const pageNum = pageIdx + 1;

        return (
          <div
            key={pageIdx}
            className="print-page bg-white shadow-2xl relative transition-all duration-200"
            style={{
              width: '794px',
              minHeight: '1123px',
              boxSizing: 'border-box',
            }}
          >
            <WatermarkLayer config={doc.watermark} />
            <div
              className="relative z-10 text-left text-slate-900 flex flex-col justify-between h-full min-h-[1123px]"
              style={{ padding: `${pagePaddingPx}px` }}
            >
              <div>
                {isFirstPage ? (
                  renderPage1Header()
                ) : (
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
                    <div className="flex items-center space-x-2">
                      <h2 className="font-bold text-[13px] tracking-normal uppercase text-slate-950 whitespace-nowrap leading-none">
                        {doc.studio.name}
                      </h2>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono leading-none">
                        Ref: {doc.details.invoiceNo}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-normal whitespace-nowrap leading-none">
                      Proposal Specifications & Agreement (Page {pageNum} of {totalPages})
                    </span>
                  </div>
                )}

                {/* Render Sections on this sheet strictly in user's defined order */}
                {pageSections.map((sectionKey, sIdx) =>
                  renderSectionByKey(sectionKey, sIdx === pageSections.length - 1)
                )}
              </div>

              {/* Page Footer */}
              <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
                <span>{doc.footerNote || `${doc.studio.name} • Proposal Ref: ${doc.details.invoiceNo}`}</span>
                <span className="font-semibold text-slate-700">
                  Page {pageNum} of {totalPages} {pageNum === totalPages ? '• End of Document' : ''}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};


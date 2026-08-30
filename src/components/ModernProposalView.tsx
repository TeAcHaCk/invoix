import React from 'react';
import type { QuotationDocument } from '../types';
import { formatCurrency } from '../utils/formatters';
import { WatermarkLayer } from './WatermarkLayer';
import { INDUSTRY_PRESETS } from '../constants/industryPresets';
import {
  CheckCircle2,
  Layers,
  Sparkles,
  ShieldCheck,
  Award,
  Clock,
  FileText,
} from 'lucide-react';

interface ModernProposalViewProps {
  document: QuotationDocument;
  onSelectSection?: (tabId: string, sectionKey?: string) => void;
}

export const ModernProposalView: React.FC<ModernProposalViewProps> = ({ document: doc, onSelectSection }) => {
  const preset = INDUSTRY_PRESETS[doc.industry] || INDUSTRY_PRESETS.creative_agency;
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

  // Pricing calculations
  const selectedItems = doc.pricingItems.filter((i) => !i.isOptional || i.selected);
  const optionalAddons = doc.pricingItems.filter((i) => i.isOptional && !i.selected);
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

  const grandTotal = taxableAmount + taxAmount;

  // Milestone payment calculations
  const advPct = doc.paymentTerms?.advancePercent ?? 40;
  const midPct = doc.paymentTerms?.afterEventPercent ?? 30;
  const balPct = doc.paymentTerms?.balancePercent ?? 30;

  const advanceAmt = doc.paymentTerms?.isCustomAmounts
    ? doc.paymentTerms?.advanceCustomAmount ?? Math.round((grandTotal * advPct) / 100)
    : Math.round((grandTotal * advPct) / 100);

  const midAmt = doc.paymentTerms?.isCustomAmounts
    ? doc.paymentTerms?.afterEventCustomAmount ?? Math.round((grandTotal * midPct) / 100)
    : Math.round((grandTotal * midPct) / 100);

  const balanceAmt = doc.paymentTerms?.isCustomAmounts
    ? doc.paymentTerms?.balanceCustomAmount ?? Math.round((grandTotal * balPct) / 100)
    : Math.max(0, grandTotal - advanceAmt - midAmt);

  const activeMilestones = (doc.eventCoverage || []).filter((m) => m.dayTitle || (m.services || []).length > 0);
  const activeDeliverables = (doc.deliverables || []).filter((d) => d.included);
  const activeTeam = (doc.crewMembers || []).filter((c) => c.enabled);
  const activeWhy = (doc.whyChooseUs || []).filter((w) => w.enabled);
  const hasTerms = doc.sectionVisibility?.terms !== false && (doc.termsAndConditions || []).length > 0;
  const hasSignatures = doc.sectionVisibility?.signatory !== false && doc.signatory?.enabled !== false;

  const hasAnnexure =
    (doc.includeCrewSection && activeTeam.length > 0) ||
    (doc.includeWhyChooseUs && activeWhy.length > 0) ||
    hasTerms ||
    hasSignatures;

  const isMultiPageScope = activeMilestones.length > 3 || (selectedItems.length + optionalAddons.length > 4);
  const page1Milestones = isMultiPageScope ? activeMilestones.slice(0, 3) : activeMilestones;
  const page2Milestones = isMultiPageScope ? activeMilestones.slice(3) : [];

  const totalPages = isMultiPageScope
    ? (hasAnnexure ? 3 : 2)
    : (hasAnnexure ? 2 : 1);

  const isCompact = doc.layoutDensity === 'compact';
  const accentColor = doc.accentColor || '#f59e0b';
  const fontFamily = doc.fontFamily || 'Plus Jakarta Sans';
  const logoWidth = doc.studio.logoWidth || 240;
  const logoHeight = doc.studio.logoHeight || 80;

  const renderPricingTableAndTotals = () => (
    <div
      onClick={() => onSelectSection?.('pricing', 'pricing')}
      className={`${isCompact ? 'mb-2' : 'mb-3'} ${sectionClass('pricing')}`}
      title={onSelectSection ? 'Click to edit pricing items and discount' : undefined}
    >
      {renderEditBadge('Pricing')}
      <div className="flex items-center justify-between border-b border-slate-200/90 pb-1 mb-1.5">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-normal whitespace-nowrap">
            {doc.sectionTitles?.pricingTitle || 'Itemized Investment Schedule'}
          </h4>
        </div>
        <span className="text-[9.5px] text-slate-400 font-mono">Currency: {currency.code} ({currency.symbol})</span>
      </div>

      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-900 text-slate-200 text-[9.5px] font-bold uppercase tracking-normal">
              <th className="py-1.5 px-2.5 w-8 text-center">#</th>
              <th className="py-1.5 px-2.5">Item / Service Description</th>
              <th className="py-1.5 px-2.5 text-center w-14">Qty</th>
              <th className="py-1.5 px-2.5 text-center w-14">Unit</th>
              <th className="py-1.5 px-2.5 text-right w-24">Rate</th>
              <th className="py-1.5 px-2.5 text-right w-28">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-[10.5px]">
            {selectedItems.map((item, idx) => {
              const itemRate = item.rate || 0;
              const itemQty = item.qty || 1;
              const itemTotal = item.qty && item.rate ? itemQty * itemRate : item.amount || 0;

              return (
                <tr key={item.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                  <td className="py-1 px-2.5 text-center text-slate-400 font-mono text-[9.5px]">{idx + 1}</td>
                  <td className="py-1 px-2.5">
                    <span className="font-semibold text-slate-900">{item.description}</span>
                    {item.isOptional && (
                      <span className="ml-2 text-[8.5px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold uppercase">
                        Included Add-on
                      </span>
                    )}
                  </td>
                  <td className="py-1 px-2.5 text-center text-slate-700 font-mono">{itemQty}</td>
                  <td className="py-1 px-2.5 text-center text-slate-500 text-[9.5px] uppercase">
                    {item.unit || 'units'}
                  </td>
                  <td className="py-1 px-2.5 text-right font-mono text-slate-700">
                    {formatCurrency(itemRate, currency, { showFraction: false })}
                  </td>
                  <td className="py-1 px-2.5 text-right font-bold font-mono text-slate-900">
                    {formatCurrency(itemTotal, currency, { showFraction: false })}
                  </td>
                </tr>
              );
            })}

            {optionalAddons.map((item, optIdx) => {
              const itemRate = item.rate || 0;
              const itemQty = item.qty || 1;
              const itemTotal = item.qty && item.rate ? itemQty * itemRate : item.amount || 0;

              return (
                <tr key={item.id || `opt-${optIdx}`} className="bg-amber-50/40 border-t border-dashed border-amber-200/80">
                  <td className="py-1 px-2.5 text-center text-amber-500 font-mono text-[9.5px]">+</td>
                  <td className="py-1 px-2.5">
                    <span className="font-medium text-slate-800">{item.description}</span>
                    <span className="ml-2 text-[8.5px] bg-amber-100 text-amber-800 border border-amber-300/60 px-1.5 py-0.2 rounded font-bold uppercase tracking-wider">
                      Available Add-on
                    </span>
                  </td>
                  <td className="py-1 px-2.5 text-center text-slate-500 font-mono">{itemQty}</td>
                  <td className="py-1 px-2.5 text-center text-slate-400 text-[9.5px] uppercase">
                    {item.unit || 'units'}
                  </td>
                  <td className="py-1 px-2.5 text-right font-mono text-slate-500 italic">
                    {formatCurrency(itemRate, currency, { showFraction: false })}
                  </td>
                  <td className="py-1 px-2.5 text-right font-semibold font-mono text-amber-900">
                    +{formatCurrency(itemTotal, currency, { showFraction: false })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end mt-1.5">
        <div className="w-72 bg-slate-50 border border-slate-200 rounded-lg p-2 space-y-0.5 text-xs">
          <div className="flex justify-between items-baseline gap-3 text-slate-600 text-[10.5px]">
            <span className="whitespace-nowrap">Subtotal:</span>
            <span className="font-mono font-medium whitespace-nowrap">{formatCurrency(subtotal, currency)}</span>
          </div>

          {discountAmount > 0 && (
            <div className="flex justify-between items-baseline gap-3 text-emerald-700 text-[10.5px]">
              <span className="whitespace-nowrap">Discount:</span>
              <span className="font-mono font-medium whitespace-nowrap">-{formatCurrency(discountAmount, currency)}</span>
            </div>
          )}

          {taxAmount > 0 && (
            <div className="flex justify-between items-baseline gap-3 text-slate-600 text-[10.5px]">
              <span className="whitespace-nowrap">
                {doc.taxConfig?.label || doc.taxType?.toUpperCase() || 'Tax'} ({doc.taxConfig?.percent || doc.taxPercent}%):
              </span>
              <span className="font-mono font-medium whitespace-nowrap">{formatCurrency(taxAmount, currency)}</span>
            </div>
          )}

          <div className="border-t-2 border-slate-900 pt-0.5 flex justify-between items-baseline gap-3 font-bold text-xs text-slate-950">
            <span className="whitespace-nowrap">Total Investment:</span>
            <span className="font-mono text-amber-950 font-extrabold text-[13px] whitespace-nowrap">{formatCurrency(grandTotal, currency)}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPaymentTermsBox = () => (
    <div
      onClick={() => onSelectSection?.('tax-payment', 'payment-milestones')}
      className={`bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-[10.5px] ${sectionClass('tax-payment')}`}
      title={onSelectSection ? 'Click to edit payment terms & milestones' : undefined}
    >
      {renderEditBadge('Payment')}
      <div className="flex items-center space-x-1.5 pb-1 mb-1.5 border-b border-slate-200/80">
        <Clock className="w-3 h-3 text-amber-700 shrink-0" />
        <span className="font-bold text-slate-900 uppercase tracking-normal text-[9px] whitespace-nowrap">
          Milestone Payment Terms
        </span>
      </div>
      <div className="space-y-0.5">
        <div className="flex justify-between items-center text-[10px]">
          <span className="text-slate-600">{doc.paymentTerms?.paymentMilestoneLabels?.advanceLabel || `${advPct}% Advance Deposit`}:</span>
          <strong className="font-mono text-slate-900">{formatCurrency(advanceAmt, currency)}</strong>
        </div>
        {midPct > 0 && (
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-slate-600">{doc.paymentTerms?.paymentMilestoneLabels?.afterEventLabel || `${midPct}% Interim Milestone`}:</span>
            <strong className="font-mono text-slate-900">{formatCurrency(midAmt, currency)}</strong>
          </div>
        )}
        {balPct > 0 && (
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-slate-600">{doc.paymentTerms?.paymentMilestoneLabels?.balanceLabel || `${balPct}% Final Handover`}:</span>
            <strong className="font-mono text-slate-900">{formatCurrency(balanceAmt, currency)}</strong>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-8 print:space-y-0" style={{ fontFamily: `"${fontFamily}", sans-serif` }}>
      <div
        className="print-page bg-white shadow-2xl relative transition-all duration-200"
        style={{
          width: '794px',
          minHeight: '1123px',
          boxSizing: 'border-box',
        }}
      >
        <WatermarkLayer config={doc.watermark} />
        <div className="relative z-10 p-8 sm:p-9 text-left text-slate-900 flex flex-col justify-between h-full min-h-[1123px]">
          <div>
            <div
              onClick={() => onSelectSection?.('business', 'branding')}
              className={`flex items-start justify-between border-b-2 border-slate-900 pb-3 mb-2.5 ${sectionClass('business')}`}
              title={onSelectSection ? 'Click to edit business branding' : undefined}
            >
              {renderEditBadge('Brand')}
              <div className="flex-1 pr-6 min-w-0">
                {doc.studio.logoUrl ? (
                  <img
                    src={doc.studio.logoUrl}
                    alt={doc.studio.name}
                    style={{
                      width: `${Math.min(logoWidth, 220)}px`,
                      maxHeight: `${Math.min(logoHeight, 75)}px`,
                      objectFit: 'contain',
                    }}
                    className="mb-1 block"
                  />
                ) : (
                  <h1 className="text-xl font-black text-slate-950 tracking-tight leading-snug mb-0.5 block">
                    {doc.studio.name}
                  </h1>
                )}
                <p className="text-[10px] font-semibold text-slate-600 tracking-normal uppercase leading-normal mb-0.5 block">
                  {doc.studio.tagline}
                </p>
                <div className="text-[9.5px] text-slate-500 mt-0.5 space-y-0.5">
                  <p>{doc.studio.address}</p>
                  <p>
                    {doc.studio.phoneNumbers && <span>Ph: {doc.studio.phoneNumbers} • </span>}
                    {doc.studio.email && <span>{doc.studio.email}</span>}
                  </p>
                  {doc.studio.gstin && (
                    <p className="font-semibold text-slate-700">
                      {doc.studio.taxNumberLabel || 'Tax ID / GSTIN'}: {doc.studio.gstin}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right flex flex-col items-end shrink-0 min-w-[220px]">
                <div
                  className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded text-[10.5px] font-extrabold uppercase tracking-wider shadow-sm whitespace-nowrap"
                  style={{ backgroundColor: accentColor, color: '#090d16' }}
                >
                  <FileText className="w-3 h-3 shrink-0" />
                  <span className="whitespace-nowrap">
                    {doc.type === 'INVOICE' ? 'COMMERCIAL INVOICE' : 'COMMERCIAL PROPOSAL'}
                  </span>
                </div>
                <div className="mt-1.5 space-y-0.5 text-right text-xs">
                  <div className="flex items-center justify-end space-x-1.5">
                    <span className="text-slate-400 font-sans text-[10.5px]">Quote Ref:</span>
                    <strong className="text-slate-950 font-bold font-mono text-[11px]">{doc.details.invoiceNo}</strong>
                  </div>
                  <div className="flex items-center justify-end space-x-1.5">
                    <span className="text-slate-400 font-sans text-[10.5px]">Date:</span>
                    <span className="text-slate-700 font-medium text-[10.5px]">{doc.details.invoiceDate}</span>
                  </div>
                  <div className="flex items-center justify-end space-x-1.5">
                    <span className="text-slate-400 font-sans text-[10.5px]">Valid Until:</span>
                    <span className="text-amber-800 font-semibold text-[10.5px]">{doc.details.validUntilDate || '30 Days from issue'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div
              onClick={() => onSelectSection?.('client', 'client')}
              className={`bg-slate-50/80 border border-slate-200/90 rounded-lg p-2.5 mb-2.5 ${sectionClass('client')}`}
              title={onSelectSection ? 'Click to edit client & project metadata' : undefined}
            >
              {renderEditBadge('Client')}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Prepared For (Client)
                  </span>
                  <h3 className="font-bold text-slate-950 text-xs">{doc.client.clientName}</h3>
                  <p className="text-slate-700 text-[10.5px] font-medium">{doc.client.nameOfEvent}</p>
                  <p className="text-slate-500 text-[10px]">{doc.client.address}</p>
                </div>
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Contact & Coordinates
                  </span>
                  <p className="text-slate-700 text-[10px]">{doc.client.contactNo}</p>
                  <p className="text-slate-700 text-[10px]">{doc.client.email}</p>
                  {doc.client.taxId && (
                    <p className="text-[10px] font-semibold text-slate-700">
                      Tax ID: {doc.client.taxId}
                    </p>
                  )}
                </div>
              </div>
              {doc.packageBannerTitle && (
                <div
                  className="mt-2 pt-1.5 border-t border-slate-200/80 text-[10.5px] font-bold uppercase tracking-wider flex items-center justify-between"
                  style={{ color: accentColor === '#f59e0b' ? '#92400e' : accentColor }}
                >
                  <span>Scope: {doc.packageBannerTitle}</span>
                  <span className="text-[9.5px] font-mono text-slate-400 lowercase font-normal">
                    {activeMilestones.length} phases planned
                  </span>
                </div>
              )}
            </div>

            {doc.sectionVisibility?.scope !== false && page1Milestones.length > 0 && (
              <div
                onClick={() => onSelectSection?.('scope', 'scope')}
                className={`mb-2.5 ${sectionClass('scope')}`}
                title={onSelectSection ? 'Click to edit scope milestones' : undefined}
              >
                {renderEditBadge('Phases')}
                <div className="flex items-center space-x-2 border-b border-slate-200/90 pb-1 mb-1.5">
                  <Layers className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-normal whitespace-nowrap">
                    {doc.sectionTitles?.scopeTitle || 'Project Phases & SOW Milestones'}
                  </h4>
                  {isMultiPageScope && (
                    <span className="text-[9.5px] text-amber-700 font-normal ml-auto">
                      (Showing 1–{page1Milestones.length} of {activeMilestones.length})
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {page1Milestones.map((m, idx) => (
                    <div
                      key={m.id || idx}
                      className="bg-white border border-slate-200/90 rounded-lg p-2 shadow-sm text-[10.5px]"
                    >
                      <p className="font-bold text-slate-900 flex items-center">
                        <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-900 text-[9px] font-bold flex items-center justify-center mr-1.5 shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-['Outfit']">{m.dayTitle}</span>
                      </p>
                      <ul className="mt-0.5 space-y-0.5 pl-5 list-disc text-slate-600 text-[9.5px]">
                        {m.services.map((s, sIdx) => (
                          <li key={sIdx} className="leading-tight">
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {doc.sectionVisibility?.deliverables !== false && activeDeliverables.length > 0 && isMultiPageScope && (
              <div
                onClick={() => onSelectSection?.('deliverables', 'deliverables')}
                className={`mb-2.5 ${sectionClass('deliverables')}`}
                title={onSelectSection ? 'Click to edit project deliverables' : undefined}
              >
                {renderEditBadge('Deliverables')}
                <div className="flex items-center space-x-1.5 pb-1 mb-1.5 border-b border-slate-200/80">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="font-bold text-slate-900 uppercase tracking-normal text-[11px] whitespace-nowrap">
                    {doc.sectionTitles?.deliverablesTitle || 'Included Key Deliverables'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 bg-amber-50/30 border border-amber-200/60 rounded-lg p-2.5 text-[10.5px]">
                  {activeDeliverables.map((del) => (
                    <div key={del.id} className="flex items-start space-x-1.5">
                      <span className="text-emerald-700 font-bold text-[11px] leading-none shrink-0 mt-0.5">✓</span>
                      <span className="text-slate-800 font-medium leading-tight">{del.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!isMultiPageScope && (
              <>
                {renderPricingTableAndTotals()}
                <div className="grid grid-cols-2 gap-2.5 mb-2">
                  {renderPaymentTermsBox()}
                  {doc.sectionVisibility?.deliverables !== false && activeDeliverables.length > 0 && (
                    <div
                      onClick={() => onSelectSection?.('deliverables', 'deliverables')}
                      className={`bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-[10.5px] ${sectionClass('deliverables')}`}
                      title={onSelectSection ? 'Click to edit project deliverables' : undefined}
                    >
                      {renderEditBadge('Deliverables')}
                      <div className="flex items-center space-x-1.5 pb-1 mb-1.5 border-b border-slate-200/80">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span className="font-bold text-slate-900 uppercase tracking-normal text-[9px] whitespace-nowrap">
                          {doc.sectionTitles?.deliverablesTitle || 'Included Key Deliverables'}
                        </span>
                      </div>
                      <ul className="space-y-1 text-[9.5px] text-slate-700">
                        {activeDeliverables.map((del) => (
                          <li key={del.id} className="flex items-start space-x-1.5">
                            <span className="text-emerald-600 font-bold">✓</span>
                            <span>{del.text}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400">
            <span>{doc.footerNote || `Confidential Proposal • ${doc.studio.name}`}</span>
            <span className="font-semibold text-slate-600">Page 1 of {totalPages}</span>
          </div>
        </div>
      </div>

      {isMultiPageScope && (
        <div
          className="print-page bg-white shadow-2xl relative transition-all duration-200"
          style={{
            width: '794px',
            minHeight: '1123px',
            boxSizing: 'border-box',
          }}
        >
          <WatermarkLayer config={doc.watermark} />
          <div className="relative z-10 p-8 sm:p-9 text-left text-slate-900 flex flex-col justify-between h-full min-h-[1123px]">
            <div>
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
                  Scope & Investment Schedule (Continued)
                </span>
              </div>
              {page2Milestones.length > 0 && (
                <div
                  onClick={() => onSelectSection?.('scope', 'scope')}
                  className={`mb-3 ${sectionClass('scope')}`}
                  title={onSelectSection ? 'Click to edit scope milestones' : undefined}
                >
                  {renderEditBadge('Phases')}
                  <div className="flex items-center space-x-2 border-b border-slate-200/90 pb-1 mb-2">
                    <Layers className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-normal whitespace-nowrap">
                      {doc.sectionTitles?.scopeTitle || 'Project Phases & SOW Milestones'} (Continued)
                    </h4>
                    <span className="text-[9.5px] text-amber-700 font-normal ml-auto">
                      Phases 4 to {activeMilestones.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {page2Milestones.map((m, idx) => (
                      <div
                        key={m.id || idx}
                        className="bg-white border border-slate-200/90 rounded-lg p-2 shadow-sm text-[10.5px]"
                      >
                        <p className="font-bold text-slate-900 flex items-center">
                          <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-900 text-[9px] font-bold flex items-center justify-center mr-1.5 shrink-0">
                            {idx + 4}
                          </span>
                          <span className="font-['Outfit']">{m.dayTitle}</span>
                        </p>
                        <ul className="mt-0.5 space-y-0.5 pl-5 list-disc text-slate-600 text-[9.5px]">
                          {m.services.map((s, sIdx) => (
                            <li key={sIdx} className="leading-tight">
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {renderPricingTableAndTotals()}
              <div className="mt-2">
                {renderPaymentTermsBox()}
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400">
              <span>{doc.studio.name} • Proposal Ref: {doc.details.invoiceNo}</span>
              <span className="font-semibold text-slate-600">Page 2 of {totalPages}</span>
            </div>
          </div>
        </div>
      )}

      {hasAnnexure && (
        <div
          className="print-page bg-white shadow-2xl relative transition-all duration-200"
          style={{
            width: '794px',
            minHeight: '1123px',
            boxSizing: 'border-box',
          }}
        >
          <WatermarkLayer config={doc.watermark} />
          <div className="relative z-10 p-8 sm:p-9 text-left text-slate-900 flex flex-col justify-between h-full min-h-[1123px]">
            <div>
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
                  Proposal Addendum & Sign-off
                </span>
              </div>
              {doc.sectionVisibility?.crew !== false && doc.includeCrewSection && activeTeam.length > 0 && (
                <div
                  onClick={() => onSelectSection?.('deliverables', 'crew')}
                  className={`mb-3.5 ${sectionClass('deliverables')}`}
                  title={onSelectSection ? 'Click to edit team members' : undefined}
                >
                  {renderEditBadge('Team')}
                  <div className="flex items-center space-x-2 border-b border-slate-200/90 pb-1 mb-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-normal whitespace-nowrap">
                      {doc.sectionTitles?.crewTitle || preset.teamSectionTitle || 'Assigned Experts & Key Personnel'}
                    </h4>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {activeTeam.map((c) => (
                      <div key={c.id} className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-[10.5px]">
                        <p className="font-bold text-slate-900">{c.team}</p>
                        <p className="text-[9.5px] text-slate-600 mt-0.5 leading-tight">{c.role}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {doc.sectionVisibility?.whyChooseUs !== false && doc.includeWhyChooseUs && activeWhy.length > 0 && (
                <div
                  onClick={() => onSelectSection?.('deliverables', 'why-choose-us')}
                  className={`mb-3.5 ${sectionClass('deliverables')}`}
                  title={onSelectSection ? 'Click to edit guarantees & why choose us' : undefined}
                >
                  {renderEditBadge('Guarantees')}
                  <div className="flex items-center space-x-2 border-b border-slate-200/90 pb-1 mb-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-normal whitespace-nowrap">
                      {doc.sectionTitles?.whyChooseUsTitle || 'Why Partner With Us & Quality Commitments'}
                    </h4>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {activeWhy.map((w) => (
                      <div key={w.id} className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-[10.5px]">
                        <p className="font-bold text-slate-900 flex items-center">
                          {w.icon ? <span className="mr-1.5 text-sm">{w.icon}</span> : null}
                          <span className="font-['Outfit']">{w.title}</span>
                        </p>
                        <p className="text-[9.5px] text-slate-600 mt-0.5 leading-tight">{w.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {doc.sectionVisibility?.terms !== false && doc.termsAndConditions && doc.termsAndConditions.length > 0 && (
                <div
                  onClick={() => onSelectSection?.('watermark-terms', 'terms')}
                  className={`mb-3.5 ${sectionClass('watermark-terms')}`}
                  title={onSelectSection ? 'Click to edit commercial terms & clauses' : undefined}
                >
                  {renderEditBadge('Terms')}
                  <div className="flex items-center space-x-2 border-b border-slate-200/90 pb-1 mb-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                    <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-normal whitespace-nowrap">
                      {doc.sectionTitles?.termsTitle || 'Terms of Engagement & Acceptance Criteria'}
                    </h4>
                  </div>
                  <ul className="space-y-1 text-[9.5px] text-slate-600 pl-4 list-decimal">
                    {doc.termsAndConditions.map((term, tIdx) => (
                      <li key={tIdx} className="leading-tight">
                        {term}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {doc.sectionVisibility?.signatory !== false && doc.signatory?.enabled !== false && (
                <div
                  onClick={() => onSelectSection?.('watermark-terms', 'signatory')}
                  className={`mt-3 pt-2.5 border-t-2 border-slate-900 grid grid-cols-2 gap-8 ${sectionClass('watermark-terms')}`}
                  title={onSelectSection ? 'Click to edit signatory details & contract sign-off' : undefined}
                >
                  {renderEditBadge('Signatures')}
                  <div>
                    <p className="text-[9.5px] font-bold text-slate-400 uppercase tracking-normal mb-0.5 whitespace-nowrap">
                      ISSUED BY:
                    </p>
                    <p className="font-bold text-xs text-slate-900">{doc.studio.name}</p>
                    <div className="h-12 border-b border-slate-300 flex items-end pb-1 my-1">
                      {doc.signatory?.signatureDataUrl ? (
                        <img
                          src={doc.signatory.signatureDataUrl}
                          alt="Signature"
                          className="max-h-10 object-contain"
                        />
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
                      ACCEPTED & APPROVED BY CLIENT:
                    </p>
                    <p className="font-bold text-xs text-slate-900">
                      {doc.client.clientName || doc.client.nameOfEvent || 'Authorized Client Representative'}
                    </p>
                    <div className="h-12 border-b border-slate-300 flex items-end pb-1 my-1">
                      {doc.signatory?.clientSignatureDataUrl ? (
                        <img
                          src={doc.signatory.clientSignatureDataUrl}
                          alt="Client Signature"
                          className="max-h-10 object-contain"
                        />
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
              )}
            </div>
            <div className="border-t border-slate-200 pt-2 flex items-center justify-between text-[10px] text-slate-400">
              <span>{doc.footerNote || `Confidential Proposal • ${doc.studio.name}`}</span>
              <span className="font-semibold text-slate-600">Page {totalPages} of {totalPages} • End of Document</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

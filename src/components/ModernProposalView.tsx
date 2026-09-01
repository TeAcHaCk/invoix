import React from 'react';
import type { QuotationDocument, ProposalSectionKey } from '../types';
import { formatCurrency } from '../utils/formatters';
import { WatermarkLayer } from './WatermarkLayer';
import { INDUSTRY_PRESETS } from '../constants/industryPresets';
import { resolveCanvasSpacing } from '../utils/canvasSpacingResolver';
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

  const { sectionGapPx, pagePaddingPx, dividerStyle, isCompact } = resolveCanvasSpacing(doc);

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

  const renderPricingSection = () => {
    if (doc.sectionVisibility?.pricingTable === false) return null;
    return (
      <div key="pricing" style={{ marginBottom: `${sectionGapPx}px` }}>
        {renderPricingTableAndTotals()}
        <div className="grid grid-cols-2 gap-2.5">
          {renderPaymentTermsBox()}
        </div>
      </div>
    );
  };

  const renderScopeSection = (
    milestonesToRender: typeof activeMilestones = activeMilestones,
    startNumber = 1,
    isContinued = false
  ) => {
    if (doc.sectionVisibility?.scope === false || milestonesToRender.length === 0) return null;
    const endNumber = startNumber + milestonesToRender.length - 1;

    return (
      <div
        key={isContinued ? `scope-${startNumber}` : 'scope'}
        onClick={() => onSelectSection?.('scope', 'scope')}
        style={{ marginBottom: `${sectionGapPx}px` }}
        className={sectionClass('scope')}
        title={onSelectSection ? 'Click to edit scope milestones' : undefined}
      >
        {renderEditBadge('Phases')}
        <div className="flex items-center space-x-2 border-b border-slate-200/90 pb-1 mb-1.5">
          <Layers className="w-3.5 h-3.5 text-amber-700 shrink-0" />
          <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-normal whitespace-nowrap">
            {doc.sectionTitles?.scopeTitle || 'Project Phases & SOW Milestones'} {isContinued ? '(Continued)' : ''}
          </h4>
          <span className="text-[9.5px] text-amber-700 font-normal ml-auto">
            {isContinued
              ? `Phases ${startNumber} to ${endNumber} of ${activeMilestones.length}`
              : `${activeMilestones.length} phase(s) planned`}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {milestonesToRender.map((m, idx) => (
            <div
              key={m.id || idx}
              className="bg-white border border-slate-200/90 rounded-lg p-2 shadow-sm text-[10.5px]"
            >
              <p className="font-bold text-slate-900 flex items-center">
                <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-900 text-[9px] font-bold flex items-center justify-center mr-1.5 shrink-0">
                  {startNumber + idx}
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
        <div className="flex items-center space-x-2 border-b border-slate-200/90 pb-1 mb-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
          <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-normal whitespace-nowrap">
            {doc.sectionTitles?.deliverablesTitle || 'Included Deliverables & Final Assets'}
          </h4>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 bg-slate-50 border border-slate-200/80 rounded-lg p-2 text-[10.5px]">
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

  const renderCrewSection = () => {
    if (doc.sectionVisibility?.crew === false || !doc.includeCrewSection || activeTeam.length === 0) return null;
    return (
      <div
        key="crew"
        onClick={() => onSelectSection?.('deliverables', 'crew')}
        style={{ marginBottom: `${sectionGapPx}px` }}
        className={sectionClass('deliverables')}
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
    );
  };

  const renderWhyChooseUsSection = () => {
    if (doc.sectionVisibility?.whyChooseUs === false || !doc.includeWhyChooseUs || activeWhy.length === 0) return null;
    return (
      <div
        key="whyChooseUs"
        onClick={() => onSelectSection?.('deliverables', 'why-choose-us')}
        style={{ marginBottom: `${sectionGapPx}px` }}
        className={sectionClass('deliverables')}
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
    );
  };

  const renderTermsSection = () => {
    if (doc.sectionVisibility?.terms === false || !doc.termsAndConditions || doc.termsAndConditions.length === 0) return null;
    return (
      <div
        key="terms"
        onClick={() => onSelectSection?.('watermark-terms', 'terms')}
        style={{ marginBottom: `${sectionGapPx}px` }}
        className={sectionClass('watermark-terms')}
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
    );
  };

  const renderSignatorySection = () => {
    if (doc.sectionVisibility?.signatory === false || doc.signatory?.enabled === false) return null;
    return (
      <div
        key="signatory"
        onClick={() => onSelectSection?.('watermark-terms', 'signatory')}
        style={{ marginBottom: `${sectionGapPx}px` }}
        className={`pt-2.5 border-t-2 border-slate-900 grid grid-cols-2 gap-8 ${sectionClass('watermark-terms')}`}
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
    );
  };

  type ProposalPageUnit =
    | {
        type: 'scope_chunk';
        milestones: typeof activeMilestones;
        startNumber: number;
        isContinued: boolean;
        height: number;
      }
    | { type: 'deliverables'; height: number }
    | { type: 'pricing'; height: number }
    | { type: 'crew'; height: number }
    | { type: 'whyChooseUs'; height: number }
    | { type: 'terms'; height: number }
    | { type: 'signatory'; height: number };

  const renderUnit = (unit: ProposalPageUnit, isLast = false) => {
    const rendered = (() => {
      switch (unit.type) {
        case 'scope_chunk':
          return renderScopeSection(unit.milestones, unit.startNumber, unit.isContinued);
        case 'deliverables':
          return renderDeliverablesBox();
        case 'pricing':
          return renderPricingSection();
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
      <React.Fragment key={unit.type === 'scope_chunk' ? `scope-${unit.startNumber}` : unit.type}>
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
    </>
  );

  // Build atomic Page Units with intelligent phase chunking
  const pageUnits: ProposalPageUnit[] = [];

  for (const key of currentSectionOrder) {
    switch (key) {
      case 'scope': {
        if (doc.sectionVisibility?.scope === false || activeMilestones.length === 0) break;
        if (activeMilestones.length <= 4) {
          const h = 35 + Math.ceil(activeMilestones.length / 2) * 60 + sectionGapPx;
          pageUnits.push({
            type: 'scope_chunk',
            milestones: activeMilestones,
            startNumber: 1,
            isContinued: false,
            height: h,
          });
        } else {
          // Chunk phases: 4 phases for chunk 1, then up to 8 phases per subsequent chunk
          let offset = 0;
          let isFirst = true;
          while (offset < activeMilestones.length) {
            const chunkSize = isFirst ? 4 : 8;
            const slice = activeMilestones.slice(offset, offset + chunkSize);
            const h = 35 + Math.ceil(slice.length / 2) * 60 + sectionGapPx;
            pageUnits.push({
              type: 'scope_chunk',
              milestones: slice,
              startNumber: offset + 1,
              isContinued: !isFirst,
              height: h,
            });
            offset += chunkSize;
            isFirst = false;
          }
        }
        break;
      }
      case 'deliverables': {
        if (doc.sectionVisibility?.deliverables === false || activeDeliverables.length === 0) break;
        const h = 30 + Math.ceil(activeDeliverables.length / 2) * 28 + 16 + sectionGapPx;
        pageUnits.push({ type: 'deliverables', height: h });
        break;
      }
      case 'pricing': {
        if (doc.sectionVisibility?.pricingTable === false) break;
        const itemCount = selectedItems.length + optionalAddons.length;
        const h = 32 + itemCount * 26 + 80 + 110 + 20 + sectionGapPx;
        pageUnits.push({ type: 'pricing', height: h });
        break;
      }
      case 'whyChooseUs': {
        if (doc.sectionVisibility?.whyChooseUs === false || !doc.includeWhyChooseUs || activeWhy.length === 0) break;
        const h = 30 + Math.ceil(activeWhy.length / 2) * 68 + sectionGapPx;
        pageUnits.push({ type: 'whyChooseUs', height: h });
        break;
      }
      case 'crew': {
        if (doc.sectionVisibility?.crew === false || !doc.includeCrewSection || activeTeam.length === 0) break;
        const h = 30 + Math.ceil(activeTeam.length / 2) * 48 + sectionGapPx;
        pageUnits.push({ type: 'crew', height: h });
        break;
      }
      case 'terms': {
        if (doc.sectionVisibility?.terms === false || !doc.termsAndConditions || doc.termsAndConditions.length === 0) break;
        const h = 30 + doc.termsAndConditions.length * 22 + sectionGapPx;
        pageUnits.push({ type: 'terms', height: h });
        break;
      }
      case 'signatory': {
        if (doc.sectionVisibility?.signatory === false || doc.signatory?.enabled === false) break;
        pageUnits.push({ type: 'signatory', height: 150 + sectionGapPx });
        break;
      }
    }
  }

  // Pack units into distinct A4 sheets strictly observing vertical height limits
  const pages: ProposalPageUnit[][] = [];
  let currentPage: ProposalPageUnit[] = [];
  let currentHeight = 0;
  // Page 1 budget: 1123px - (padding * 2) - header (240px) - footer (40px)
  const page1HeaderFooter = 240 + 40;
  let maxCapacity = Math.max(450, 1123 - (pagePaddingPx * 2) - page1HeaderFooter);

  for (const unit of pageUnits) {
    if (currentHeight + unit.height > maxCapacity && currentPage.length > 0) {
      pages.push(currentPage);
      currentPage = [unit];
      currentHeight = unit.height;
      // Subsequent pages budget: 1123px - (padding * 2) - header mini (50px) - footer (40px)
      maxCapacity = Math.max(550, 1123 - (pagePaddingPx * 2) - 90);
    } else {
      currentPage.push(unit);
      currentHeight += unit.height;
    }
  }

  if (currentPage.length > 0) {
    pages.push(currentPage);
  }

  if (pages.length === 0) {
    pages.push([{ type: 'pricing', height: 200 }]);
  }

  const totalPages = pages.length;

  return (
    <div className="space-y-8 print:space-y-0" style={{ fontFamily: `"${fontFamily}", sans-serif` }}>
      {pages.map((pageUnitsOnSheet, pageIdx) => {
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

                {/* Render Units on this sheet strictly in defined order */}
                {pageUnitsOnSheet.map((unit, uIdx) =>
                  renderUnit(unit, uIdx === pageUnitsOnSheet.length - 1)
                )}
              </div>

              {/* Page Footer */}
              <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400">
                <span>{doc.footerNote || `Confidential Proposal • ${doc.studio.name}`}</span>
                <span className="font-semibold text-slate-600">
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

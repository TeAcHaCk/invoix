import React from 'react';
import type { QuotationDocument } from '../types';
import { formatCurrency } from '../utils/formatters';
import { WatermarkLayer } from './WatermarkLayer';
import { INDUSTRY_PRESETS } from '../constants/industryPresets';
import {
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  ShieldCheck,
  Award,
  Clock,
  FileText,
} from 'lucide-react';

interface ModernProposalViewProps {
  document: QuotationDocument;
}

export const ModernProposalView: React.FC<ModernProposalViewProps> = ({ document: doc }) => {
  const preset = INDUSTRY_PRESETS[doc.industry] || INDUSTRY_PRESETS.creative_agency;
  const currency = doc.currency;

  const logoWidth = doc.studio.logoWidth || 280;
  const logoHeight = doc.studio.logoHeight || 110;

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

  const activeMilestones = doc.eventCoverage || [];
  const activeDeliverables = (doc.deliverables || []).filter((d) => d.included);
  const activeTeam = (doc.crewMembers || []).filter((c) => c.enabled);
  const activeWhy = (doc.whyChooseUs || []).filter((w) => w.enabled);

  const hasPage2 =
    (doc.includeCrewSection && activeTeam.length > 0) ||
    (doc.includeWhyChooseUs && activeWhy.length > 0) ||
    (doc.termsAndConditions && doc.termsAndConditions.length > 5);

  const accentColor = doc.accentColor || '#f59e0b';
  const fontFamily = doc.fontFamily || 'Plus Jakarta Sans';

  return (
    <div className="space-y-8 print:space-y-0" style={{ fontFamily: `"${fontFamily}", sans-serif` }}>
      {/* ========================================================= */}
      {/* PAGE 1: EXECUTIVE SUMMARY, SCOPE & PRICING               */}
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
            {/* Header / Brand Block */}
            <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5">
              <div className="flex-1 pr-6 min-w-0">
                {doc.studio.logoUrl ? (
                  <img
                    src={doc.studio.logoUrl}
                    alt={doc.studio.name}
                    style={{
                      width: `${logoWidth}px`,
                      maxHeight: `${logoHeight}px`,
                      objectFit: 'contain',
                    }}
                    className="mb-2 block"
                  />
                ) : (
                  <h1 className="text-2xl font-black text-slate-950 tracking-tight leading-snug mb-1.5 block">
                    {doc.studio.name}
                  </h1>
                )}
                <p className="text-[10.5px] font-semibold text-slate-600 tracking-normal uppercase leading-normal mb-1 block">
                  {doc.studio.tagline}
                </p>
                <div className="text-[10px] text-slate-500 mt-1 space-y-0.5">
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

              {/* Right Document Reference Tag */}
              <div className="text-right flex flex-col items-end shrink-0 min-w-[240px]">
                <div
                  className="inline-flex items-center space-x-1.5 px-3 py-1 rounded text-[11px] font-extrabold uppercase tracking-wider shadow-sm whitespace-nowrap"
                  style={{ backgroundColor: accentColor, color: '#090d16' }}
                >
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <span className="whitespace-nowrap">
                    {doc.type === 'INVOICE' ? 'COMMERCIAL INVOICE' : 'COMMERCIAL PROPOSAL'}
                  </span>
                </div>

                <div className="mt-2.5 space-y-1 text-right text-xs">
                  <div className="flex items-center justify-end space-x-1.5">
                    <span className="text-slate-400 font-sans text-[11px]">Quote Ref:</span>
                    <strong className="text-slate-950 font-bold font-mono">{doc.details.invoiceNo}</strong>
                  </div>
                  <div className="flex items-center justify-end space-x-1.5">
                    <span className="text-slate-400 text-[11px]">Date:</span>
                    <strong className="text-slate-800 font-medium">{doc.details.invoiceDate}</strong>
                  </div>
                  <div className="flex items-center justify-end space-x-1.5">
                    <span className="text-slate-400 text-[11px]">Valid Until:</span>
                    <strong className="text-emerald-700 font-semibold">{doc.details.validUntilDate || '30 Days from issue date'}</strong>
                  </div>
                  {doc.details.poNumber && (
                    <div className="flex items-center justify-end space-x-1.5">
                      <span className="text-slate-400 text-[11px]">Ref / PO #:</span>
                      <span className="font-mono text-slate-800">{doc.details.poNumber}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Client & Project Banner */}
            <div className="grid grid-cols-2 gap-4 my-4 bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-normal font-['Outfit'] mb-1">
                  PREPARED FOR / CLIENT:
                </p>
                <h3 className="text-sm font-bold text-slate-950">
                  {doc.client.clientName || doc.client.nameOfEvent || 'Valued Client'}
                </h3>
                <p className="text-[11px] text-slate-600 font-medium">{doc.client.address || 'Client Address'}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {doc.client.contactNo && <span>Tel: {doc.client.contactNo}</span>}
                  {doc.client.email && <span> • {doc.client.email}</span>}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-normal font-['Outfit'] mb-1">
                  PROJECT / ENGAGEMENT:
                </p>
                <h3 className="text-sm font-bold text-amber-900">
                  {doc.packageBannerTitle || doc.client.nameOfEvent || 'Professional Services Scope'}
                </h3>
                <p className="text-[11px] text-slate-600 mt-0.5 flex items-center">
                  <Calendar className="w-3 h-3 mr-1 text-slate-400 inline shrink-0" />
                  <span>
                    Timeline: {doc.details.eventDateMode === 'single' ? doc.details.eventDate : `${doc.details.eventDateFrom} to ${doc.details.eventDateTo}`}
                  </span>
                </p>
              </div>
            </div>

            {/* Project Scope / Phases (If present) */}
            {doc.includeScopeSection !== false && activeMilestones.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center space-x-2 border-b border-slate-200/90 pb-1.5 mb-2.5">
                  <Layers className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-normal font-['Outfit'] whitespace-nowrap">
                    {preset.scopeSectionTitle || 'Project Phases & SOW Milestones'}
                  </h4>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {activeMilestones.slice(0, 4).map((m, idx) => (
                    <div
                      key={m.id || idx}
                      className="bg-white border border-slate-200/90 rounded-lg p-2.5 shadow-sm text-[11px]"
                    >
                      <p className="font-bold text-slate-900 flex items-center">
                        <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-900 text-[9.5px] font-bold flex items-center justify-center mr-1.5 shrink-0">
                          {idx + 1}
                        </span>
                        <span>{m.dayTitle}</span>
                      </p>
                      <ul className="mt-1 space-y-0.5 pl-5 list-disc text-slate-600 text-[10.5px]">
                        {m.services.slice(0, 3).map((s, sIdx) => (
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

            {/* Itemized Investment & Pricing Table */}
            <div className="mb-4">
              <div className="flex items-center justify-between border-b border-slate-200/90 pb-1.5 mb-2.5">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-normal font-['Outfit'] whitespace-nowrap">
                    Itemized Investment Schedule
                  </h4>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Currency: {currency.code} ({currency.symbol})</span>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-slate-200 text-[10px] font-bold uppercase tracking-normal font-['Outfit']">
                      <th className="py-2 px-3 w-8 text-center">#</th>
                      <th className="py-2 px-3">Item / Service Description</th>
                      <th className="py-2 px-3 text-center w-16">Qty</th>
                      <th className="py-2 px-3 text-center w-16">Unit</th>
                      <th className="py-2 px-3 text-right w-24">Rate</th>
                      <th className="py-2 px-3 text-right w-28">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px]">
                    {selectedItems.map((item, idx) => {
                      const itemRate = item.rate || 0;
                      const itemQty = item.qty || 1;
                      const itemTotal = item.qty && item.rate ? itemQty * itemRate : item.amount || 0;

                      return (
                        <tr key={item.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                          <td className="py-2 px-3 text-center text-slate-400 font-mono text-[10px]">{idx + 1}</td>
                          <td className="py-2 px-3">
                            <span className="font-semibold text-slate-900">{item.description}</span>
                            {item.isOptional && (
                              <span className="ml-2 text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold uppercase">
                                Included Add-on
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-center text-slate-700 font-mono">{itemQty}</td>
                          <td className="py-2 px-3 text-center text-slate-500 text-[10px] uppercase">
                            {item.unit || 'units'}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-slate-700">
                            {formatCurrency(itemRate, currency, { showFraction: false })}
                          </td>
                          <td className="py-2 px-3 text-right font-bold font-mono text-slate-900">
                            {formatCurrency(itemTotal, currency, { showFraction: false })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Financial Totals Block */}
              <div className="flex justify-end mt-2">
                <div className="w-72 bg-slate-50 border border-slate-200 rounded-lg p-2.5 space-y-1 text-xs">
                  <div className="flex justify-between text-slate-600 text-[11px]">
                    <span>Subtotal:</span>
                    <span className="font-mono font-medium">{formatCurrency(subtotal, currency)}</span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700 text-[11px]">
                      <span>Discount:</span>
                      <span className="font-mono font-medium">-{formatCurrency(discountAmount, currency)}</span>
                    </div>
                  )}

                  {taxAmount > 0 && (
                    <div className="flex justify-between text-slate-600 text-[11px]">
                      <span>
                        {doc.taxConfig?.label || doc.taxType?.toUpperCase() || 'Tax'} ({doc.taxConfig?.percent || doc.taxPercent}%):
                      </span>
                      <span className="font-mono font-medium">{formatCurrency(taxAmount, currency)}</span>
                    </div>
                  )}

                  <div className="border-t-2 border-slate-900 pt-1 flex justify-between font-bold text-sm text-slate-950">
                    <span className="font-['Outfit']">Total Investment:</span>
                    <span className="font-mono text-amber-950 font-extrabold">{formatCurrency(grandTotal, currency)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Milestones & Deliverables Summary */}
            <div className="grid grid-cols-2 gap-3 mb-2">
              {/* Payment Terms Milestones */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-[11px]">
                <div className="flex items-center space-x-1.5 pb-1 mb-2 border-b border-slate-200/80">
                  <Clock className="w-3 h-3 text-amber-700 shrink-0" />
                  <span className="font-bold text-slate-900 uppercase tracking-normal text-[9px] font-['Outfit'] whitespace-nowrap">
                    Milestone Payment Terms
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[10.5px]">
                    <span className="text-slate-600">{doc.paymentTerms?.paymentMilestoneLabels?.advanceLabel || `${advPct}% Advance Deposit`}:</span>
                    <strong className="font-mono text-slate-900">{formatCurrency(advanceAmt, currency)}</strong>
                  </div>
                  {midPct > 0 && (
                    <div className="flex justify-between items-center text-[10.5px]">
                      <span className="text-slate-600">{doc.paymentTerms?.paymentMilestoneLabels?.afterEventLabel || `${midPct}% Interim Milestone`}:</span>
                      <strong className="font-mono text-slate-900">{formatCurrency(midAmt, currency)}</strong>
                    </div>
                  )}
                  {balPct > 0 && (
                    <div className="flex justify-between items-center text-[10.5px]">
                      <span className="text-slate-600">{doc.paymentTerms?.paymentMilestoneLabels?.balanceLabel || `${balPct}% Final Handover`}:</span>
                      <strong className="font-mono text-slate-900">{formatCurrency(balanceAmt, currency)}</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Deliverables Checklist */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-[11px]">
                <div className="flex items-center space-x-1.5 pb-1 mb-2 border-b border-slate-200/80">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span className="font-bold text-slate-900 uppercase tracking-normal text-[9px] font-['Outfit'] whitespace-nowrap">
                    Included Key Deliverables
                  </span>
                </div>
                <ul className="space-y-1 text-[10.5px] text-slate-700">
                  {activeDeliverables.slice(0, 4).map((d) => (
                    <li key={d.id} className="flex items-start space-x-1.5 leading-tight">
                      <span className="text-emerald-600 font-bold shrink-0">✓</span>
                      <span className="line-clamp-1">{d.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Footer & Page 1 Info */}
          <div className="border-t border-slate-200 pt-2 flex items-center justify-between text-[10px] text-slate-400">
            <span>{doc.footerNote || `Confidential Proposal • ${doc.studio.name}`}</span>
            <span>Page 1 of {hasPage2 ? '2' : '1'}</span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* PAGE 2: TEAM, GUARANTEES, TERMS & E-SIGNATURE (IF ACTIVE)  */}
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

          <div className="relative z-10 p-10 text-left font-['Plus_Jakarta_Sans',sans-serif] text-slate-900 flex flex-col justify-between h-full min-h-[1123px]">
            <div>
              {/* Header Mini */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
                <div className="flex items-center space-x-2">
                  <h2 className="font-bold text-sm tracking-normal uppercase font-['Outfit'] text-slate-950 whitespace-nowrap leading-none">
                    {doc.studio.name}
                  </h2>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono leading-none">
                    Ref: {doc.details.invoiceNo}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 uppercase tracking-normal font-['Outfit'] whitespace-nowrap leading-none">
                  Proposal Addendum & Sign-off
                </span>
              </div>

              {/* Assigned Specialists / Team Section */}
              {doc.includeCrewSection && activeTeam.length > 0 && (
                <div className="mb-5">
                  <div className="flex items-center space-x-2 border-b border-slate-200/90 pb-1.5 mb-2.5">
                    <Award className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-normal font-['Outfit'] whitespace-nowrap">
                      {preset.teamSectionTitle || 'Assigned Experts & Key Personnel'}
                    </h4>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    {activeTeam.map((c) => (
                      <div key={c.id} className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-[11px]">
                        <p className="font-bold text-slate-900">{c.team}</p>
                        <p className="text-[10.5px] text-slate-600 mt-0.5 leading-tight">{c.role}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Guarantees & Why Work With Us */}
              {doc.includeWhyChooseUs && activeWhy.length > 0 && (
                <div className="mb-5">
                  <div className="flex items-center space-x-2 border-b border-slate-200/90 pb-1.5 mb-2.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-normal font-['Outfit'] whitespace-nowrap">
                      Why Partner With Us & Quality Commitments
                    </h4>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    {activeWhy.map((w) => (
                      <div key={w.id} className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-[11px]">
                        <p className="font-bold text-slate-900 flex items-center">
                          <span className="mr-1.5 text-sm">{w.icon}</span>
                          <span>{w.title}</span>
                        </p>
                        <p className="text-[10.5px] text-slate-600 mt-0.5 leading-tight">{w.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Commercial Terms & Conditions */}
              {doc.termsAndConditions && doc.termsAndConditions.length > 0 && (
                <div className="mb-5">
                  <div className="flex items-center space-x-2 border-b border-slate-200/90 pb-1.5 mb-2.5">
                    <FileText className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                    <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-normal font-['Outfit'] whitespace-nowrap">
                      Terms of Engagement & Acceptance Criteria
                    </h4>
                  </div>
                  <ul className="space-y-1.5 text-[10.5px] text-slate-600 pl-4 list-decimal">
                    {doc.termsAndConditions.map((term, tIdx) => (
                      <li key={tIdx} className="leading-tight">
                        {term}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* E-Signature & Formal Approval Sign-Off Block */}
              {doc.signatory?.enabled !== false && (
                <div className="mt-4 pt-3 border-t-2 border-slate-900 grid grid-cols-2 gap-8">
                  {/* Service Provider Signature */}
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-normal font-['Outfit'] mb-1 whitespace-nowrap">
                      ISSUED BY:
                    </p>
                    <p className="font-bold text-xs text-slate-900">{doc.studio.name}</p>
                    <div className="h-14 border-b border-slate-300 flex items-end pb-1 my-1">
                      {doc.signatory?.signatureDataUrl ? (
                        <img
                          src={doc.signatory.signatureDataUrl}
                          alt="Signature"
                          className="max-h-12 object-contain"
                        />
                      ) : (
                        <span className="text-[11px] font-mono text-slate-400 italic">
                          {doc.signatory?.signerName || 'Authorized Signatory'}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>{doc.signatory?.signerTitle || 'Managing Director'}</span>
                      <span>Date: {doc.signatory?.signatureDate || doc.details.invoiceDate}</span>
                    </div>
                  </div>

                  {/* Client Acceptance Signature */}
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-normal font-['Outfit'] mb-1 whitespace-nowrap">
                      ACCEPTED & APPROVED BY CLIENT:
                    </p>
                    <p className="font-bold text-xs text-slate-900">
                      {doc.client.clientName || doc.client.nameOfEvent || 'Authorized Client Representative'}
                    </p>
                    <div className="h-14 border-b border-slate-300 flex items-end pb-1 my-1">
                      {doc.signatory?.clientSignatureDataUrl ? (
                        <img
                          src={doc.signatory.clientSignatureDataUrl}
                          alt="Client Signature"
                          className="max-h-12 object-contain"
                        />
                      ) : doc.signatory?.clientSignedName ? (
                        <span className="text-xs font-serif text-emerald-800 font-bold italic">
                          Digitally Signed: {doc.signatory.clientSignedName}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Sign / Draw here to approve</span>
                      )}
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>Date: {doc.signatory?.clientSignedDate || '___/___/______'}</span>
                      <span>Status: {doc.signatory?.clientSignedName ? 'APPROVED' : 'AWAITING APPROVAL'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Page 2 Footer */}
            <div className="border-t border-slate-200 pt-2 flex items-center justify-between text-[10px] text-slate-400">
              <span>{doc.footerNote || `Confidential Proposal • ${doc.studio.name}`}</span>
              <span>Page 2 of 2</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

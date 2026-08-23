import React, { useState, useEffect } from 'react';
import type { QuotationDocument } from '../types';
import { formatCurrency } from '../utils/formatters';
import { generateQrDataUrl } from '../utils/qrGenerator';
import { CheckCircle2, AlertCircle, Clock } from 'lucide-react';

interface FormalInvoiceViewProps {
  document: QuotationDocument;
}

export const FormalInvoiceView: React.FC<FormalInvoiceViewProps> = ({ document: doc }) => {
  const currency = doc.currency;
  const logoWidth = doc.studio.logoWidth || 320;
  const logoHeight = doc.studio.logoHeight || 130;

  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  // Financial Calculations
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
  const amountReceived = doc.invoicePayment?.amountReceived || doc.paymentTerms?.advanceReceived || 0;
  const balanceDue = Math.max(0, grandTotal - amountReceived);

  // Status calculation
  let statusBadge = {
    label: 'PAYMENT DUE',
    color: 'bg-red-50 text-red-700 border-red-200',
    icon: <AlertCircle className="w-3.5 h-3.5 mr-1 shrink-0" />,
  };

  if (amountReceived >= grandTotal && grandTotal > 0) {
    statusBadge = {
      label: 'PAID IN FULL',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-300',
      icon: <CheckCircle2 className="w-3.5 h-3.5 mr-1 shrink-0" />,
    };
  } else if (amountReceived > 0) {
    statusBadge = {
      label: 'PARTIALLY PAID',
      color: 'bg-amber-50 text-amber-800 border-amber-300',
      icon: <Clock className="w-3.5 h-3.5 mr-1 shrink-0" />,
    };
  }

  // Generate offline QR code for UPI / Stripe / Payment Link
  useEffect(() => {
    let active = true;
    let paymentPayload = '';
    const payAmount = balanceDue > 0 ? balanceDue : grandTotal;

    if (currency.code === 'INR' && doc.studio.upiId) {
      paymentPayload = `upi://pay?pa=${encodeURIComponent(doc.studio.upiId)}&pn=${encodeURIComponent(
        doc.studio.name || 'Vendor'
      )}&am=${payAmount}&cu=INR&tn=${encodeURIComponent(doc.details.invoiceNo || 'Invoice Payment')}`;
    } else if (doc.studio.paymentLink) {
      paymentPayload = doc.studio.paymentLink;
    } else if (doc.studio.website) {
      paymentPayload = `https://${doc.studio.website.replace(/^https?:\/\//, '')}`;
    }

    if (paymentPayload) {
      generateQrDataUrl(paymentPayload, { width: 140 }).then((dataUrl) => {
        if (active) setQrCodeDataUrl(dataUrl);
      });
    } else {
      setQrCodeDataUrl('');
    }

    return () => {
      active = false;
    };
  }, [doc.studio.upiId, doc.studio.paymentLink, doc.studio.website, doc.studio.name, doc.details.invoiceNo, balanceDue, grandTotal, currency.code]);

  const fontFamily = doc.fontFamily || 'Plus Jakarta Sans';

  return (
    <div
      className="relative w-full h-full bg-white text-slate-900 text-left p-8 sm:p-10 flex flex-col justify-between select-text min-h-[1123px]"
      style={{ fontFamily: `"${fontFamily}", sans-serif` }}
    >
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
          <div className="flex-1 pr-6 min-w-0">
            {doc.studio.logoUrl ? (
              <img
                src={doc.studio.logoUrl}
                alt={doc.studio.name}
                style={{
                  width: `${Math.min(logoWidth, 340)}px`,
                  maxHeight: `${Math.min(logoHeight, 130)}px`,
                  objectFit: 'contain',
                }}
                className="mb-2 block"
              />
            ) : (
              <h1 className="text-2xl font-bold tracking-tight text-slate-950 font-['Outfit'] leading-snug mb-1.5 block">
                {doc.studio.name}
              </h1>
            )}
            <p className="text-[10.5px] tracking-normal text-slate-600 uppercase font-semibold leading-normal mb-1 block">
              {doc.studio.tagline}
            </p>
            <div className="text-[11px] text-slate-500 space-y-0.5 pt-0.5">
              <p>{doc.studio.address}</p>
              <p>
                {doc.studio.phoneNumbers && <span>Ph: {doc.studio.phoneNumbers} • </span>}
                {doc.studio.email}
              </p>
              {doc.studio.gstin && (
                <p className="font-semibold text-slate-700">
                  {doc.studio.taxNumberLabel || 'Tax ID / GSTIN'}: {doc.studio.gstin}
                </p>
              )}
            </div>
          </div>

          {/* Invoice Badge & Meta */}
          <div className="text-right flex flex-col items-end shrink-0 min-w-[200px]">
            <div className="text-2xl font-extrabold text-slate-900 tracking-normal font-['Outfit'] uppercase whitespace-nowrap leading-tight">
              {doc.taxConfig?.type === 'none' ? 'COMMERCIAL INVOICE' : 'TAX INVOICE'}
            </div>

            <div className="mt-2 space-y-1 text-xs">
              <div className="flex justify-end space-x-2">
                <span className="text-slate-500">Invoice No:</span>
                <span className="font-mono font-bold text-slate-950">{doc.details.invoiceNo}</span>
              </div>
              <div className="flex justify-end space-x-2">
                <span className="text-slate-500">Invoice Date:</span>
                <span className="font-medium text-slate-800">{doc.details.invoiceDate}</span>
              </div>
              {doc.details.dueDate && (
                <div className="flex justify-end space-x-2">
                  <span className="text-slate-500">Payment Due:</span>
                  <span className="font-bold text-red-600">{doc.details.dueDate}</span>
                </div>
              )}
              {doc.details.poNumber && (
                <div className="flex justify-end space-x-2">
                  <span className="text-slate-500">PO / Ref #:</span>
                  <span className="font-mono text-slate-700">{doc.details.poNumber}</span>
                </div>
              )}
            </div>

            {/* Status Badge */}
            <div
              className={`mt-2.5 px-3 py-1 rounded-full border text-[11px] font-bold tracking-normal uppercase font-['Outfit'] inline-flex items-center shadow-sm ${statusBadge.color}`}
            >
              {statusBadge.icon}
              <span>{statusBadge.label}</span>
            </div>
          </div>
        </div>

        {/* Bill To / Client Section */}
        <div className="grid grid-cols-2 gap-6 my-4 bg-slate-50 border border-slate-200/90 rounded-xl p-3.5 text-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-normal block font-['Outfit'] mb-1 whitespace-nowrap">
              BILLED TO / CLIENT:
            </span>
            <div className="font-bold text-sm text-slate-900">
              {doc.client.clientName || doc.client.nameOfEvent || 'Client Organization'}
            </div>
            {doc.client.clientName && doc.client.nameOfEvent && (
              <div className="text-[11px] text-amber-900 font-semibold">{doc.client.nameOfEvent}</div>
            )}
            <div className="text-[11px] text-slate-600 mt-0.5 leading-snug">{doc.client.address || 'Address'}</div>
            <div className="text-[11px] text-slate-500 mt-1 space-x-1">
              {doc.client.contactNo && <span>Ph: {doc.client.contactNo}</span>}
              {doc.client.email && <span> • {doc.client.email}</span>}
            </div>
            {doc.client.taxId && (
              <div className="text-[11px] text-slate-700 font-medium mt-1">
                Client Tax ID: {doc.client.taxId}
              </div>
            )}
          </div>

          <div className="text-right flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-normal block font-['Outfit'] mb-1 whitespace-nowrap">
                SERVICE / PROJECT SUMMARY:
              </span>
              <div className="font-semibold text-xs text-slate-800">
                {doc.packageBannerTitle || 'Professional Services Delivery'}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Service Date:{' '}
                {doc.details.eventDateMode === 'single'
                  ? doc.details.eventDate
                  : `${doc.details.eventDateFrom} to ${doc.details.eventDateTo}`}
              </div>
            </div>

            <div className="text-[11px] text-slate-500">
              Payment Terms:{' '}
              <strong className="text-slate-800">
                {doc.paymentTerms?.paymentMode || 'Direct Bank Transfer / Wire'}
              </strong>
            </div>
          </div>
        </div>

        {/* Itemized Invoice Table */}
        <div className="mt-3 border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-slate-200 text-[10px] font-bold uppercase tracking-normal font-['Outfit']">
                <th className="py-2.5 px-3 w-8 text-center">#</th>
                <th className="py-2.5 px-3">Item / Service Description</th>
                <th className="py-2.5 px-3 text-center w-16">Qty</th>
                <th className="py-2.5 px-3 text-center w-16">Unit</th>
                <th className="py-2.5 px-3 text-right w-24">Unit Rate</th>
                <th className="py-2.5 px-3 text-right w-28">Amount ({currency.symbol})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11px]">
              {selectedItems.map((item, idx) => {
                const itemRate = item.rate || 0;
                const itemQty = item.qty || 1;
                const itemTotal = item.qty && item.rate ? itemQty * itemRate : item.amount || 0;

                return (
                  <tr key={item.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[10px]">{idx + 1}</td>
                    <td className="py-2.5 px-3">
                      <span className="font-semibold text-slate-900">{item.description}</span>
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-700 font-mono">{itemQty}</td>
                    <td className="py-2.5 px-3 text-center text-slate-500 text-[10px] uppercase">
                      {item.unit || 'units'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                      {formatCurrency(itemRate, currency, { showFraction: false })}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold font-mono text-slate-900">
                      {formatCurrency(itemTotal, currency, { showFraction: false })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Financial Summary Calculation Card */}
        <div className="flex justify-between items-start mt-4 gap-6">
          {/* Left: Payment Banking & Offline QR Code */}
          <div className="flex-1 bg-slate-50 border border-slate-200/90 rounded-xl p-3 text-xs">
            <div className="flex items-start justify-between">
              <div className="space-y-1 pr-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-normal block font-['Outfit'] whitespace-nowrap">
                  PAYMENT INSTRUCTIONS & BANK DETAILS:
                </span>
                {doc.studio.bankName && (
                  <p className="text-[11px] text-slate-700">
                    <strong className="text-slate-900">Bank:</strong> {doc.studio.bankName}
                  </p>
                )}
                {doc.studio.accountNumber && (
                  <p className="text-[11px] text-slate-700">
                    <strong className="text-slate-900">A/C No:</strong>{' '}
                    <span className="font-mono">{doc.studio.accountNumber}</span>
                  </p>
                )}
                {doc.studio.ifscCode && (
                  <p className="text-[11px] text-slate-700">
                    <strong className="text-slate-900">IFSC/SWIFT:</strong>{' '}
                    <span className="font-mono">{doc.studio.ifscCode}</span>
                  </p>
                )}
                {doc.studio.accountHolder && (
                  <p className="text-[11px] text-slate-700">
                    <strong className="text-slate-900">Beneficiary:</strong> {doc.studio.accountHolder}
                  </p>
                )}
                {doc.studio.upiId && (
                  <p className="text-[11px] text-emerald-800 font-semibold pt-0.5">
                    UPI ID: <span className="font-mono">{doc.studio.upiId}</span>
                  </p>
                )}
              </div>

              {/* Offline Dynamic QR Code */}
              {qrCodeDataUrl && (
                <div className="shrink-0 flex flex-col items-center bg-white p-1.5 rounded-lg border border-slate-200 shadow-sm">
                  <img src={qrCodeDataUrl} alt="Payment QR" className="w-24 h-24 object-contain" />
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-normal font-['Outfit'] mt-1">
                    Scan to Pay
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Subtotal, Tax & Net Due Totals */}
          <div className="w-72 bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5 text-xs shrink-0">
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

            <div className="border-t border-slate-300 pt-1 flex justify-between font-bold text-sm text-slate-950">
              <span className="font-['Outfit']">Total Amount:</span>
              <span className="font-mono text-amber-950 font-extrabold">{formatCurrency(grandTotal, currency)}</span>
            </div>

            {amountReceived > 0 && (
              <div className="flex justify-between text-emerald-800 text-[11px] pt-0.5">
                <span>Amount Paid:</span>
                <span className="font-mono font-bold">{formatCurrency(amountReceived, currency)}</span>
              </div>
            )}

            <div className="border-t-2 border-slate-900 pt-1.5 flex justify-between font-extrabold text-sm text-red-700 bg-red-50/80 -mx-1 px-1 rounded">
              <span className="font-['Outfit'] uppercase tracking-normal">Balance Due:</span>
              <span className="font-mono">{formatCurrency(balanceDue, currency)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Legal & Signatory */}
      <div>
        <div className="border-t border-slate-200 pt-3 grid grid-cols-2 gap-6 text-[10px] text-slate-500">
          <div>
            <p className="font-bold text-slate-700 uppercase tracking-normal mb-0.5 font-['Outfit'] whitespace-nowrap">
              Terms & Payment Conditions:
            </p>
            <p>1. Please quote Invoice Number on all bank transfer remittances.</p>
            <p>2. Interest @ 1.5% per month will be charged on overdue payments.</p>
            <p>3. This is a computer-generated commercial invoice.</p>
          </div>

          <div className="text-right flex flex-col items-end justify-end">
            <div className="h-10 flex items-end pb-1">
              {doc.signatory?.signatureDataUrl ? (
                <img src={doc.signatory.signatureDataUrl} alt="Signature" className="max-h-9 object-contain" />
              ) : (
                <span className="font-mono text-slate-400 italic text-[11px]">
                  {doc.signatory?.signerName || 'Authorized Signatory'}
                </span>
              )}
            </div>
            <div className="border-t border-slate-400 pt-0.5 w-44 text-center font-bold text-slate-800 text-[10px]">
              For {doc.studio.name}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

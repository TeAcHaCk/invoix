import React from 'react';
import type { QuotationDocument } from '../types';
import { formatCurrency } from '../utils/formatters';
import { ShieldCheck, CheckCircle2, AlertCircle, Clock, QrCode } from 'lucide-react';

interface FormalInvoiceViewProps {
  document: QuotationDocument;
}

export const FormalInvoiceView: React.FC<FormalInvoiceViewProps> = ({ document: doc }) => {
  const logoWidth = doc.studio.logoWidth || 320;
  const logoHeight = doc.studio.logoHeight || 130;

  // Financial Calculations
  const subtotal = doc.pricingItems.reduce((sum, item) => {
    const itemTotal = item.qty && item.rate ? item.qty * item.rate : item.amount || 0;
    return sum + itemTotal;
  }, 0) || doc.totalInvestment || 0;

  const discountAmount = doc.discount || 0;
  const taxableAmount = Math.max(0, subtotal - discountAmount);

  let taxAmount = 0;
  if (doc.taxType === 'gst' || doc.taxType === 'igst') {
    taxAmount = Math.round((taxableAmount * (doc.taxPercent || 18)) / 100);
  }

  const grandTotal = taxableAmount + taxAmount;
  const amountReceived = doc.invoicePayment?.amountReceived || doc.paymentTerms?.advanceReceived || 0;
  const balanceDue = Math.max(0, grandTotal - amountReceived);

  // Status calculation
  let statusBadge = {
    label: 'PAYMENT DUE',
    color: 'bg-red-50 text-red-700 border-red-200',
    icon: <AlertCircle className="w-3.5 h-3.5 mr-1" />,
  };

  if (amountReceived >= grandTotal && grandTotal > 0) {
    statusBadge = {
      label: 'PAID IN FULL',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-300',
      icon: <CheckCircle2 className="w-3.5 h-3.5 mr-1" />,
    };
  } else if (amountReceived > 0) {
    statusBadge = {
      label: 'PARTIALLY PAID',
      color: 'bg-amber-50 text-amber-800 border-amber-300',
      icon: <Clock className="w-3.5 h-3.5 mr-1" />,
    };
  }

  // QR Code URL for UPI Payment
  const upiId = doc.studio.upiId || '8970511524@upi';
  const payAmount = balanceDue > 0 ? balanceDue : grandTotal;
  const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
    doc.studio.name || 'FUSION BELLS FILMS'
  )}&am=${payAmount}&cu=INR&tn=${encodeURIComponent(doc.details.invoiceNo || 'Invoice Payment')}`;
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
    upiUrl
  )}&margin=4`;

  return (
    <div className="relative w-full h-full bg-white text-slate-900 font-['Plus_Jakarta_Sans',sans-serif] text-left p-8 sm:p-10 flex flex-col justify-between select-text">
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5">
          {/* Studio Brand */}
          <div className="space-y-1">
            {doc.studio.logoUrl ? (
              <img
                src={doc.studio.logoUrl}
                alt={doc.studio.name}
                style={{
                  width: `${Math.min(logoWidth, 360)}px`,
                  maxHeight: `${Math.min(logoHeight, 140)}px`,
                  objectFit: 'contain',
                }}
                className="mb-1.5"
              />
            ) : (
              <h1 className="text-2xl font-bold tracking-tight text-slate-950 font-['Outfit']">
                {doc.studio.name}
              </h1>
            )}
            <p className="text-[11px] tracking-[0.18em] text-slate-600 uppercase font-semibold">
              {doc.studio.tagline}
            </p>
            <div className="text-[11px] text-slate-500 space-y-0.5 pt-1">
              <p>{doc.studio.address}</p>
              <p>Ph: {doc.studio.phoneNumbers} • {doc.studio.email}</p>
              {doc.studio.gstin && (
                <p className="font-semibold text-slate-700">GSTIN: {doc.studio.gstin}</p>
              )}
            </div>
          </div>

          {/* Invoice Badge & Meta */}
          <div className="text-right flex flex-col items-end">
            <div className="text-2xl font-extrabold text-slate-900 tracking-wider font-['Outfit'] uppercase">
              TAX INVOICE
            </div>
            <div
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border mt-2 ${statusBadge.color}`}
            >
              {statusBadge.icon}
              <span>{statusBadge.label}</span>
            </div>

            <div className="mt-3 text-xs space-y-1 text-slate-700 font-medium">
              <div>
                <span className="text-slate-500">Invoice No: </span>
                <span className="font-bold text-slate-900">{doc.details.invoiceNo || 'INV-2026-001'}</span>
              </div>
              <div>
                <span className="text-slate-500">Invoice Date: </span>
                <span className="font-bold text-slate-900">{doc.details.invoiceDate || '—'}</span>
              </div>
              {doc.details.dueDate && (
                <div>
                  <span className="text-slate-500">Due Date: </span>
                  <span className="font-bold text-slate-900">{doc.details.dueDate}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bill To / Bill From Section */}
        <div className="grid grid-cols-2 gap-8 my-5 p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
          <div>
            <div className="text-[11px] font-bold text-amber-700 tracking-wider uppercase mb-1.5 font-['Outfit']">
              BILLED TO (CLIENT)
            </div>
            <div className="space-y-1">
              <div className="font-bold text-sm text-slate-900">
                {doc.client.nameOfEvent || doc.client.clientName || 'Client / Event Name'}
              </div>
              {doc.client.clientName && doc.client.nameOfEvent && (
                <div className="text-slate-700 font-medium">Contact: {doc.client.clientName}</div>
              )}
              {doc.client.address && (
                <div className="text-slate-600 leading-snug">{doc.client.address}</div>
              )}
              {doc.client.contactNo && (
                <div className="text-slate-700 font-medium">Phone: {doc.client.contactNo}</div>
              )}
              {doc.client.email && (
                <div className="text-slate-600">{doc.client.email}</div>
              )}
            </div>
          </div>

          <div className="border-l border-slate-200 pl-6">
            <div className="text-[11px] font-bold text-slate-500 tracking-wider uppercase mb-1.5 font-['Outfit']">
              EVENT & PAYMENT DETAILS
            </div>
            <div className="space-y-1 text-slate-700">
              <div>
                <span className="text-slate-500">Event Date: </span>
                <span className="font-semibold text-slate-900">
                  {doc.details.eventDateMode === 'range'
                    ? `${doc.details.eventDateFrom || ''} – ${doc.details.eventDateTo || ''}`
                    : doc.details.eventDate || '—'}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Payment Mode: </span>
                <span className="font-semibold text-slate-900">
                  {doc.invoicePayment?.paymentMode || doc.paymentTerms?.paymentMode || 'UPI / Bank Transfer'}
                </span>
              </div>
              {doc.invoicePayment?.transactionRef && (
                <div>
                  <span className="text-slate-500">Ref / Txn ID: </span>
                  <span className="font-mono text-slate-900 font-medium">
                    {doc.invoicePayment.transactionRef}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Itemized Financial Table */}
        <div className="my-4">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-900 text-white font-['Outfit'] uppercase text-[11px] tracking-wider">
                <th className="py-2.5 px-3 rounded-l-md w-10 text-center">#</th>
                <th className="py-2.5 px-3">Service / Item Description</th>
                <th className="py-2.5 px-3 text-center w-16">Qty</th>
                <th className="py-2.5 px-3 text-right w-28">Rate</th>
                <th className="py-2.5 px-3 rounded-r-md text-right w-28">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {doc.pricingItems.map((item, index) => {
                const itemQty = item.qty || 1;
                const itemRate = item.rate || item.amount || 0;
                const totalItemAmount = item.qty && item.rate ? item.qty * item.rate : item.amount || 0;
                return (
                  <tr key={item.id} className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-3 text-center text-slate-500 font-mono">{index + 1}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-900">{item.description}</td>
                    <td className="py-2.5 px-3 text-center text-slate-700">{itemQty}</td>
                    <td className="py-2.5 px-3 text-right text-slate-700">{formatCurrency(itemRate)}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                      {formatCurrency(totalItemAmount)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Financial Summary & Calculations */}
        <div className="flex justify-end my-3">
          <div className="w-72 space-y-1.5 text-xs text-slate-700">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Subtotal</span>
              <span className="font-semibold text-slate-900">{formatCurrency(subtotal)}</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between py-1 border-b border-slate-100 text-emerald-700">
                <span>Discount</span>
                <span className="font-semibold">- {formatCurrency(discountAmount)}</span>
              </div>
            )}

            {doc.taxType === 'gst' && (
              <>
                <div className="flex justify-between py-0.5 text-slate-500 text-[11px]">
                  <span>CGST (9%)</span>
                  <span>{formatCurrency(Math.round(taxAmount / 2))}</span>
                </div>
                <div className="flex justify-between py-0.5 text-slate-500 text-[11px] border-b border-slate-100 pb-1">
                  <span>SGST (9%)</span>
                  <span>{formatCurrency(Math.round(taxAmount / 2))}</span>
                </div>
              </>
            )}

            {doc.taxType === 'igst' && (
              <div className="flex justify-between py-1 border-b border-slate-100 text-slate-500">
                <span>IGST ({doc.taxPercent || 18}%)</span>
                <span>{formatCurrency(taxAmount)}</span>
              </div>
            )}

            <div className="flex justify-between py-2 border-t-2 border-slate-900 text-sm font-bold text-slate-950 font-['Outfit']">
              <span>GRAND TOTAL</span>
              <span>{formatCurrency(grandTotal)}</span>
            </div>

            {/* Amount Received & Net Balance Due */}
            <div className="bg-slate-100/90 rounded-lg p-2.5 space-y-1 border border-slate-200/80 mt-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-600">Amount Received:</span>
                <span className="font-bold text-emerald-700">{formatCurrency(amountReceived)}</span>
              </div>
              <div className="flex justify-between text-xs pt-1 border-t border-slate-200">
                <span className="font-bold text-slate-900 uppercase">Balance Due:</span>
                <span className="font-extrabold text-sm text-amber-800">
                  {formatCurrency(balanceDue)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bank Transfer & UPI Scan-to-Pay Section */}
        <div className="grid grid-cols-3 gap-4 my-4 p-4 rounded-xl border border-amber-500/30 bg-amber-50/40 text-xs">
          {/* Bank Details */}
          <div className="col-span-2 space-y-1">
            <div className="flex items-center space-x-1.5 text-amber-900 font-bold tracking-wide uppercase font-['Outfit'] mb-1">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              <span>Studio Bank Transfer Details</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-slate-800 text-[11.5px]">
              <div>
                <span className="text-slate-500 block">Bank Name:</span>
                <span className="font-bold text-slate-950">{doc.studio.bankName || 'HDFC Bank'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Account Holder:</span>
                <span className="font-bold text-slate-950">{doc.studio.accountHolder || doc.studio.name}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Account Number:</span>
                <span className="font-mono font-bold text-slate-950">
                  {doc.studio.accountNumber || '50200088991122'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">IFSC Code:</span>
                <span className="font-mono font-bold text-slate-950">
                  {doc.studio.ifscCode || 'HDFC0001234'}
                </span>
              </div>
              <div className="col-span-2 pt-1 border-t border-amber-200/60 flex items-center justify-between">
                <span className="text-slate-600">UPI ID: <strong className="text-slate-950 font-mono">{upiId}</strong></span>
              </div>
            </div>
          </div>

          {/* UPI QR Code */}
          <div className="flex flex-col items-center justify-center border-l border-amber-200/80 pl-3">
            <div className="text-[10px] font-bold text-amber-900 uppercase tracking-wider mb-1 flex items-center">
              <QrCode className="w-3 h-3 mr-1 text-amber-700" />
              <span>Scan & Pay UPI</span>
            </div>
            <img
              src={qrCodeImageUrl}
              alt="Scan to Pay UPI"
              className="w-20 h-20 rounded-lg border border-amber-300 shadow-sm bg-white p-0.5"
            />
            <span className="text-[9.5px] font-semibold text-slate-600 mt-1">
              GPay • PhonePe • Paytm
            </span>
          </div>
        </div>
      </div>

      {/* Invoice Footer & Signature */}
      <div className="border-t border-slate-200 pt-4 flex items-end justify-between text-xs text-slate-500">
        <div className="max-w-md space-y-1">
          <p className="font-semibold text-slate-700">Thank you for your business!</p>
          <p className="text-[10.5px] text-slate-500 leading-snug">
            {doc.footerNote || 'All payments are subject to the studio terms and conditions.'}
          </p>
        </div>

        <div className="text-right flex flex-col items-center">
          <div className="h-10 border-b border-slate-400 w-36 mb-1"></div>
          <span className="text-[10.5px] font-bold text-slate-800 uppercase tracking-wider font-['Outfit']">
            Authorized Signature
          </span>
          <span className="text-[9.5px] text-slate-500">{doc.studio.name}</span>
        </div>
      </div>
    </div>
  );
};

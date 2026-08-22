import React, { useState, useEffect, useRef } from 'react';
import type { QuotationDocument, SignatoryRecord } from '../types';
import {
  fetchPublicDocument,
  recordDocumentView,
  approveDocumentPublicly,
} from '../services/documentService';
import { formatCurrency } from '../utils/formatters';
import { exportDocumentToPdf } from '../utils/pdfGenerator';
import { InvoiceDocumentView } from './InvoiceDocumentView';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Download,
  Check,
  RotateCcw,
  PenTool,
  FileCheck,
  Layers,
  Loader2,
  AlertCircle,
  Eye,
} from 'lucide-react';

interface PublicProposalPageProps {
  documentId: string;
}

export const PublicProposalPage: React.FC<PublicProposalPageProps> = ({ documentId }) => {
  const [document, setDocument] = useState<QuotationDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signerName, setSignerName] = useState('');
  const [isApproved, setIsApproved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const loadDocument = async () => {
      setIsLoading(true);
      setError(null);

      const { doc, error: fetchErr } = await fetchPublicDocument(documentId);

      if (fetchErr || !doc) {
        setError(fetchErr || 'Document could not be found.');
      } else {
        setDocument(doc);
        setSignerName(doc.client.clientName || '');
        setIsApproved(Boolean(doc.signatory?.clientSignedName));
        // Record client view audit in background
        recordDocumentView(documentId);
      }
      setIsLoading(false);
    };

    if (documentId) {
      loadDocument();
    }
  }, [documentId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center font-['Plus_Jakarta_Sans',sans-serif]">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin mb-3" />
        <p className="text-sm font-semibold text-slate-300">Loading Secure Proposal...</p>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 font-['Plus_Jakarta_Sans',sans-serif]">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-3 shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-100 font-['Outfit']">Proposal Link Not Found</h2>
          <p className="text-xs text-slate-400">{error || 'This proposal may have expired or been removed.'}</p>
          <a
            href="/"
            className="inline-block px-4 py-2 bg-amber-500 text-slate-950 text-xs font-bold rounded-xl shadow mt-2"
          >
            Go to Homepage
          </a>
        </div>
      </div>
    );
  }

  const currency = document.currency;

  const toggleOptionalItem = (itemId: string) => {
    if (isApproved) return; // Prevent changing after sign-off

    const updatedPricing = document.pricingItems.map((item) => {
      if (item.id === itemId) {
        return { ...item, selected: !item.selected };
      }
      return item;
    });

    const activeTotal = updatedPricing
      .filter((i) => !i.isOptional || i.selected)
      .reduce((sum, item) => sum + (item.qty && item.rate ? item.qty * item.rate : item.amount || 0), 0);

    setDocument({
      ...document,
      pricingItems: updatedPricing,
      totalInvestment: activeTotal,
    });
  };

  // Canvas Drawing
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (isApproved) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || isApproved) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0f172a';
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    if (isApproved) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Calculations
  const selectedItems = document.pricingItems.filter((i) => !i.isOptional || i.selected);
  const subtotal =
    selectedItems.reduce((sum, item) => {
      const itemTotal = item.qty && item.rate ? item.qty * item.rate : item.amount || 0;
      return sum + itemTotal;
    }, 0) || document.totalInvestment || 0;

  const discountAmount = document.discount || 0;
  const taxableAmount = Math.max(0, subtotal - discountAmount);

  let taxAmount = 0;
  if (document.taxConfig?.type && document.taxConfig.type !== 'none') {
    taxAmount = Math.round((taxableAmount * (document.taxConfig.percent || 0)) / 100);
  } else if (document.taxType && document.taxType !== 'none') {
    taxAmount = Math.round((taxableAmount * (document.taxPercent || 0)) / 100);
  }

  const grandTotal = taxableAmount + taxAmount;
  const advanceAmount = Math.round((grandTotal * (document.paymentTerms?.advancePercent || 30)) / 100);

  const handleApprove = async () => {
    if (!signerName.trim()) {
      alert('Please enter your full legal name to approve.');
      return;
    }

    setIsSubmitting(true);
    let signatureUrl = '';
    if (canvasRef.current) {
      signatureUrl = canvasRef.current.toDataURL('image/png');
    }

    const signatoryData: SignatoryRecord = {
      ...document.signatory,
      clientSignedName: signerName.trim(),
      clientSignedDate: new Date().toLocaleDateString('en-GB'),
      clientSignatureDataUrl: signatureUrl || undefined,
    };

    const success = await approveDocumentPublicly(
      documentId,
      signatoryData,
      document.pricingItems,
      grandTotal,
      document.client.email
    );

    setIsSubmitting(false);

    if (success) {
      setIsApproved(true);
      setDocument({
        ...document,
        status: 'APPROVED',
        approvedAt: new Date().toISOString(),
        signatory: signatoryData,
      });
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
      });
    }
  };

  const handleDownloadPdf = async () => {
    setIsExporting(true);
    const clientSlug = (document.client.clientName || document.client.nameOfEvent || 'Proposal').replace(
      /[^a-zA-Z0-9]/g,
      '_'
    );
    const fileName = `${document.type}_${clientSlug}_${document.details.invoiceNo}.pdf`;
    await exportDocumentToPdf('quotation-invoice-canvas', fileName);
    setIsExporting(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-['Plus_Jakarta_Sans',sans-serif] flex flex-col">
      {/* Top Client Portal Bar */}
      <header className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-40 px-4 sm:px-8 py-3.5 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {document.studio.logoUrl ? (
              <img src={document.studio.logoUrl} alt="Logo" className="h-8 max-w-[140px] object-contain" />
            ) : (
              <h1 className="text-base font-bold text-slate-100 font-['Outfit']">{document.studio.name}</h1>
            )}
            <span className="hidden sm:inline-block text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-bold uppercase">
              Official Proposal
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center space-x-1.5 transition-all disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting ? 'Generating...' : 'Download PDF'}</span>
            </button>

            {isApproved ? (
              <span className="px-3.5 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold rounded-xl flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Proposal Approved</span>
              </span>
            ) : (
              <a
                href="#approval-section"
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-amber-500/20 flex items-center space-x-1.5 transition-all"
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>Review & Sign</span>
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-8 space-y-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-amber-500/30 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xl">
          <div>
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest font-['Outfit'] block">
              Commercial Proposal & Estimate
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-100 font-['Outfit'] mt-1">
              {document.packageBannerTitle || document.client.nameOfEvent}
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Prepared for <strong className="text-slate-100">{document.client.clientName || 'Your Business'}</strong> by{' '}
              <strong className="text-amber-300">{document.studio.name}</strong>
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs text-slate-400 block font-mono">Ref: {document.details.invoiceNo}</span>
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md inline-block mt-1">
              {isApproved ? '✓ Proposal Signed & Approved' : 'Awaiting Your Approval'}
            </span>
          </div>
        </div>

        {/* Interactive Add-on Selection Block */}
        <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-100 font-['Outfit'] flex items-center space-x-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>Scope of Services & Optional Add-ons</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {isApproved
                  ? 'All services and deliverables finalized under this approved agreement.'
                  : 'Customize your package by selecting or deselecting optional add-ons below.'}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-semibold font-['Outfit'] block">
                Total Investment
              </span>
              <strong className="text-lg font-mono text-amber-300 font-extrabold">
                {formatCurrency(grandTotal, currency)}
              </strong>
            </div>
          </div>

          <div className="space-y-2.5">
            {document.pricingItems.map((item) => {
              const itemTotal = item.qty && item.rate ? item.qty * item.rate : item.amount || 0;
              const isChecked = !item.isOptional || item.selected;

              return (
                <div
                  key={item.id}
                  onClick={() => item.isOptional && toggleOptionalItem(item.id)}
                  className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                    item.isOptional && !isApproved ? 'cursor-pointer hover:border-amber-500/50' : ''
                  } ${
                    isChecked
                      ? 'bg-slate-950/80 border-slate-700/80'
                      : 'bg-slate-950/40 border-slate-800/40 opacity-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {item.isOptional ? (
                      <div
                        className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                          item.selected
                            ? 'bg-amber-500 border-amber-400 text-slate-950'
                            : 'border-slate-600 bg-slate-800'
                        }`}
                      >
                        {item.selected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">
                        ✓
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-semibold text-slate-200 flex items-center space-x-2">
                        <span>{item.description}</span>
                        {item.isOptional && (
                          <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded uppercase font-bold font-['Outfit']">
                            Optional Add-on
                          </span>
                        )}
                      </p>
                      {item.qty && item.rate ? (
                        <p className="text-[11px] text-slate-400 font-mono">
                          {item.qty} {item.unit || 'units'} × {formatCurrency(item.rate, currency)}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-bold font-mono text-slate-100">
                      {formatCurrency(itemTotal, currency)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Investment Breakdown Summary */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold font-['Outfit'] block">
                Subtotal
              </span>
              <strong className="text-sm font-mono text-slate-200">{formatCurrency(subtotal, currency)}</strong>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold font-['Outfit'] block">
                {document.taxConfig?.label || 'Tax'} ({document.taxConfig?.percent || document.taxPercent}%)
              </span>
              <strong className="text-sm font-mono text-slate-200">{formatCurrency(taxAmount, currency)}</strong>
            </div>

            <div>
              <span className="text-[10px] text-amber-400 uppercase font-bold font-['Outfit'] block">
                Total Amount
              </span>
              <strong className="text-base font-mono text-amber-300 font-extrabold">
                {formatCurrency(grandTotal, currency)}
              </strong>
            </div>

            <div>
              <span className="text-[10px] text-emerald-400 uppercase font-bold font-['Outfit'] block">
                {document.paymentTerms?.advancePercent || 30}% Booking Deposit
              </span>
              <strong className="text-sm font-mono text-emerald-300 font-bold">
                {formatCurrency(advanceAmount, currency)}
              </strong>
            </div>
          </div>
        </section>

        {/* Live A4 Document Canvas Preview */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100 font-['Outfit'] flex items-center space-x-2">
              <Eye className="w-4 h-4 text-amber-400" />
              <span>Full Proposal Document Preview</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">A4 Print Ready</span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-8 flex justify-center overflow-x-auto shadow-2xl">
            <InvoiceDocumentView document={document} elementId="quotation-invoice-canvas" zoomScale={0.92} />
          </div>
        </section>

        {/* E-Signature & Approval Sign-off Block */}
        <section id="approval-section" className="bg-slate-900 border border-amber-500/30 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
                <PenTool className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100 font-['Outfit']">
                  Digital Signature & Commercial Acceptance
                </h3>
                <p className="text-xs text-slate-400">
                  {isApproved
                    ? 'This proposal has been approved and legally executed.'
                    : 'Sign below to accept this proposal and lock in your project schedule.'}
                </p>
              </div>
            </div>

            {isApproved && (
              <span className="text-xs font-bold text-emerald-400 flex items-center space-x-1.5 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
                <CheckCircle2 className="w-4 h-4" />
                <span>Legally Signed</span>
              </span>
            )}
          </div>

          {isApproved ? (
            <div className="bg-slate-950 border border-emerald-500/30 rounded-xl p-5 space-y-3">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>Proposal Approved by {document.signatory?.clientSignedName}</span>
              </div>
              <p className="text-xs text-slate-300">
                Signed on: <strong>{document.signatory?.clientSignedDate}</strong>
              </p>
              {document.signatory?.clientSignatureDataUrl && (
                <div className="bg-white p-2 rounded-lg border border-slate-700 inline-block">
                  <img
                    src={document.signatory.clientSignatureDataUrl}
                    alt="Digital Signature"
                    className="max-h-14 object-contain"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Authorized Signatory / Legal Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sarah Jenkins"
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                    By signing, you acknowledge and accept all specifications, deliverables, and payment terms outlined in this proposal.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Draw Signature on Screen:
                    </label>
                    <button
                      type="button"
                      onClick={clearCanvas}
                      className="text-[11px] text-slate-400 hover:text-amber-300 flex items-center space-x-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Clear</span>
                    </button>
                  </div>
                  <div className="bg-white rounded-xl p-1.5 border border-slate-700">
                    <canvas
                      ref={canvasRef}
                      width={400}
                      height={100}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      className="w-full h-24 bg-white rounded-lg cursor-crosshair touch-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-xl shadow-emerald-600/30 flex items-center space-x-2 transition-all disabled:opacity-50 text-sm"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <FileCheck className="w-4 h-4 stroke-[2.5]" />
                      <span>Accept & Legally Approve Proposal</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/60 p-6 text-center text-xs text-slate-500">
        <p>
          {document.studio.name} • {document.studio.phoneNumbers} • {document.studio.email}
        </p>
        <p className="text-[11px] text-slate-600 mt-1">
          Powered by Universal Proposal & Invoicing Platform
        </p>
      </footer>
    </div>
  );
};

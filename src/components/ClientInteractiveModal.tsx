import React, { useState, useRef, useEffect } from 'react';
import type { QuotationDocument } from '../types';
import { formatCurrency } from '../utils/formatters';
import confetti from 'canvas-confetti';
import {
  X,
  CheckCircle2,
  Sparkles,
  Layers,
  PenTool,
  RotateCcw,
  Check,
  FileCheck,
} from 'lucide-react';

interface ClientInteractiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: QuotationDocument;
  onApprove: (updatedDoc: QuotationDocument) => void;
}

export const ClientInteractiveModal: React.FC<ClientInteractiveModalProps> = ({
  isOpen,
  onClose,
  document: initialDoc,
  onApprove,
}) => {
  const [doc, setDoc] = useState<QuotationDocument>(initialDoc);
  const [signerName, setSignerName] = useState(initialDoc.client.clientName || '');
  const [isSigned, setIsSigned] = useState(Boolean(initialDoc.signatory?.clientSignedName));
  const [isDrawing, setIsDrawing] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const prevDocIdRef = useRef(initialDoc.id);

  // Sync state when initialDoc changes to a different document
  useEffect(() => {
    if (prevDocIdRef.current !== initialDoc.id) {
      prevDocIdRef.current = initialDoc.id;
      setDoc(initialDoc);
      setSignerName(initialDoc.client.clientName || '');
      setIsSigned(Boolean(initialDoc.signatory?.clientSignedName));
    }
  }, [initialDoc]);

  if (!isOpen) return null;

  const currency = doc.currency;

  const toggleOptionalItem = (itemId: string) => {
    const updatedPricing = doc.pricingItems.map((item) => {
      if (item.id === itemId) {
        return { ...item, selected: !item.selected };
      }
      return item;
    });

    const activeTotal = updatedPricing
      .filter((i) => !i.isOptional || i.selected)
      .reduce((sum, item) => sum + (item.qty && item.rate ? item.qty * item.rate : item.amount || 0), 0);

    setDoc({
      ...doc,
      pricingItems: updatedPricing,
      totalInvestment: activeTotal,
    });
  };

  // Canvas Drawing
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
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
    if (!isDrawing) return;
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
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Final Calculations
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
  const advanceAmount = Math.round((grandTotal * (doc.paymentTerms?.advancePercent || 30)) / 100);

  const handleApproveProposal = () => {
    let signatureUrl = '';
    if (canvasRef.current) {
      signatureUrl = canvasRef.current.toDataURL('image/png');
    }

    const now = new Date();
    const finalSigner = signerName.trim() || doc.client.clientName || 'Client Authorized';
    const selectedAddons = doc.pricingItems
      .filter((i) => i.isOptional && i.selected)
      .map((i) => i.description);

    const approvedDoc: QuotationDocument = {
      ...doc,
      status: 'APPROVED',
      approvedAt: now.toISOString(),
      acceptanceAudit: {
        signatoryName: finalSigner,
        signatoryEmail: doc.client.email || '',
        signedAt: now.toISOString(),
        formattedDate: now.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        signatureDataUrl: signatureUrl || undefined,
        selectedAddonIds: selectedAddons,
        acceptedTotalInvestment: grandTotal,
        userAgent: navigator.userAgent,
      },
      signatory: {
        ...doc.signatory,
        clientSignedName: finalSigner,
        clientSignedDate: now.toLocaleDateString('en-GB'),
        clientSignatureDataUrl: signatureUrl || undefined,
      },
    };

    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
    });

    onApprove(approvedDoc);
    setIsSigned(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100 font-['Plus_Jakarta_Sans',sans-serif]">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 font-['Outfit']">
                Client Interactive Proposal & E-Sign Portal
              </h2>
              <p className="text-[11px] text-slate-400">
                Preview what your client experiences when viewing this proposal online
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Studio Banner & Client Welcome */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/30 border border-amber-500/30 rounded-xl p-5 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest font-['Outfit'] block">
                Official Commercial Proposal
              </span>
              <h1 className="text-xl font-bold text-slate-100 font-['Outfit'] mt-0.5">
                {doc.packageBannerTitle || doc.client.nameOfEvent}
              </h1>
              <p className="text-xs text-slate-300 mt-1">
                Prepared by <strong className="text-amber-300">{doc.studio.name}</strong> for{' '}
                <strong className="text-slate-100">{doc.client.clientName || 'Your Business'}</strong>
              </p>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 block font-mono">Ref: {doc.details.invoiceNo}</span>
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md inline-block mt-1">
                Active & Awaiting Approval
              </span>
            </div>
          </div>

          {/* Interactive Line Items & Optional Add-ons */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider font-['Outfit'] flex items-center space-x-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>Scope & Optional Service Add-ons</span>
              </h3>
              <span className="text-[11px] text-slate-400">Tick to include add-ons into your investment</span>
            </div>

            <div className="space-y-2">
              {doc.pricingItems.map((item) => {
                const itemTotal = item.qty && item.rate ? item.qty * item.rate : item.amount || 0;
                const isChecked = !item.isOptional || item.selected;

                return (
                  <div
                    key={item.id}
                    onClick={() => item.isOptional && toggleOptionalItem(item.id)}
                    className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                      item.isOptional ? 'cursor-pointer hover:border-amber-500/50' : ''
                    } ${
                      isChecked
                        ? 'bg-slate-800/80 border-slate-700'
                        : 'bg-slate-900/50 border-slate-800/60 opacity-60'
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
                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">
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
                      <span className="text-sm font-bold font-mono text-amber-300">
                        {formatCurrency(itemTotal, currency)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Investment & Payment Summary */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold font-['Outfit'] block">
                Subtotal
              </span>
              <strong className="text-sm font-mono text-slate-200">{formatCurrency(subtotal, currency)}</strong>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold font-['Outfit'] block">
                {doc.taxConfig?.label || 'Tax'} ({doc.taxConfig?.percent || doc.taxPercent}%)
              </span>
              <strong className="text-sm font-mono text-slate-200">{formatCurrency(taxAmount, currency)}</strong>
            </div>

            <div>
              <span className="text-[10px] text-amber-400 uppercase font-bold font-['Outfit'] block">
                Total Investment
              </span>
              <strong className="text-base font-mono text-amber-300 font-extrabold">
                {formatCurrency(grandTotal, currency)}
              </strong>
            </div>

            <div>
              <span className="text-[10px] text-emerald-400 uppercase font-bold font-['Outfit'] block">
                {doc.paymentTerms?.advancePercent || 30}% Booking Deposit
              </span>
              <strong className="text-sm font-mono text-emerald-300 font-bold">
                {formatCurrency(advanceAmount, currency)}
              </strong>
            </div>
          </div>

          {/* Digital E-Signature Acceptance Pad */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center space-x-2">
                <PenTool className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider font-['Outfit']">
                  Digital Signature & Formal Acceptance
                </h3>
              </div>
              {isSigned && (
                <span className="text-xs font-bold text-emerald-400 flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Digitally Signed</span>
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Full Legal Name / Signatory
                </label>
                <input
                  type="text"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  placeholder="e.g. Jane Doe"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  By clicking approve, you accept all commercial scope, deliverables, and payment terms.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-slate-300">
                    Draw Signature on Screen:
                  </label>
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="text-[10px] text-slate-400 hover:text-amber-300 flex items-center space-x-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                </div>
                <div className="bg-white rounded-lg p-1 border border-slate-700">
                  <canvas
                    ref={canvasRef}
                    width={340}
                    height={90}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-20 bg-white rounded cursor-crosshair touch-none"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all"
              >
                Close Preview
              </button>
              <button
                type="button"
                onClick={handleApproveProposal}
                className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 flex items-center space-x-2 transition-all"
              >
                <FileCheck className="w-4 h-4" />
                <span>Sign & Approve Proposal</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

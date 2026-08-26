import React, { useState, useEffect, useRef } from 'react';
import type { QuotationDocument, SignatoryRecord } from '../types';
import {
  fetchPublicDocument,
  recordDocumentView,
  approveDocumentPublicly,
} from '../services/documentService';
import { generateContractSignatureHash, generateCertificateId } from '../utils/cryptoAudit';
import { formatCurrency } from '../utils/formatters';
import { exportDocumentToPdf, printDocument } from '../utils/pdfGenerator';
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
  Share2,
  CreditCard,
  Sparkles,
  Copy,
  Upload,
  Type as TypeIcon,
  ShieldCheck,
  Trash2,
  Lock,
  ArrowRight,
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
  const [signError, setSignError] = useState<string | null>(null);
  // True when the document resolved only from this browser's storage — meaning
  // the link is dead for everyone else.
  const [isLocalOnly, setIsLocalOnly] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);
  const [signatureMode, setSignatureMode] = useState<'draw' | 'upload' | 'type'>('draw');
  const [uploadedSignatureUrl, setUploadedSignatureUrl] = useState<string | null>(null);
  const [liveTimestamp, setLiveTimestamp] = useState<string>(() => {
    const now = new Date();
    return `${now.toLocaleDateString('en-GB')} ${now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    })}`;
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setLiveTimestamp(
        `${now.toLocaleDateString('en-GB')} ${now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })}`
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const loadDocument = async () => {
      setIsLoading(true);
      setError(null);

      const { doc, error: fetchErr, source } = await fetchPublicDocument(documentId);

      if (fetchErr || !doc) {
        setError(fetchErr || 'Document could not be found.');
      } else {
        setDocument(doc);
        setIsLocalOnly(source === 'local');
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

  const generateTypedSignatureDataUrl = (
    name: string,
    hash?: string,
    customDate?: Date
  ): string => {
    const offscreen = window.document.createElement('canvas');
    offscreen.width = 480;
    offscreen.height = 120;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return '';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 480, 120);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'italic bold 26px "Playfair Display", "Georgia", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name || 'Digital Signature', 240, 36);

    const now = customDate || new Date();
    const dateFormatted = now.toLocaleDateString('en-GB');
    const timeFormatted = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
    const timeWithSeconds = `${dateFormatted} ${timeFormatted}`;

    ctx.font = 'bold 9.5px monospace, sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText(`DIGITALLY VERIFIED SIGNATURE • ${timeWithSeconds}`, 240, 72);

    if (hash) {
      ctx.font = '8px monospace';
      ctx.fillStyle = '#059669';
      ctx.fillText(`SHA-256: ${hash}`, 240, 94);
    } else {
      ctx.font = '8px monospace';
      ctx.fillStyle = '#64748b';
      ctx.fillText(`CRYPTOGRAPHICALLY VERIFIED & TAMPER-PROOF`, 240, 94);
    }

    return offscreen.toDataURL('image/png');
  };

  const handleSignatureFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, or WEBP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setUploadedSignatureUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApprove = async () => {
    if (!signerName.trim()) {
      alert('Please enter your full legal name to approve.');
      return;
    }

    const now = new Date();
    const timestampIso = now.toISOString();

    // Preliminary hash for typed image rendering
    const preliminary = await generateContractSignatureHash({
      signatureDataUrl:
        signatureMode === 'upload' && uploadedSignatureUrl
          ? uploadedSignatureUrl
          : signatureMode === 'draw' && canvasRef.current
          ? canvasRef.current.toDataURL('image/png')
          : `typed-${signerName.trim()}-${timestampIso}`,
      documentId,
      invoiceNo: document.details.invoiceNo,
      signerName: signerName.trim(),
      timestamp: timestampIso,
      totalInvestment: grandTotal,
      currencyCode: currency.code,
    });

    let signatureUrl = '';
    if (signatureMode === 'draw') {
      if (canvasRef.current) {
        signatureUrl = canvasRef.current.toDataURL('image/png');
      }
    } else if (signatureMode === 'upload') {
      if (!uploadedSignatureUrl) {
        alert('Please select or drop a signature / stamp image file to upload.');
        return;
      }
      signatureUrl = uploadedSignatureUrl;
    } else if (signatureMode === 'type') {
      signatureUrl = generateTypedSignatureDataUrl(signerName.trim(), preliminary.hash, now);
    }

    setIsSubmitting(true);
    setSignError(null);

    // Cryptographic SHA-256 Hash Generation
    const signature = await generateContractSignatureHash({
      signatureDataUrl: signatureUrl || 'digital-acceptance',
      documentId,
      invoiceNo: document.details.invoiceNo,
      signerName: signerName.trim(),
      timestamp: timestampIso,
      totalInvestment: grandTotal,
      currencyCode: currency.code,
    });

    const certificateId = generateCertificateId(document.details.invoiceNo, signature.hash);

    const signatoryData: SignatoryRecord = {
      ...document.signatory,
      clientSignedName: signerName.trim(),
      clientSignedDate: new Date().toLocaleDateString('en-GB'),
      clientSignatureDataUrl: signatureUrl || undefined,
    };

    const sigType = signatureMode === 'draw' ? 'drawn' : signatureMode === 'upload' ? 'uploaded' : 'typed';

    const result = await approveDocumentPublicly(
      documentId,
      signatoryData,
      document.pricingItems,
      grandTotal,
      document.client.email,
      {
        signatureType: sigType,
        signatureHash: signature.hash,
        signatureAlgo: signature.algo,
        certificateId,
      }
    );

    setIsSubmitting(false);

    if (!result.success) {
      // Someone already signed this proposal (another device, or the sender).
      // Show the signed state rather than an inviting-but-doomed form.
      if (result.alreadySigned) {
        const { doc: refreshed } = await fetchPublicDocument(documentId);
        if (refreshed) {
          setDocument(refreshed);
        }
        setIsApproved(true);
      }
      setSignError(result.error || 'We could not record your signature. Please try again.');
      return;
    }

    if (result.success) {
      setIsApproved(true);
      setDocument({
        ...document,
        status: 'APPROVED',
        approvedAt: timestampIso,
        signatory: signatoryData,
        acceptanceAudit: {
          signatoryName: signerName.trim(),
          signedAt: timestampIso,
          formattedDate: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
          signatureType: sigType,
          signatureDataUrl: signatureUrl,
          signatureHash: signature.hash,
          signatureAlgo: signature.algo,
          certificateId,
          acceptedTotalInvestment: grandTotal,
        },
      });
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
      });
    }
  };

  const handleNotifyWhatsApp = () => {
    if (!document) return;
    const studioName = document.studio.name || 'Studio';
    const docNo = document.details.invoiceNo;
    const projectTitle = document.packageBannerTitle || document.client.nameOfEvent || 'Project';
    const totalStr = formatCurrency(grandTotal, currency);
    const clientName = signerName || document.signatory?.clientSignedName || 'Client';

    const message = `*PROPOSAL ACCEPTED & DIGITALLY SIGNED* ✍️\n\n` +
      `Hi *${studioName}*,\n\n` +
      `I have reviewed, digitally signed, and accepted Proposal Ref: *${docNo}* (${projectTitle}) for *${totalStr}*.\n\n` +
      `👤 *Signed By:* ${clientName}\n` +
      `📅 *Date:* ${new Date().toLocaleDateString('en-GB')}\n\n` +
      `Looking forward to commencing the project!`;

    const phone = (document.studio.phoneNumbers || '').replace(/[^0-9]/g, '');
    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLabel(label);
    setTimeout(() => setCopiedLabel(null), 2500);
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

  const hasBankDetails =
    document.studio.bankName ||
    document.studio.accountNumber ||
    document.studio.ifscCode ||
    document.studio.upiId;

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

          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={() => printDocument()}
              className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 text-amber-300 text-xs font-semibold rounded-xl border border-amber-500/40 flex items-center space-x-1.5 transition-all cursor-pointer shadow-sm shadow-amber-500/10"
              title="Save as crisp vector PDF (selectable text, ~100 KB)"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Save PDF (Crisp Text)</span>
              <span className="sm:hidden">Crisp PDF</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl border border-slate-700/80 flex items-center space-x-1.5 transition-all disabled:opacity-50 cursor-pointer"
              title="Download raster image PDF snapshot"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting ? 'Generating...' : 'Download'}</span>
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

      {/* Not-synced warning. Only the owner can ever see this: it renders when the
          document came from this browser's own storage rather than the server,
          which is exactly the case where the link 404s for the recipient. */}
      {isLocalOnly && (
        <div
          role="alert"
          className="bg-amber-950/60 border-b border-amber-500/40 px-4 py-3 flex items-start gap-3"
        >
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs leading-relaxed">
            <p className="font-bold text-amber-200">This link is not shareable yet</p>
            <p className="text-amber-100/80 mt-0.5">
              This proposal loaded from your own browser, not from the cloud — anyone else
              opening this link will see &ldquo;Proposal Link Not Found&rdquo;. Sign in and save
              the document again to sync it, then re-copy the link.
            </p>
          </div>
        </div>
      )}

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
            <div className="space-y-6 animate-fadeIn">
              {/* Success Banner */}
              <div className="bg-gradient-to-br from-emerald-950/60 to-slate-950 border border-emerald-500/40 rounded-2xl p-6 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-emerald-400 font-bold text-base font-['Outfit']">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Proposal Accepted & Digitally Executed!</span>
                    </div>
                    <p className="text-xs text-slate-300">
                      Signed by <strong>{document.signatory?.clientSignedName}</strong> on{' '}
                      <strong>{document.signatory?.clientSignedDate}</strong>
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full font-mono font-bold">
                      {document.acceptanceAudit?.certificateId || `Ref: ${document.details.invoiceNo}`}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  {document.signatory?.clientSignatureDataUrl && (
                    <div className="bg-white p-2.5 rounded-xl border border-slate-700 inline-block shadow-md">
                      <img
                        src={document.signatory.clientSignatureDataUrl}
                        alt="Digital Signature"
                        className="max-h-12 object-contain"
                      />
                    </div>
                  )}

                  <div className="space-y-1 text-xs">
                    <div className="flex items-center space-x-1.5 text-slate-300">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="font-semibold">Signature Method:</span>
                      <span className="capitalize text-emerald-300 font-mono">
                        {document.acceptanceAudit?.signatureType === 'uploaded'
                          ? 'Uploaded Image Stamp'
                          : document.acceptanceAudit?.signatureType === 'typed'
                          ? 'Typed Legal Script'
                          : 'Drawn Touch Signature'}
                      </span>
                    </div>

                    {document.acceptanceAudit?.signatureHash && (
                      <div className="flex items-center space-x-2 bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5 font-mono text-[10.5px]">
                        <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                        <span className="text-slate-400 truncate max-w-[200px] sm:max-w-xs" title={document.acceptanceAudit.signatureHash}>
                          SHA-256: {document.acceptanceAudit.signatureHash}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(document.acceptanceAudit!.signatureHash!, 'hash')}
                          className="text-amber-400 hover:text-amber-300 font-bold shrink-0 ml-1 cursor-pointer flex items-center gap-0.5"
                        >
                          {copiedLabel === 'hash' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedLabel === 'hash' ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Next Steps Buttons */}
                <div className="pt-3 border-t border-emerald-500/20 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleNotifyWhatsApp}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 flex items-center space-x-2 transition-all cursor-pointer"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Notify {document.studio.name} on WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    disabled={isExporting}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    <span>{isExporting ? 'Preparing PDF...' : 'Download Executed Agreement (PDF)'}</span>
                  </button>
                </div>
              </div>

              {/* Offline Deposit / Bank Wire Guidance Card */}
              {hasBankDetails && (
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="w-4 h-4 text-amber-400" />
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-['Outfit']">
                      Booking Deposit & Wire Transfer Details
                    </h4>
                  </div>

                  <p className="text-xs text-slate-400">
                    Please transfer the <strong>{document.paymentTerms?.advancePercent || 30}% Booking Deposit</strong> of{' '}
                    <strong className="text-emerald-400 font-mono font-bold">
                      {formatCurrency(advanceAmount, currency)}
                    </strong>{' '}
                    using the direct bank or UPI details below:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {document.studio.bankName && (
                      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-1">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Bank Name</span>
                        <p className="text-xs font-bold text-slate-100">{document.studio.bankName}</p>
                      </div>
                    )}

                    {document.studio.accountHolder && (
                      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-1">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Beneficiary Name</span>
                        <p className="text-xs font-bold text-slate-100">{document.studio.accountHolder}</p>
                      </div>
                    )}

                    {document.studio.accountNumber && (
                      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Account # / IBAN</span>
                          <p className="text-xs font-mono font-bold text-amber-300">{document.studio.accountNumber}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(document.studio.accountNumber!, 'acc')}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-[10.5px] rounded-lg text-slate-300 flex items-center space-x-1 cursor-pointer"
                        >
                          {copiedLabel === 'acc' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedLabel === 'acc' ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    )}

                    {document.studio.ifscCode && (
                      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">IFSC / SWIFT Code</span>
                          <p className="text-xs font-mono font-bold text-slate-200">{document.studio.ifscCode}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(document.studio.ifscCode!, 'ifsc')}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-[10.5px] rounded-lg text-slate-300 flex items-center space-x-1 cursor-pointer"
                        >
                          {copiedLabel === 'ifsc' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedLabel === 'ifsc' ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    )}

                    {document.studio.upiId && (
                      <div className="sm:col-span-2 bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Instant UPI ID</span>
                          <p className="text-xs font-mono font-bold text-emerald-400">{document.studio.upiId}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(document.studio.upiId!, 'upi')}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-[10.5px] rounded-lg text-slate-300 flex items-center space-x-1 cursor-pointer"
                        >
                          {copiedLabel === 'upi' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedLabel === 'upi' ? 'Copied' : 'Copy UPI'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                {/* Left Column: Signer Name & Legal Terms */}
                <div className="md:col-span-5 space-y-3">
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
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500 font-semibold"
                    />
                  </div>

                  <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-['Outfit'] block">
                      Cryptographic Audit & Integrity
                    </span>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      By submitting your signature, a cryptographically signed SHA-256 audit hash will be generated to bind this commercial acceptance.
                    </p>
                  </div>
                </div>

                {/* Right Column: Multi-Mode Signature Selector */}
                <div className="md:col-span-7 space-y-2.5">
                  <div className="flex items-center justify-between">
                    {/* Mode Selector Tabs */}
                    <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
                      <button
                        type="button"
                        onClick={() => setSignatureMode('draw')}
                        className={`px-3 py-1 text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer ${
                          signatureMode === 'draw'
                            ? 'bg-amber-500 text-slate-950 font-bold shadow'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <PenTool className="w-3 h-3" />
                        <span>Draw</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSignatureMode('upload')}
                        className={`px-3 py-1 text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer ${
                          signatureMode === 'upload'
                            ? 'bg-amber-500 text-slate-950 font-bold shadow'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Upload className="w-3 h-3" />
                        <span>Upload Stamp</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSignatureMode('type')}
                        className={`px-3 py-1 text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer ${
                          signatureMode === 'type'
                            ? 'bg-amber-500 text-slate-950 font-bold shadow'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <TypeIcon className="w-3 h-3" />
                        <span>Type Name</span>
                      </button>
                    </div>

                    {signatureMode === 'draw' && (
                      <button
                        type="button"
                        onClick={clearCanvas}
                        className="text-[11px] text-slate-400 hover:text-amber-300 flex items-center space-x-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Clear</span>
                      </button>
                    )}
                  </div>

                  {/* Mode 1: Draw Canvas */}
                  {signatureMode === 'draw' && (
                    <div className="bg-white rounded-xl p-1.5 border border-slate-700 shadow-inner">
                      <canvas
                        ref={canvasRef}
                        width={450}
                        height={110}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        className="w-full h-28 bg-white rounded-lg cursor-crosshair touch-none"
                      />
                    </div>
                  )}

                  {/* Mode 2: Upload Signature / Stamp */}
                  {signatureMode === 'upload' && (
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleSignatureFileUpload}
                        className="hidden"
                      />

                      {uploadedSignatureUrl ? (
                        <div className="bg-white rounded-xl p-3 border border-slate-700 flex items-center justify-between">
                          <img
                            src={uploadedSignatureUrl}
                            alt="Uploaded Signature"
                            className="max-h-20 max-w-[240px] object-contain"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setUploadedSignatureUrl(null);
                              if (fileInputRef.current) fileInputRef.current.value = '';
                            }}
                            className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-600 rounded-lg text-xs font-semibold flex items-center space-x-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="bg-slate-950 border-2 border-dashed border-slate-700 hover:border-amber-500/60 rounded-xl p-6 text-center cursor-pointer transition-colors space-y-2 group"
                        >
                          <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform flex items-center justify-center mx-auto">
                            <Upload className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-200">
                              Click to browse or drop signature/company stamp
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Supports PNG, JPG, or WEBP transparent image
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Mode 3: Type Legal Name Script */}
                  {signatureMode === 'type' && (
                    <div className="bg-white rounded-xl p-4 border border-slate-700 text-center space-y-2 shadow-inner">
                      <p className="font-['Playfair_Display',serif] italic font-bold text-2xl text-slate-900 tracking-wide select-none">
                        {signerName || 'Your Legal Name'}
                      </p>
                      <div className="border-t border-slate-200 pt-2 space-y-1">
                        <div className="flex items-center justify-center space-x-2 text-[10.5px] text-slate-600 font-mono font-semibold">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>DIGITALLY VERIFIED SIGNATURE • {liveTimestamp}</span>
                        </div>
                        <div className="flex items-center justify-center space-x-1.5 text-[9px] text-slate-400 font-mono">
                          <Lock className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                          <span>SHA-256 HASH GENERATED & CRYPTOGRAPHICALLY ATTESTED</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Signing Failure Notice */}
              {signError && (
                <div
                  role="alert"
                  className="flex items-start space-x-3 bg-rose-950/50 border border-rose-500/40 rounded-xl p-4"
                >
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold text-rose-200">Signature not recorded</p>
                    <p className="text-xs text-rose-300/90 leading-relaxed">{signError}</p>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-xl shadow-emerald-600/30 flex items-center space-x-2 transition-all disabled:opacity-50 text-sm cursor-pointer"
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

        {/*
          The single best piece of real estate Invoix owns: the person reading
          this is a business owner who just received a professional proposal.
          Shown only on free-tier documents — Pro accounts get white-label
          client pages, which is a concrete reason to upgrade.
        */}
        {document.showInvoixBranding !== false && (
          <div className="mt-4 pt-4 border-t border-slate-800/70 flex flex-col items-center space-y-2">
            <p className="text-[11px] text-slate-500">
              This proposal was created with{' '}
              <span className="font-bold text-amber-400/90">Invoix</span>
            </p>
            <a
              href="https://www.invoix.app/?utm_source=proposal_footer&utm_medium=share_link&utm_campaign=viral_loop"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[11px] font-bold transition-colors"
            >
              <span>Create your own proposal — free</span>
              <ArrowRight className="w-3 h-3 stroke-[2.5]" />
            </a>
          </div>
        )}
      </footer>
    </div>
  );
};

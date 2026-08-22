import React, { useState } from 'react';
import type { QuotationDocument } from '../types';
import {
  MessageSquare,
  X,
  Copy,
  ExternalLink,
  Check,
  FileDown,
  Share2,
  Phone,
  Send,
  CloudUpload,
  Link,
  Loader2,
  FileText,
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { generatePdfBlob, exportDocumentToPdf } from '../utils/pdfGenerator';
import { uploadPdfToCloud } from '../utils/cloudStorage';

interface WhatsAppShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: QuotationDocument;
}

export const WhatsAppShareModal: React.FC<WhatsAppShareModalProps> = ({
  isOpen,
  onClose,
  document: doc,
}) => {
  const [copied, setCopied] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [isSharingNative, setIsSharingNative] = useState(false);
  const [recipientPhone, setRecipientPhone] = useState(doc.client.contactNo || '');
  const [pdfLink, setPdfLink] = useState<string | null>(null);
  const [customMessage, setCustomMessage] = useState('');
  const [shareMode, setShareMode] = useState<'cloud-pdf' | 'text' | 'native'>('cloud-pdf');

  const eventDates =
    doc.details.eventDateMode === 'single'
      ? doc.details.eventDate
      : `${doc.details.eventDateFrom} to ${doc.details.eventDateTo}`;

  const advanceAmt = Math.round((doc.totalInvestment * doc.paymentTerms.advancePercent) / 100);

  // Clean, universally supported WhatsApp text formatting (no broken encoding or multi-byte glyphs)
  const buildMessage = (onlineLink?: string | null) => {
    let msg = `*${doc.studio.name}*
_${doc.studio.tagline}_

*${doc.type === 'INVOICE' ? 'TAX INVOICE' : 'WEDDING PHOTOGRAPHY QUOTATION'}*
----------------------------------------
*Client / Event Details:*
- *Event Name:* ${doc.client.nameOfEvent}
- *Venue/Address:* ${doc.client.address}
- *Event Date(s):* ${eventDates}
- *${doc.type === 'INVOICE' ? 'Invoice No' : 'Quotation No'}:* ${doc.details.invoiceNo}

*Package:* ${doc.packageBannerTitle}

*Deliverables Included:*
${doc.deliverables
  .filter((d) => d.included)
  .map((d) => `- ${d.text}`)
  .join('\n')}

*Total Investment:* ${formatCurrency(doc.totalInvestment)}
*Advance at Booking (${doc.paymentTerms.advancePercent}%):* ${formatCurrency(advanceAmt)}`;

    if (onlineLink) {
      msg += `\n\n📄 *Download / View Official PDF:*
${onlineLink}`;
    }

    msg += `\n\n*Note:* Booking confirmed upon receipt of advance payment.

Thank you for choosing *${doc.studio.name}*!
*Contact:* ${doc.studio.phoneNumbers}
*Website:* ${doc.studio.website}`;

    return msg;
  };

  React.useEffect(() => {
    if (isOpen) {
      setRecipientPhone(doc.client.contactNo || '');
      setPdfLink(null);
      setCustomMessage(buildMessage(null));
      // Auto-generate cloud PDF link in background
      handleGenerateCloudLink();
    }
  }, [isOpen, doc]);

  const handleGenerateCloudLink = async () => {
    setIsGeneratingLink(true);
    const eventSlug = (doc.client.nameOfEvent || 'Quotation').replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `${doc.type}_${eventSlug}.pdf`;

    try {
      const pdfFile = await generatePdfBlob('quotation-invoice-canvas', fileName);
      if (pdfFile) {
        const link = await uploadPdfToCloud(pdfFile);
        if (link) {
          setPdfLink(link);
          setCustomMessage(buildMessage(link));
        }
      }
    } catch (e) {
      console.error('Failed to generate cloud link', e);
    } finally {
      setIsGeneratingLink(false);
    }
  };

  if (!isOpen) return null;

  const getCleanPhoneNumber = () => {
    const raw = recipientPhone.replace(/[^0-9]/g, '');
    if (raw.length === 10) return `91${raw}`;
    return raw;
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(customMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenWhatsApp = () => {
    const cleanNum = getCleanPhoneNumber();
    const encoded = encodeURIComponent(customMessage);
    const url = cleanNum ? `https://wa.me/${cleanNum}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
  };

  const handleNativeDeviceShare = async () => {
    setIsSharingNative(true);
    const eventSlug = (doc.client.nameOfEvent || 'Quotation').replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `${doc.type}_${eventSlug}.pdf`;

    try {
      const pdfFile = await generatePdfBlob('quotation-invoice-canvas', fileName);
      if (pdfFile && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        await navigator.share({
          files: [pdfFile],
          title: `${doc.studio.name} - ${doc.type}`,
          text: `Official ${doc.type} for ${doc.client.nameOfEvent}.`,
        });
      } else {
        // Fallback: Download file & open chat
        await exportDocumentToPdf('quotation-invoice-canvas', fileName);
        handleOpenWhatsApp();
      }
    } catch (e) {
      console.error('Error sharing native file:', e);
      handleOpenWhatsApp();
    } finally {
      setIsSharingNative(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-green-500/30 rounded-2xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-green-500/20 text-green-400 rounded-lg border border-green-500/30">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-green-100 font-['Outfit']">
                WhatsApp Quotation & PDF Hub
              </h3>
              <p className="text-xs text-slate-400">
                Send instantly with cloud PDF link or direct file attachment.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Share Mode Switcher */}
        <div className="p-3 bg-slate-950/40 border-b border-slate-800 flex gap-2">
          <button
            type="button"
            onClick={() => setShareMode('cloud-pdf')}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
              shareMode === 'cloud-pdf'
                ? 'bg-green-600 text-white shadow-lg'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <CloudUpload className="w-3.5 h-3.5" />
            <span>PDF Cloud Link (Recommended)</span>
          </button>

          <button
            type="button"
            onClick={() => setShareMode('native')}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
              shareMode === 'native'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-lg'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Direct File Attach</span>
          </button>

          <button
            type="button"
            onClick={() => setShareMode('text')}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1 transition-all ${
              shareMode === 'text'
                ? 'bg-slate-700 text-white shadow-lg'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Text Only</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 text-xs space-y-4">
          {/* Recipient Phone Input */}
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center space-x-2 text-slate-400">
              <Phone className="w-4 h-4 text-green-400" />
              <span className="font-semibold text-slate-300">Client WhatsApp Phone:</span>
            </div>
            <input
              type="text"
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              placeholder="e.g. 9686715683"
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-green-300 font-mono focus:outline-none focus:border-green-500 w-[180px]"
            />
          </div>

          {/* Cloud PDF Link Status Banner */}
          {shareMode === 'cloud-pdf' && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-green-300 flex items-center space-x-1.5 text-xs font-['Outfit']">
                  <Link className="w-3.5 h-3.5 text-green-400" />
                  <span>Official PDF Public Link:</span>
                </span>
                {isGeneratingLink && (
                  <span className="text-[11px] text-amber-400 flex items-center space-x-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Uploading PDF...</span>
                  </span>
                )}
              </div>

              {pdfLink ? (
                <div className="flex items-center space-x-2 bg-slate-950/80 p-2 rounded-lg border border-green-500/20 font-mono text-[11px] text-green-200 truncate">
                  <span className="truncate flex-1">{pdfLink}</span>
                  <a
                    href={pdfLink}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 hover:text-green-400"
                    title="Open Link"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleGenerateCloudLink}
                  disabled={isGeneratingLink}
                  className="px-3 py-1.5 bg-green-600/30 hover:bg-green-600/40 text-green-300 border border-green-500/40 rounded-lg text-xs font-medium flex items-center space-x-1.5"
                >
                  <CloudUpload className="w-3.5 h-3.5" />
                  <span>Generate Link Now</span>
                </button>
              )}
            </div>
          )}

          {/* Mode: Native File Attach Explainer */}
          {shareMode === 'native' && (
            <div className="bg-slate-950/80 border border-amber-500/30 rounded-xl p-4 text-center space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                <FileDown className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-amber-200 uppercase font-['Outfit']">
                Direct PDF File Attachment
              </h4>
              <p className="text-slate-400 text-[11.5px] leading-relaxed">
                Clicking the button below attaches the <strong>PDF file directly</strong> on mobile devices (iPhone/Android). On PC/Mac, it saves the PDF to your Downloads folder and opens WhatsApp with the client.
              </p>
            </div>
          )}

          {/* Editable Message Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-slate-400">
              <label className="font-semibold text-slate-300 text-xs">
                WhatsApp Message (Will be sent with link):
              </label>
              <button
                type="button"
                onClick={() => setCustomMessage(buildMessage(pdfLink))}
                className="text-[11px] text-green-400 hover:underline"
              >
                Reset Text
              </button>
            </div>
            <textarea
              rows={8}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 font-sans text-xs leading-relaxed focus:outline-none focus:border-green-500"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleCopyText}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center space-x-1.5 border border-slate-700 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied!' : 'Copy Message'}</span>
          </button>

          {shareMode === 'native' ? (
            <button
              type="button"
              onClick={handleNativeDeviceShare}
              disabled={isSharingNative}
              className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold rounded-lg shadow-lg flex items-center space-x-2 transition-all active:scale-95 disabled:opacity-50"
            >
              <Share2 className="w-4 h-4" />
              <span>{isSharingNative ? 'Attaching PDF...' : 'Attach & Send PDF'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleOpenWhatsApp}
              className="px-5 py-2 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded-lg shadow-lg flex items-center space-x-2 transition-all active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span>Open in WhatsApp & Send</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

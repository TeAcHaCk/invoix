import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { QuotationDocument } from '../types';
import { useAuth } from '../context/AuthContext';
import { getShareLinkState } from '../services/documentService';
import {
  MessageSquare,
  X,
  Copy,
  Check,
  Send,
  CloudUpload,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { buildPdfFile } from '../services/pdfExportService';
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
  const { user } = useAuth();
  const [recipientPhone, setRecipientPhone] = useState(doc.client.contactNo || '');
  const [customMessage, setCustomMessage] = useState('');
  const [pdfLink, setPdfLink] = useState<string | null>(null);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [copied, setCopied] = useState(false);

  const currency = doc.currency;
  const shareState = getShareLinkState(doc, user?.id);
  const eventDates =
    doc.details.eventDateMode === 'single'
      ? doc.details.eventDate
      : `${doc.details.eventDateFrom} to ${doc.details.eventDateTo}`;

  const advanceAmt = Math.round(
    (doc.totalInvestment * (doc.paymentTerms?.advancePercent || 30)) / 100
  );

  const buildMessage = useCallback(
    (onlineLink?: string | null) => {
      // No `|| doc.id` fallback: ids are no longer accepted as link keys, so a
      // link built from one would 404. getShareLinkState already gates on sync.
      const publicLink = shareState.url || '';

      let msg = `*${doc.studio.name}*
_${doc.studio.tagline}_

*${doc.type === 'INVOICE' ? 'COMMERCIAL TAX INVOICE' : 'OFFICIAL COMMERCIAL PROPOSAL'}*
----------------------------------------
*Client & Project Details:*
- *Project / Client:* ${doc.client.clientName || doc.client.nameOfEvent}
- *Address / Location:* ${doc.client.address}
- *Date(s):* ${eventDates}
- *Reference No:* ${doc.details.invoiceNo}

*Scope / Package:* ${doc.packageBannerTitle || doc.client.nameOfEvent}

*Key Deliverables:*
${doc.deliverables
  .filter((d) => d.included)
  .slice(0, 5)
  .map((d) => `- ${d.text}`)
  .join('\n')}

*Total Investment:* ${formatCurrency(doc.totalInvestment, currency)}
*Advance Deposit (${doc.paymentTerms?.advancePercent || 30}%):* ${formatCurrency(advanceAmt, currency)}

🔗 *View & E-Sign Interactive Proposal Online:*
${publicLink}`;

      if (onlineLink) {
        msg += `\n\n📄 *Direct PDF Download Link:*
${onlineLink}`;
      }

      msg += `\n\n*Note:* Confirmation upon approval and advance receipt.

Thank you for partnering with *${doc.studio.name}*!
*Contact:* ${doc.studio.phoneNumbers}
*Website:* ${doc.studio.website}`;

      return msg;
    },
    [doc, eventDates, currency, advanceAmt, shareState.url]
  );

  const handleGenerateCloudLink = useCallback(async () => {
    setIsGeneratingLink(true);

    try {
      const pdfFile = await buildPdfFile(doc, 'quotation-invoice-canvas');
      if (pdfFile) {
        const url = await uploadPdfToCloud(pdfFile);
        if (url) {
          setPdfLink(url);
          setCustomMessage(buildMessage(url));
        }
      }
    } catch (e) {
      console.error('Error generating link:', e);
    } finally {
      setIsGeneratingLink(false);
    }
  }, [doc, buildMessage]);

  const prevIsOpenRef = useRef(isOpen);

  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      setRecipientPhone(doc.client.contactNo || '');
      setPdfLink(null);
      setCustomMessage(buildMessage(null));
      handleGenerateCloudLink();
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, doc.client.contactNo, buildMessage, handleGenerateCloudLink]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(customMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenWhatsApp = () => {
    const cleanNumber = recipientPhone.replace(/[^0-9]/g, '');
    const encoded = encodeURIComponent(customMessage);
    const url = cleanNumber
      ? `https://wa.me/${cleanNumber}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 font-['Outfit']">
                Share via WhatsApp & Messaging
              </h2>
              <p className="text-[11px] text-slate-400">
                Send structured quotation with direct PDF download link
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">
              Client WhatsApp Phone Number
            </label>
            <input
              type="text"
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              placeholder="e.g. 919876543210 (with country code)"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          {/* Cloud PDF Status Banner */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CloudUpload className="w-4 h-4 text-amber-400" />
              <div>
                <p className="text-xs font-semibold text-slate-200">
                  {pdfLink ? 'Online PDF Link Ready' : isGeneratingLink ? 'Generating Cloud PDF Link...' : 'No Cloud Link'}
                </p>
                <p className="text-[10px] text-slate-400">
                  {pdfLink ? pdfLink : 'Creating high-DPI document link for WhatsApp...'}
                </p>
              </div>
            </div>

            {isGeneratingLink ? (
              <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
            ) : pdfLink ? (
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">
                Linked
              </span>
            ) : null}
          </div>

          {/* Cloud Sync Warning Banner for Unregistered / Unsynced Users */}
          {!shareState.shareable && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-amber-300 text-xs flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Cloud Sync Required for Interactive Link</p>
                <p className="text-[11px] text-amber-300/80 mt-0.5 leading-relaxed">{shareState.message}</p>
              </div>
            </div>
          )}

          {/* Message Preview */}
          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">
              Formatted Message Preview
            </label>
            <textarea
              rows={9}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500 leading-relaxed"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <button
            type="button"
            onClick={handleCopy}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Text'}</span>
          </button>

          <button
            type="button"
            onClick={handleOpenWhatsApp}
            className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-lg shadow-emerald-600/20 transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Open in WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
};

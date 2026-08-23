import React, { useState, useEffect } from 'react';
import type { QuotationDocument } from '../types';
import {
  getVaultDocuments,
  deleteDocumentFromVault,
  saveDocumentToVault,
} from '../utils/vaultStorage';
import { formatCurrency } from '../utils/formatters';
import { SUPPORTED_CURRENCIES } from '../constants/currencies';
import {
  Archive,
  X,
  Search,
  Trash2,
  Copy,
  ArrowRight,
  Download,
  Upload,
  CheckCircle2,
  Eye,
  ShieldCheck,
  Printer,
  Crown,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isPaidPlan, FREE_PLAN_MAX_DOCUMENTS } from '../utils/planLimits';

interface HistoryVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadDocument: (doc: QuotationDocument) => void;
  currentDocumentId: string;
  onOpenUpgrade?: (plan?: 'pro' | 'agency') => void;
}

export const HistoryVaultModal: React.FC<HistoryVaultModalProps> = ({
  isOpen,
  onClose,
  onLoadDocument,
  currentDocumentId,
  onOpenUpgrade,
}) => {
  const { profile } = useAuth();
  const isPaid = isPaidPlan(profile);
  const [documents, setDocuments] = useState<QuotationDocument[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'ALL' | 'APPROVED' | 'VIEWED' | 'DRAFT'>('ALL');
  const [selectedIndustryFilter, setSelectedIndustryFilter] = useState<string>('ALL');
  const [inspectingAuditDoc, setInspectingAuditDoc] = useState<QuotationDocument | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDocuments(getVaultDocuments());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredDocs = documents.filter((d) => {
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      d.client.nameOfEvent?.toLowerCase().includes(q) ||
      d.details.invoiceNo?.toLowerCase().includes(q) ||
      d.client.clientName?.toLowerCase().includes(q) ||
      d.client.contactNo?.includes(q) ||
      d.client.address?.toLowerCase().includes(q);

    const matchesIndustry =
      selectedIndustryFilter === 'ALL' || d.industry === selectedIndustryFilter;

    const docStatus = d.status || (d.signatory?.clientSignedName ? 'APPROVED' : (d.viewCount && d.viewCount > 0 ? 'VIEWED' : 'DRAFT'));
    const matchesStatus =
      selectedStatusFilter === 'ALL' ||
      (selectedStatusFilter === 'APPROVED' && docStatus === 'APPROVED') ||
      (selectedStatusFilter === 'VIEWED' && docStatus === 'VIEWED') ||
      (selectedStatusFilter === 'DRAFT' && docStatus === 'DRAFT');

    return matchesQuery && matchesIndustry && matchesStatus;
  });

  const countApproved = documents.filter((d) => d.status === 'APPROVED' || d.signatory?.clientSignedName).length;
  const countViewed = documents.filter((d) => (d.status === 'VIEWED' || (d.viewCount && d.viewCount > 0)) && !d.signatory?.clientSignedName).length;
  const countDrafts = documents.length - countApproved - countViewed;

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this document from your vault?')) {
      const updated = deleteDocumentFromVault(id);
      setDocuments(updated);
    }
  };

  const handleDuplicate = (doc: QuotationDocument, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isPaid && documents.length >= FREE_PLAN_MAX_DOCUMENTS) {
      if (onOpenUpgrade) {
        onOpenUpgrade('pro');
      } else {
        alert('Free plan limit reached (3 proposals). Upgrade to Pro for unlimited proposals.');
      }
      return;
    }
    const newId = `doc_${Date.now()}`;
    const year = new Date().getFullYear();
    const rand = Math.floor(100 + Math.random() * 900);
    const duplicated: QuotationDocument = {
      ...doc,
      id: newId,
      status: 'DRAFT',
      viewCount: 0,
      lastViewedAt: undefined,
      approvedAt: undefined,
      acceptanceAudit: undefined,
      signatory: {
        ...doc.signatory,
        clientSignedName: undefined,
        clientSignedDate: undefined,
        clientSignatureDataUrl: undefined,
      },
      details: {
        ...doc.details,
        invoiceNo: `${doc.type === 'INVOICE' ? 'INV' : 'QUO'}-${year}-${rand}`,
        invoiceDate: new Date().toLocaleDateString('en-GB'),
      },
      updatedAt: new Date().toISOString(),
    };
    saveDocumentToVault(duplicated);
    setDocuments(getVaultDocuments());
  };

  const handleExportBackupJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(documents, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `quotation_vault_backup_${new Date().toISOString().slice(0, 10)}.json`);
    dlAnchor.click();
  };

  const handleImportBackupJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target?.result as string);
          if (Array.isArray(imported)) {
            if (!isPaid && (documents.length + imported.length) > FREE_PLAN_MAX_DOCUMENTS) {
              if (onOpenUpgrade) onOpenUpgrade('pro');
              alert(`Free plan holds up to ${FREE_PLAN_MAX_DOCUMENTS} documents. Upgrade to Pro for unlimited storage.`);
              return;
            }
            imported.forEach((docItem) => saveDocumentToVault(docItem));
            setDocuments(getVaultDocuments());
            alert(`Successfully restored ${imported.length} documents into vault!`);
          }
        } catch {
          alert('Invalid JSON backup file.');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-4xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden font-['Plus_Jakarta_Sans',sans-serif] modal-enter">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Archive className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold text-slate-100 font-['Outfit']">
                  Document Vault & Intelligence
                </h2>
                {isPaid ? (
                  <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full uppercase font-mono font-bold flex items-center gap-1">
                    <Crown className="w-2.5 h-2.5" />
                    <span>UNLIMITED PRO</span>
                  </span>
                ) : (
                  <span className={`text-[9px] px-2 py-0.5 rounded-full uppercase font-mono font-bold border ${
                    documents.length >= FREE_PLAN_MAX_DOCUMENTS
                      ? 'bg-red-500/20 text-red-300 border-red-500/30'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}>
                    {documents.length} / {FREE_PLAN_MAX_DOCUMENTS} SAVED (FREE)
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Track client views, audit certificates, and restore past proposals
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {!isPaid && onOpenUpgrade && (
              <button
                type="button"
                onClick={() => onOpenUpgrade('pro')}
                className="px-2.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold rounded-xl flex items-center space-x-1 shadow-sm transition-all cursor-pointer"
                title="Upgrade to Pro for unlimited storage"
              >
                <Zap className="w-3.5 h-3.5 fill-slate-950" />
                <span className="hidden sm:inline">Upgrade Pro</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleExportBackupJson}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl flex items-center space-x-1 transition-colors cursor-pointer"
              title="Export Vault to JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Backup</span>
            </button>

            <label className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl flex items-center space-x-1 cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5" />
              <span>Restore</span>
              <input type="file" accept=".json" onChange={handleImportBackupJson} className="hidden" />
            </label>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-800 transition-colors ml-2 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="px-4 sm:px-5 py-2.5 bg-slate-950/60 border-b border-slate-800/80 flex items-center space-x-2 overflow-x-auto no-scrollbar text-xs">
          {[
            { id: 'ALL' as const, label: `All Proposals (${documents.length})` },
            { id: 'APPROVED' as const, label: `Approved (${countApproved})`, icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> },
            { id: 'VIEWED' as const, label: `Viewed by Client (${countViewed})`, icon: <Eye className="w-3.5 h-3.5 text-blue-400" /> },
            { id: 'DRAFT' as const, label: `Drafts (${countDrafts})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-semibold flex items-center space-x-1.5 transition-all cursor-pointer whitespace-nowrap ${
                selectedStatusFilter === tab.id
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Search & Industry Filter Bar */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/40 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by client, title, quote #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-700/70 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500 input-premium"
            />
          </div>

          <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto no-scrollbar">
            {['ALL', 'creative_agency', 'software_tech', 'consulting', 'construction', 'photography_events', 'general_business'].map(
              (ind) => (
                <button
                  key={ind}
                  type="button"
                  onClick={() => setSelectedIndustryFilter(ind)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
                    selectedIndustryFilter === ind
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {ind.replace('_', ' ')}
                </button>
              )
            )}
          </div>
        </div>

        {/* Document Cards List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 no-scrollbar">
          {filteredDocs.length === 0 ? (
            <div className="text-center py-12 text-slate-500 space-y-2">
              <Archive className="w-10 h-10 mx-auto opacity-30" />
              <p className="text-sm font-medium">No documents matching this filter.</p>
              <p className="text-xs text-slate-600">
                Click "Save to Vault" in the top navigation bar to archive your drafts.
              </p>
            </div>
          ) : (
            filteredDocs.map((doc) => {
              const isCurrent = doc.id === currentDocumentId;
              const currency = doc.currency || SUPPORTED_CURRENCIES[0];
              const isApproved = Boolean(doc.status === 'APPROVED' || doc.signatory?.clientSignedName);
              const isViewed = Boolean((doc.status === 'VIEWED' || (doc.viewCount && doc.viewCount > 0)) && !isApproved);

              return (
                <div
                  key={doc.id}
                  onClick={() => {
                    onLoadDocument(doc);
                    onClose();
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group ${
                    isCurrent
                      ? 'bg-amber-500/10 border-amber-500/60 ring-1 ring-amber-500/30'
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center space-x-3.5 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-xs font-['Outfit'] shrink-0 ${
                        isApproved
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : doc.type === 'INVOICE'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {isApproved ? '✓' : doc.type === 'INVOICE' ? 'INV' : 'QUO'}
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <h4 className="text-xs font-bold text-slate-100 group-hover:text-amber-300 transition-colors truncate">
                          {doc.client.nameOfEvent || doc.packageBannerTitle || 'Untitled Proposal'}
                        </h4>
                        {isCurrent && (
                          <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-mono font-bold">
                            CURRENT
                          </span>
                        )}

                        {/* Lifecycle Status Pill */}
                        {isApproved ? (
                          <span className="inline-flex items-center space-x-1 text-[10px] px-2 py-0.2 rounded-full font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>Approved by {doc.signatory?.clientSignedName || 'Client'}</span>
                          </span>
                        ) : isViewed ? (
                          <span className="inline-flex items-center space-x-1 text-[10px] px-2 py-0.2 rounded-full font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30">
                            <Eye className="w-3 h-3 text-blue-400" />
                            <span>Viewed {doc.viewCount || 1}x</span>
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.2 rounded-full font-semibold bg-slate-800 text-slate-400">
                            Draft
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 text-[11px] text-slate-400 flex-wrap">
                        <span className="font-mono text-slate-300 font-semibold">{doc.details.invoiceNo}</span>
                        <span>•</span>
                        <span>{doc.client.clientName || doc.client.address || 'Direct Client'}</span>
                        <span>•</span>
                        <span className="text-[10px] text-slate-500">
                          Updated {new Date(doc.updatedAt || doc.details.invoiceDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end space-x-4 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
                    <div className="text-left sm:text-right">
                      <div className="text-xs font-mono font-extrabold text-amber-300">
                        {formatCurrency(doc.totalInvestment || 0, currency)}
                      </div>
                      <span className="text-[10px] text-slate-500 uppercase font-['Outfit']">
                        {doc.industry?.replace('_', ' ') || 'PROPOSAL'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1">
                      {/* Audit Certificate Button */}
                      {isApproved && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setInspectingAuditDoc(doc);
                          }}
                          title="View Digital Acceptance Audit Certificate"
                          className="px-2 py-1 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 rounded-lg text-[10px] font-bold flex items-center space-x-1 cursor-pointer transition-colors"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="hidden md:inline">Audit Cert</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={(e) => handleDuplicate(doc, e)}
                        title="Duplicate Proposal"
                        className="p-2 text-slate-400 hover:text-amber-300 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleDelete(doc.id, e)}
                        title="Delete Document"
                        className="p-2 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <div className="p-1.5 text-slate-500 group-hover:text-amber-400 transition-colors">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* AUDIT CERTIFICATE INSPECTOR MODAL                        */}
      {/* ========================================================= */}
      {inspectingAuditDoc && (
        <div className="fixed inset-0 z-60 flex items-center justify-center modal-overlay p-4">
          <div className="glass rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-5 text-slate-100 font-['Plus_Jakarta_Sans',sans-serif] modal-enter border border-emerald-500/40">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100 font-['Outfit']">Digital Acceptance Certificate</h3>
                  <p className="text-[10.5px] text-slate-400">Cryptographically Audited Contract Sign-off</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectingAuditDoc(null)}
                className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Document Ref:</span>
                  <span className="font-mono font-bold text-slate-200">{inspectingAuditDoc.details.invoiceNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Legal Signatory:</span>
                  <span className="font-bold text-emerald-300">
                    {inspectingAuditDoc.signatory?.clientSignedName || inspectingAuditDoc.acceptanceAudit?.signatoryName || 'Client Signatory'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Signed Date & Time:</span>
                  <span className="font-mono text-slate-300">
                    {inspectingAuditDoc.acceptanceAudit?.formattedDate || inspectingAuditDoc.signatory?.clientSignedDate || 'Verified'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Agreed Total Investment:</span>
                  <span className="font-mono font-bold text-amber-300">
                    {formatCurrency(
                      inspectingAuditDoc.acceptanceAudit?.acceptedTotalInvestment || inspectingAuditDoc.totalInvestment,
                      inspectingAuditDoc.currency
                    )}
                  </span>
                </div>
              </div>

              {/* Signature Image Canvas */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 block">Captured Handwritten Signature:</span>
                {inspectingAuditDoc.signatory?.clientSignatureDataUrl || inspectingAuditDoc.acceptanceAudit?.signatureDataUrl ? (
                  <div className="p-3 bg-white rounded-xl flex items-center justify-center">
                    <img
                      src={inspectingAuditDoc.signatory?.clientSignatureDataUrl || inspectingAuditDoc.acceptanceAudit?.signatureDataUrl}
                      alt="Signature"
                      className="max-h-20 object-contain"
                    />
                  </div>
                ) : (
                  <div className="p-3 bg-slate-900 rounded-xl text-center text-slate-500 text-[11px]">
                    Signature captured via digital legal checkbox confirmation
                  </div>
                )}
              </div>

              {inspectingAuditDoc.acceptanceAudit?.userAgent && (
                <div className="text-[10px] text-slate-500 font-mono bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/60 truncate">
                  Agent: {inspectingAuditDoc.acceptanceAudit.userAgent}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-2 pt-1 border-t border-slate-800">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center space-x-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Certificate</span>
              </button>
              <button
                type="button"
                onClick={() => setInspectingAuditDoc(null)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

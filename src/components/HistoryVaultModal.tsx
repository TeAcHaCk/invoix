import React, { useState } from 'react';
import type { QuotationDocument } from '../types';
import { Archive, X, Search, Trash2, Copy, FileText, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

interface HistoryVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadDocument: (doc: QuotationDocument) => void;
  currentDocumentId: string;
}

const STORAGE_KEY = 'fbf_documents_vault';

export const saveDocumentToVault = (doc: QuotationDocument): void => {
  try {
    const existingStr = localStorage.getItem(STORAGE_KEY);
    let items: QuotationDocument[] = existingStr ? JSON.parse(existingStr) : [];
    
    // Replace if exists, or prepend
    const index = items.findIndex((i) => i.id === doc.id);
    const updatedDoc = { ...doc, updatedAt: new Date().toISOString() };
    
    if (index >= 0) {
      items[index] = updatedDoc;
    } else {
      items.unshift(updatedDoc);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save document to vault', e);
  }
};

export const getVaultDocuments = (): QuotationDocument[] => {
  try {
    const existingStr = localStorage.getItem(STORAGE_KEY);
    return existingStr ? JSON.parse(existingStr) : [];
  } catch (e) {
    console.error('Failed to load documents from vault', e);
    return [];
  }
};

export const deleteDocumentFromVault = (id: string): QuotationDocument[] => {
  try {
    const existingStr = localStorage.getItem(STORAGE_KEY);
    let items: QuotationDocument[] = existingStr ? JSON.parse(existingStr) : [];
    items = items.filter((i) => i.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    return items;
  } catch (e) {
    console.error('Failed to delete document from vault', e);
    return [];
  }
};

export const HistoryVaultModal: React.FC<HistoryVaultModalProps> = ({
  isOpen,
  onClose,
  onLoadDocument,
  currentDocumentId,
}) => {
  const [documents, setDocuments] = useState<QuotationDocument[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      setDocuments(getVaultDocuments());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredDocs = documents.filter((d) => {
    const q = searchQuery.toLowerCase();
    return (
      d.client.nameOfEvent?.toLowerCase().includes(q) ||
      d.details.invoiceNo?.toLowerCase().includes(q) ||
      d.client.contactNo?.includes(q) ||
      d.client.address?.toLowerCase().includes(q)
    );
  });

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this saved document?')) {
      const updated = deleteDocumentFromVault(id);
      setDocuments(updated);
    }
  };

  const handleDuplicate = (doc: QuotationDocument, e: React.MouseEvent) => {
    e.stopPropagation();
    const duplicated: QuotationDocument = {
      ...doc,
      id: 'doc_' + Date.now(),
      details: {
        ...doc.details,
        invoiceNo: `${doc.type === 'INVOICE' ? 'INV' : 'QUO'}-${new Date().getFullYear()}-${Math.floor(
          100 + Math.random() * 900
        )}`,
      },
      updatedAt: new Date().toISOString(),
    };
    saveDocumentToVault(duplicated);
    setDocuments(getVaultDocuments());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-amber-500/30 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-amber-100 font-['Outfit']">
                Document History & Vault
              </h3>
              <p className="text-xs text-slate-400">
                Browse, search, load, duplicate, or delete your saved quotes and invoices.
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

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/40">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by event name, invoice no, contact number..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Documents List */}
        <div className="p-4 space-y-2.5 overflow-y-auto flex-1 text-xs">
          {filteredDocs.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-40 text-amber-400" />
              <p className="font-medium text-sm text-slate-400">No saved documents found</p>
              <p className="text-xs mt-1">Click "Save to Vault" in the top bar to save your current work.</p>
            </div>
          ) : (
            filteredDocs.map((item) => {
              const isCurrent = item.id === currentDocumentId;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    onLoadDocument(item);
                    onClose();
                  }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isCurrent
                      ? 'bg-amber-500/10 border-amber-500/50 shadow-md'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${
                          item.type === 'INVOICE'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {item.type}
                      </span>
                      <span className="font-mono text-slate-400 text-[11px]">
                        {item.details.invoiceNo}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] text-amber-400 font-semibold bg-amber-400/10 px-1.5 py-0.5 rounded">
                          (Currently Open)
                        </span>
                      )}
                    </div>

                    <div className="text-sm font-semibold text-slate-200">
                      {item.client.nameOfEvent || 'Untitled Event'}
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center space-x-3">
                      <span>{item.client.address || 'No address'}</span>
                      <span>•</span>
                      <span>{item.client.contactNo || 'No contact'}</span>
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end space-y-1.5">
                    <span className="text-sm font-bold text-amber-300 font-mono">
                      {formatCurrency(item.totalInvestment)}
                    </span>
                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={(e) => handleDuplicate(item, e)}
                        className="p-1.5 text-slate-400 hover:text-amber-300 hover:bg-slate-800 rounded"
                        title="Duplicate"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(item.id, e)}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <div className="pl-1 text-amber-400">
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
    </div>
  );
};

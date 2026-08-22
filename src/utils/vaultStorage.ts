import type { QuotationDocument } from '../types';

export const VAULT_STORAGE_KEY = 'fbf_documents_vault_v2';

export const saveDocumentToVault = (doc: QuotationDocument): void => {
  try {
    const existingStr = localStorage.getItem(VAULT_STORAGE_KEY) || localStorage.getItem('fbf_documents_vault');
    let items: QuotationDocument[] = existingStr ? JSON.parse(existingStr) : [];

    const index = items.findIndex((i) => i.id === doc.id);
    const updatedDoc = { ...doc, updatedAt: new Date().toISOString() };

    if (index >= 0) {
      items[index] = updatedDoc;
    } else {
      items.unshift(updatedDoc);
    }

    localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save document to vault', e);
  }
};

export const getVaultDocuments = (): QuotationDocument[] => {
  try {
    const existingStr = localStorage.getItem(VAULT_STORAGE_KEY) || localStorage.getItem('fbf_documents_vault');
    return existingStr ? JSON.parse(existingStr) : [];
  } catch (e) {
    console.error('Failed to load documents from vault', e);
    return [];
  }
};

export const updateVaultDocumentMetadata = (
  id: string,
  partial: Partial<QuotationDocument>
): QuotationDocument | null => {
  try {
    const existingStr = localStorage.getItem(VAULT_STORAGE_KEY) || localStorage.getItem('fbf_documents_vault');
    let items: QuotationDocument[] = existingStr ? JSON.parse(existingStr) : [];
    const index = items.findIndex((i) => i.id === id);

    if (index >= 0) {
      items[index] = {
        ...items[index],
        ...partial,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(items));
      return items[index];
    }
    return null;
  } catch (e) {
    console.error('Failed to update document metadata in vault', e);
    return null;
  }
};

export const deleteDocumentFromVault = (id: string): QuotationDocument[] => {
  try {
    const existingStr = localStorage.getItem(VAULT_STORAGE_KEY) || localStorage.getItem('fbf_documents_vault');
    let items: QuotationDocument[] = existingStr ? JSON.parse(existingStr) : [];
    items = items.filter((i) => i.id !== id);
    localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(items));
    return items;
  } catch (e) {
    console.error('Failed to delete document from vault', e);
    return [];
  }
};



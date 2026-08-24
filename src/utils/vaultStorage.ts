import type { QuotationDocument } from '../types';

export const VAULT_STORAGE_KEY = 'fbf_documents_vault_v2';

export interface VaultSaveResult {
  success: boolean;
  /** Storage is full. The document was NOT saved. */
  quotaExceeded?: boolean;
  /** Message safe to show the user. */
  error?: string;
}

/**
 * Detects a storage-quota failure across browsers.
 *
 * Chrome/Safari throw QuotaExceededError (code 22), Firefox throws
 * NS_ERROR_DOM_QUOTA_REACHED (code 1014), and older WebKit uses code 21.
 */
function isQuotaError(err: unknown): boolean {
  if (!(err instanceof DOMException)) return false;
  return (
    err.name === 'QuotaExceededError' ||
    err.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    err.code === 22 ||
    err.code === 1014 ||
    err.code === 21
  );
}

const QUOTA_MESSAGE =
  'Your browser storage is full, so this document was not saved locally. ' +
  'Delete older documents from the vault, or sign in so your work syncs to the cloud.';

function readVault(): QuotationDocument[] {
  const existingStr =
    localStorage.getItem(VAULT_STORAGE_KEY) || localStorage.getItem('fbf_documents_vault');
  return existingStr ? (JSON.parse(existingStr) as QuotationDocument[]) : [];
}

/**
 * Persists a document to the local vault.
 *
 * Returns a result rather than swallowing failures: a full localStorage used to
 * be logged to the console and reported to the caller as success, so the user
 * saw a success toast and confetti while their work was silently discarded.
 */
export const saveDocumentToVault = (doc: QuotationDocument): VaultSaveResult => {
  try {
    const items = readVault();

    const index = items.findIndex((i) => i.id === doc.id);
    const updatedDoc = { ...doc, updatedAt: new Date().toISOString() };

    if (index >= 0) {
      items[index] = updatedDoc;
    } else {
      items.unshift(updatedDoc);
    }

    localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(items));
    return { success: true };
  } catch (e) {
    console.error('Failed to save document to vault', e);
    if (isQuotaError(e)) {
      return { success: false, quotaExceeded: true, error: QUOTA_MESSAGE };
    }
    return {
      success: false,
      error: 'This document could not be saved to local storage.',
    };
  }
};

export const getVaultDocuments = (): QuotationDocument[] => {
  try {
    return readVault();
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
    const items = readVault();
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
    const items = readVault().filter((i) => i.id !== id);
    localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(items));
    return items;
  } catch (e) {
    console.error('Failed to delete document from vault', e);
    return [];
  }
};

/** Rough size of the vault in bytes, for surfacing storage pressure in the UI. */
export const getVaultStorageBytes = (): number => {
  try {
    const raw =
      localStorage.getItem(VAULT_STORAGE_KEY) || localStorage.getItem('fbf_documents_vault');
    return raw ? raw.length : 0;
  } catch {
    return 0;
  }
};

import type { QuotationDocument, SignatoryRecord, PricingItem } from '../types';
import { getSupabaseClient } from '../lib/supabase';
import { createShareToken } from '../utils/cryptoAudit';
import {
  saveDocumentToVault,
  getVaultDocuments,
  updateVaultDocumentMetadata,
  deleteDocumentFromVault,
} from '../utils/vaultStorage';

export interface CloudSaveResult {
  success: boolean;
  isCloud: boolean;
  error?: string;
}

/** Documents created before share tokens existed get one on first touch. */
const withShareToken = (doc: QuotationDocument): QuotationDocument =>
  doc.shareToken ? doc : { ...doc, shareToken: createShareToken() };

/** Finds a locally cached document by share token, falling back to the raw id. */
const findLocalByToken = (token: string): QuotationDocument | undefined => {
  const localDocs = getVaultDocuments();
  return localDocs.find((d) => d.shareToken === token) || localDocs.find((d) => d.id === token);
};

export const saveDocument = async (
  doc: QuotationDocument,
  userId?: string
): Promise<CloudSaveResult> => {
  const document = withShareToken(doc);

  // Always save locally to vault for offline resilience
  saveDocumentToVault(document);

  const supabase = getSupabaseClient();
  if (!supabase || !userId) {
    return { success: true, isCloud: false };
  }

  // "Approved" is derived from the signature, never carried forward on its own.
  // Letting a stale status: 'APPROVED' survive without a signature is what made
  // the status column drift out of step with document_data and caused
  // sign_document to reject genuinely unsigned proposals.
  const isSigned = Boolean(document.signatory?.clientSignedName);
  const derivedStatus = isSigned
    ? 'APPROVED'
    : document.status && document.status !== 'APPROVED'
    ? document.status
    : 'DRAFT';

  try {
    const payload = {
      id: document.id,
      user_id: userId,
      share_token: document.shareToken,
      type: document.type,
      industry: document.industry,
      theme: document.theme,
      title: document.packageBannerTitle || document.client.nameOfEvent || 'Untitled Document',
      client_name: document.client.clientName || document.client.nameOfEvent,
      client_email: document.client.email || '',
      total_investment: document.totalInvestment || 0,
      currency_code: document.currency.code,
      status: derivedStatus,
      views_count: document.viewCount || 0,
      is_public: true,
      document_data: document,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('documents').upsert(payload);

    if (error) {
      console.warn('Supabase document upsert failed, saved locally:', error.message);
      return { success: true, isCloud: false, error: error.message };
    }

    return { success: true, isCloud: true };
  } catch (err: any) {
    console.error('Error saving document to cloud:', err);
    return { success: true, isCloud: false, error: err?.message };
  }
};

export const fetchUserDocuments = async (userId?: string): Promise<QuotationDocument[]> => {
  const localDocs = getVaultDocuments();

  const supabase = getSupabaseClient();
  if (!supabase || !userId) {
    return localDocs;
  }

  try {
    const { data, error } = await supabase
      .from('documents')
      .select('document_data')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (!error && data && data.length > 0) {
      const cloudDocs = data.map((d: any) => d.document_data as QuotationDocument);

      // Merge cloud documents with any local docs not yet synced
      const mergedMap = new Map<string, QuotationDocument>();
      cloudDocs.forEach((d) => mergedMap.set(d.id, d));
      localDocs.forEach((d) => {
        if (!mergedMap.has(d.id)) {
          mergedMap.set(d.id, d);
        }
      });

      return Array.from(mergedMap.values());
    }
  } catch (e) {
    console.error('Error fetching cloud documents:', e);
  }

  return localDocs;
};

/**
 * Loads a document for the public client portal.
 *
 * Goes through the get_public_document RPC rather than selecting from the table:
 * the documents table is owner-only now, and the RPC requires the share token.
 */
export const fetchPublicDocument = async (
  shareToken: string
): Promise<{ doc: QuotationDocument | null; error?: string }> => {
  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      const { data, error } = await supabase.rpc('get_public_document', { p_token: shareToken });

      if (!error && data) {
        return { doc: data as QuotationDocument };
      }
      if (error) {
        console.warn('Public document RPC failed, checking local storage:', error.message);
      }
    } catch (e) {
      console.warn('Supabase public document fetch failed, checking local storage:', e);
    }
  }

  // Check local storage fallback (also covers fully offline / no-cloud usage)
  const found = findLocalByToken(shareToken);
  if (found) {
    return { doc: found };
  }

  return { doc: null, error: 'Document not found or link expired.' };
};

export const recordDocumentView = async (shareToken: string): Promise<void> => {
  // Update local vault storage immediately
  const found = findLocalByToken(shareToken);
  if (found) {
    const currentCount = found.viewCount || 0;
    updateVaultDocumentMetadata(found.id, {
      viewCount: currentCount + 1,
      lastViewedAt: new Date().toISOString(),
      status: found.status === 'APPROVED' ? 'APPROVED' : 'VIEWED',
    });
  }

  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    // The RPC writes the audit row and bumps the counter in one server-side step.
    const { error } = await supabase.rpc('record_public_view', { p_token: shareToken });
    if (error) {
      console.warn('Failed to record document view in cloud:', error.message);
    }
  } catch (err) {
    console.error('Failed to record document view in cloud:', err);
  }
};

export interface ApprovalResult {
  success: boolean;
  /** The document was already signed by someone else — not a failure to retry. */
  alreadySigned?: boolean;
  /** Message safe to show the client. */
  error?: string;
  /** The server's authoritative copy, when it returned one. */
  doc?: QuotationDocument;
}

export const approveDocumentPublicly = async (
  shareToken: string,
  signatory: SignatoryRecord,
  updatedPricingItems?: PricingItem[],
  acceptedTotal?: number,
  clientEmail?: string,
  auditExtra?: {
    signatureType?: 'drawn' | 'uploaded' | 'typed';
    signatureHash?: string;
    signatureAlgo?: 'sha-256' | 'fallback';
    certificateId?: string;
  }
): Promise<ApprovalResult> => {
  const now = new Date();

  const auditRecord = {
    signatoryName: signatory.clientSignedName || 'Authorized Signatory',
    signatoryEmail: clientEmail || '',
    signedAt: now.toISOString(),
    formattedDate: now.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
    signatureType: auditExtra?.signatureType || 'drawn',
    signatureDataUrl: signatory.clientSignatureDataUrl,
    signatureHash: auditExtra?.signatureHash,
    signatureAlgo: auditExtra?.signatureAlgo,
    certificateId: auditExtra?.certificateId,
    userAgent: navigator.userAgent,
  };

  // Which optional add-ons the client chose. The server recomputes the total
  // from these — the browser's figure is not trusted.
  const selectedAddonIds = (updatedPricingItems || [])
    .filter((i) => i.isOptional && i.selected)
    .map((i) => i.id);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.rpc('sign_document', {
        p_token: shareToken,
        p_signatory: signatory,
        p_audit: auditRecord,
        p_selected_addon_ids: selectedAddonIds,
      });

      if (!error && data) {
        // Mirror the server's authoritative copy into the local vault.
        const serverDoc = data as QuotationDocument;
        saveDocumentToVault(serverDoc);
        return { success: true, doc: serverDoc };
      }
      if (error) {
        console.error('Failed to sign document in cloud:', error.message);
        // sign_document raises 23505 when a signature is already on file.
        const alreadySigned =
          error.code === '23505' || /already been signed/i.test(error.message || '');
        return {
          success: false,
          alreadySigned,
          error: alreadySigned
            ? 'This proposal has already been signed and approved.'
            : 'We could not record your signature. Please try again or contact the sender.',
        };
      }
    } catch (e) {
      console.error('Failed to sign document in cloud:', e);
      return {
        success: false,
        error: 'We could not reach the signing service. Please check your connection and try again.',
      };
    }
  }

  // Offline / no-cloud fallback: apply the approval to the local copy only.
  const local = findLocalByToken(shareToken);
  if (!local) {
    return { success: false, error: 'Document not found or this link has expired.' };
  }

  if (local.signatory?.clientSignedName) {
    return {
      success: false,
      alreadySigned: true,
      error: 'This proposal has already been signed and approved.',
      doc: local,
    };
  }

  const items = updatedPricingItems || local.pricingItems;
  const finalTotal =
    acceptedTotal ??
    items
      .filter((i) => !i.isOptional || i.selected)
      .reduce((sum, i) => sum + (i.qty && i.rate ? i.qty * i.rate : i.amount || 0), 0);

  const approved: QuotationDocument = {
    ...local,
    status: 'APPROVED',
    approvedAt: now.toISOString(),
    acceptanceAudit: { ...auditRecord, acceptedTotalInvestment: finalTotal },
    pricingItems: items,
    totalInvestment: finalTotal,
    signatory,
  };
  saveDocumentToVault(approved);

  return { success: true, doc: approved };
};

export const deleteDocument = async (id: string, userId?: string): Promise<void> => {
  deleteDocumentFromVault(id);

  const supabase = getSupabaseClient();
  if (supabase && userId) {
    try {
      await supabase.from('documents').delete().eq('id', id).eq('user_id', userId);
    } catch (e) {
      console.error('Failed to delete cloud document:', e);
    }
  }
};

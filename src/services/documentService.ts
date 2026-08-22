import type { QuotationDocument, SignatoryRecord } from '../types';
import { getSupabaseClient } from '../lib/supabase';
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

export const saveDocument = async (
  doc: QuotationDocument,
  userId?: string
): Promise<CloudSaveResult> => {
  // Always save locally to vault for offline resilience
  saveDocumentToVault(doc);

  const supabase = getSupabaseClient();
  if (!supabase || !userId) {
    return { success: true, isCloud: false };
  }

  try {
    const payload = {
      id: doc.id,
      user_id: userId,
      type: doc.type,
      industry: doc.industry,
      theme: doc.theme,
      title: doc.packageBannerTitle || doc.client.nameOfEvent || 'Untitled Document',
      client_name: doc.client.clientName || doc.client.nameOfEvent,
      client_email: doc.client.email || '',
      total_investment: doc.totalInvestment || 0,
      currency_code: doc.currency.code,
      status: doc.signatory?.clientSignedName ? 'APPROVED' : doc.status || 'DRAFT',
      views_count: doc.viewCount || 0,
      is_public: true,
      document_data: doc,
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

export const fetchPublicDocument = async (
  documentId: string
): Promise<{ doc: QuotationDocument | null; error?: string }> => {
  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('document_data, views_count')
        .eq('id', documentId)
        .single();

      if (!error && data?.document_data) {
        return { doc: data.document_data as QuotationDocument };
      }
    } catch (e) {
      console.warn('Supabase public document fetch failed, checking local storage:', e);
    }
  }

  // Check local storage fallback
  const localDocs = getVaultDocuments();
  const found = localDocs.find((d) => d.id === documentId);
  if (found) {
    return { doc: found };
  }

  return { doc: null, error: 'Document not found or link expired.' };
};

export const recordDocumentView = async (documentId: string): Promise<void> => {
  // Update local vault storage immediately
  const localDocs = getVaultDocuments();
  const found = localDocs.find((d) => d.id === documentId);
  if (found) {
    const currentCount = found.viewCount || 0;
    updateVaultDocumentMetadata(documentId, {
      viewCount: currentCount + 1,
      lastViewedAt: new Date().toISOString(),
      status: found.status === 'APPROVED' ? 'APPROVED' : 'VIEWED',
    });
  }

  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    // 1. Insert view audit log
    await supabase.from('document_views').insert({
      document_id: documentId,
      user_agent: navigator.userAgent,
    });

    // 2. Increment view counter in Supabase
    try {
      const { error } = await supabase.rpc('increment_document_views', { doc_id: documentId });
      if (error) {
        throw error;
      }
    } catch {
      // Fallback update if RPC function not created in database
      const { data } = await supabase.from('documents').select('views_count, document_data').eq('id', documentId).single();
      const current = data?.views_count || 0;
      const existingDocData = data?.document_data || {};
      await supabase
        .from('documents')
        .update({
          views_count: current + 1,
          last_viewed_at: new Date().toISOString(),
          status: existingDocData.status === 'APPROVED' ? 'APPROVED' : 'VIEWED',
          document_data: {
            ...existingDocData,
            viewCount: current + 1,
            lastViewedAt: new Date().toISOString(),
            status: existingDocData.status === 'APPROVED' ? 'APPROVED' : 'VIEWED',
          },
        })
        .eq('id', documentId);
    }
  } catch (err) {
    console.error('Failed to record document view in cloud:', err);
  }
};

export const approveDocumentPublicly = async (
  documentId: string,
  signatory: SignatoryRecord,
  updatedPricingItems?: any[],
  acceptedTotal?: number,
  clientEmail?: string
): Promise<boolean> => {
  const { doc } = await fetchPublicDocument(documentId);
  if (!doc) return false;

  const now = new Date();
  const selectedAddons = (updatedPricingItems || doc.pricingItems)
    .filter((i) => i.isOptional && i.selected)
    .map((i) => i.description);

  const finalTotal =
    acceptedTotal ??
    (updatedPricingItems || doc.pricingItems)
      .filter((i) => !i.isOptional || i.selected)
      .reduce((sum, i) => sum + (i.qty && i.rate ? i.qty * i.rate : i.amount || 0), 0);

  const auditRecord = {
    signatoryName: signatory.clientSignedName || 'Authorized Signatory',
    signatoryEmail: clientEmail || doc.client.email || '',
    signedAt: now.toISOString(),
    formattedDate: now.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    signatureDataUrl: signatory.clientSignatureDataUrl,
    selectedAddonIds: selectedAddons,
    acceptedTotalInvestment: finalTotal,
    userAgent: navigator.userAgent,
  };

  const approvedDoc: QuotationDocument = {
    ...doc,
    status: 'APPROVED',
    approvedAt: now.toISOString(),
    acceptanceAudit: auditRecord,
    pricingItems: updatedPricingItems || doc.pricingItems,
    signatory,
  };

  // Save in local storage
  saveDocumentToVault(approvedDoc);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase
        .from('documents')
        .update({
          status: 'APPROVED',
          signed_at: now.toISOString(),
          signer_name: signatory.clientSignedName,
          total_investment: finalTotal,
          document_data: approvedDoc,
        })
        .eq('id', documentId);
      return true;
    } catch (e) {
      console.error('Failed to update cloud approval:', e);
    }
  }

  return true;
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

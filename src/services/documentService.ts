import type { QuotationDocument, SignatoryRecord, PricingItem } from '../types';
import { getSupabaseClient } from '../lib/supabase';
import { createShareToken } from '../utils/cryptoAudit';
import { uploadIfDataUrl } from './storageService';
import {
  saveDocumentToVault,
  getVaultDocuments,
  updateVaultDocumentMetadata,
  deleteDocumentFromVault,
} from '../utils/vaultStorage';

export interface CloudSaveResult {
  /** False only when the document reached NEITHER the cloud nor local storage. */
  success: boolean;
  isCloud: boolean;
  error?: string;
  /** Local storage is full. Data is still safe if isCloud is true. */
  quotaExceeded?: boolean;
  /**
   * The authoritative share token and sync stamp after a successful cloud write.
   *
   * Callers holding the document in their own state MUST merge this back.
   * Without it the in-memory copy never learns it is synced, and every feature
   * gated on that — the text-PDF export and the share-link check — silently
   * degrades even though the save worked.
   */
  synced?: { shareToken?: string; cloudSyncedAt: string };
}

/**
 * Strips a document's IDENTITY when forking a copy from it.
 *
 * A duplicate must never inherit `shareToken` or `cloudSyncedAt`. Both are
 * identity, not content:
 *   - two rows sharing a share_token violate idx_documents_share_token, so every
 *     autosave of the copy fails with a 409 and the document silently stops
 *     syncing;
 *   - worse, while it does share a token the copy is reachable at the ORIGINAL's
 *     public link. findLocalByToken() returns the first match, and
 *     /api/pdf renders by token — so one client could be served another
 *     client's proposal.
 *
 * Use this anywhere a new document is derived from an existing one. Spreading
 * `...doc` and overriding only the obvious fields is what caused exactly that.
 */
export const forkDocumentIdentity = (doc: QuotationDocument): QuotationDocument => ({
  ...doc,
  // Date.now() alone collides when two copies are made in the same millisecond.
  id: `doc_${Date.now()}_${createShareToken().slice(0, 6)}`,
  shareToken: createShareToken(),
  cloudSyncedAt: undefined,
});

/** Documents created before share tokens existed get one on first touch. */
const withShareToken = (doc: QuotationDocument): QuotationDocument =>
  doc.shareToken ? doc : { ...doc, shareToken: createShareToken() };

/** Finds a locally cached document by share token, falling back to the raw id. */
const findLocalByToken = (token: string): QuotationDocument | undefined => {
  const localDocs = getVaultDocuments();
  const byToken = localDocs.filter((d) => d.shareToken === token);

  if (byToken.length > 1) {
    // Vaults created before forkDocumentIdentity() existed can hold copies that
    // share a token. Serving an arbitrary one could hand a client the wrong
    // document, so refuse rather than guess.
    console.error(
      `Ambiguous share token: ${byToken.length} local documents claim "${token}". ` +
        'Refusing to resolve. Re-save the affected documents to assign fresh links.'
    );
    return undefined;
  }

  return byToken[0] || localDocs.find((d) => d.id === token);
};

/**
 * Replaces inline base64 images on a document with uploaded URLs.
 *
 * The studio logo and watermark are the same few images repeated across EVERY
 * document, and base64 adds ~33% on top — that is what fills the ~5 MB
 * localStorage cap after 20-30 documents and what makes each autosave re-send
 * the blobs to Supabase.
 *
 * Deliberately non-destructive: uploadIfDataUrl hands back the original value on
 * any failure, so a network problem degrades to today's behaviour rather than
 * losing the image. Already-uploaded URLs are returned untouched, so this is a
 * no-op after the first successful save.
 *
 * The CLIENT's signature is not uploaded here: it is captured on the public
 * portal by an anonymous visitor who has no auth to write to storage. It stays
 * inline and is persisted server-side by the sign_document RPC.
 */
const normalizeDocumentAssets = async (
  doc: QuotationDocument,
  userId?: string
): Promise<QuotationDocument> => {
  if (!userId) return doc;

  const [logoUrl, watermarkUrl, signatureUrl, customImageUrl] = await Promise.all([
    uploadIfDataUrl(doc.studio?.logoUrl, 'logo', userId),
    uploadIfDataUrl(doc.studio?.watermarkUrl, 'watermark', userId),
    uploadIfDataUrl(doc.studio?.signatureUrl, 'signature', userId),
    uploadIfDataUrl(doc.watermark?.customImageUrl, 'watermark', userId),
  ]);

  return {
    ...doc,
    studio: {
      ...doc.studio,
      logoUrl: logoUrl ?? doc.studio?.logoUrl,
      watermarkUrl: watermarkUrl ?? doc.studio?.watermarkUrl,
      signatureUrl,
    },
    watermark: { ...doc.watermark, customImageUrl },
  };
};

export const saveDocument = async (
  doc: QuotationDocument,
  userId?: string,
  isPaid: boolean = false
): Promise<CloudSaveResult> => {
  // Lift images out to storage BEFORE writing anywhere, so the local vault copy
  // shrinks too — localStorage is the constraint this is meant to relieve.
  const withAssets = await normalizeDocumentAssets(doc, userId);

  // The client opening a share link is anonymous and cannot look up the owner's
  // plan, so whether to show the Invoix footer CTA is decided here, at save
  // time, and travels with the document.
  const document: QuotationDocument = {
    ...withShareToken(withAssets),
    showInvoixBranding: !isPaid,
  };

  // Always save locally to vault for offline resilience. The result matters:
  // a full localStorage used to be swallowed and reported as success, so the
  // user got a success toast and confetti while the work was discarded.
  const local = saveDocumentToVault(document);

  const supabase = getSupabaseClient();
  if (!supabase || !userId) {
    // No cloud fallback, so the local result is the only outcome there is.
    return {
      success: local.success,
      isCloud: false,
      error: local.error,
      quotaExceeded: local.quotaExceeded,
    };
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

    // Read the row back: the database owns share_token (freeze_share_token keeps
    // an existing one), so the value it returns is the only one that resolves
    // for a client. Reconciling it locally stops the link in the user's clipboard
    // from drifting away from the row it points at.
    const { data: saved, error } = await supabase
      .from('documents')
      .upsert(payload)
      .select('share_token')
      .maybeSingle();

    let synced: { shareToken?: string; cloudSyncedAt: string } | undefined;

    if (!error) {
      // Record that this document is genuinely in the cloud, and adopt the
      // authoritative token. Both matter for deciding whether a share link works.
      synced = {
        shareToken: saved?.share_token || document.shareToken,
        cloudSyncedAt: new Date().toISOString(),
      };
      saveDocumentToVault({ ...document, ...synced });
    }

    if (error) {
      console.warn('Supabase document upsert failed:', error.message);
      // Cloud failed. Only the local copy stands between the user and data loss.
      return {
        success: local.success,
        isCloud: false,
        error: local.success ? undefined : local.error || error.message,
        quotaExceeded: local.quotaExceeded,
      };
    }

    // Cloud write succeeded, so the document is safe even if localStorage is full.
    return { success: true, isCloud: true, quotaExceeded: local.quotaExceeded, synced };
  } catch (err: any) {
    console.error('Error saving document to cloud:', err);
    return {
      success: local.success,
      isCloud: false,
      error: local.success ? undefined : local.error || err?.message,
      quotaExceeded: local.quotaExceeded,
    };
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
): Promise<{ doc: QuotationDocument | null; error?: string; source?: 'cloud' | 'local' }> => {
  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      const { data, error } = await supabase.rpc('get_public_document', { p_token: shareToken });

      if (!error && data) {
        const serverDoc = data as QuotationDocument;
        // It came from the server, so it is on the server. The stored
        // document_data does not carry cloudSyncedAt (the stamp is applied after
        // the payload is built), and without this the client portal would always
        // fall back to the raster PDF.
        return {
          doc: {
            ...serverDoc,
            cloudSyncedAt: serverDoc.cloudSyncedAt || new Date().toISOString(),
          },
          source: 'cloud',
        };
      }
      if (error) {
        console.warn('Public document RPC failed, checking local storage:', error.message);
      }
    } catch (e) {
      console.warn('Supabase public document fetch failed, checking local storage:', e);
    }
  }

  // Local fallback. This keeps offline and no-cloud use working, but it is also
  // why a broken link looks fine to the document's owner and 404s for everyone
  // else — only their browser holds this copy. Callers get source: 'local' so
  // they can say so rather than presenting it as a working shared link.
  const found = findLocalByToken(shareToken);
  if (found) {
    return { doc: found, source: 'local' };
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
  // Offline signing has no cloud copy to fall back on, so a failed vault write
  // means the signature is gone. Never report that as a successful approval.
  const stored = saveDocumentToVault(approved);
  if (!stored.success) {
    return {
      success: false,
      error:
        stored.error ||
        'Your signature could not be saved on this device. Please try again with an internet connection.',
    };
  }

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


export interface ShareLinkState {
  /** False when the link would 404 for anyone but this browser. */
  shareable: boolean;
  url: string | null;
  reason?: 'not_signed_in' | 'not_synced';
  /** Plain-language explanation, safe to show in the UI. */
  message?: string;
}

/**
 * The single answer to "can this document be shared, and with what URL?"
 *
 * Both the Copy Link button and the WhatsApp share build links, and neither
 * used to check anything — so a signed-out user got a URL that resolves only in
 * their own browser and 404s for the client they send it to. The owner cannot
 * detect this themselves, because their localStorage copy makes the link look
 * healthy when they test it.
 *
 * Returns the URL even when not shareable, so callers can still show it in a
 * disabled state rather than rendering an empty field.
 */
export const getShareLinkState = (
  doc: QuotationDocument,
  userId?: string
): ShareLinkState => {
  /*
    No `|| doc.id` fallback. Document ids are timestamps, and the public RPCs no
    longer accept one as a link key — a link built from an id would simply 404.
    An unsynced document has no usable link, which is what the states below say.
  */
  const url = doc.shareToken ? `${window.location.origin}/?view=${doc.shareToken}` : null;

  if (!userId) {
    return {
      shareable: false,
      url,
      reason: 'not_signed_in',
      message:
        'Sign in to sync this proposal to the cloud. Until then the link only opens on this device.',
    };
  }

  if (!doc.cloudSyncedAt) {
    return {
      shareable: false,
      url,
      reason: 'not_synced',
      message:
        'This proposal has not synced yet. Save it, then copy the link again.',
    };
  }

  return { shareable: true, url };
};

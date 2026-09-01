import type { QuotationDocument } from '../types';
import { exportDocumentToPdf, generatePdfBlob } from '../utils/pdfGenerator';

/**
 * Text-PDF export via the server-side Chromium renderer, with an automatic
 * fallback to the existing raster export.
 *
 * The server route (`/api/pdf`) renders the real public proposal page through
 * the same print stylesheet the browser uses, so the output is genuine vector
 * text — selectable, searchable, and a fraction of the size of the rasterised
 * screenshot.
 *
 * It cannot serve every case, and that is why the raster path stays:
 *   - a document that has never synced has no share token to render by
 *   - the cold start can exceed a slow connection's patience
 *   - the endpoint may be unavailable
 * In all of those the caller silently gets the raster PDF rather than an error.
 */

export type PdfQuality = 'text' | 'image';

export interface PdfExportResult {
  success: boolean;
  /** Which path actually produced the file. */
  usedQuality: PdfQuality;
  /** Set when the requested quality was unavailable and we fell back. */
  fallbackReason?: string;
  error?: string;
}

/** Server render has to boot Chromium; well beyond a normal fetch budget. */
const SERVER_TIMEOUT_MS = 70_000;

const buildFilename = (doc: QuotationDocument): string => {
  const ref = (doc.details?.invoiceNo || 'Document').replace(/[^a-zA-Z0-9._-]/g, '');
  const kind = doc.type === 'INVOICE' ? 'Invoice' : 'Quotation';
  return `${kind}-${ref || 'Invoix'}.pdf`;
};

/** True when the server renderer can reach this document at all. */
export const canExportTextPdf = (doc: QuotationDocument): boolean =>
  Boolean(doc.shareToken && doc.cloudSyncedAt);

const triggerBlobDownload = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  // Revoking too early aborts the download on mobile Safari.
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 3000);
};

/**
 * Fetches the server-rendered text PDF as a Blob.
 *
 * Returns null on any failure so callers can fall back rather than surfacing an
 * error the user cannot act on.
 */
export const fetchTextPdfBlob = async (doc: QuotationDocument): Promise<Blob | null> => {
  if (!canExportTextPdf(doc)) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SERVER_TIMEOUT_MS);

  try {
    const params = new URLSearchParams({
      token: doc.shareToken!,
      filename: buildFilename(doc),
    });

    const res = await fetch(`/api/pdf?${params.toString()}`, { signal: controller.signal });

    if (!res.ok) {
      console.warn('Text PDF render failed with status', res.status);
      return null;
    }

    const blob = await res.blob();
    // A truncated or error response would not be a usable PDF.
    if (!blob.size || !blob.type.includes('pdf')) {
      console.warn('Text PDF response was not a PDF:', blob.type, blob.size);
      return null;
    }
    return blob;
  } catch (err) {
    console.warn('Text PDF request failed:', err);
    return null;
  } finally {
    clearTimeout(timer);
  }
};

/**
 * Downloads the document, preferring true text and degrading quietly.
 *
 * `elementId` is only used by the raster fallback, which captures the live DOM.
 */
export const downloadPdf = async (
  doc: QuotationDocument,
  quality: PdfQuality = 'text',
  elementId: string = 'quotation-preview-container'
): Promise<PdfExportResult> => {
  const filename = buildFilename(doc);

  if (quality === 'text') {
    if (!canExportTextPdf(doc)) {
      const ok = await exportDocumentToPdf(elementId, filename);
      return {
        success: ok,
        usedQuality: 'image',
        fallbackReason:
          'This document has not synced to the cloud yet, so the standard PDF was used. Save it while signed in to enable crisp text export.',
        error: ok ? undefined : 'Could not generate the PDF.',
      };
    }

    const blob = await fetchTextPdfBlob(doc);
    if (blob) {
      triggerBlobDownload(blob, filename);
      return { success: true, usedQuality: 'text' };
    }

    const ok = await exportDocumentToPdf(elementId, filename);
    return {
      success: ok,
      usedQuality: 'image',
      fallbackReason:
        'Crisp text export was unavailable, so the standard PDF was used instead.',
      error: ok ? undefined : 'Could not generate the PDF.',
    };
  }

  const ok = await exportDocumentToPdf(elementId, filename);
  return {
    success: ok,
    usedQuality: 'image',
    error: ok ? undefined : 'Could not generate the PDF.',
  };
};

/**
 * Produces a File for attachment flows (WhatsApp upload), preferring text.
 *
 * This is the case the browser's own print dialog cannot serve at all — it hands
 * the PDF to the user, never to the page — so it is the clearest reason the
 * server renderer exists alongside it.
 */
export const buildPdfFile = async (
  doc: QuotationDocument,
  elementId: string = 'quotation-invoice-canvas'
): Promise<File | null> => {
  const filename = buildFilename(doc);

  const blob = await fetchTextPdfBlob(doc);
  if (blob) {
    return new File([blob], filename, { type: 'application/pdf' });
  }

  return generatePdfBlob(elementId, filename);
};

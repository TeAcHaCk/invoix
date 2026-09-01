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

/** True when the server renderer can reach this document. */
export const canExportTextPdf = (_doc: QuotationDocument): boolean => true;

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

/** Builds a standalone HTML document containing the rendered canvas and all stylesheets. */
export const buildExportHtml = (elementId: string = 'quotation-preview-container'): string => {
  const target =
    document.getElementById('quotation-invoice-canvas') ||
    document.getElementById(elementId) ||
    document.querySelector<HTMLElement>('.print-page');

  if (!target) return '';

  const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map((el) => el.outerHTML)
    .join('\n');

  const clone = target.cloneNode(true) as HTMLElement;
  clone.removeAttribute('id');
  clone.style.transform = 'none';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  ${styles}
  <style>
    @page { size: A4 portrait; margin: 0; }
    html, body { margin: 0; padding: 0; background: #fff !important; width: 100%; }
    .print-page { margin: 0 auto !important; box-shadow: none !important; page-break-after: always; break-after: page; }
    .print-page:last-child { page-break-after: auto; break-after: auto; }
  </style>
</head>
<body>
  <div id="invoix-print-root" style="width: 100%; display: flex; flex-direction: column; align-items: center;">
    ${clone.outerHTML}
  </div>
</body>
</html>`;
};

/**
 * Fetches the server-rendered text PDF as a Blob.
 *
 * Sends the standalone HTML structure directly so that export succeeds even in
 * protected environments (such as Vercel SSO/preview password protection) without
 * making external network calls.
 */
export const fetchTextPdfBlob = async (
  doc: QuotationDocument,
  elementId?: string
): Promise<Blob | null> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SERVER_TIMEOUT_MS);

  try {
    const filename = buildFilename(doc);
    const html = buildExportHtml(elementId);

    const res = await fetch('/api/pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ html, document: doc, filename }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.warn('Text PDF render failed with status', res.status, errText);
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
 * `elementId` is used for the HTML snapshot and the raster fallback.
 */
export const downloadPdf = async (
  doc: QuotationDocument,
  quality: PdfQuality = 'text',
  elementId: string = 'quotation-preview-container'
): Promise<PdfExportResult> => {
  const filename = buildFilename(doc);

  if (quality === 'text') {
    const blob = await fetchTextPdfBlob(doc, elementId);
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

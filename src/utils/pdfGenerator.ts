import { toPng, getFontEmbedCSS } from 'html-to-image';
import jsPDF from 'jspdf';

/**
 * High-fidelity multi-page A4 PDF exporter.
 *
 * Strategy: Temporarily remove the viewport zoom/scale transform from the
 * parent wrapper, capture the REAL DOM element (with all Tailwind styles
 * already applied) using PNG at 3× pixel-ratio, then restore the transform.
 * No DOM cloning needed — this guarantees pixel-perfect output.
 */

const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;
const PIXEL_RATIO = 3;

/**
 * Temporarily unscale all ancestor transforms so the capture happens at
 * the element's natural 794px width, regardless of mobile zoom level.
 * Returns a restore function that puts everything back.
 */
interface StyleRestore {
  el: HTMLElement;
  transform: string;
  display: string;
  visibility: string;
  opacity: string;
  position: string;
  left: string;
}

/**
 * Temporarily unscale all ancestor transforms and un-hide any hidden ancestor
 * elements so capture works even if the user is on mobile in the Form Editor tab.
 * Returns a restore function that puts everything back immediately after capture.
 */
function unscaleAncestors(el: HTMLElement): () => void {
  const restores: StyleRestore[] = [];

  let node: HTMLElement | null = el.parentElement;
  while (node) {
    const computed = getComputedStyle(node);
    const hasTransform = computed.transform && computed.transform !== 'none';
    const isHidden = computed.display === 'none' || computed.visibility === 'hidden';

    if (hasTransform || isHidden) {
      restores.push({
        el: node,
        transform: node.style.transform,
        display: node.style.display,
        visibility: node.style.visibility,
        opacity: node.style.opacity,
        position: node.style.position,
        left: node.style.left,
      });

      if (hasTransform) {
        node.style.transform = 'none';
      }
      if (computed.display === 'none') {
        node.style.display = 'block';
        node.style.position = 'fixed';
        node.style.left = '-9999px';
        node.style.opacity = '0';
      }
      if (computed.visibility === 'hidden') {
        node.style.visibility = 'visible';
      }
    }
    node = node.parentElement;
  }

  return () => {
    for (const r of restores) {
      r.el.style.transform = r.transform;
      r.el.style.display = r.display;
      r.el.style.visibility = r.visibility;
      r.el.style.opacity = r.opacity;
      r.el.style.position = r.position;
      r.el.style.left = r.left;
    }
  };
}

/**
 * Resolves the page's webfonts to embeddable CSS (data URIs).
 *
 * html-to-image rasterises through an SVG <foreignObject>, which cannot reach
 * the document's stylesheets — so `document.fonts.ready` is not enough. Without
 * embedded fonts the capture silently falls back to a wider system font, text
 * grows, and tight rows (the totals block especially) wrap in the PDF while
 * looking fine on screen.
 *
 * Computed once per export and reused across pages; it is the slow part.
 * Returns undefined on failure so capture still proceeds.
 */
async function resolveFontEmbedCss(el: HTMLElement): Promise<string | undefined> {
  try {
    return await getFontEmbedCSS(el);
  } catch (err) {
    console.warn('Could not embed webfonts for PDF capture, using fallbacks:', err);
    return undefined;
  }
}

async function capturePageAsPng(pageEl: HTMLElement, fontEmbedCSS?: string): Promise<string> {
  // 1. Remove parent scaling transforms
  const restoreTransforms = unscaleAncestors(pageEl);

  // 2. Force browser reflow so the element paints at full size
  void pageEl.offsetHeight;
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

  // Clamp capture height to A4 so overflowing content is cut off at the page
  // boundary rather than bleeding into the capture and creating orphan PDF
  // sheets. The page-packing algorithm should prevent overflow in the first
  // place, but this is a hard safety net.
  const captureHeight = Math.min(pageEl.scrollHeight || A4_HEIGHT_PX, A4_HEIGHT_PX);

  try {
    const dataUrl = await toPng(pageEl, {
      pixelRatio: PIXEL_RATIO,
      backgroundColor: '#ffffff',
      cacheBust: true,
      fontEmbedCSS,
      width: A4_WIDTH_PX,
      height: captureHeight,
      style: {
        transform: 'none',
        margin: '0',
        maxWidth: 'none',
        width: `${A4_WIDTH_PX}px`,
        height: `${A4_HEIGHT_PX}px`,
        maxHeight: `${A4_HEIGHT_PX}px`,
        overflow: 'hidden',
      },
      filter: (node) => {
        if (node instanceof HTMLElement && node.classList.contains('no-print')) {
          return false;
        }
        return true;
      },
    });
    return dataUrl;
  } finally {
    // 3. Restore original transforms immediately
    restoreTransforms();
  }
}

/** Decode actual pixel dimensions of a data-URL image. */
function getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: A4_WIDTH_PX * PIXEL_RATIO, height: A4_HEIGHT_PX * PIXEL_RATIO });
    img.src = dataUrl;
  });
}

/**
 * Places one captured page into the PDF at full A4 width.
 *
 * Each page is captured at exactly A4 height (1123px), so the image should
 * always map 1:1 onto a single A4 PDF sheet. Minor sub-pixel variations
 * (up to 8%) are absorbed by stretching to fill the page. Anything larger
 * (which should not happen with the capture clamp) still gets handled by
 * slicing onto additional sheets as a last resort.
 */
async function drawPageIntoPdf(
  pdf: jsPDF,
  imgData: string,
  pdfW: number,
  pdfH: number,
  /** Stable alias so jsPDF embeds the bitmap once even when it spans sheets. */
  alias: string
): Promise<void> {
  const dims = await getImageDimensions(imgData);
  const imgAspect = dims.width / dims.height;

  const drawW = pdfW;
  const drawH = pdfW / imgAspect;

  // Fit within a single page (absorb up to 8% overshoot by stretching)
  if (drawH <= pdfH * 1.08) {
    pdf.addImage(imgData, 'PNG', 0, 0, drawW, pdfH, alias, 'FAST');
    return;
  }

  // Taller than A4: re-draw the same image shifted up by one page each time.
  // jsPDF clips to the page box, so each pass reveals the next slice.
  const TOLERANCE_MM = 1.0;
  let offsetY = 0;
  let remaining = drawH;

  while (remaining > TOLERANCE_MM) {
    pdf.addImage(imgData, 'PNG', 0, offsetY, drawW, drawH, alias, 'FAST');
    remaining -= pdfH;
    offsetY -= pdfH;
    if (remaining > TOLERANCE_MM) {
      pdf.addPage('a4', 'portrait');
    }
  }
}

export async function exportDocumentToPdf(
  elementId: string,
  fileName: string = 'Quotation-Invoix.pdf'
): Promise<boolean> {
  const container =
    document.getElementById(elementId) ||
    document.querySelector('.print-page') ||
    document.getElementById('quotation-preview-container');

  if (!container) {
    console.error(`PDF Export Error: Element #${elementId} not found in DOM`);
    return false;
  }

  try {
    // Wait for web fonts
    if (document.fonts) {
      try { await document.fonts.ready; } catch { /* proceed */ }
    }

    // Discover all print pages
    const subPages = container.querySelectorAll<HTMLElement>('.print-page');
    const pageElements: HTMLElement[] =
      subPages.length > 0 ? Array.from(subPages) : [container as HTMLElement];

    // Resolve fonts once, not per page — this is the expensive step.
    const fontEmbedCSS = await resolveFontEmbedCss(container as HTMLElement);

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pdfW = pdf.internal.pageSize.getWidth();   // 210 mm
    const pdfH = pdf.internal.pageSize.getHeight();   // 297 mm

    for (let i = 0; i < pageElements.length; i++) {
      if (i > 0) pdf.addPage('a4', 'portrait');

      const imgData = await capturePageAsPng(pageElements[i], fontEmbedCSS);
      await drawPageIntoPdf(pdf, imgData, pdfW, pdfH, `page_${i}`);
    }

    // Mobile-safe download
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
      const blob = pdf.output('blob');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 3000);
    } else {
      pdf.save(fileName);
    }

    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    return false;
  }
}

export async function generatePdfBlob(
  elementId: string,
  fileName: string = 'Quotation.pdf'
): Promise<File | null> {
  const container =
    document.getElementById(elementId) ||
    document.querySelector('.print-page') ||
    document.getElementById('quotation-preview-container');

  if (!container) return null;

  try {
    if (document.fonts) {
      try { await document.fonts.ready; } catch {}
    }

    const subPages = container.querySelectorAll<HTMLElement>('.print-page');
    const pageElements: HTMLElement[] =
      subPages.length > 0 ? Array.from(subPages) : [container as HTMLElement];

    // Resolve fonts once, not per page — this is the expensive step.
    const fontEmbedCSS = await resolveFontEmbedCss(container as HTMLElement);

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = pdf.internal.pageSize.getHeight();

    for (let i = 0; i < pageElements.length; i++) {
      if (i > 0) pdf.addPage('a4', 'portrait');

      const imgData = await capturePageAsPng(pageElements[i], fontEmbedCSS);
      await drawPageIntoPdf(pdf, imgData, pdfW, pdfH, `page_${i}`);
    }

    const blob = pdf.output('blob');
    return new File([blob], fileName, { type: 'application/pdf' });
  } catch (err) {
    console.error('Error generating PDF blob:', err);
    return null;
  }
}

// Print isolation lives in ./printIsolation so main.tsx can install it
// without pulling jsPDF and html-to-image into the entry chunk.
export { printDocument, installPrintIsolation } from './printIsolation';

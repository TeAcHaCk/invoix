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

  try {
    const dataUrl = await toPng(pageEl, {
      pixelRatio: PIXEL_RATIO,
      backgroundColor: '#ffffff',
      cacheBust: true,
      fontEmbedCSS,
      width: A4_WIDTH_PX,
      height: pageEl.scrollHeight || A4_HEIGHT_PX,
      style: {
        transform: 'none',
        margin: '0',
        maxWidth: 'none',
        width: `${A4_WIDTH_PX}px`,
        minHeight: `${A4_HEIGHT_PX}px`,
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
 * The previous version fitted by whichever axis overflowed, so any page taller
 * than A4 (every `.print-page` uses min-height, so content freely overflows) got
 * scaled down to ~86% and centre-floated with white gutters down both sides.
 * That was the long-running "alignment is not proper" bug.
 *
 * Content now always spans the full page width; anything taller than one A4
 * flows onto additional pages rather than being squashed to fit.
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

  // Half a millimetre of slack so rounding never triggers a blank trailing page.
  const TOLERANCE_MM = 0.5;

  if (drawH <= pdfH + TOLERANCE_MM) {
    pdf.addImage(imgData, 'PNG', 0, 0, drawW, drawH, alias, 'FAST');
    return;
  }

  // Taller than A4: re-draw the same image shifted up by one page each time.
  // jsPDF clips to the page box, so each pass reveals the next slice.
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

const PRINT_ROOT_ID = 'invoix-print-root';

/**
 * Prints the document by lifting a COPY of it to the top of <body>.
 *
 * A plain window.print() printed the editor sidebar, then printed blank once the
 * CSS hid it. The reason is the ancestor chain the preview lives in:
 *
 *   .overflow-y-auto.relative   <- clips, and is the containing block
 *     .print-zoom-wrapper       <- inline transform: scale()
 *       #quotation-preview-container
 *         .canvas-viewport      <- another inline transform: scale()
 *           #quotation-invoice-canvas
 *
 * No @media print rule can reliably free an element from a clipping, positioned
 * and transformed chain like that - which is why the page came out empty. Moving
 * it out of the chain is the only robust fix.
 *
 * A CLONE is used rather than the live node: relocating React-managed DOM risks
 * a reconciliation error if a render lands mid-print. The clone is an inert
 * snapshot, restored by simply deleting it.
 *
 * Deliberately does NOT touch PDF export, which works and is not in the way.
 */
export function printDocument(elementId: string = 'quotation-invoice-canvas'): void {
  const source =
    document.getElementById(elementId) ||
    document.getElementById('quotation-preview-container') ||
    document.querySelector<HTMLElement>('.print-page');

  if (!source) {
    // Nothing to isolate - fall back to the browser's own behaviour.
    window.print();
    return;
  }

  // Clear any root left behind by an interrupted previous run.
  document.getElementById(PRINT_ROOT_ID)?.remove();

  const printRoot = document.createElement('div');
  printRoot.id = PRINT_ROOT_ID;

  const clone = source.cloneNode(true) as HTMLElement;
  // The clone must not inherit the zoom transform or the id it was cloned from.
  clone.removeAttribute('id');
  clone.style.transform = 'none';
  clone.style.width = 'auto';
  printRoot.appendChild(clone);

  document.body.appendChild(printRoot);

  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    printRoot.remove();
    window.removeEventListener('afterprint', cleanup);
  };

  /*
    Cleanup is driven ONLY by afterprint, plus a long safety net.

    It must not run straight after window.print(): in current Chrome the print
    preview is rendered ASYNCHRONOUSLY and window.print() returns immediately.
    A cleanup scheduled on the next tick therefore removed the clone before the
    browser snapshotted the page, leaving nothing for `body > *:not(print-root)`
    to reveal - which printed a correctly sized but completely blank A4 sheet.

    The clone is display:none on screen (see index.css) and only becomes visible
    inside @media print, so leaving it in the DOM until afterprint is invisible
    to the user.
  */
  window.addEventListener('afterprint', cleanup);
  // Safari and some mobile browsers fire afterprint unreliably.
  window.setTimeout(cleanup, 120000);

  window.print();
}

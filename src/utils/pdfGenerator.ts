import { toPng } from 'html-to-image';
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

async function capturePageAsPng(pageEl: HTMLElement): Promise<string> {
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

      const imgData = await capturePageAsPng(pageElements[i]);
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

      const imgData = await capturePageAsPng(pageElements[i]);
      await drawPageIntoPdf(pdf, imgData, pdfW, pdfH, `page_${i}`);
    }

    const blob = pdf.output('blob');
    return new File([blob], fileName, { type: 'application/pdf' });
  } catch (err) {
    console.error('Error generating PDF blob:', err);
    return null;
  }
}

export function printDocument(): void {
  window.print();
}

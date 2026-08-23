import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

/**
 * High-fidelity multi-page A4 PDF exporter.
 *
 * Strategy: Clone each .print-page into a hidden, full-width (794px) offscreen
 * container so the capture is completely independent of the viewport zoom/scale.
 * Uses PNG (lossless) at 3× pixel-ratio for razor-sharp 300 DPI print quality.
 * Computes the actual aspect ratio of each page so nothing gets stretched.
 */

const A4_WIDTH_PX = 794;   // 210mm at 96 DPI
const A4_HEIGHT_PX = 1123;  // 297mm at 96 DPI
const PIXEL_RATIO = 3;      // 3× = ~288 DPI print quality

/** Copy all stylesheets into the offscreen host so Tailwind / fonts apply. */
function injectStyles(host: HTMLElement): void {
  const doc = host.ownerDocument!;
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      if (sheet.href) {
        const link = doc.createElement('link');
        link.rel = 'stylesheet';
        link.href = sheet.href;
        host.prepend(link);
      } else if (sheet.cssRules) {
        const style = doc.createElement('style');
        style.textContent = Array.from(sheet.cssRules)
          .map((r) => r.cssText)
          .join('\n');
        host.prepend(style);
      }
    } catch {
      // Cross-origin stylesheets – skip
    }
  }
}

/**
 * Clone a page element into a hidden offscreen container at full A4 width.
 * Returns the container (caller must remove it after capture).
 */
function clonePageOffscreen(pageEl: HTMLElement): HTMLElement {
  const host = document.createElement('div');
  host.setAttribute('aria-hidden', 'true');
  Object.assign(host.style, {
    position: 'fixed',
    left: '-9999px',
    top: '0',
    width: `${A4_WIDTH_PX}px`,
    minHeight: `${A4_HEIGHT_PX}px`,
    overflow: 'hidden',
    zIndex: '-1',
    backgroundColor: '#ffffff',
    // Prevent any inherited transforms / scaling
    transform: 'none',
    transformOrigin: 'top left',
  });

  // Deep clone the page node
  const clone = pageEl.cloneNode(true) as HTMLElement;
  Object.assign(clone.style, {
    width: `${A4_WIDTH_PX}px`,
    minHeight: `${A4_HEIGHT_PX}px`,
    margin: '0',
    transform: 'none',
    maxWidth: 'none',
    boxSizing: 'border-box',
  });

  host.appendChild(clone);
  injectStyles(host);
  document.body.appendChild(host);

  return host;
}

/** Capture a single page element as a high-quality PNG data URL. */
async function capturePageAsPng(pageEl: HTMLElement): Promise<string> {
  const host = clonePageOffscreen(pageEl);

  // Let the browser layout & paint the cloned tree (fonts, images, etc.)
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  await new Promise((r) => setTimeout(r, 120));

  const target = host.firstElementChild as HTMLElement;

  try {
    const dataUrl = await toPng(target, {
      pixelRatio: PIXEL_RATIO,
      backgroundColor: '#ffffff',
      cacheBust: true,
      width: A4_WIDTH_PX,
      height: target.scrollHeight || A4_HEIGHT_PX,
      style: {
        transform: 'none',
        margin: '0',
        maxWidth: 'none',
        width: `${A4_WIDTH_PX}px`,
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
    document.body.removeChild(host);
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

      // Decode actual image dimensions to preserve aspect ratio
      const dims = await getImageDimensions(imgData);
      const imgAspect = dims.width / dims.height;
      const a4Aspect = pdfW / pdfH;

      let drawW = pdfW;
      let drawH = pdfH;
      let drawX = 0;
      let drawY = 0;

      if (imgAspect > a4Aspect) {
        // Image is wider than A4 – fit width, center vertically
        drawH = pdfW / imgAspect;
        drawY = 0; // top-align
      } else {
        // Image is taller than A4 – fit height, center horizontally
        drawW = pdfH * imgAspect;
        drawX = (pdfW - drawW) / 2;
      }

      pdf.addImage(imgData, 'PNG', drawX, drawY, drawW, drawH, undefined, 'FAST');
    }

    // Save – mobile-safe blob download
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
      const dims = await getImageDimensions(imgData);
      const imgAspect = dims.width / dims.height;
      const a4Aspect = pdfW / pdfH;

      let drawW = pdfW;
      let drawH = pdfH;
      let drawX = 0;
      let drawY = 0;

      if (imgAspect > a4Aspect) {
        drawH = pdfW / imgAspect;
      } else {
        drawW = pdfH * imgAspect;
        drawX = (pdfW - drawW) / 2;
      }

      pdf.addImage(imgData, 'PNG', drawX, drawY, drawW, drawH, undefined, 'FAST');
    }

    const blob = pdf.output('blob');
    return new File([blob], fileName, { type: 'application/pdf' });
  } catch (err) {
    console.error('Error generating PDF blob:', err);
    return null;
  }
}

/** Utility: get pixel dimensions of a data-URL image. */
function getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: A4_WIDTH_PX * PIXEL_RATIO, height: A4_HEIGHT_PX * PIXEL_RATIO });
    img.src = dataUrl;
  });
}

export function printDocument(): void {
  window.print();
}

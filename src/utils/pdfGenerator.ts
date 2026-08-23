import { toJpeg } from 'html-to-image';
import jsPDF from 'jspdf';

/**
 * High-fidelity, ultra-crisp multi-page A4 PDF exporter.
 * Uses native browser SVG/canvas engine (supports Tailwind v4 OKLCH colors, Google fonts & CSS variables).
 */
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
    // 1. Wait for custom web fonts (Outfit, Plus Jakarta Sans, Cinzel, Cormorant, etc.)
    if (document.fonts) {
      try {
        await document.fonts.ready;
      } catch {
        // Proceed if font loading promise errors
      }
    }

    // 2. Discover all printed pages (.print-page) inside container
    const subPages = container.querySelectorAll<HTMLElement>('.print-page');
    const pageElements: HTMLElement[] =
      subPages.length > 0 ? Array.from(subPages) : [container as HTMLElement];

    // Standard A4 Dimensions: 210mm x 297mm
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();   // 210 mm
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 297 mm

    for (let i = 0; i < pageElements.length; i++) {
      const pageEl = pageElements[i];
      if (i > 0) {
        pdf.addPage('a4', 'portrait');
      }

      // Convert page node to high-res JPEG using native browser renderer (100% OKLCH color support)
      const imgData = await toJpeg(pageEl, {
        quality: 0.96,
        pixelRatio: 2, // 300+ DPI razor-sharp print quality
        backgroundColor: '#ffffff',
        cacheBust: true,
        style: {
          transform: 'none',
          margin: '0',
          maxWidth: 'none',
          width: '794px',
        },
        filter: (node) => {
          if (node instanceof HTMLElement && node.classList.contains('no-print')) {
            return false;
          }
          return true;
        },
      });

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
    }

    // 3. Reliable Mobile & Desktop Save Trigger
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
      const pdfBlob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
        URL.revokeObjectURL(blobUrl);
      }, 2500);
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
      try {
        await document.fonts.ready;
      } catch {}
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

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    for (let i = 0; i < pageElements.length; i++) {
      const pageEl = pageElements[i];
      if (i > 0) {
        pdf.addPage('a4', 'portrait');
      }

      const imgData = await toJpeg(pageEl, {
        quality: 0.96,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        cacheBust: true,
        style: {
          transform: 'none',
          margin: '0',
          maxWidth: 'none',
          width: '794px',
        },
      });

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
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

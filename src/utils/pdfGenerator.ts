import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

export async function exportDocumentToPdf(
  elementId: string,
  fileName: string = 'Quotation-Invoix.pdf'
): Promise<boolean> {
  const container = document.getElementById(elementId);
  if (!container) {
    console.error(`Element #${elementId} not found`);
    return false;
  }

  try {
    // Wait for all custom Google Fonts to be completely loaded and rendered
    if (document.fonts) {
      await document.fonts.ready;
    }

    // Check if container has multiple sub-pages marked with .print-page
    const subPages = container.querySelectorAll<HTMLElement>('.print-page');
    const pageElements = subPages.length > 0 ? Array.from(subPages) : [container];

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

      // Generate ultra-crisp unscaled image regardless of device viewport/zoom
      const imgData = await toPng(pageEl, {
        quality: 0.98,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        cacheBust: true,
        width: 794,
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

      const img = new Image();
      img.src = imgData;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const scale = Math.min(pdfWidth / img.width, pdfHeight / img.height);
      const finalWidth = img.width * scale;
      const finalHeight = img.height * scale;
      const xOffset = (pdfWidth - finalWidth) / 2;

      pdf.addImage(imgData, 'PNG', xOffset, 0, finalWidth, finalHeight, undefined, 'FAST');
    }

    pdf.save(fileName);
    return true;
  } catch (error) {
    console.error('Error generating multi-page PDF:', error);
    return false;
  }
}

export async function generatePdfBlob(
  elementId: string,
  fileName: string = 'Quotation.pdf'
): Promise<File | null> {
  const container = document.getElementById(elementId);
  if (!container) return null;

  try {
    if (document.fonts) {
      await document.fonts.ready;
    }

    const subPages = container.querySelectorAll<HTMLElement>('.print-page');
    const pageElements = subPages.length > 0 ? Array.from(subPages) : [container];

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

      const imgData = await toPng(pageEl, {
        quality: 0.98,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        cacheBust: true,
        width: 794,
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

      const img = new Image();
      img.src = imgData;
      await new Promise((res, rej) => {
        img.onload = res;
        img.onerror = rej;
      });

      const scale = Math.min(pdfWidth / img.width, pdfHeight / img.height);
      const finalWidth = img.width * scale;
      const finalHeight = img.height * scale;
      const xOffset = (pdfWidth - finalWidth) / 2;

      pdf.addImage(imgData, 'PNG', xOffset, 0, finalWidth, finalHeight, undefined, 'FAST');
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

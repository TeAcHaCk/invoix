import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Ultra-crisp, high-fidelity multi-page A4 PDF exporter for Desktop & Mobile browsers
 */
export async function exportDocumentToPdf(
  elementId: string,
  fileName: string = 'Quotation-Invoix.pdf'
): Promise<boolean> {
  const sourceEl = document.getElementById(elementId);
  if (!sourceEl) {
    console.error(`PDF Export Error: Element #${elementId} not found in DOM`);
    return false;
  }

  // 1. Wait for Google Fonts & icon sets to fully load
  if (document.fonts) {
    try {
      await document.fonts.ready;
    } catch {
      // Proceed if fonts ready check fails
    }
  }

  // 2. Clone source element into a temporary offscreen node attached to body
  // This guarantees html2canvas finds all nodes without iframe mismatch or zoom scaling distortion
  const tempHost = document.createElement('div');
  tempHost.style.position = 'fixed';
  tempHost.style.left = '0';
  tempHost.style.top = '0';
  tempHost.style.width = '794px';
  tempHost.style.zIndex = '-99999';
  tempHost.style.opacity = '0.01'; // Near zero but non-zero so canvas renderer renders all pixels
  tempHost.style.pointerEvents = 'none';
  tempHost.style.backgroundColor = '#ffffff';

  const clonedEl = sourceEl.cloneNode(true) as HTMLElement;
  clonedEl.style.transform = 'none';
  clonedEl.style.width = '794px';
  clonedEl.style.margin = '0';
  clonedEl.style.padding = '0';

  tempHost.appendChild(clonedEl);
  document.body.appendChild(tempHost);

  try {
    const subPages = tempHost.querySelectorAll<HTMLElement>('.print-page');
    const pageElements: HTMLElement[] =
      subPages.length > 0 ? Array.from(subPages) : [clonedEl];

    // A4 Dimensions: 210mm x 297mm
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();   // 210 mm
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 297 mm

    for (let i = 0; i < pageElements.length; i++) {
      const page = pageElements[i];
      page.style.width = '794px';
      page.style.transform = 'none';

      if (i > 0) {
        pdf.addPage('a4', 'portrait');
      }

      // Render high-DPI canvas (scale 2 for crisp 300 DPI print quality)
      const canvas = await html2canvas(page, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: 794,
        windowWidth: 794,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
    }

    // 3. Trigger reliable file download for Desktop and Mobile browsers
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
      }, 2000);
    } else {
      pdf.save(fileName);
    }

    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    return false;
  } finally {
    if (document.body.contains(tempHost)) {
      document.body.removeChild(tempHost);
    }
  }
}

export async function generatePdfBlob(
  elementId: string,
  fileName: string = 'Quotation.pdf'
): Promise<File | null> {
  const sourceEl = document.getElementById(elementId);
  if (!sourceEl) return null;

  if (document.fonts) {
    try {
      await document.fonts.ready;
    } catch {
      // Continue
    }
  }

  const tempHost = document.createElement('div');
  tempHost.style.position = 'fixed';
  tempHost.style.left = '0';
  tempHost.style.top = '0';
  tempHost.style.width = '794px';
  tempHost.style.zIndex = '-99999';
  tempHost.style.opacity = '0.01';
  tempHost.style.pointerEvents = 'none';

  const clonedEl = sourceEl.cloneNode(true) as HTMLElement;
  clonedEl.style.transform = 'none';
  clonedEl.style.width = '794px';

  tempHost.appendChild(clonedEl);
  document.body.appendChild(tempHost);

  try {
    const subPages = tempHost.querySelectorAll<HTMLElement>('.print-page');
    const pageElements = subPages.length > 0 ? Array.from(subPages) : [clonedEl];

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    for (let i = 0; i < pageElements.length; i++) {
      const page = pageElements[i];
      if (i > 0) {
        pdf.addPage('a4', 'portrait');
      }

      const canvas = await html2canvas(page, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: 794,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
    }

    const blob = pdf.output('blob');
    return new File([blob], fileName, { type: 'application/pdf' });
  } catch (err) {
    console.error('Error generating PDF blob:', err);
    return null;
  } finally {
    if (document.body.contains(tempHost)) {
      document.body.removeChild(tempHost);
    }
  }
}

export function printDocument(): void {
  window.print();
}

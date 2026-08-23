import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * High-fidelity, ultra-crisp multi-page PDF exporter for Desktop & Mobile browsers
 */
export async function exportDocumentToPdf(
  elementId: string,
  fileName: string = 'Quotation-Invoix.pdf'
): Promise<boolean> {
  const container = document.getElementById(elementId);
  if (!container) {
    console.error(`PDF Export Error: Element #${elementId} not found in DOM`);
    return false;
  }

  try {
    // 1. Wait for custom web fonts (Outfit, Plus Jakarta Sans, Cinzel, etc.) to finish loading
    if (document.fonts) {
      await document.fonts.ready;
    }

    // 2. Locate all print pages (.print-page) or fallback to container
    const subPages = container.querySelectorAll<HTMLElement>('.print-page');
    const pageElements: HTMLElement[] =
      subPages.length > 0 ? Array.from(subPages) : [container];

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
      const pageEl = pageElements[i];
      if (i > 0) {
        pdf.addPage('a4', 'portrait');
      }

      // Render high-DPI canvas (scale 2.5 for 300+ DPI razor-sharp print quality)
      const canvas = await html2canvas(pageEl, {
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 794,
        ignoreElements: (element) => {
          return element.classList.contains('no-print');
        },
        onclone: (clonedDoc) => {
          // Ensure cloned element has explicit A4 width and visible styling
          const clonedPage = clonedDoc.getElementById(elementId) || clonedDoc.querySelector('.print-page');
          if (clonedPage) {
            (clonedPage as HTMLElement).style.transform = 'none';
            (clonedPage as HTMLElement).style.width = '794px';
          }
        },
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);

      // Fit to A4 page dimensions
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
    }

    // 3. Reliable Mobile & Desktop Save Execution
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
      // Direct Blob download fallback for mobile browsers (Brave, Chrome, Safari)
      const pdfBlob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      }, 1500);
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

      const canvas = await html2canvas(pageEl, {
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 794,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
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

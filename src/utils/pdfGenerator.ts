import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

export async function exportDocumentToPdf(
  elementId: string,
  fileName: string = 'Quotation-FusionBellsFilms.pdf'
): Promise<boolean> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element #${elementId} not found`);
    return false;
  }

  try {
    // Generate high-resolution PNG with html-to-image (fully supports Tailwind v4, oklch, and custom web fonts)
    const imgData = await toPng(element, {
      quality: 0.98,
      pixelRatio: 2.5,
      backgroundColor: '#ffffff',
      cacheBust: true,
      filter: (node) => {
        // Exclude elements with no-print class if any
        if (node instanceof HTMLElement && node.classList.contains('no-print')) {
          return false;
        }
        return true;
      },
    });

    // Standard A4 dimensions in mm: 210 x 297
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();   // 210 mm
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 297 mm

    // Create an image object to calculate dimensions accurately
    const img = new Image();
    img.src = imgData;
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });

    const imgWidth = img.width;
    const imgHeight = img.height;

    // Calculate scale factor so the ENTIRE document fits on 1 single A4 page with zero trimming
    const widthRatio = pdfWidth / imgWidth;
    const heightRatio = pdfHeight / imgHeight;

    // Use the scaling factor that ensures both width and height fit completely without cut-offs
    const scale = Math.min(widthRatio, heightRatio);

    const finalWidth = imgWidth * scale;
    const finalHeight = imgHeight * scale;

    // Center horizontally and align vertically from top with neat margin
    const xOffset = (pdfWidth - finalWidth) / 2;
    const yOffset = 0; // Top aligned for pristine single-page presentation

    pdf.addImage(imgData, 'PNG', xOffset, yOffset, finalWidth, finalHeight, undefined, 'FAST');

    pdf.save(fileName);
    return true;
  } catch (error) {
    console.error('Error generating PDF with html-to-image:', error);
    return false;
  }
}

export async function generatePdfBlob(
  elementId: string,
  fileName: string = 'Quotation.pdf'
): Promise<File | null> {
  const element = document.getElementById(elementId);
  if (!element) return null;

  try {
    const imgData = await toPng(element, {
      quality: 0.98,
      pixelRatio: 2.5,
      backgroundColor: '#ffffff',
      cacheBust: true,
    });

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const img = new Image();
    img.src = imgData;
    await new Promise((res, rej) => {
      img.onload = res;
      img.onerror = rej;
    });

    const widthRatio = pdfWidth / img.width;
    const heightRatio = pdfHeight / img.height;
    const scale = Math.min(widthRatio, heightRatio);

    const finalWidth = img.width * scale;
    const finalHeight = img.height * scale;
    const xOffset = (pdfWidth - finalWidth) / 2;

    pdf.addImage(imgData, 'PNG', xOffset, 0, finalWidth, finalHeight, undefined, 'FAST');

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

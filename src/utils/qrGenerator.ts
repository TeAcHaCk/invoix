import QRCode from 'qrcode';

export async function generateQrDataUrl(
  text: string,
  options?: {
    width?: number;
    margin?: number;
    darkColor?: string;
    lightColor?: string;
  }
): Promise<string> {
  if (!text || !text.trim()) {
    return '';
  }

  try {
    const dataUrl = await QRCode.toDataURL(text, {
      width: options?.width || 200,
      margin: options?.margin !== undefined ? options?.margin : 1,
      color: {
        dark: options?.darkColor || '#0f172a',
        light: options?.lightColor || '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
    return dataUrl;
  } catch (err) {
    console.error('Error generating offline QR code:', err);
    return '';
  }
}

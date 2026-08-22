export async function trimTransparentImage(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        let top: number | null = null;
        let bottom: number | null = null;
        let left: number | null = null;
        let right: number | null = null;

        for (let y = 0; y < canvas.height; y++) {
          for (let x = 0; x < canvas.width; x++) {
            const alpha = data[(y * canvas.width + x) * 4 + 3];
            if (alpha > 10) {
              if (top === null) top = y;
              bottom = y;
              if (left === null || x < left) left = x;
              if (right === null || x > right) right = x;
            }
          }
        }

        if (top === null || left === null || right === null || bottom === null) {
          resolve(dataUrl);
          return;
        }

        // Add 5px padding around the content
        const pad = 4;
        const startX = Math.max(0, left - pad);
        const startY = Math.max(0, top - pad);
        const endX = Math.min(canvas.width - 1, right + pad);
        const endY = Math.min(canvas.height - 1, bottom + pad);

        const trimWidth = endX - startX + 1;
        const trimHeight = endY - startY + 1;

        const trimmedCanvas = document.createElement('canvas');
        trimmedCanvas.width = trimWidth;
        trimmedCanvas.height = trimHeight;
        const trimmedCtx = trimmedCanvas.getContext('2d');
        if (!trimmedCtx) {
          resolve(dataUrl);
          return;
        }

        trimmedCtx.drawImage(
          canvas,
          startX,
          startY,
          trimWidth,
          trimHeight,
          0,
          0,
          trimWidth,
          trimHeight
        );
        resolve(trimmedCanvas.toDataURL('image/png'));
      } catch (e) {
        console.error('Error auto-trimming logo:', e);
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

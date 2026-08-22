export async function uploadPdfToCloud(pdfFile: File): Promise<string | null> {
  try {
    const formData = new FormData();
    formData.append('file', pdfFile);

    const response = await fetch('https://tmpfiles.org/api/v1/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed with status ${response.status}`);
    }

    const json = await response.json();
    if (json.status === 'success' && json.data?.url) {
      // Convert https://tmpfiles.org/XXXX/file.pdf to direct download link https://tmpfiles.org/dl/XXXX/file.pdf
      const rawUrl: string = json.data.url;
      const directUrl = rawUrl.replace('https://tmpfiles.org/', 'https://tmpfiles.org/dl/');
      return directUrl;
    }
    return null;
  } catch (error) {
    console.error('Error uploading PDF to cloud storage:', error);
    return null;
  }
}

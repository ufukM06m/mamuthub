import * as pdfjsLib from 'pdfjs-dist';

// Configure worker from jsdelivr matching installed pdfjs-dist version
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export interface PdfRenderResult {
  pageCount: number;
  images: string[];
}

/**
 * Converts a PDF file/dataUrl into slide image data URLs using pdfjs-dist
 */
export async function convertPdfToImages(
  pdfInput: File | ArrayBuffer | string,
  maxPages: number = 50,
  scale: number = 2.0
): Promise<PdfRenderResult> {
  try {
    let loadingTask;

    if (typeof pdfInput === 'string') {
      if (pdfInput.startsWith('data:application/pdf;base64,')) {
        const base64Data = pdfInput.split(',')[1];
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        loadingTask = pdfjsLib.getDocument({ data: bytes });
      } else {
        loadingTask = pdfjsLib.getDocument({ url: pdfInput });
      }
    } else if (pdfInput instanceof File) {
      const arrayBuffer = await pdfInput.arrayBuffer();
      loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
    } else {
      loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(pdfInput) });
    }

    const pdfDocument = await loadingTask.promise;
    const totalPages = Math.min(pdfDocument.numPages, maxPages);
    const images: string[] = [];

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      // Calculate optimal scale so max canvas width is up to 2560px (2K Ultra-Sharp) for crystal clear vector text & graphics
      const unscaledViewport = page.getViewport({ scale: 1.0 });
      const targetScale = Math.min(2.5, Math.max(1.5, 2560 / unscaledViewport.width));
      const viewport = page.getViewport({ scale: targetScale });

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d', { alpha: false });
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      if (context) {
        // High quality image smoothing
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';

        // Fill white background
        context.fillStyle = '#FFFFFF';
        context.fillRect(0, 0, canvas.width, canvas.height);

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;
        // High-fidelity JPEG (0.92) - visually indistinguishable from native PDF vectors on 2K/4K displays
        const imageUrl = canvas.toDataURL('image/jpeg', 0.92);
        images.push(imageUrl);
      }
    }

    return {
      pageCount: pdfDocument.numPages,
      images,
    };
  } catch (error) {
    console.warn('PDF sayfalara dönüştürülürken hata oluştu, PDF moduna düşülüyor:', error);
    return {
      pageCount: 1,
      images: [],
    };
  }
}

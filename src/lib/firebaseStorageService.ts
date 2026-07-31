import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

function withTimeout<T>(promise: Promise<T>, ms: number = 8000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Storage operation timed out after ${ms}ms`)), ms)
    ),
  ]);
}

/**
 * Converts a base64 Data URL (e.g., data:application/pdf;base64,...) to a Blob
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  if (!dataUrl || !dataUrl.includes(',')) {
    throw new Error('Invalid Data URL');
  }
  const parts = dataUrl.split(',');
  const mimeMatch = parts[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
  const bstr = atob(parts[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * Uploads a PDF file or base64 PDF Data URL to Firebase Storage
 * Returns the public HTTPS download URL or null on failure
 */
export async function uploadPdfToStorage(
  presId: string,
  pdfInput: Blob | File | string
): Promise<string | null> {
  try {
    let blob: Blob;
    if (typeof pdfInput === 'string') {
      if (pdfInput.startsWith('https://') || pdfInput.startsWith('http://')) {
        return pdfInput; // Already hosted
      }
      blob = dataUrlToBlob(pdfInput);
    } else {
      blob = pdfInput;
    }

    const storageRef = ref(storage, `presentations/${presId}/document.pdf`);
    const snapshot = await withTimeout(
      uploadBytes(storageRef, blob, {
        contentType: 'application/pdf',
        customMetadata: { presentationId: presId },
      }),
      10000
    );

    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  } catch (error) {
    console.warn('Firebase Storage PDF yükleme uyarısı (fallback kullanılıyor):', error);
    return null;
  }
}

/**
 * Uploads cover thumbnail image to Firebase Storage
 */
export async function uploadThumbnailToStorage(
  presId: string,
  thumbnailUrl: string
): Promise<string | null> {
  try {
    if (!thumbnailUrl || typeof thumbnailUrl !== 'string') return null;
    if (thumbnailUrl.startsWith('https://') || thumbnailUrl.startsWith('http://')) {
      return thumbnailUrl;
    }
    if (!thumbnailUrl.startsWith('data:image/')) return null;

    const blob = dataUrlToBlob(thumbnailUrl);
    const storageRef = ref(storage, `presentations/${presId}/thumbnail.jpg`);
    const snapshot = await withTimeout(
      uploadBytes(storageRef, blob, {
        contentType: 'image/jpeg',
        customMetadata: { presentationId: presId },
      }),
      8000
    );

    return await getDownloadURL(snapshot.ref);
  } catch (error) {
    console.warn('Firebase Storage Thumbnail yükleme hatası:', error);
    return null;
  }
}

/**
 * Uploads high-res slide images to Firebase Storage
 * Returns array of HTTPS download URLs or null on failure
 */
export async function uploadSlideImagesToStorage(
  presId: string,
  images: string[],
  onProgress?: (completed: number, total: number) => void
): Promise<string[] | null> {
  if (!images || !Array.isArray(images) || images.length === 0) {
    return [];
  }

  const downloadUrls: string[] = new Array(images.length);
  try {
    const tasks: Array<() => Promise<void>> = [];

    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      if (typeof img === 'string' && (img.startsWith('https://') || img.startsWith('http://'))) {
        downloadUrls[i] = img;
      } else if (typeof img === 'string' && img.startsWith('data:image/')) {
        tasks.push(async () => {
          try {
            const blob = dataUrlToBlob(img);
            const fileRef = ref(storage, `presentations/${presId}/slides/slide_${i + 1}.jpg`);
            const snapshot = await withTimeout(
              uploadBytes(fileRef, blob, {
                contentType: 'image/jpeg',
                customMetadata: { presentationId: presId, slideNumber: String(i + 1) },
              }),
              8000
            );
            downloadUrls[i] = await getDownloadURL(snapshot.ref);
          } catch {
            downloadUrls[i] = img; // Fallback to base64 if storage upload fails or times out
          }
        });
      } else {
        downloadUrls[i] = img;
      }
    }

    const BATCH_SIZE = 5;
    for (let i = 0; i < tasks.length; i += BATCH_SIZE) {
      const batch = tasks.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map((fn) => fn()));
      if (onProgress) {
        onProgress(Math.min(i + BATCH_SIZE, tasks.length), tasks.length);
      }
    }
    return downloadUrls;
  } catch (error) {
    console.warn('Firebase Storage slayt görselleri yükleme uyarısı:', error);
    return downloadUrls;
  }
}

/**
 * Deletes presentation files from Firebase Storage when deleted from app
 */
export async function deletePresentationFromStorage(presId: string, pageCount: number = 30): Promise<void> {
  try {
    const pdfRef = ref(storage, `presentations/${presId}/document.pdf`);
    await deleteObject(pdfRef).catch(() => {});

    const thumbRef = ref(storage, `presentations/${presId}/thumbnail.jpg`);
    await deleteObject(thumbRef).catch(() => {});

    for (let i = 1; i <= pageCount; i++) {
      const slideRef = ref(storage, `presentations/${presId}/slides/slide_${i}.jpg`);
      await deleteObject(slideRef).catch(() => {});
    }
  } catch {
    // ignore cleanups errors
  }
}

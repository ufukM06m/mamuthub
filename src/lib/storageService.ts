import {
  uploadPdfToStorage,
  uploadThumbnailToStorage,
  uploadSlideImagesToStorage,
} from './firebaseStorageService';

// Service for persistent local storage using IndexedDB & LocalStorage
// Handles large assets (PDF data URLs, extracted base64 slide images) that exceed Firestore's 1MB limit

const DB_NAME = 'MamutHubDB';

const DB_VERSION = 1;
const PRESENTATIONS_STORE = 'presentations';
const TAXONOMY_STORE = 'taxonomy';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(PRESENTATIONS_STORE)) {
        db.createObjectStore(PRESENTATIONS_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(TAXONOMY_STORE)) {
        db.createObjectStore(TAXONOMY_STORE, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Get deleted presentation IDs from localStorage
export function getDeletedPresIds(): string[] {
  try {
    const saved = localStorage.getItem('mamuthub_deleted_pres_ids');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function addDeletedPresId(id: string): void {
  try {
    const current = getDeletedPresIds();
    if (!current.includes(id)) {
      current.push(id);
      localStorage.setItem('mamuthub_deleted_pres_ids', JSON.stringify(current));
    }
  } catch {
    // ignore
  }
}

export function clearDeletedPresIds(): void {
  try {
    localStorage.removeItem('mamuthub_deleted_pres_ids');
  } catch {
    // ignore
  }
}

// Save full presentation (including large base64 pdfUrl and extractedImages) to IndexedDB
export async function saveLocalPresentation<T extends { id: string; pdfUrl?: string; extractedImages?: string[] }>(presentation: T): Promise<void> {
  // If user un-deletes or re-saves, remove from deleted IDs
  try {
    const deleted = getDeletedPresIds();
    if (deleted.includes(presentation.id)) {
      const updated = deleted.filter((d) => d !== presentation.id);
      localStorage.setItem('mamuthub_deleted_pres_ids', JSON.stringify(updated));
    }
  } catch {
    // ignore
  }

  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(PRESENTATIONS_STORE, 'readwrite');
      const store = tx.objectStore(PRESENTATIONS_STORE);
      const getReq = store.get(presentation.id);
      getReq.onsuccess = () => {
        const existing = getReq.result as T | undefined;
        let toSave = presentation;
        if (existing) {
          toSave = {
            ...existing,
            ...presentation,
            pdfUrl: presentation.pdfUrl || existing.pdfUrl,
            extractedImages:
              (presentation.extractedImages && presentation.extractedImages.length >= (existing.extractedImages?.length || 0))
                ? presentation.extractedImages
                : (existing.extractedImages || presentation.extractedImages),
          };
        }
        const putReq = store.put(toSave);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      };
      getReq.onerror = () => {
        const req = store.put(presentation);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      };
    });
  } catch (err) {
    console.warn('Failed to save presentation to IndexedDB:', err);
    // LocalStorage fallback for non-huge items
    try {
      const saved = localStorage.getItem('mamuthub_local_presentations');
      const list: T[] = saved ? JSON.parse(saved) : [];
      const updated = [...list.filter((p) => p.id !== presentation.id), presentation];
      localStorage.setItem('mamuthub_local_presentations', JSON.stringify(updated));
    } catch {
      // ignore
    }
  }
}

// Get all local presentations from IndexedDB
export async function getLocalPresentations<T extends { id: string }>(): Promise<T[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(PRESENTATIONS_STORE, 'readonly');
      const store = tx.objectStore(PRESENTATIONS_STORE);
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result as T[]) || []);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to load presentations from IndexedDB:', err);
    try {
      const saved = localStorage.getItem('mamuthub_local_presentations');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }
}

// Delete presentation from IndexedDB
export async function deleteLocalPresentation(id: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(PRESENTATIONS_STORE, 'readwrite');
      const store = tx.objectStore(PRESENTATIONS_STORE);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to delete presentation from IndexedDB:', err);
  }
}

// Downscale and compress an image data URL using HTML Canvas
export async function compressImageDataUrl(
  dataUrl: string,
  maxWidth: number = 800,
  quality: number = 0.65
): Promise<string> {
  if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) {
    return dataUrl;
  }
  // Return early if already small (< 35 KB)
  if (dataUrl.length < 35 * 1024) {
    return dataUrl;
  }

  return new Promise((resolve) => {
    // Timeout safety fallback (2 seconds max)
    const timer = setTimeout(() => resolve(dataUrl), 2000);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      clearTimeout(timer);
      try {
        const scale = Math.min(1, maxWidth / img.width);
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'medium';
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed.length < dataUrl.length ? compressed : dataUrl);
        } else {
          resolve(dataUrl);
        }
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => {
      clearTimeout(timer);
      resolve(dataUrl);
    };
    img.src = dataUrl;
  });
}

// Create safe payload for Firestore. First attempts to upload full 4K PDF and slide images
// to Firebase Storage so ALL devices get 100% original crystal-clear resolution via HTTPS URLs.
// Falls back to safe base64 compression if Cloud Storage is unavailable.
export async function sanitizePresentationForFirestore<T extends Record<string, any>>(pres: T): Promise<T> {
  // 1. Deep clone & auto-purge all undefined keys
  const sanitized: Record<string, any> = JSON.parse(
    JSON.stringify(pres, (key, value) => {
      if (value === undefined) return undefined;
      return value;
    })
  );

  const presId = sanitized.id || 'pres_' + Date.now();

  // 2. Try Cloud Storage Upload for PDF binary
  if (typeof sanitized.pdfUrl === 'string' && sanitized.pdfUrl.startsWith('data:')) {
    const storagePdfUrl = await uploadPdfToStorage(presId, sanitized.pdfUrl);
    if (storagePdfUrl) {
      sanitized.pdfUrl = storagePdfUrl;
    } else {
      // Fallback: strip base64 PDF binary from Firestore payload (stored in local IndexedDB)
      delete sanitized.pdfUrl;
    }
  }

  // 3. Try Cloud Storage Upload for cover Thumbnail
  if (typeof sanitized.thumbnailUrl === 'string' && sanitized.thumbnailUrl.startsWith('data:image/')) {
    const storageThumbUrl = await uploadThumbnailToStorage(presId, sanitized.thumbnailUrl);
    if (storageThumbUrl) {
      sanitized.thumbnailUrl = storageThumbUrl;
    } else {
      sanitized.thumbnailUrl = await compressImageDataUrl(sanitized.thumbnailUrl, 500, 0.7);
    }
  }

  // 4. Try Cloud Storage Upload for high-res slide images
  if (Array.isArray(sanitized.extractedImages) && sanitized.extractedImages.length > 0) {
    const hasBase64 = sanitized.extractedImages.some((img: string) => typeof img === 'string' && img.startsWith('data:image/'));
    if (hasBase64) {
      const storageSlideUrls = await uploadSlideImagesToStorage(presId, sanitized.extractedImages);
      if (storageSlideUrls && storageSlideUrls.length > 0) {
        sanitized.extractedImages = storageSlideUrls;
      } else {
        // Fallback: compress slide images for Firestore payload
        const slideImages = sanitized.extractedImages.slice(0, 15);
        const compressedList: string[] = [];
        for (const imgUrl of slideImages) {
          if (typeof imgUrl === 'string' && imgUrl.startsWith('data:image/')) {
            const compressed = await compressImageDataUrl(imgUrl, 800, 0.7);
            compressedList.push(compressed);
          } else {
            compressedList.push(imgUrl);
          }
        }
        sanitized.extractedImages = compressedList;
      }
    }
  }

  // 5. Final safety boundary: if total payload is still over 600 KB, slice/remove extractedImages to guarantee Firestore write
  if (JSON.stringify(sanitized).length > 600 * 1024) {
    if (Array.isArray(sanitized.extractedImages)) {
      sanitized.extractedImages = sanitized.extractedImages.slice(0, 3);
    }
  }
  if (JSON.stringify(sanitized).length > 700 * 1024) {
    delete sanitized.extractedImages;
  }

  return sanitized as T;
}


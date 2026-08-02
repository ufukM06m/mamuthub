import {
  uploadPdfToStorage,
  uploadThumbnailToStorage,
  uploadSlideImagesToStorage,
} from './firebaseStorageService';
import { savePresentationAssets } from './firestoreService';

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

// Persistent Favorites in localStorage
export function getFavoritePresIds(): string[] {
  try {
    const saved = localStorage.getItem('mamuthub_favorites');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function saveFavoritePresIds(favIds: string[]): void {
  try {
    localStorage.setItem('mamuthub_favorites', JSON.stringify(favIds));
  } catch {
    // ignore
  }
}

export function toggleFavoritePresId(id: string): boolean {
  const current = getFavoritePresIds();
  const exists = current.includes(id);
  const updated = exists ? current.filter((favId) => favId !== id) : [...current, id];
  saveFavoritePresIds(updated);
  return !exists;
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

  // Sync memory cache if assets are provided
  if (presentation.pdfUrl || (presentation.extractedImages && presentation.extractedImages.length > 0)) {
    savePresentationAssets(presentation.id, presentation.pdfUrl, presentation.extractedImages).catch(() => {});
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
            pdfUrl: presentation.pdfUrl !== undefined ? presentation.pdfUrl : existing.pdfUrl,
            extractedImages:
              presentation.extractedImages && presentation.extractedImages.length > 0
                ? presentation.extractedImages
                : existing.extractedImages,
          };
        }
        // Update memory cache with final object
        savePresentationAssets(toSave.id, toSave.pdfUrl, toSave.extractedImages).catch(() => {});
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
  } finally {
    // Always sync synchronous localStorage backup for instant startup recovery across sessions
    try {
      const saved = localStorage.getItem('mamuthub_local_presentations');
      const list: any[] = saved ? JSON.parse(saved) : [];
      const lightweight = { ...presentation };
      if (typeof lightweight.pdfUrl === 'string' && lightweight.pdfUrl.startsWith('data:')) {
        delete lightweight.pdfUrl;
      }
      const updatedList = [...list.filter((p) => p.id !== presentation.id), lightweight];
      localStorage.setItem('mamuthub_local_presentations', JSON.stringify(updatedList));
    } catch {
      // ignore
    }
  }
}

// Get all local presentations from IndexedDB & LocalStorage backup
export async function getLocalPresentations<T extends { id: string }>(): Promise<T[]> {
  const localBackup: T[] = (() => {
    try {
      const saved = localStorage.getItem('mamuthub_local_presentations');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  })();

  try {
    const db = await openDB();
    const idbPres = await new Promise<T[]>((resolve, reject) => {
      const tx = db.transaction(PRESENTATIONS_STORE, 'readonly');
      const store = tx.objectStore(PRESENTATIONS_STORE);
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result as T[]) || []);
      req.onerror = () => reject(req.error);
    });

    const map = new Map<string, T>();
    localBackup.forEach((p) => map.set(p.id, p));
    idbPres.forEach((p) => {
      const existing = map.get(p.id);
      map.set(p.id, existing ? { ...existing, ...p } : p);
    });
    return Array.from(map.values());
  } catch (err) {
    console.warn('Failed to load presentations from IndexedDB:', err);
    return localBackup;
  }
}

// Delete presentation from IndexedDB
export async function deleteLocalPresentation(id: string): Promise<void> {
  try {
    const saved = localStorage.getItem('mamuthub_local_presentations');
    if (saved) {
      const list: any[] = JSON.parse(saved);
      const updated = list.filter((p) => p.id !== id);
      localStorage.setItem('mamuthub_local_presentations', JSON.stringify(updated));
    }
  } catch {
    // ignore
  }
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

// Purge all local presentation records from IndexedDB and LocalStorage
export async function purgeAllLocalPresentations(): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(PRESENTATIONS_STORE, 'readwrite');
      const store = tx.objectStore(PRESENTATIONS_STORE);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to clear IndexedDB presentations:', err);
  }

  try {
    localStorage.removeItem('mamuthub_local_presentations');
    localStorage.removeItem('mamuthub_favorites');
  } catch {
    // ignore
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
// Falls back to sub-document Firestore assets if Cloud Storage is unavailable.
export async function sanitizePresentationForFirestore<T extends Record<string, any>>(pres: T): Promise<T> {
  // 1. Deep clone & auto-purge all undefined keys
  const sanitized: Record<string, any> = JSON.parse(
    JSON.stringify(pres, (key, value) => {
      if (value === undefined) return undefined;
      return value;
    })
  );

  const presId = sanitized.id || 'pres_' + Date.now();

  // Update memory cache
  savePresentationAssets(presId, pres.pdfUrl, pres.extractedImages).catch(() => {});

  // 2. Try Cloud Storage Upload for PDF binary
  if (typeof sanitized.pdfUrl === 'string' && sanitized.pdfUrl.startsWith('data:')) {
    const storagePdfUrl = await uploadPdfToStorage(presId, sanitized.pdfUrl);
    if (storagePdfUrl) {
      sanitized.pdfUrl = storagePdfUrl;
    } else {
      // Strip heavy base64 PDF binary from main Firestore document (stored locally in IndexedDB)
      delete sanitized.pdfUrl;
    }
  }

  // 3. Try Cloud Storage Upload for cover Thumbnail
  if (typeof sanitized.thumbnailUrl === 'string' && sanitized.thumbnailUrl.startsWith('data:image/')) {
    const storageThumbUrl = await uploadThumbnailToStorage(presId, sanitized.thumbnailUrl);
    if (storageThumbUrl) {
      sanitized.thumbnailUrl = storageThumbUrl;
    } else {
      // Compress thumbnail to lightweight preview (~15-30KB)
      sanitized.thumbnailUrl = await compressImageDataUrl(sanitized.thumbnailUrl, 350, 0.5);
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
        // Strip heavy base64 slide images from main Firestore document (stored locally in IndexedDB)
        delete sanitized.extractedImages;
      }
    }
  }

  return sanitized as T;
}



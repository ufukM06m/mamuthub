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
export async function saveLocalPresentation<T extends { id: string }>(presentation: T): Promise<void> {
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
      const req = store.put(presentation);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
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

// Create safe payload for Firestore by stripping huge base64 strings and undefined values
export function sanitizePresentationForFirestore<T extends Record<string, any>>(pres: T): T {
  // 1. Deep clone & auto-purge all undefined keys
  const sanitized: Record<string, any> = JSON.parse(
    JSON.stringify(pres, (key, value) => {
      if (value === undefined) return undefined;
      return value;
    })
  );

  // 2. Strip huge PDF base64 data URLs for Firestore payload (stored permanently in local IndexedDB)
  if (
    typeof sanitized.pdfUrl === 'string' &&
    (sanitized.pdfUrl.startsWith('data:') || sanitized.pdfUrl.length > 100 * 1024)
  ) {
    delete sanitized.pdfUrl;
  }

  // 3. Keep thumbnail or first 2 slide images if extractedImages array is large
  if (Array.isArray(sanitized.extractedImages) && sanitized.extractedImages.length > 2) {
    sanitized.extractedImages = sanitized.extractedImages.slice(0, 2);
  }

  // 4. Ensure total payload size is safely under Firestore's 1MB limit (max 500KB)
  if (JSON.stringify(sanitized).length > 500 * 1024) {
    delete sanitized.extractedImages;
  }

  return sanitized as T;
}

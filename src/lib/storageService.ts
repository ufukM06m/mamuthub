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

// Save full presentation (including large base64 pdfUrl and extractedImages) to IndexedDB
export async function saveLocalPresentation<T extends { id: string }>(presentation: T): Promise<void> {
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

// Create safe payload for Firestore by trimming/compressing huge base64 strings if over 800KB
export function sanitizePresentationForFirestore<T extends Record<string, any>>(pres: T): T {
  const jsonStr = JSON.stringify(pres);
  // 800 KB safety boundary for 1MB Firestore limit
  if (jsonStr.length < 800 * 1024) {
    return pres;
  }

  // If presentation object is too large due to extractedImages or pdfUrl, create a lightweight version for Firestore
  const sanitized = { ...pres };
  
  // Keep thumbnail or first 1-2 slide images if extractedImages is huge
  if (Array.isArray(sanitized.extractedImages) && sanitized.extractedImages.length > 3) {
    sanitized.extractedImages = sanitized.extractedImages.slice(0, 3);
  }

  // If pdfUrl is a huge base64 data URL, clear it in Firestore payload (it will stay in IndexedDB)
  if (typeof sanitized.pdfUrl === 'string' && sanitized.pdfUrl.startsWith('data:') && sanitized.pdfUrl.length > 500 * 1024) {
    sanitized.pdfUrl = undefined;
  }

  return sanitized;
}

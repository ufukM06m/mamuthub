import {
  collection,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';
import {
  uploadPdfToStorage,
  uploadSlideImagesToStorage,
  deletePresentationFromStorage,
} from './firebaseStorageService';

let isFirestoreQuotaExceeded = false;
type QuotaListener = (isQuota: boolean) => void;
const quotaListeners = new Set<QuotaListener>();

export function getIsQuotaExceeded(): boolean {
  return isFirestoreQuotaExceeded;
}

export function onQuotaExceededChange(listener: QuotaListener): () => void {
  quotaListeners.add(listener);
  return () => quotaListeners.delete(listener);
}

function checkQuotaError(err: any): boolean {
  if (
    err?.code === 'resource-exhausted' ||
    err?.message?.includes('Quota limit exceeded') ||
    err?.message?.includes('resource-exhausted')
  ) {
    if (!isFirestoreQuotaExceeded) {
      isFirestoreQuotaExceeded = true;
      quotaListeners.forEach((l) => l(true));
      console.info('ℹ️ Firestore günlük ücretsiz okuma/yazma kotası doldu. Sistem otomatik olarak %100 yerel IndexedDB depolama modunda kesintisiz çalışıyor.');
    }
    return true;
  }
  return false;
}

export function subscribeToCollection<T extends { id: string }>(
  collectionName: string,
  initialDataIfEmpty: T[],
  onData: (data: T[]) => void
) {
  if (isFirestoreQuotaExceeded) {
    onData([]);
    return () => {};
  }

  const colRef = collection(db, collectionName);

  let unsubscribing = false;
  const unsubscribe = onSnapshot(
    colRef,
    (snapshot) => {
      if (snapshot.empty) {
        onData([]);
      } else {
        const items = snapshot.docs.map((docSnap) => ({
          ...docSnap.data(),
          id: docSnap.id,
        })) as T[];
        onData(items);
      }
    },
    (error) => {
      const isQuota = checkQuotaError(error);
      if (!isQuota) {
        console.warn(`Firestore subscription warning [${collectionName}]:`, error?.message || error);
      }
      if (isQuota && !unsubscribing) {
        unsubscribing = true;
        try {
          unsubscribe();
        } catch {
          // ignore
        }
        onData([]);
      }
    }
  );

  return () => {
    unsubscribing = true;
    try {
      unsubscribe();
    } catch {
      // ignore
    }
  };
}

export async function upsertItem<T extends { id: string }>(
  collectionName: string,
  item: T
): Promise<{ success: boolean; isQuota: boolean }> {
  if (isFirestoreQuotaExceeded) return { success: false, isQuota: true };
  try {
    const docRef = doc(db, collectionName, item.id);
    const cleanItem = JSON.parse(JSON.stringify(item));
    await setDoc(docRef, cleanItem, { merge: true });
    return { success: true, isQuota: false };
  } catch (err) {
    const isQuota = checkQuotaError(err);
    console.warn(`Error saving item to ${collectionName}:`, err);
    return { success: false, isQuota };
  }
}

export async function removeItem(collectionName: string, id: string) {
  if (isFirestoreQuotaExceeded) return;
  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
  } catch (err) {
    checkQuotaError(err);
    console.warn(`Error deleting item from ${collectionName}:`, err);
  }
}

export async function getItemById<T extends { id: string }>(
  collectionName: string,
  id: string
): Promise<T | null> {
  if (isFirestoreQuotaExceeded) return null;
  try {
    const docRef = doc(db, collectionName, id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as T;
    }
  } catch (err) {
    checkQuotaError(err);
    console.warn(`Error fetching ${collectionName}/${id}:`, err);
  }
  return null;
}

export async function replaceCollection<T extends { id: string }>(
  collectionName: string,
  newItems: T[]
) {
  if (isFirestoreQuotaExceeded) return;
  try {
    const snapshot = await getDocs(collection(db, collectionName));
    const batch = writeBatch(db);
    snapshot.docs.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
    newItems.forEach((item) => {
      const docRef = doc(db, collectionName, item.id);
      batch.set(docRef, item);
    });
    await batch.commit();
  } catch (err) {
    checkQuotaError(err);
    console.warn(`Error replacing collection ${collectionName}:`, err);
  }
}

export async function purgeAllFirestorePresentations(): Promise<void> {
  if (isFirestoreQuotaExceeded) return;
  try {
    const presSnap = await getDocs(collection(db, 'presentations'));
    await Promise.all(
      presSnap.docs.map(async (d) => {
        deletePresentationFromStorage(d.id).catch(() => {});
        return deleteDoc(d.ref).catch(() => {});
      })
    );

    try {
      const assetsSnap = await getDocs(collection(db, 'presentation_assets'));
      await Promise.all(assetsSnap.docs.map((d) => deleteDoc(d.ref).catch(() => {})));
    } catch {
      // ignore
    }

    assetMemoryCache.clear();
  } catch (err) {
    console.warn('Error purging firestore presentations:', err);
  }
}

const assetMemoryCache = new Map<string, { pdfUrl?: string; extractedImages?: string[] }>();

export function clearPresentationAssetCache(presId: string): void {
  assetMemoryCache.delete(presId);
}

// Save presentation assets directly to Firebase Cloud Storage (0 Firestore read/write quota spent for chunks)
export async function savePresentationAssets(
  presId: string,
  pdfUrl?: string,
  extractedImages?: string[]
): Promise<{ pdfUrl?: string; extractedImages?: string[] }> {
  let finalPdfUrl = pdfUrl;
  let finalImages = extractedImages;

  try {
    // 1. Upload Base64 PDF to Cloud Storage
    if (pdfUrl && pdfUrl.startsWith('data:')) {
      const storagePdfUrl = await uploadPdfToStorage(presId, pdfUrl);
      if (storagePdfUrl) {
        finalPdfUrl = storagePdfUrl;
      }
    }

    // 2. Upload Base64 Slide Images to Cloud Storage
    if (extractedImages && extractedImages.length > 0) {
      const hasBase64 = extractedImages.some((img) => typeof img === 'string' && img.startsWith('data:image/'));
      if (hasBase64) {
        const storageSlideUrls = await uploadSlideImagesToStorage(presId, extractedImages);
        if (storageSlideUrls && storageSlideUrls.length > 0) {
          finalImages = storageSlideUrls;
        }
      }
    }
  } catch (err) {
    console.warn('Cloud Storage asset save warning:', err);
  }

  const result = { pdfUrl: finalPdfUrl, extractedImages: finalImages };
  assetMemoryCache.set(presId, result);
  return result;
}

// Load presentation assets from Memory Cache, IndexedDB, or Firebase Storage (0 Firestore reads!)
export async function loadPresentationAssets(presId: string): Promise<{ pdfUrl?: string; extractedImages?: string[] }> {
  if (assetMemoryCache.has(presId)) {
    const cached = assetMemoryCache.get(presId)!;
    if (cached.pdfUrl || (cached.extractedImages && cached.extractedImages.length > 0)) {
      return cached;
    }
  }

  // Check IndexedDB
  try {
    if (window.indexedDB) {
      const dbReq = window.indexedDB.open('MamutHubDB', 1);
      const localAssets = await new Promise<{ pdfUrl?: string; extractedImages?: string[] } | null>((resolve) => {
        dbReq.onsuccess = () => {
          const idb = dbReq.result;
          if (idb.objectStoreNames.contains('presentations')) {
            const tx = idb.transaction('presentations', 'readonly');
            const store = tx.objectStore('presentations');
            const getReq = store.get(presId);
            getReq.onsuccess = () => {
              const res = getReq.result;
              if (res && (res.pdfUrl || (res.extractedImages && res.extractedImages.length > 0))) {
                resolve({ pdfUrl: res.pdfUrl, extractedImages: res.extractedImages });
              } else {
                resolve(null);
              }
            };
            getReq.onerror = () => resolve(null);
          } else {
            resolve(null);
          }
        };
        dbReq.onerror = () => resolve(null);
      });

      if (localAssets) {
        assetMemoryCache.set(presId, localAssets);
        return localAssets;
      }
    }
  } catch {
    // ignore
  }

  // Check Cloud Storage directly via getDownloadURL (0 Firestore read units consumed!)
  try {
    const pdfRef = ref(storage, `presentations/${presId}/document.pdf`);
    const storagePdfUrl = await getDownloadURL(pdfRef).catch(() => undefined);

    if (storagePdfUrl) {
      const result = { pdfUrl: storagePdfUrl, extractedImages: undefined };
      assetMemoryCache.set(presId, result);
      return result;
    }
  } catch {
    // ignore
  }

  return {};
}


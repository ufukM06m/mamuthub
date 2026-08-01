import {
  collection,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
  query,
  where,
} from 'firebase/firestore';
import { db } from './firebase';

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
    await Promise.all(presSnap.docs.map((d) => deleteDoc(d.ref).catch(() => {})));

    const assetsSnap = await getDocs(collection(db, 'presentation_assets'));
    await Promise.all(assetsSnap.docs.map((d) => deleteDoc(d.ref).catch(() => {})));

    assetMemoryCache.clear();
  } catch (err) {
    console.warn('Error purging firestore presentations:', err);
  }
}

const assetMemoryCache = new Map<string, { pdfUrl?: string; extractedImages?: string[] }>();

export function clearPresentationAssetCache(presId: string): void {
  assetMemoryCache.delete(presId);
}

// Save large presentation assets in active memory cache (local IndexedDB holds permanent copy)
export async function savePresentationAssets(presId: string, pdfUrl?: string, extractedImages?: string[]): Promise<void> {
  assetMemoryCache.set(presId, { pdfUrl, extractedImages });
}

// Load presentation assets from Firestore in ONE single query call with fast timeout
export async function loadPresentationAssets(presId: string): Promise<{ pdfUrl?: string; extractedImages?: string[] }> {
  if (assetMemoryCache.has(presId)) {
    return assetMemoryCache.get(presId)!;
  }
  if (isFirestoreQuotaExceeded) return {};

  try {
    const fetchPromise = (async () => {
      let pdfUrl: string | undefined;
      const chunkMap = new Map<number, string>();
      const slideMap = new Map<number, string>();

      const q = query(collection(db, 'presentation_assets'), where('presId', '==', presId));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return {};
      }

      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        const id = docSnap.id;

        if (id === `${presId}_pdf`) {
          pdfUrl = data.data;
        } else if (id.startsWith(`${presId}_pdf_`)) {
          const idx = data.index !== undefined ? Number(data.index) : parseInt(id.replace(`${presId}_pdf_`, ''), 10);
          if (!isNaN(idx) && data.chunk) {
            chunkMap.set(idx, data.chunk);
          }
        } else if (id.startsWith(`${presId}_slide_`)) {
          const idx = data.slideIndex !== undefined ? Number(data.slideIndex) : parseInt(id.replace(`${presId}_slide_`, ''), 10);
          if (!isNaN(idx) && data.data) {
            slideMap.set(idx, data.data);
          }
        }
      });

      if (chunkMap.size > 0) {
        const sortedIndexes = Array.from(chunkMap.keys()).sort((a, b) => a - b);
        pdfUrl = sortedIndexes.map((idx) => chunkMap.get(idx)).join('');
      }

      let sortedImages: string[] | undefined;
      if (slideMap.size > 0) {
        const sortedSlideIndexes = Array.from(slideMap.keys()).sort((a, b) => a - b);
        sortedImages = sortedSlideIndexes.map((idx) => slideMap.get(idx)!);
      }

      const result = {
        pdfUrl: pdfUrl || undefined,
        extractedImages: sortedImages,
      };

      if (result.pdfUrl || (result.extractedImages && result.extractedImages.length > 0)) {
        assetMemoryCache.set(presId, result);
      }

      return result;
    })();

    const result = await Promise.race([
      fetchPromise,
      new Promise<{ pdfUrl?: string; extractedImages?: string[] }>((resolve) =>
        setTimeout(() => resolve({}), 1200)
      ),
    ]);

    return result;
  } catch (err) {
    checkQuotaError(err);
    console.warn('Failed to load presentation assets from Firestore:', err);
    return {};
  }
}


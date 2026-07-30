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

export function subscribeToCollection<T extends { id: string }>(
  collectionName: string,
  initialDataIfEmpty: T[],
  onData: (data: T[]) => void
) {
  const colRef = collection(db, collectionName);

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
      console.warn(`Firestore subscription warning [${collectionName}]:`, error);
      onData([]);
    }
  );

  return unsubscribe;
}

export async function upsertItem<T extends { id: string }>(
  collectionName: string,
  item: T
) {
  try {
    const docRef = doc(db, collectionName, item.id);
    const cleanItem = JSON.parse(JSON.stringify(item));
    await setDoc(docRef, cleanItem, { merge: true });
  } catch (err) {
    console.error(`Error saving item to ${collectionName}:`, err);
  }
}

export async function removeItem(collectionName: string, id: string) {
  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
  } catch (err) {
    console.error(`Error deleting item from ${collectionName}:`, err);
  }
}

export async function replaceCollection<T extends { id: string }>(
  collectionName: string,
  newItems: T[]
) {
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
    console.error(`Error replacing collection ${collectionName}:`, err);
  }
}

const assetMemoryCache = new Map<string, { pdfUrl?: string; extractedImages?: string[] }>();

// Save large presentation assets (base64 PDF data & slide images) to separate Firestore sub-documents
export async function savePresentationAssets(presId: string, pdfUrl?: string, extractedImages?: string[]): Promise<void> {
  assetMemoryCache.set(presId, { pdfUrl, extractedImages });
  try {
    const tasks: Array<() => Promise<void>> = [];

    if (pdfUrl && pdfUrl.startsWith('data:')) {
      const chunkSize = 250 * 1024;
      if (pdfUrl.length <= chunkSize) {
        tasks.push(() => setDoc(doc(db, 'presentation_assets', `${presId}_pdf`), { data: pdfUrl, presId }));
      } else {
        const totalChunks = Math.ceil(pdfUrl.length / chunkSize);
        for (let i = 0; i < totalChunks; i++) {
          const chunk = pdfUrl.slice(i * chunkSize, (i + 1) * chunkSize);
          tasks.push(() => setDoc(doc(db, 'presentation_assets', `${presId}_pdf_${i}`), { chunk, presId, index: i, total: totalChunks }));
        }
      }
    }
    if (Array.isArray(extractedImages) && extractedImages.length > 0) {
      for (let i = 0; i < extractedImages.length; i++) {
        const img = extractedImages[i];
        if (img && typeof img === 'string' && img.startsWith('data:')) {
          tasks.push(() => setDoc(doc(db, 'presentation_assets', `${presId}_slide_${i}`), { data: img, presId, slideIndex: i }));
        }
      }
    }

    // Execute in batches of 6 concurrent requests to prevent Firestore connection drops
    const BATCH_SIZE = 6;
    for (let i = 0; i < tasks.length; i += BATCH_SIZE) {
      const batch = tasks.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map((fn) => fn().catch((err) => console.warn('Asset save chunk warning:', err))));
    }
  } catch (err) {
    console.warn('Failed to save presentation assets to Firestore:', err);
  }
}

// Load presentation assets from Firestore in ONE single query call
export async function loadPresentationAssets(presId: string): Promise<{ pdfUrl?: string; extractedImages?: string[] }> {
  if (assetMemoryCache.has(presId)) {
    return assetMemoryCache.get(presId)!;
  }
  try {
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
  } catch (err) {
    console.warn('Failed to load presentation assets from Firestore:', err);
    return {};
  }
}


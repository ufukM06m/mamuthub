import {
  collection,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch
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

// Save large presentation assets (base64 PDF data & slide images) to separate Firestore sub-documents
export async function savePresentationAssets(presId: string, pdfUrl?: string, extractedImages?: string[]): Promise<void> {
  try {
    if (pdfUrl && pdfUrl.startsWith('data:')) {
      const chunkSize = 250 * 1024;
      if (pdfUrl.length <= chunkSize) {
        await setDoc(doc(db, 'presentation_assets', `${presId}_pdf`), { data: pdfUrl, presId });
      } else {
        const totalChunks = Math.ceil(pdfUrl.length / chunkSize);
        for (let i = 0; i < totalChunks; i++) {
          const chunk = pdfUrl.slice(i * chunkSize, (i + 1) * chunkSize);
          await setDoc(doc(db, 'presentation_assets', `${presId}_pdf_${i}`), { chunk, presId, index: i, total: totalChunks });
        }
      }
    }
    if (Array.isArray(extractedImages) && extractedImages.length > 0) {
      for (let i = 0; i < extractedImages.length; i++) {
        const img = extractedImages[i];
        if (img && typeof img === 'string' && img.startsWith('data:')) {
          await setDoc(doc(db, 'presentation_assets', `${presId}_slide_${i}`), { data: img, presId, slideIndex: i });
        }
      }
    }
  } catch (err) {
    console.warn('Failed to save presentation assets to Firestore:', err);
  }
}

// Load presentation assets from Firestore when missing from main document or local IndexedDB
export async function loadPresentationAssets(presId: string): Promise<{ pdfUrl?: string; extractedImages?: string[] }> {
  try {
    let pdfUrl: string | undefined;
    let extractedImages: string[] = [];

    // Try single doc pdf
    const pdfDoc = await getDoc(doc(db, 'presentation_assets', `${presId}_pdf`));
    if (pdfDoc.exists()) {
      pdfUrl = pdfDoc.data().data;
    } else {
      // Check chunked pdf
      let chunks: string[] = [];
      let i = 0;
      while (i < 20) {
        const chunkDoc = await getDoc(doc(db, 'presentation_assets', `${presId}_pdf_${i}`));
        if (!chunkDoc.exists()) break;
        chunks.push(chunkDoc.data().chunk);
        i++;
      }
      if (chunks.length > 0) {
        pdfUrl = chunks.join('');
      }
    }

    // Try slide images
    let idx = 0;
    while (idx < 50) {
      const slideDoc = await getDoc(doc(db, 'presentation_assets', `${presId}_slide_${idx}`));
      if (!slideDoc.exists()) break;
      extractedImages.push(slideDoc.data().data);
      idx++;
    }

    return {
      pdfUrl: pdfUrl || undefined,
      extractedImages: extractedImages.length > 0 ? extractedImages : undefined,
    };
  } catch (err) {
    console.warn('Failed to load presentation assets from Firestore:', err);
    return {};
  }
}


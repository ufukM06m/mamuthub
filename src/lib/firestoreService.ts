import {
  collection,
  doc,
  setDoc,
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
    async (snapshot) => {
      if (snapshot.empty && initialDataIfEmpty && initialDataIfEmpty.length > 0) {
        const seedKey = `mamuthub_seeded_${collectionName}`;
        if (!localStorage.getItem(seedKey)) {
          localStorage.setItem(seedKey, 'true');
          try {
            const batch = writeBatch(db);
            initialDataIfEmpty.forEach((item) => {
              const docRef = doc(db, collectionName, item.id);
              batch.set(docRef, item);
            });
            await batch.commit();
            return;
          } catch (err) {
            console.error(`Error seeding initial data for ${collectionName}:`, err);
          }
        }
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
      onData(initialDataIfEmpty);
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
    await setDoc(docRef, item, { merge: true });
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

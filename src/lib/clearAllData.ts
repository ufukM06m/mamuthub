import { purgeAllFirestorePresentations } from './firestoreService';
import { getDocs, collection } from 'firebase/firestore';
import { purgeAllLocalPresentations, getLocalPresentations } from './storageService';
import { deletePresentationFromStorage } from './firebaseStorageService';
import { db } from './firebase';

export async function purgeAllPresentationsSystemWide(): Promise<void> {
  try {
    // 1. Gather all presentation IDs from local IndexedDB
    const localPres = await getLocalPresentations<{ id: string }>();
    const localIds = localPres.map((p) => p.id);

    // 2. Gather all presentation IDs from Firestore
    const firestoreIds: string[] = [];
    try {
      const snap = await getDocs(collection(db, 'presentations'));
      snap.docs.forEach((docSnap) => firestoreIds.push(docSnap.id));
    } catch {
      // ignore
    }

    const allIds = Array.from(new Set([...localIds, ...firestoreIds, 'pres-1', 'pres-2', 'pres-3', 'pres-4']));

    // 3. Delete files from Firebase Storage
    await Promise.all(allIds.map((id) => deletePresentationFromStorage(id, 50))).catch(() => {});

    // 4. Delete Firestore documents & presentation_assets
    await purgeAllFirestorePresentations().catch(() => {});

    // 5. Delete IndexedDB & LocalStorage records
    await purgeAllLocalPresentations().catch(() => {});

    console.log('Tüm sunum verileri (IndexedDB, LocalStorage, Firestore, Storage) başarıyla temizlendi.');
  } catch (err) {
    console.error('Sunumları temizleme sırasında hata:', err);
  }
}

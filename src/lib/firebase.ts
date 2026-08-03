import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const NAMED_DATABASE_ID =
  (firebaseConfig as any).firestoreDatabaseId ||
  (firebaseConfig as any).databaseId ||
  'ai-studio-mamuthubkurumsal-ca452916-ffc6-4766-987a-df094a6b755c';

export const db = getFirestore(app, NAMED_DATABASE_ID);

console.info(`🔥 Firestore veritabanına bağlandı. Proje: ${firebaseConfig.projectId}, Veritabanı ID: ${NAMED_DATABASE_ID}`);

export const auth = getAuth(app);
export const storage = getStorage(app);

// Authenticate anonymously if enabled; gracefully handle restricted operation
signInAnonymously(auth).catch(() => {
  // Anonymous auth disabled or restricted; non-fatal for local operation
});


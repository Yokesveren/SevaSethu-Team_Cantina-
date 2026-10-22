// Load env vars from .env (never commit real credentials to source)
import 'dotenv/config';

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
  for (const col of ['triage_cases', 'teleconsult_requests', 'sos_alerts', 'follow_ups']) {
    const snap = await getDocs(collection(db, col));
    snap.forEach(d => {
      const s = JSON.stringify(d.data());
      if (s.toLowerCase().includes('ram') || s.includes('PAT-898CB3')) {
        console.log(`FOUND in ${col} [${d.id}]:`, s);
      }
    });
  }
  console.log('Done checking other collections.');
  process.exit(0);
}
check();

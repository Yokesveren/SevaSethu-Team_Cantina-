// Load env vars from .env (never commit real credentials to source)
import "dotenv/config";

import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

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

async function inspect() {
  for (const colName of ["teleconsult_requests", "triage_cases", "patients"]) {
    console.log(`\n=== COLLECTION: ${colName} ===`);
    try {
      const snap = await getDocs(collection(db, colName));
      console.log(`Total docs: ${snap.size}`);
      snap.forEach(d => {
        console.log(`[${d.id}] =>`, JSON.stringify(d.data(), null, 2));
      });
    } catch (err) {
      console.error(`Error fetching ${colName}:`, err.message);
    }
  }
  process.exit(0);
}

inspect();

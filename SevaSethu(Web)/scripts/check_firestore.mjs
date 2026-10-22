import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB0zLW1Q9aFdqyfUeE3CAXPe_YYpHpfB_o",
  authDomain: "seva-sethu-1ae78.firebaseapp.com",
  projectId: "seva-sethu-1ae78",
  storageBucket: "seva-sethu-1ae78.firebasestorage.app",
  messagingSenderId: "312175528219",
  appId: "1:312175528219:web:81ad1ab2e59d960bca6bbe",
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

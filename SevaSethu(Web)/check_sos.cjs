// Load env vars from .env (never commit real credentials to source)
require("dotenv").config();

const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs } = require("firebase/firestore");

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

async function checkSOS() {
  console.log("=== CHECKING sos_alerts IN FIRESTORE ===");
  const snap = await getDocs(collection(db, "sos_alerts"));
  console.log(`Total documents in sos_alerts: ${snap.size}`);
  snap.forEach(d => {
    console.log(`Doc ID: ${d.id}`);
    console.log(JSON.stringify(d.data(), null, 2));
    console.log("-----------------------------------------");
  });
  process.exit(0);
}

checkSOS().catch(e => {
  console.error(e);
  process.exit(1);
});

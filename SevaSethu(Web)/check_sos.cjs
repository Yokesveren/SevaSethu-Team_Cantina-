const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs } = require("firebase/firestore");

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

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyB0zLW1Q9aFdqyfUeE3CAXPe_YYpHpfB_o',
  authDomain: 'seva-sethu-1ae78.firebaseapp.com',
  projectId: 'seva-sethu-1ae78',
  storageBucket: 'seva-sethu-1ae78.firebasestorage.app',
  messagingSenderId: '312175528219',
  appId: '1:312175528219:web:81ad1ab2e59d960bca6bbe',
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

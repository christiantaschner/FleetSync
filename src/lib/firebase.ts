import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence, initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// import { getAnalytics, isSupported } from "firebase/analytics"; // Optional: if you need Analytics

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Optional
};

// Developer-friendly check for missing API key.
if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes("YOUR_API_KEY")) {
  console.error("********************************************************************************");
  console.error("********************************************************************************");
  console.error("Firebase API Key is missing or using a placeholder value.");
  console.error("Please check your .env.local file and ensure NEXT_PUBLIC_FIREBASE_API_KEY is set correctly.");
  console.error("After setting the key, you MUST restart your development server.");
  console.error("********************************************************************************");
  console.error("********************************************************************************");
}

// This pattern is more robust for Next.js environments and prevents re-initialization.
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

const auth = getAuth(app);
const storage = getStorage(app);

// Initialize Firestore with offline persistence
let db: ReturnType<typeof getFirestore>;

if (typeof window !== 'undefined') {
  try {
    // We are on the client, so we can enable persistence.
    db = initializeFirestore(app, {
      localCache: {
        kind: 'persistent'
      }
    });
    console.log("Firestore persistence enabled.");
  } catch (error) {
    console.error("Failed to enable Firestore persistence:", error);
    db = getFirestore(app); // Fallback to memory-only cache
  }
} else {
  // We are on the server, no persistence needed.
  db = getFirestore(app);
}

// Optional: Initialize Analytics if needed and supported
// let analytics;
// if (typeof window !== 'undefined' && firebaseConfig.measurementId && app) {
//   isSupported().then((supported) => {
//     if (supported) {
//       analytics = getAnalytics(app);
//     }
//   });
// }

export { app, auth, db, storage /* , analytics */ };

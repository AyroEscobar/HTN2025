// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "htn2025-e14e0.firebaseapp.com",
  projectId: "htn2025-e14e0",
  storageBucket: "htn2025-e14e0.firebasestorage.app",
  messagingSenderId: "594757329345",
  appId: "1:594757329345:web:e854a25f1fe6303d994f40"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);


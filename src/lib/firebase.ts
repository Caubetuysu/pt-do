import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBT87H1Ti1mSgL34lQOxYAp0V5dZ-ZI7Ac",
  authDomain: "pt-do-7c998.firebaseapp.com",
  projectId: "pt-do-7c998",
  storageBucket: "pt-do-7c998.firebasestorage.app",
  messagingSenderId: "656807597202",
  appId: "1:656807597202:web:412304a6ca17a0f8ae424b",
  measurementId: "G-07BCP1NZG1"
};

// Initialize Firebase only once
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);
export const auth = getAuth(app);

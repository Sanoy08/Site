import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Your web app's Firebase configuration
// Replace these values with the ones you copied in Phase 1
const firebaseConfig = {
  apiKey: "AIzaSyDXyMTQemaZeUvIAqNr4BCSsNHXWb76WH0",
  authDomain: "bumbas-kitchen-87d59.firebaseapp.com",
  projectId: "bumbas-kitchen-87d59",
  storageBucket: "bumbas-kitchen-87d59.firebasestorage.app",
  messagingSenderId: "42402664604",
  appId: "1:42402664604:web:aff05d002e3709def89d59",
  measurementId: "G-529JJ690D2"
};

// Initialize Firebase (Singleton pattern)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider };
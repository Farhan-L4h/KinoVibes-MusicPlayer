// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration untuk KinoVibe
// Ini adalah konfigurasi demo, ganti dengan project Firebase Anda sendiri
// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDy7pPHoESLabIHxrVAFs1w9zlGYadGMYc",
  authDomain: "kino-vibe.firebaseapp.com",
  projectId: "kino-vibe",
  storageBucket: "kino-vibe.firebasestorage.app",
  messagingSenderId: "627738365935",
  appId: "1:627738365935:web:e615f46e69406a7ef9b01a",
  measurementId: "G-17Z8F9CJRF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Cloud Storage and get a reference to the service
export const storage = getStorage(app);

export default app;
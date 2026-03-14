import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

let app;
let db;
let auth;

try {
  // Initialize Firebase SDK
  app = initializeApp(firebaseConfig);
  
  // Initialize Firestore with the named database
  db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
  
  // Initialize Auth
  auth = getAuth(app);
} catch (error) {
  console.error('Firebase initialization error:', error);
}

export { db, auth };

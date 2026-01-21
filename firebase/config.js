import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

/* --- FIREBASE CONFIGURATION --- */
const firebaseConfig = typeof __firebase_config !== 'undefined' 
  ? JSON.parse(__firebase_config) 
  : {
      apiKey: "AIzaSyCttsHAE-UPhhBbSwafpt-kxa_priQZkyI",
      authDomain: "patnam-clinic-hub.firebaseapp.com",
      projectId: "patnam-clinic-hub",
      storageBucket: "patnam-clinic-hub.firebasestorage.app",
      messagingSenderId: "819118122911",
      appId: "1:819118122911:web:e3b9f8ebad901db1bbbfaa",
      measurementId: "G-DYHEGBH36V"
    };

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const appId = typeof __app_id !== 'undefined' ? __app_id : 'patnam-clinic-default';

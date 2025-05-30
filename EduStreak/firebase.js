// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from 'firebase/firestore';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCzm_rS9786pwkuoQ4y9J2ldPeMhQM-biA",
  authDomain: "edustreak-e3e89.firebaseapp.com",
  projectId: "edustreak-e3e89",
  storageBucket: "edustreak-e3e89.firebasestorage.app",
  messagingSenderId: "580888857819",
  appId: "1:580888857819:web:2e77b92144a51442ed10fe",
  measurementId: "G-9X739T4LCH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

export {db};

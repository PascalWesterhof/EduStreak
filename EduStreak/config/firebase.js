import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { initializeApp } from 'firebase/app';
import { browserLocalPersistence, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { Platform } from 'react-native';

// Ensure you have these environment variables set in your EAS build profile (and locally for development if needed)
const firebaseConfig = {
  apiKey: 'AIzaSyDDe6kTo9XiAJu6mZ2gmZJiJI4MyuqAnMA',
  authDomain: 'edustreak-772c2.firebaseapp.com',
  projectId: 'edustreak-772c2',
  storageBucket: 'edustreak-772c2.firebasestorage.app',
  messagingSenderId: '538149596527',
  appId: '1:538149596527:web:d0de85d9379e2959fc8c9a',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Conditionally set persistence based on platform
const auth = initializeAuth(app, {
  persistence: Platform.OS === 'web' 
    ? browserLocalPersistence // or browserSessionPersistence
    : getReactNativePersistence(ReactNativeAsyncStorage)
});

const db = getFirestore(app);
const storage = getStorage(app);

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId: '538149596527-1dgue7rp6omuknv7kannrttjc04u35vg.apps.googleusercontent.com',
});

export { app, auth, db, storage };


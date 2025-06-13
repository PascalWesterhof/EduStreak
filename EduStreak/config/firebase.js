import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { initializeApp } from 'firebase/app';
import { browserLocalPersistence, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { Platform } from 'react-native';
import Config from "react-native-config";

// Ensure you have these environment variables set in your EAS build profile (and locally for development if needed)
const firebaseConfig = {
  apiKey: Config.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: Config.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: Config.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: Config.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: Config.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: Config.EXPO_PUBLIC_FIREBASE_APP_ID
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
  webClientId: Config.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
});

export { app, auth, db, storage };


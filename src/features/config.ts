import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getReactNativePersistence,
  initializeAuth,
} from 'firebase/auth';

import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey:
    Constants.expoConfig?.extra?.firebaseApiKey ??
    process.env.EXPO_PUBLIC_FIREBASE_API_KEY,

  authDomain:
    Constants.expoConfig?.extra?.firebaseAuthDomain ??
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,

  projectId:
    Constants.expoConfig?.extra?.firebaseProjectId ??
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,

  storageBucket:
    Constants.expoConfig?.extra?.firebaseStorageBucket ??
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,

  messagingSenderId:
    Constants.expoConfig?.extra?.firebaseMessagingSenderId ??
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,

  appId:
    Constants.expoConfig?.extra?.firebaseAppId ??
    process.env.EXPO_PUBLIC_FIREBASE_APP_ID,

  measurementId:
    Constants.expoConfig?.extra?.firebaseMeasurementId ??
    process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

export const app =
  getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);
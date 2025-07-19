// FirebaseConfig.tsx - Corrected for Production Use

// --- Step 1: Use imports from @react-native-firebase only ---
// Do not use 'firebase/app', 'firebase/auth', etc.
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import storage from "@react-native-firebase/storage";
import { getApp as getRnfApp } from "@react-native-firebase/app";
import {
  ReactNativeFirebaseAppCheckProvider,
  initializeAppCheck
} from "@react-native-firebase/app-check";

// The firebaseConfig object is not needed. @react-native-firebase reads
// the configuration from your google-services.json and GoogleService-Info.plist files.

// --- Step 2: Get the single, native Firebase App instance ---
const app = getRnfApp();

// --- Step 3: Initialize App Check on the native app instance ---
const rnfbProvider = new ReactNativeFirebaseAppCheckProvider();
rnfbProvider.configure({
  // This correctly switches between debug and production providers
  android:  { provider: __DEV__ ? "debug" : "playIntegrity" },
  apple:    { provider: __DEV__ ? "debug" : "deviceCheck" }
});

initializeAppCheck(
  app, // Use the same native app instance
  { provider: rnfbProvider, isTokenAutoRefreshEnabled: true }
);

// --- Step 4: Get Auth, Firestore, and Storage from @react-native-firebase ---
// Persistence is handled automatically by the native SDK, so AsyncStorage is not needed here.
const authInstance = auth();
const dbInstance = firestore();
const storageInstance = storage();
const { FieldValue, Timestamp, GeoPoint } = firestore;
// --- Step 5: Your existing function, now using the correct auth instance ---
export async function forgotPassword(email: string): Promise<void> {
  if (!email) throw new Error("Email is required to reset password.");
  await authInstance.sendPasswordResetEmail(email);
}

// --- Step 6: Export all the instances with the names your app expects ---
export {
    app,
    authInstance as auth,
    dbInstance as db,
    storageInstance as storage,
     FieldValue,
  Timestamp,
  GeoPoint,
};

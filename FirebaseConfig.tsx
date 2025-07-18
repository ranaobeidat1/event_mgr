// Update your FirebaseConfig.tsx to add Firebase Storage
import { initializeApp } from "firebase/app";
import { initializeAuth,sendPasswordResetEmail,getReactNativePersistence  } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { getApp as getRnfApp } from "@react-native-firebase/app";
import {
 ReactNativeFirebaseAppCheckProvider,
 initializeAppCheck
} from "@react-native-firebase/app-check";

const firebaseConfig = {
  apiKey: "AIzaSyCkL3MCILFGcZCjnZcO9Hb-z2CfpZVkPQ8",
  authDomain: "sahlab-fc516.firebaseapp.com",
  projectId: "sahlab-fc516",
  storageBucket: "sahlab-fc516.firebasestorage.app", 
  messagingSenderId: "222769047395",
  appId: "1:222769047395:web:0162805bc14f04f20c5556",
  measurementId: "G-5NWM3TJEK3"
};




// Initialize Firebase
const app = initializeApp(firebaseConfig);

const rnfbProvider = new ReactNativeFirebaseAppCheckProvider();
rnfbProvider.configure({
 android:  { provider: __DEV__ ? "debug" : "playIntegrity" },
  apple:    { provider: __DEV__ ? "debug" : "deviceCheck" }
});

initializeAppCheck(
 getRnfApp(),               // RNFirebase App instance
 { provider: rnfbProvider, isTokenAutoRefreshEnabled: true }
);


const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
const db = getFirestore(app);
const storage = getStorage(app);
export async function forgotPassword(email: string): Promise<void> {
  if (!email) throw new Error("Email is required to reset password.");
  await sendPasswordResetEmail(auth, email);
}
export { app, auth, db, storage };
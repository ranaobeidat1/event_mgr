// src/FirebaseConfig.ts
import { initializeApp } from "firebase/app";
import {
  initializeAuth,
  getReactNativePersistence
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCkL3MCILFGcZCjnZcO9Hb-z2CfpZVkPQ8",
  authDomain: "sahlab-fc516.firebaseapp.com",
  projectId: "sahlab-fc516",
  // ← corrected to the form <PROJECT_ID>.appspot.com
  storageBucket: "sahlab-fc516.appspot.com",
  messagingSenderId: "222769047395",
  appId: "1:222769047395:web:0162805bc14f04f20c5556",
  measurementId: "G-5NWM3TJEK3"
};

// 1) Initialize the core app
const app = initializeApp(firebaseConfig);

// 2) Initialize Auth with AsyncStorage persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// 3) Firestore
const db = getFirestore(app);

// 4) Storage
const storage = getStorage(app);

export { app, auth, db, storage };

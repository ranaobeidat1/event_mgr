// app/FirebaseConfig.tsx
import { initializeApp } from "firebase/app";
import { initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

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
const auth = initializeAuth(app);
const db = getFirestore(app);

export { app, auth, db };
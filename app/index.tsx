import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
// --- CORRECTED IMPORTS ---
import { auth } from '../FirebaseConfig';
import { FirebaseAuthTypes } from '@react-native-firebase/auth'; // Correct type import

export default function Index() {
  const [initializing, setInitializing] = useState(true);
  // --- USE CORRECT USER TYPE ---
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);

  useEffect(() => {
    // --- CORRECTED AUTH LISTENER SYNTAX ---
    const unsubscribe = auth.onAuthStateChanged(usr => {
      setUser(usr);
      setInitializing(false);
    });
    return unsubscribe;
  }, []);

  if (initializing) return null;

  return <Redirect href={user ? '/(tabs)' : '/login'} />;
}

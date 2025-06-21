import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../FirebaseConfig';

export default function Index() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, usr => {
      setUser(usr);
      setInitializing(false);
    });
    return unsubscribe;
  }, []);

  if (initializing) return null;

  return <Redirect href={user ? '/(tabs)' : '/login'} />;
}

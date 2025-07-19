// app/_layout.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import { Stack, SplashScreen, useRouter } from 'expo-router';
import { useFonts } from 'expo-font';
import { auth, db } from '../FirebaseConfig';
import firestore from '@react-native-firebase/firestore'; // Import for serverTimestamp
import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator, I18nManager } from 'react-native';
import * as Device from 'expo-device';
import './global.css';
import { StatusBar } from 'expo-status-bar';
import { registerForPushNotificationsAsync } from './utils/notificationService';
import { doc, getDoc, setDoc } from 'firebase/firestore'; // Import firestore functions

// Disable RTL
I18nManager.allowRTL(false);
I18nManager.forceRTL(false);


// --- 1. UPDATED AUTH CONTEXT ---
// Added isAdmin state and a logout function
type AuthContextType = {
  user: FirebaseAuthTypes.User | null;
  isAdmin: boolean;
  isGuest: boolean;
  setIsGuest: (value: boolean) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  isGuest: false,
  setIsGuest: () => {},
  logout: async () => {},
});
export const useAuth = () => useContext(AuthContext);


export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Heebo-Thin': require('../assets/fonts/Heebo-Thin.ttf'),
    'Heebo-ExtraLight': require('../assets/fonts/Heebo-ExtraLight.ttf'),
    'Heebo-Light': require('../assets/fonts/Heebo-Light.ttf'),
    'Heebo-Regular': require('../assets/fonts/Heebo-Regular.ttf'),
    'Heebo-Medium': require('../assets/fonts/Heebo-Medium.ttf'),
    'Heebo-SemiBold': require('../assets/fonts/Heebo-SemiBold.ttf'),
    'Heebo-Bold': require('../assets/fonts/Heebo-Bold.ttf'),
    'Heebo-ExtraBold': require('../assets/fonts/Heebo-ExtraBold.ttf'),
    'Heebo-Black': require('../assets/fonts/Heebo-Black.ttf'),
    Tahoma: require('../assets/fonts/tahoma.ttf'),
  });

  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false); // Added isAdmin state
  const [isGuest, setIsGuest] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  const router = useRouter();


  useEffect(() => {
    if (isGuest) {
      setAuthReady(true);
      return;
    }
    
    const unsub = auth.onAuthStateChanged(async (u) => {
      setUser(u);
      if (u) {
        // --- 2. ADDED USER ACTIVITY TRACKING ---
        // This updates 'lastSeen' for your statistics page
        const userDocRef = db.collection('users').doc(u.uid);
        try {
          await userDocRef.set({
            lastSeen: firestore.FieldValue.serverTimestamp(),
          }, { merge: true });
        } catch (e) { console.error("Failed to update lastSeen", e); }
        
        // Check user role
        const userDoc = await userDocRef.get();
        if (userDoc.exists()) {
          setIsAdmin(userDoc.data()?.role === 'admin');
        } else {
          setIsAdmin(false);
        }

        // Handle push notifications
        if (Device.isDevice) {
          await registerForPushNotificationsAsync();
        }

      } else {
        // User signed out, reset admin status
        setIsAdmin(false);
      }
      setAuthReady(true);
    });

    return () => unsub();
  }, [isGuest]);
  
  // --- 3. ADDED ROBUST LOGOUT FUNCTION ---
  // This resets all state and prevents the "stale state" glitch
  const logout = async () => {
    await auth.signOut();
    setUser(null);
    setIsAdmin(false);
    setIsGuest(false);
    router.replace('/login');
  };

  const ready = fontsLoaded && authReady;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#1A4782" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor="#1A4782" />
      <AuthContext.Provider value={{ user, isAdmin, isGuest, setIsGuest, logout }}>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
          <Stack.Screen name="profile" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="register" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="posts/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="posts/[id]/edit" options={{ headerShown: false }} />
          <Stack.Screen name="posts/create" options={{ headerShown: false }} />
          <Stack.Screen name="classes/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="add-class" options={{ headerShown: false }} />
          <Stack.Screen name="registrations-list" options={{ headerShown: false }} />
          <Stack.Screen name="alerts/create-alert" options={{ headerShown: false }} />
          <Stack.Screen name="alerts/edit-alert" options={{ headerShown: false }} />
          <Stack.Screen name="users" options={{ headerShown: false }} />
          <Stack.Screen name="all-registrations" options={{ headerShown: false }} />
          <Stack.Screen name="statistics" options={{ headerShown: false }} />
          <Stack.Screen name="edit-user" options={{ headerShown: false }}/>
        </Stack>
      </AuthContext.Provider>
    </SafeAreaProvider>
  );
}
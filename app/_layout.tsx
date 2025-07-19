// app/_layout.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import "../FirebaseConfig"
import { Stack, SplashScreen } from 'expo-router';
import { useFonts } from 'expo-font';
// --- CORRECTED IMPORTS ---
import { auth, db } from '../FirebaseConfig';
import { FirebaseAuthTypes } from '@react-native-firebase/auth'; // Correct type import
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  View,
  ActivityIndicator,
  I18nManager,
} from 'react-native';
import * as Device from 'expo-device';
import './global.css';
import { StatusBar } from 'expo-status-bar';
import { registerForPushNotificationsAsync } from './utils/notificationService';

// ────────────────────────────────────────────────────────────
//  Disable RTL
// ────────────────────────────────────────────────────────────
I18nManager.allowRTL(false);
I18nManager.forceRTL(false);

// ────────────────────────────────────────────────────────────
//  Auth context
// ────────────────────────────────────────────────────────────
type AuthContextType = {
  user: FirebaseAuthTypes.User | null; // Use correct user type
  isGuest: boolean;
  setIsGuest: (value: boolean) => void;
};
const AuthContext = createContext<AuthContextType>({
  user: null,
  isGuest: false,
  setIsGuest: () => {},
});
export const useAuth = () => useContext(AuthContext);

// ────────────────────────────────────────────────────────────
//  Root layout component
// ────────────────────────────────────────────────────────────
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

  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null); // Use correct user type
  const [isGuest, setIsGuest] = useState(false);

  const [authReady, setAuthReady] = useState(false);
  const [pushReady, setPushReady] = useState(false);

  // ────────────────────────────────────────────────────────────
  //  Auth listener
  // ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isGuest) {
      setAuthReady(true);
      setPushReady(true);
      return;
    }
    
    // --- CORRECTED AUTH LISTENER SYNTAX ---
    const unsub = auth.onAuthStateChanged(async (u) => {
      setUser(u);
      setAuthReady(true);

      if (u && Device.isDevice) {
        await registerForPushNotificationsAsync();
      } else {
        console.log('Skipping push registration on emulator or signed-out user');
        if (!u && Device.isDevice && user?.uid) {
          try {
            // --- CORRECTED FIRESTORE SYNTAX ---
            await db.collection('users').doc(user.uid).update({ expoPushToken: '' });
          } catch {}
        }
      }
      setPushReady(true);
    });

    return () => unsub();
  }, [isGuest, user?.uid]); // Added user.uid to dependency array

  // ────────────────────────────────────────────────────────────
  //  Splash until everything is ready
  // ────────────────────────────────────────────────────────────
  const ready = fontsLoaded && authReady && pushReady;

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync();
    } else {
      SplashScreen.preventAutoHideAsync();
    }
  }, [ready]);

  if (!ready) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#1A4782" />
      </View>
    );
  }

  // ────────────────────────────────────────────────────────────
  //  Render navigation
  // ────────────────────────────────────────────────────────────
  return (
    <SafeAreaProvider>
      <StatusBar 
        style="light" 
        backgroundColor="#1A4782" 
      />
    <AuthContext.Provider value={{ user, isGuest, setIsGuest }}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
        <Stack.Screen name="profile" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="posts/[id]" options={{ headerShown: false }} />
        <Stack.Screen
          name="posts/[id]/edit"
          options={{ headerShown: false }}
        />
        <Stack.Screen name="posts/create" options={{ headerShown: false }} />
        <Stack.Screen name="classes/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="add-class" options={{ headerShown: false }} />
        <Stack.Screen
          name="registrations-list"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="alerts/create-alert"
          options={{ headerShown: false }}
        />
         <Stack.Screen
          name="alerts/edit-alert"
          options={{ headerShown: false }}
        />
        <Stack.Screen name="users" options={{ headerShown: false }} />
        <Stack.Screen
          name="all-registrations"
          options={{ headerShown: false }}
        />
        <Stack.Screen name="statistics" options={{ headerShown: false }} />
      </Stack>
    </AuthContext.Provider>
    </SafeAreaProvider>
  );
}

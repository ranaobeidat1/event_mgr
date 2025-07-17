// app/_layout.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import { Stack, SplashScreen } from 'expo-router';
import { useFonts } from 'expo-font';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '../FirebaseConfig';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  View,
  ActivityIndicator,
  I18nManager,
  Platform,
} from 'react-native';
import * as Device from 'expo-device';
import {
  doc,
  updateDoc,
} from 'firebase/firestore';
import './global.css';

// 👉 single notification helper now
import { registerForPushNotificationsAsync } from './utils/notificationService'; // adjust path if utils folder differs

// ────────────────────────────────────────────────────────────
//  Disable RTL
// ────────────────────────────────────────────────────────────
I18nManager.allowRTL(false);
I18nManager.forceRTL(false);

// ────────────────────────────────────────────────────────────
//  Auth context
// ────────────────────────────────────────────────────────────
type AuthContextType = {
  user: User | null;
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
  // ① Fonts
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

  // ② Auth + guest
  const [user, setUser] = useState<User | null>(null);
  const [isGuest, setIsGuest] = useState(false);

  // ③ Global readiness flags
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

    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setAuthReady(true);

      if (u && Device.isDevice) {
        // get + store token (function already updates Firestore)
        await registerForPushNotificationsAsync();
      } else {
        console.log('Skipping push registration on emulator or signed-out user');
        // optional: if user signs out, clear token field
        if (!u && Device.isDevice && user?.uid) {
          try {
            await updateDoc(doc(db, 'users', user.uid), { expoPushToken: '' });
          } catch {}
        }
      }
      setPushReady(true);
    });

    return () => unsub();
  }, [isGuest]);

  // ────────────────────────────────────────────────────────────
  //  Splash until everything is ready
  // ────────────────────────────────────────────────────────────
  const ready = fontsLoaded && authReady && pushReady;

  if (!ready) {
    SplashScreen.preventAutoHideAsync();
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#1A4782" />
      </View>
    );
  }
  SplashScreen.hideAsync();

  // ────────────────────────────────────────────────────────────
  //  Render navigation
  // ────────────────────────────────────────────────────────────
  return (
    <SafeAreaProvider>
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

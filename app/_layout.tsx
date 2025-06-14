// app/_layout.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { Stack, SplashScreen } from "expo-router";
import { useFonts } from "expo-font";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../FirebaseConfig";
import { View, ActivityIndicator } from "react-native";
import "./global.css";

// Import notification functions
import {
  registerForPushNotificationsAsync,
  saveFCMTokenToFirestore,
  setupNotificationListeners,
  cleanupNotificationListeners,
  removeFCMTokenFromFirestore
} from "./utils/notificationService";

// Auth context to share user state
type AuthContextType = { user: User | null };
const AuthContext = createContext<AuthContextType>({ user: null });
export const useAuth = () => useContext(AuthContext);

export default function RootLayout() {
  // ① Load custom fonts
  const [fontsLoaded] = useFonts({
    "Heebo-Thin": require("../assets/fonts/Heebo-Thin.ttf"),
    "Heebo-ExtraLight": require("../assets/fonts/Heebo-ExtraLight.ttf"),
    "Heebo-Light": require("../assets/fonts/Heebo-Light.ttf"),
    "Heebo-Regular": require("../assets/fonts/Heebo-Regular.ttf"),
    "Heebo-Medium": require("../assets/fonts/Heebo-Medium.ttf"),
    "Heebo-SemiBold": require("../assets/fonts/Heebo-SemiBold.ttf"),
    "Heebo-Bold": require("../assets/fonts/Heebo-Bold.ttf"),
    "Heebo-ExtraBold": require("../assets/fonts/Heebo-ExtraBold.ttf"),
    "Heebo-Black": require("../assets/fonts/Heebo-Black.ttf"),
    Tahoma: require("../assets/fonts/tahoma.ttf"),
  });

  // ② Track auth state
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  // ③ Setup notifications
  useEffect(() => {
    const subscriptions = setupNotificationListeners();
    
    return () => {
      cleanupNotificationListeners(subscriptions);
    };
  }, []);

  // ④ Handle authentication and FCM token
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      
      if (u) {
        // User is signed in, register for notifications
        try {
          const token = await registerForPushNotificationsAsync();
          if (token) {
            await saveFCMTokenToFirestore(u.uid, token);
            console.log('✅ User logged in and FCM token saved');
          }
        } catch (error) {
          console.error('Error setting up notifications:', error);
        }
      } else {
        // User logged out, remove FCM token
        console.log('❌ User logged out');
      }
      
      if (initializing) setInitializing(false);
    });
    return unsubscribe;
  }, []);

  // ⑤ Show splash/loading until fonts & auth are ready
  if (!fontsLoaded || initializing) {
    SplashScreen.preventAutoHideAsync();
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#1A4782" />
      </View>
    );
  }
  SplashScreen.hideAsync();

  // ⑥ Provide auth context and render navigator
  return (
    <AuthContext.Provider value={{ user }}>
      <Stack>
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
      </Stack>
    </AuthContext.Provider>
  );
}
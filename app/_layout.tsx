// app/_layout.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { Stack, SplashScreen } from "expo-router";
import { useFonts } from "expo-font";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../FirebaseConfig";
import { View, ActivityIndicator, I18nManager } from "react-native";
import "./global.css";

// Import notification helpers
import {
  registerForPushNotificationsAsync,
  saveFCMTokenToFirestore,
  setupNotificationListeners,
  cleanupNotificationListeners,
  removeFCMTokenFromFirestore,
} from "./utils/notificationService";

// Disable RTL
I18nManager.allowRTL(false);
I18nManager.forceRTL(false);

// Auth context to share user state
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

  // ② Track auth & guest state
  const [user, setUser] = useState<User | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [initializing, setInitializing] = useState(true);

  // ③ Listen for auth changes, handle FCM registration & cleanup
  useEffect(() => {
    if (isGuest) {
      setInitializing(false);
      return;
    }

    let notificationSubscriptions: any = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (u) => {
      setUser(u);

      if (u) {
        // ✅ On sign-in: request permission & get token
        try {
          const token = await registerForPushNotificationsAsync();
          if (token) {
            await saveFCMTokenToFirestore(u.uid, token);
            console.log("✅ FCM token saved:", token);
          }
        } catch (err) {
          console.error("Error getting push token:", err);
        }

        // ▶️ Start listening for incoming notifications
        notificationSubscriptions = setupNotificationListeners();
        return () => cleanupNotificationListeners(notificationSubscriptions);
      } else {
        // ❌ On sign-out: remove token from Firestore
        if (user?.uid) {
          await removeFCMTokenFromFirestore(user.uid);
          console.log("❌ FCM token removed");
        }
      }

      if (initializing) setInitializing(false);
    });

    return () => {
      unsubscribeAuth();
      if (notificationSubscriptions) {
        cleanupNotificationListeners(notificationSubscriptions);
      }
    };
  }, [isGuest]);

  // ④ Show splash/loading until fonts & auth are ready
  if (!fontsLoaded || initializing) {
    SplashScreen.preventAutoHideAsync();
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#1A4782" />
      </View>
    );
  }
  SplashScreen.hideAsync();

  // ⑤ Provide auth context and render your navigation stack
  return (
    <AuthContext.Provider value={{ user, isGuest, setIsGuest }}>
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
        <Stack.Screen name="users" options={{ headerShown: false }} />
        <Stack.Screen name="all-registrations" options={{ headerShown: false }} />
        <Stack.Screen name="statistics" options={{ headerShown: false }} />
      </Stack>
    </AuthContext.Provider>
  );
}

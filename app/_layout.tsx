// app/_layout.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../FirebaseConfig";
import { View, ActivityIndicator } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import "./global.css";

// Notification utilities omitted for brevity
// Auth context
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

  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (initializing) setInitializing(false);
    });
    return unsub;
  }, []);

  // Show splash/loading until fonts & auth are ready
  if (!fontsLoaded || initializing) {
    SplashScreen.preventAutoHideAsync();
    return (
      <View style={{ flex:1, justifyContent:"center", alignItems:"center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  SplashScreen.hideAsync();

  return (
    <AuthContext.Provider value={{ user }}>
      <Stack>
        {!user ? (
          // Unauthenticated routes
          <>
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="register" options={{ headerShown: false }} />
          </>
        ) : (
          // Authenticated routes
          <>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="posts/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="posts/[id]/edit" options={{ headerShown: false }} />
            <Stack.Screen name="posts/create" options={{ headerShown: false }} />
            <Stack.Screen name="classes/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="add-class" options={{ headerShown: false }} />
            <Stack.Screen name="registrations-list" options={{ headerShown: false }} />
            <Stack.Screen name="alerts/create-alert" options={{ headerShown: false }} />
          </>
        )}
      </Stack>
    </AuthContext.Provider>
  );
}

// Update your app/_layout.tsx
import { Stack, Slot, SplashScreen } from "expo-router";
import { useFonts } from "expo-font";
import { useEffect } from "react";
import "./global.css";

export default function RootLayout() {
  const [loaded] = useFonts({
    // Heebo fonts
    "Heebo-Thin": require("../assets/fonts/Heebo-Thin.ttf"),
    "Heebo-ExtraLight": require("../assets/fonts/Heebo-ExtraLight.ttf"),
    "Heebo-Light": require("../assets/fonts/Heebo-Light.ttf"),
    "Heebo-Regular": require("../assets/fonts/Heebo-Regular.ttf"),
    "Heebo-Medium": require("../assets/fonts/Heebo-Medium.ttf"),
    "Heebo-SemiBold": require("../assets/fonts/Heebo-SemiBold.ttf"),
    "Heebo-Bold": require("../assets/fonts/Heebo-Bold.ttf"),
    "Heebo-ExtraBold": require("../assets/fonts/Heebo-ExtraBold.ttf"),
    "Heebo-Black": require("../assets/fonts/Heebo-Black.ttf"),
    // Tahoma
    Tahoma: require("../assets/fonts/tahoma.ttf"),
  });

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <Stack>
    
      <Stack.Screen name="posts/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="posts/create" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="classes/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="add-class" options={{ headerShown: false }} />
      <Stack.Screen name="registrations-list" options={{ headerShown: false }} />
      <Stack.Screen name="alerts/create-alert" options={{ headerShown: false }} />
      <Slot />
    </Stack>
  );
}
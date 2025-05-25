// app/(tabs)/_layout.tsx

import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  Image,
  ActivityIndicator,
} from "react-native";
import { Tabs } from "expo-router";
import { useFonts } from "expo-font";
import { useAuth } from "../_layout";
import { getUser, type UserData } from "../utils/firestoreUtils";

export default function TabsLayout() {
  // 1) Load your fonts
  const [fontsLoaded] = useFonts({
    "Heebo-Thin":      require("../../assets/fonts/Heebo-Thin.ttf"),
    "Heebo-ExtraLight":require("../../assets/fonts/Heebo-ExtraLight.ttf"),
    "Heebo-Light":     require("../../assets/fonts/Heebo-Light.ttf"),
    "Heebo-Regular":   require("../../assets/fonts/Heebo-Regular.ttf"),
    "Heebo-Medium":    require("../../assets/fonts/Heebo-Medium.ttf"),
    "Heebo-SemiBold":  require("../../assets/fonts/Heebo-SemiBold.ttf"),
    "Heebo-Bold":      require("../../assets/fonts/Heebo-Bold.ttf"),
    "Heebo-ExtraBold": require("../../assets/fonts/Heebo-ExtraBold.ttf"),
    "Heebo-Black":     require("../../assets/fonts/Heebo-Black.ttf"),
    Tahoma:            require("../../assets/fonts/tahoma.ttf"),
  });

  // 2) Get the Firebase User from context
  const { user } = useAuth();

  // 3) Fetch Firestore profile data (firstName, etc.)
  const [profile, setProfile] = useState<UserData | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoadingProfile(false);
      return;
    }
    (async () => {
      try {
        const data = await getUser(user.uid);
        setProfile(data);
      } catch (err) {
        console.error("Error loading profile:", err);
      } finally {
        setLoadingProfile(false);
      }
    })();
  }, [user]);

  // 4) Wait for fonts and profile load
  if (!fontsLoaded || loadingProfile) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#1A4782", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </SafeAreaView>
    );
  }

  // 5) Derive display name from Firestore data
  const displayName = profile?.firstName ?? "משתמש";

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {/* Blue header box */}
      <View
        style={{
          height: 75,
          backgroundColor: "#1A4782",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 20,
        }}
      >
        <Text
          style={{
            color: "#FFFFFF",
            fontSize: 24,
            fontFamily: "Heebo-Bold",
          }}
        >
          שלום {displayName}!
        </Text>
        {/* White logo box */}
        <View
          style={{
             position: 'absolute',
            right: 0,
            height: 75,
            width: 90,
            backgroundColor: "#FFFFFF",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Image
            source={require("../../assets/icons/logoIcon.png")}
            style={{
              width: "80%",
              height: "80%",
              resizeMode: "contain",
            }}
          />
        </View>
      </View>

      {/* Tabs Navigator (unchanged) */}
      <Tabs
        screenOptions={{
          tabBarItemStyle: {
            justifyContent: "center",
            alignItems: "center",
          },
          tabBarStyle: {
            height: 90,
            backgroundColor: "#1A4782",
            position: "absolute",
            bottom: 0,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <View
                className={`flex justify-center items-center mt-6 ${
                  focused
                    ? "bg-white p-3 rounded-full mt-8 w-16 h-16"
                    : ""
                }`}
              >
                <Image
                  source={require("../../assets/icons/Home.png")}
                  className="w-12 h-12 mt-2"
                  style={{ tintColor: focused ? "#1A4782" : "#FFFFFF" }}
                />
              </View>
            ),
            tabBarLabel: () => (
              <Text className="text-xl text-white font-heebo-bold mt-7">
                בית
              </Text>
            ),
          }}
        />
        <Tabs.Screen
          name="alerts"
          options={{
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <View
                className={`flex justify-center items-center mt-6 ${
                  focused
                    ? "bg-white p-3 rounded-full mt-8 w-16 h-16"
                    : ""
                }`}
              >
                <Image
                  source={require("../../assets/icons/bell.png")}
                  className="w-12 h-12 mt-2"
                  style={{ tintColor: focused ? "#1A4782" : "#FFFFFF" }}
                />
              </View>
            ),
            tabBarLabel: () => (
              <Text className="text-xl text-white font-heebo-bold mt-7">
                עדכונים
              </Text>
            ),
          }}
        />
        <Tabs.Screen
          name="classes"
          options={{
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <View
                className={`flex justify-center items-center mt-6 ${
                  focused
                    ? "bg-white p-3 rounded-full mt-8 w-16 h-16"
                    : ""
                }`}
              >
                <Image
                  source={require("../../assets/icons/classIcon.png")}
                  className="w-12 h-12 mt-2"
                  style={{ tintColor: focused ? "#1A4782" : "#FFFFFF" }}
                />
              </View>
            ),
            tabBarLabel: () => (
              <Text className="text-xl text-white font-heebo-bold mt-7">
                חוגים
              </Text>
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <View
                className={`flex justify-center items-center mt-6 ${
                  focused
                    ? "bg-white p-3 rounded-full mt-8 w-16 h-16"
                    : ""
                }`}
              >
                <Image
                  source={require("../../assets/icons/User.png")}
                  className="w-12 h-12 mt-2"
                  style={{ tintColor: focused ? "#1A4782" : "#FFFFFF" }}
                />
              </View>
            ),
            tabBarLabel: () => (
              <Text className="text-xl text-white font-heebo-bold mt-7">
                פרופיל
              </Text>
            ),
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
}

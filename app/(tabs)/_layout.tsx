import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  Image,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { Tabs, useRouter } from "expo-router";
import { useFonts } from "expo-font";
import { useAuth } from "../_layout";
import { getUser, type UserData } from "../utils/firestoreUtils";

export default function TabsLayout() {
  const router = useRouter();
  const { user } = useAuth();

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

  // Firestore profile state
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
        console.error(err);
      } finally {
        setLoadingProfile(false);
      }
    })();
  }, [user]);

  // Loading state
  if (!fontsLoaded || loadingProfile) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#1A4782", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </SafeAreaView>
    );
  }

  const displayName = profile?.firstName ?? "משתמש";

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {/* Header */}
      <View
        style={{
          height: 75,
          backgroundColor: "#1A4782",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {/* Profile button */}
        <TouchableOpacity
          onPress={() => router.push("/profile")}
          style={{ position: "absolute", left: 20, width: 32, height: 32, justifyContent: "center", alignItems: "center" }}
        >
          <Image
            source={require("../../assets/icons/User.png")}
            style={{ width: "100%", height: "100%", resizeMode: "contain" }}
          />
        </TouchableOpacity>

        {/* Greeting */}
        <Text style={{ color: "#FFFFFF", fontSize: 24, fontFamily: "Heebo-Bold" }}>
          שלום {displayName}!
        </Text>

        {/* Logo */}
        <View style={{ position: "absolute", right: 0, height: 75, width: 90, backgroundColor: "#FFFFFF", justifyContent: "center", alignItems: "center" }}>
          <Image source={require("../../assets/icons/logoIcon.png")} style={{ width: "80%", height: "80%", resizeMode: "contain" }} />
        </View>
      </View>

      {/* Tabs */}
      <Tabs
        screenOptions={{
          tabBarItemStyle: { justifyContent: "center", alignItems: "center" },
          tabBarStyle: { height: 90, backgroundColor: "#1A4782", position: "absolute", bottom: 0 },
        }}
      >
        {/* Home */}
        <Tabs.Screen
          name="index"
          options={{
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <View className={`flex justify-center items-center mt-6 ${focused ? "bg-white p-3 rounded-full mt-8 w-14 h-14" : ""}`}>
                <Image source={require("../../assets/icons/Home.png")} className="w-12 h-12 mt-2" style={{ tintColor: focused ? "#1A4782" : "#FFFFFF" }} />
              </View>
            ),
            tabBarLabel: () => <Text className="text-xl text-white font-heebo-bold mt-7">בית</Text>,
          }}
        />
        {/* Alerts */}
        <Tabs.Screen
          name="alerts"
          options={{
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <View className={`flex justify-center items-center mt-6 ${focused ? "bg-white p-2 rounded-full mt-8 w-14 h-14" : ""}`}>
                <Image source={require("../../assets/icons/bell.png")} className="w-12 h-12 mt-2" style={{ tintColor: focused ? "#1A4782" : "#FFFFFF" }} />
              </View>
            ),
            tabBarLabel: () => <Text className="text-xl text-white font-heebo-bold mt-7">עדכונים</Text>,
          }}
        />
        {/* Classes */}
        <Tabs.Screen
          name="classes"
          options={{
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <View className={`flex justify-center items-center mt-6 ${focused ? "bg-white p-3 rounded-full mt-8 w-14 h-14" : ""}`}>
                <Image source={require("../../assets/icons/classIcon.png")} className="w-12 h-12 mt-2" style={{ tintColor: focused ? "#1A4782" : "#FFFFFF" }} />
              </View>
            ),
            tabBarLabel: () => <Text className="text-xl text-white font-heebo-bold mt-7">חוגים</Text>,
          }}
        />
        {/* Gallery */}
        <Tabs.Screen
          name="gallery"
          options={{
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <View className={`flex justify-center items-center mt-6 ${focused ? "bg-white p-3 rounded-full mt-8 w-14 h-14" : ""}`}>
                <Image source={require("../../assets/icons/gallery.png")} className="w-12 h-12 mt-2" style={{ tintColor: focused ? "#1A4782" : "#FFFFFF" }} />
              </View>
            ),
            tabBarLabel: () => <Text className="text-xl text-white font-heebo-bold mt-7">גלריה</Text>,
          }}
        />
        {/* Hide default Profile */}
        <Tabs.Screen
          name="profile"
          options={{
            tabBarButton: () => null,
            headerShown: false,
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
}

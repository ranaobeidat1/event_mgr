import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  I18nManager,
  Alert,
} from "react-native";
import { Tabs, useRouter } from "expo-router";
import { useFonts } from "expo-font";
import { useAuth } from "../_layout";
import { getUser, type UserData } from "../utils/firestoreUtils";

// --- Notification setup imports ---
import * as Notifications from "expo-notifications";
import { auth, db } from "../../FirebaseConfig";
import { doc, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
// --- End notification setup imports ---

I18nManager.allowRTL(false);
I18nManager.forceRTL(false);

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function createAndroidChannel() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }
}

async function registerForPush() {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== "granted") return;
  const { data: token } = await Notifications.getExpoPushTokenAsync();
  console.log("Push token:", token);
  const uid = auth.currentUser?.uid;
  if (uid) {
    await setDoc(
      doc(db, "fcmTokens", uid),
      { userId: uid, token },
      { merge: true }
    );
  }
}

export default function TabsLayout() {
  const router = useRouter();
  const { user: authUser, isGuest, setIsGuest } = useAuth();

  const [user, setUser] = useState(authUser ?? null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (usr) => {
      if (usr) setUser(usr);
      setInitializing(false);
    });
    return unsubscribe;
  }, []);

  const [fontsLoaded] = useFonts({
    "Heebo-Thin": require("../../assets/fonts/Heebo-Thin.ttf"),
    "Heebo-ExtraLight": require("../../assets/fonts/Heebo-ExtraLight.ttf"),
    "Heebo-Light": require("../../assets/fonts/Heebo-Light.ttf"),
    "Heebo-Regular": require("../../assets/fonts/Heebo-Regular.ttf"),
    "Heebo-Medium": require("../../assets/fonts/Heebo-Medium.ttf"),
    "Heebo-SemiBold": require("../../assets/fonts/Heebo-SemiBold.ttf"),
    "Heebo-Bold": require("../../assets/fonts/Heebo-Bold.ttf"),
    "Heebo-ExtraBold": require("../../assets/fonts/Heebo-ExtraBold.ttf"),
    "Heebo-Black": require("../../assets/fonts/Heebo-Black.ttf"),
    Tahoma: require("../../assets/fonts/tahoma.ttf"),
  });

  const [profile, setProfile] = useState<UserData | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    if (user && !isGuest) {
      createAndroidChannel();
      registerForPush();
    }
  }, [user, isGuest]);

  useEffect(() => {
    if (isGuest || !user) {
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
  }, [user, isGuest]);

  if (!fontsLoaded || loadingProfile || initializing) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: "#1A4782",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color="#FFFFFF" />
      </SafeAreaView>
    );
  }

  const displayName = isGuest ? "אורח" : profile?.firstName ?? "משתמש";

  const handleRestrictedFeature = () => {
    if (isGuest) {
      Alert.alert(
      "מגבלת גישה",
      "הגישה למאפיין זה מוגבלת לחשבונות רשומים בלבד.",
      [
        {
        text: "אישור",
        style: "cancel",
        },
      ]
      );
      return true;
    }
    return false;
  };

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
        <TouchableOpacity
          onPress={() => {
            if (isGuest) {
              handleRestrictedFeature();
            } else {
              router.push("/profile");
            }
          }}
          style={{
            position: "absolute",
            left: 20,
            width: 32,
            height: 32,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Image
            source={require("../../assets/icons/User.png")}
            style={{ width: "100%", height: "100%", resizeMode: "contain" }}
          />
        </TouchableOpacity>

        <Text style={{ color: "#FFFFFF", fontSize: 24, fontFamily: "Heebo-Bold" }}>
          שלום {displayName}!
        </Text>
        <View
          style={{
            position: "absolute",
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
            style={{ width: "80%", height: "80%", resizeMode: "contain" }}
          />
        </View>
      </View>

      {/* Reversed Tabs */}
      <Tabs
        screenOptions={{
          tabBarItemStyle: { justifyContent: "center", alignItems: "center" },
          tabBarStyle: {
            height: 90,
            backgroundColor: "#1A4782",
            position: "absolute",
            bottom: 0,
          },
        }}
      >
        <Tabs.Screen
          name="gallery"
          options={{
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <View className={`flex justify-center items-center mt-6 ${focused ? "bg-white p-3 rounded-full mt-8 w-14 h-14" : ""}`}>
                <Image
                  source={require("../../assets/icons/gallery.png")}
                  className="w-12 h-12 mt-2"
                  style={{ tintColor: focused ? "#1A4782" : "#FFFFFF" }}
                />
              </View>
            ),
            tabBarLabel: () => (
              <Text className="text-xl text-white font-heebo-bold mt-7">גלריה</Text>
            ),
          }}
        />
        <Tabs.Screen
          name="classes"
          options={{
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <View className={`flex justify-center items-center mt-6 ${focused ? "bg-white p-3 rounded-full mt-8 w-14 h-14" : ""}`}>
                <Image
                  source={require("../../assets/icons/classIcon.png")}
                  className="w-12 h-12 mt-2"
                  style={{ tintColor: focused ? "#1A4782" : "#FFFFFF" }}
                />
              </View>
            ),
            tabBarLabel: () => (
              <Text className="text-xl text-white font-heebo-bold mt-7">חוגים</Text>
            ),
          }}
        />
        <Tabs.Screen
          name="alerts"
          options={{
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <View className={`flex justify-center items-center mt-6 ${focused ? "bg-white p-2 rounded-full mt-8 w-14 h-14" : ""}`}>
                <Image
                  source={require("../../assets/icons/bell.png")}
                  className="w-12 h-12 mt-2"
                  style={{ tintColor: focused ? "#1A4782" : "#FFFFFF" }}
                />
              </View>
            ),
            tabBarLabel: () => (
              <Text className="text-xl text-white font-heebo-bold mt-7">עדכונים</Text>
            ),
          }}
        />
        <Tabs.Screen
          name="index"
          options={{
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <View className={`flex justify-center items-center mt-6 ${focused ? "bg-white p-3 rounded-full mt-8 w-14 h-14" : ""}`}>
                <Image
                  source={require("../../assets/icons/Home.png")}
                  className="w-12 h-12 mt-2"
                  style={{ tintColor: focused ? "#1A4782" : "#FFFFFF" }}
                />
              </View>
            ),
            tabBarLabel: () => (
              <Text className="text-xl text-white font-heebo-bold mt-7">בית</Text>
            ),
          }}
        />
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

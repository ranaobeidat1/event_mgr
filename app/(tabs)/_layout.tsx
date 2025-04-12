import React from "react";
import { SafeAreaView, Image, Text, View } from "react-native";
import { Tabs } from "expo-router";
import { useFonts } from "expo-font";

export default function _layout() {
  const [loaded] = useFonts({
    // Heebo fonts: using two levels up for the relative path
    "Heebo-Thin": require("../../assets/fonts/Heebo-Thin.ttf"),
    "Heebo-ExtraLight": require("../../assets/fonts/Heebo-ExtraLight.ttf"),
    "Heebo-Light": require("../../assets/fonts/Heebo-Light.ttf"),
    "Heebo-Regular": require("../../assets/fonts/Heebo-Regular.ttf"),
    "Heebo-Medium": require("../../assets/fonts/Heebo-Medium.ttf"),
    "Heebo-SemiBold": require("../../assets/fonts/Heebo-SemiBold.ttf"),
    "Heebo-Bold": require("../../assets/fonts/Heebo-Bold.ttf"),
    "Heebo-ExtraBold": require("../../assets/fonts/Heebo-ExtraBold.ttf"),
    "Heebo-Black": require("../../assets/fonts/Heebo-Black.ttf"),
    // Tahoma (already using two levels up)
    Tahoma: require("../../assets/fonts/tahoma.ttf"),
  });

  if (!loaded) return null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#1A4782" }}>
        <Text className="absolute top-[80px] left-[20px] text-white text-2xl font-heebo-bold">
  שלום יוסף !
</Text>
  <View
  style={{
    height: 70,
    width: 90,
    backgroundColor: "#ffffff",
    alignSelf: "flex-end",
    marginRight: 0,
    justifyContent: "center", // Center the logo vertically
    alignItems: "center", // Center the logo horizontally
  }}
>
  <Image
    source={require("../../assets/icons/logoIcon.png")} // Update this path to your logo's location
    style={{
      width: "80%",  // Adjust width as needed
      height: "80%", // Adjust height as needed
      resizeMode: "contain", // Ensures the logo maintains its aspect ratio
    }}
  />
  

</View>


      <Tabs
        screenOptions={{
          tabBarItemStyle: {
            justifyContent: "center",
            alignItems: "center",
          },
          tabBarStyle: {
            height: 90,
            backgroundColor: "#1A4782", // Primary color background
            position: "absolute",
            bottom: 0,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "home",
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <View
                className={`flex justify-center items-center mt-6 ${
                  focused
                    ? "bg-white p-3 rounded-full mt-8 w-16 h-16 flex flex-col items-center justify-center"
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
            title: "alerts",
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <View
                className={`flex justify-center items-center mt-6 ${
                  focused
                    ? "bg-white p-3 rounded-full mt-8 w-16 h-16 flex flex-col items-center justify-center"
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
            title: "classes",
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <View
                className={`flex justify-center items-center mt-6 ${
                  focused
                    ? "bg-white p-3 rounded-full mt-8 w-16 h-16 flex flex-col items-center justify-center"
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
            title: "profile",
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <View
                className={`flex justify-center items-center mt-6 ${
                  focused
                    ? "bg-white p-3 rounded-full mt-8 w-16 h-16 flex flex-col items-center justify-center"
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

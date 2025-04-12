import React from "react";
import { ScrollView, Text, View, SafeAreaView } from "react-native";
import { Link } from "expo-router";

export default function Index() {
  // Sample list of classes with names in Hebrew
  const classes = [
    { id: "1", name: "יוגה" },
    { id: "2", name: "פילאטיס" },
    { id: "3", name: "זומבה" },
    { id: "4", name: "קרוספיט" },
    { id: "5", name: "ריקודים" },
    { id: "6", name: "אירוביקס" },
    { id: "7", name: "מדיטציה" },
  ];

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}>
        <Text className="text-3xl font-heebo-bold text-center mt-5 text-primary">
          חוגים
        </Text>
        {/* Container for clickable class pills */}
        <View className="mt-8 flex flex-col gap-8">
          {classes.map((cls) => (
            <Link key={cls.id} href={`/classes/${cls.id}`}>
              <View className="bg-primary rounded-full px-14 py-8 shadow-md w-full items-center">
                <Text className="text-white font-heebo-bold text-xl">{cls.name}</Text>
              </View>
            </Link>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

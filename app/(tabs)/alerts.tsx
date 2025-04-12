import { ScrollView, Text, View,SafeAreaView } from "react-native";
import { Link } from "expo-router";
export default function Index() {
  return (
    <View className="flex-1 items-center justify-center bg-white gap-4">
        <ScrollView className="flex-1 w-full">
<Text className="text-3xl font-heebo-bold text-center mt-5 text-primary">
  עדכונים
</Text>
        </ScrollView>
    </View>
  );
}

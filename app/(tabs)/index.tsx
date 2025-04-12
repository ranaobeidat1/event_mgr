import React, { useState } from "react";
import {
  FlatList,
  Modal,
  TouchableOpacity,
  View,
  Text,
  SafeAreaView,
  Image,
  ScrollView,
} from "react-native";
import { Link } from "expo-router";

// Define the Post type with an image property of any type
interface Post {
  id: string;
  title: string;
  content: string;
  image: any;
}

const PostItem = ({ item }: { item: Post }) => {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View className="p-4 m-2 bg-[#1A4782] border border-white rounded-lg">
      <TouchableOpacity onPress={() => setModalVisible(true)}>
        <Image
          source={item.image}
          className="w-full h-40 rounded-lg" // Using nativewind for styling
          resizeMode="cover"
        />
      </TouchableOpacity>
      <Text className="text-xl font-heebo-bold text-white mt-2">
        {item.title}
      </Text>
      <Text className="mt-2 text-white">{item.content}</Text>

      {/* Modal for full-screen zoomable image */}
      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <View className="flex-1 bg-black">
          {/* Close button */}
          <TouchableOpacity
            onPress={() => setModalVisible(false)}
            className="absolute top-10 right-5 z-10"
          >
            <Text className="text-white text-3xl">X</Text>
          </TouchableOpacity>

          {/* ScrollView with pinch-to-zoom functionality */}
          <ScrollView
            maximumZoomScale={3}
            minimumZoomScale={1}
            contentContainerStyle={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Image
              source={item.image}
              style={{
                width: "100%",
                height: "100%",
              }}
              resizeMode="contain"
            />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

export default function Index() {
  // Array of posts with realistic content and local image paths
  const posts: Post[] = [
    {
      id: "1",
      title: "A Journey Through the Mountains",
      content:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean et purus vitae sem congue blandit.",
      image: require("../../assets/images/mountain.png"),
    },
    {
      id: "2",
      title: "Discovering the City Life",
      content:
        "Suspendisse potenti. Nulla facilisi. Explore the vibrant streets and hidden corners of the city.",
      image: require("../../assets/images/city.png"),
    },
    {
      id: "3",
      title: "The Enchanted Forest",
      content:
        "Curabitur ut eros felis. Wander through the mystical forest where nature amazes at every turn.",
      image: require("../../assets/images/forest.png"),
    },
    {
      id: "4",
      title: "A Night at the Party",
      content:
        "Duis aute irure dolor in reprehenderit. Experience the lively atmosphere and unforgettable moments at the party.",
      image: require("../../assets/images/party.png"),
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-white">
      <FlatList<Post>
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PostItem item={item} />}
        ListHeaderComponent={
          <Text className="text-3xl font-heebo-bold text-center mt-5 text-[#1A4782]">
            ברוכים הבאים לאפליקציה שלנו!
          </Text>
        }
        contentContainerStyle={{ paddingBottom: 120 }}
      />
    </SafeAreaView>
  );
}

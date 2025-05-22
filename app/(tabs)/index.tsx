import React, { useEffect, useState } from "react";
import {
  FlatList,
  TouchableOpacity,
  View,
  Text,
  SafeAreaView,
  Image,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db, auth } from "../FirebaseConfig";
import { getUser } from "../utils/firestoreUtils";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface Post {
  id: string;
  title: string;
  content: string;
  images?: string[];
  createdAt?: any;
}

interface UserData {
  id: string;
  role?: string;
}

const PostItem = ({ item }: { item: Post }) => {
  const images = item.images || [];
  const total = images.length;

  const goToDetail = () => {
    router.push(`./posts/${item.id}`);
  };

  // Single image
  if (total === 1) {
    return (
      <TouchableOpacity
        onPress={goToDetail}
        className="m-2 overflow-hidden bg-white rounded-lg items-center"
      >
        <Image
          source={{ uri: images[0] }}
          className="w-[500px] h-[500px]"
          resizeMode="cover"
        />
        <View className="p-4 bg-[#1A4782] w-full">
          <Text className="text-xl font-heebo-bold text-white text-right">
            {item.title}
          </Text>
          <Text
            className="mt-1 text-white text-right"
            numberOfLines={2}
          >
            {item.content}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  // Two images
  if (total === 2) {
    return (
      <View className="m-2 overflow-hidden bg-white rounded-lg">
        <View className="flex-row justify-center items-center">
          {images.map((uri, idx) => (
            <TouchableOpacity key={idx} onPress={goToDetail}>
              <Image
                source={{ uri }}
                className="w-[500px] h-[500px] mx-1"
                resizeMode="cover"
              />
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          onPress={goToDetail}
          className="absolute bottom-0 left-0 p-4 bg-[#1A4782] w-full"
        >
          <Text className="text-xl font-heebo-bold text-white text-right">
            {item.title}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Three images
  if (total === 3) {
    return (
      <TouchableOpacity
        onPress={goToDetail}
        className="m-2 rounded-lg overflow-hidden bg-white"
      >
        <View
          style={{
            flexDirection: "row",
            width: SCREEN_WIDTH,
            height: SCREEN_WIDTH / 2,
          }}
        >
          <Image
            source={{ uri: images[0] }}
            style={{ width: SCREEN_WIDTH / 2, height: SCREEN_WIDTH / 2 }}
            resizeMode="cover"
          />
          <View style={{ width: SCREEN_WIDTH / 2 }}>
            {[images[1], images[2]].map((uri, idx) => (
              <Image
                key={idx}
                source={{ uri }}
                style={{ width: SCREEN_WIDTH / 2, height: SCREEN_WIDTH / 4 }}
                resizeMode="cover"
              />
            ))}
          </View>
        </View>
        <View className="p-4 bg-[#1A4782] w-full">
          <Text className="text-xl font-heebo-bold text-white text-right">
            {item.title}
          </Text>
          <Text
            className="mt-1 text-white text-right"
            numberOfLines={2}
          >
            {item.content}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  // Four images
  if (total === 4) {
    const cellSize = SCREEN_WIDTH / 2;
    return (
      <TouchableOpacity
        onPress={goToDetail}
        className="m-2 overflow-hidden bg-white rounded-lg"
      >
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            width: SCREEN_WIDTH,
          }}
        >
          {images.slice(0, 4).map((uri, idx) => (
            <Image
              key={idx}
              source={{ uri }}
              style={{ width: cellSize, height: cellSize }}
              resizeMode="cover"
            />
          ))}
        </View>
        <View className="p-4 bg-[#1A4782] w-full">
          <Text className="text-xl font-heebo-bold text-white text-right">
            {item.title}
          </Text>
          <Text
            className="mt-1 text-white text-right"
            numberOfLines={2}
          >
            {item.content}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  // 5+ images
  const cellSize = SCREEN_WIDTH / 2;
  const extra = total - 4;
  if (total > 4) {
    return (
      <TouchableOpacity
        onPress={goToDetail}
        className="m-2 overflow-hidden bg-white rounded-lg"
      >
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            width: SCREEN_WIDTH,
          }}
        >
          {images.slice(0, 4).map((uri, idx) => (
            <View
              key={idx}
              style={{ width: cellSize, height: cellSize }}
            >
              <Image
                source={{ uri }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
                blurRadius={idx === 3 ? 10 : 0}
              />
              {idx === 3 && (
                <View className="absolute inset-0 justify-center items-center">
                  <Text className="text-white text-xl font-heeboBold bg-black bg-opacity-50 px-2 py-1">
                    +{extra}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
        <View className="p-4 bg-[#1A4782] w-full">
          <Text className="text-xl font-heebo-bold text-white text-right">
            {item.title}
          </Text>
          <Text
            className="mt-1 text-white text-right"
            numberOfLines={2}
          >
            {item.content}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return null;
};

export default function PostsScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const postsQuery = query(
      collection(db, "posts"),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
      setPosts(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Post, "id">),
        }))
      );
    });

    (async () => {
      const user = auth.currentUser;
      if (user) {
        const userData = (await getUser(user.uid)) as UserData;
        setIsAdmin(userData?.role === "admin");
      }
    })();

    return unsubscribe;
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-white">
      {isAdmin && (
        <TouchableOpacity
       className="absolute top-4 right-4 w-14 h-14 bg-yellow-400 rounded-full items-center justify-center shadow-lg z-10"

          onPress={() => router.push("/posts/create")}
        >
          <Text className="text-black text-2xl font-heeboBold">
            +
          </Text>
        </TouchableOpacity>
      )}

      <FlatList<Post>
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PostItem item={item} />}
        ListHeaderComponent={() => (
          <Text className="text-3xl font-heebo-bold mt-5 text-[#1A4782] text-center">
            ברוכים הבאים לאפליקציה שלנו!
          </Text>
        )}
        contentContainerStyle={{
          paddingBottom: 120,
          paddingTop: isAdmin ? 60 : 20,
        }}
      />
    </SafeAreaView>
  );
}

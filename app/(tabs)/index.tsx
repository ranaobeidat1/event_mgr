import React, { useEffect, useState } from "react";
import {
  FlatList,
  TouchableOpacity,
  View,
  Text,
  SafeAreaView,
  Image,
  Dimensions,
  TextInput,
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
  const goToDetail = () => router.push(`./posts/${item.id}`);

  // Single image
  if (total === 1) {
    return (
      <TouchableOpacity
        onPress={goToDetail}
        className="m-2 overflow-hidden bg-white rounded-lg items-center"
      >
        <Image
          source={{ uri: images[0] }}
          className="w-[500px] h-[500px] border border-white"
          resizeMode="cover"
        />
        <View className="p-4 bg-[#1A4782] w-full">
          <Text className="text-xl font-heebo-bold text-white text-right">
            {item.title}
          </Text>
          <Text className="mt-1 text-white text-right" numberOfLines={2}>
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
                className="w-[500px] h-[500px] mx-0.25 border border-white"
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
            style={{
              width: SCREEN_WIDTH / 2,
              height: SCREEN_WIDTH / 2,
              borderWidth: 1,
              borderColor: '#FFFFFF',
            }}
            resizeMode="cover"
          />
          <View style={{ width: SCREEN_WIDTH / 2 }}>
            {[images[1], images[2]].map((uri, idx) => (
              <Image
                key={idx}
                source={{ uri }}
                style={{
                  width: SCREEN_WIDTH / 2,
                  height: SCREEN_WIDTH / 4,
                  borderWidth: 1,
                  borderColor: '#FFFFFF',
                }}
                resizeMode="cover"
              />
            ))}
          </View>
        </View>
        <View className="p-4 bg-[#1A4782] w-full">
          <Text className="text-xl font-heebo-bold text-white text-right">
            {item.title}
          </Text>
          <Text className="mt-1 text-white text-right" numberOfLines={2}>
            {item.content}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  // Four images and 5+
  const cellSize = SCREEN_WIDTH / 2;
  const extra = total - 4;
  if (total >= 4) {
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
            <View key={idx} style={{ width: cellSize, height: cellSize }}>
              <Image
                source={{ uri }}
                style={{
                  width: cellSize,
                  height: cellSize,
                  borderWidth: 1,
                  borderColor: '#FFFFFF',
                }}
                resizeMode="cover"
                blurRadius={idx === 3 && total > 4 ? 10 : 0}
              />
              {idx === 3 && total > 4 && (
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
          <Text className="mt-1 text-white text-right" numberOfLines={2}>
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
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter posts based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredPosts(posts);
    } else {
      const filtered = posts.filter(post => {
        const titleMatch = post.title?.toLowerCase().includes(searchQuery.toLowerCase());
        const contentMatch = post.content?.toLowerCase().includes(searchQuery.toLowerCase());
        return titleMatch || contentMatch;
      });
      setFilteredPosts(filtered);
    }
  }, [posts, searchQuery]);

  useEffect(() => {
    const postsQuery = query(
      collection(db, "posts"),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
      setPosts(
        snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<Post, "id">) }))
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

  const ListHeaderComponent = () => (
    <View>
      <Text className="text-3xl font-heebo-bold mt-5 text-[#1A4782] text-center">
        ברוכים הבאים לאפליקציה שלנו!
      </Text>
      
      {/* Search Box */}
      <View className="mx-4 mt-6 mb-4">
        <TextInput
          className="bg-gray-100 rounded-full px-5 py-3 text-lg font-heebo-regular text-right"
          placeholder="חפש פוסטים..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.trim() !== "" && (
          <TouchableOpacity
            className="absolute left-7 top-1/2 transform -translate-y-1/2"
            onPress={() => setSearchQuery("")}
          >
            <Text className="text-gray-500 text-lg">×</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Search Results Counter */}
      {searchQuery.trim() !== "" && (
        <View className="mx-4 mb-2">
          <Text className="text-sm text-gray-600 font-heebo-medium text-right">
            נמצאו {filteredPosts.length} פוסטים
          </Text>
        </View>
      )}
    </View>
  );

  const ListEmptyComponent = () => (
    <View className="flex-1 items-center justify-center mt-20">
      <Text className="text-center text-gray-600 font-heebo-medium text-lg">
        {searchQuery.trim() !== "" ? "לא נמצאו פוסטים התואמים לחיפוש" : "אין פוסטים עדיין"}
      </Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      {isAdmin && (
        <TouchableOpacity
          className="absolute top-4 right-4 w-14 h-14 bg-yellow-400 rounded-full items-center justify-center shadow-lg z-10"
          onPress={() => router.push("/posts/create")}
        >
          <Text className="text-black text-2xl font-heeboBold">+</Text>
        </TouchableOpacity>
      )}

      <FlatList<Post>
        data={filteredPosts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PostItem item={item} />}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={ListEmptyComponent}
        contentContainerStyle={{
          paddingBottom: 120,
          paddingTop: isAdmin ? 60 : 20,
        }}
      />
    </SafeAreaView>
  );
}
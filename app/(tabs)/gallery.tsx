import React, { useEffect, useState, useCallback } from "react";
import {
  FlatList,
  TouchableOpacity,
  View,
  Text,
  SafeAreaView,
  Image,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import {
  collection,
  query,
  orderBy,
  getDocs,
  limit,
  startAfter,
  DocumentData,
} from "firebase/firestore";
import { db, auth } from "../../FirebaseConfig";
import { getUser } from "../utils/firestoreUtils";
import { useAuth } from "../_layout";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface Post {
  id: string;
  title?: string;
  content?: string;
  images?: string[];
  createdAt?: any;
}

// ========================================================================
// THIS IS THE CORRECT, FULL PostItem COMPONENT.
// ========================================================================
const PostItem = ({ item }: { item: Post }) => {
  const images = item.images || [];
  const total = images.length;
  const goToDetail = () => router.push(`/posts/${item.id}`);

  // Single image
  if (total === 1) {
    return (
      <TouchableOpacity
        onPress={goToDetail}
        className="m-2 overflow-hidden bg-white rounded-3xl items-center"
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
          <Text className="mt-1 text-white text-right font-tahoma" numberOfLines={4}>
            {item.content}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  // Two images
  if (total === 2) {
    const cellSize = SCREEN_WIDTH / 2;

    return (
      <View className="m-2 overflow-hidden bg-white rounded-2xl">
        <View className="flex-row justify-center items-center">
          {images.map((uri, idx) => (
            <TouchableOpacity key={idx} onPress={goToDetail}>
              <Image
                source={{ uri }}
                style={{
                  width: cellSize,
                  height: cellSize * 2,
                  borderWidth: 1,
                  borderColor: "#FFFFFF",
                }}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          onPress={goToDetail}
          className="p-4 bg-[#1A4782] w-full"
        >
          <Text className="text-xl font-heebo-bold text-white text-right">
            {item.title}
          </Text>
          <Text className="mt-1 text-white text-right font-tahoma" numberOfLines={4}>
            {item.content}
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
        className="m-2 rounded-3xl overflow-hidden bg-white"
      >
        <View
          style={{
            flexDirection: "row",
            width: SCREEN_WIDTH,
            height: SCREEN_WIDTH,
          }}
        >
          <Image
            source={{ uri: images[0] }}
            style={{
              width: SCREEN_WIDTH / 2,
              height: SCREEN_WIDTH,
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
                  width: SCREEN_WIDTH,
                  height: SCREEN_WIDTH / 2,
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
          <Text className="mt-1 text-white text-right font-tahoma" numberOfLines={4}>
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
        className="m-2 overflow-hidden bg-white rounded-3xl"
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
          <Text className="mt-1 text-white text-right font-tahoma" numberOfLines={4}>
            {item.content}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return null;
};

// Define how many posts to load per page
const POSTS_PER_PAGE = 5;

export default function PostsScreen() {
  const { isGuest } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  // --- New state for pagination and loading ---
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastVisible, setLastVisible] = useState<DocumentData | null>(null);
  const [allDataLoaded, setAllDataLoaded] = useState(false);

  // --- Replaces your old useEffect fetching logic ---
  useEffect(() => {
    const fetchInitialPosts = async () => {
      setLoading(true);
      try {
        const firstBatchQuery = query(
          collection(db, "posts"),
          orderBy("createdAt", "desc"),
          limit(POSTS_PER_PAGE)
        );
        const docSnapshots = await getDocs(firstBatchQuery);
        const newPosts = docSnapshots.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Post, "id">),
        }));

        const lastDoc = docSnapshots.docs[docSnapshots.docs.length - 1];
        setLastVisible(lastDoc);
        setPosts(newPosts);

        if (docSnapshots.docs.length < POSTS_PER_PAGE) {
          setAllDataLoaded(true);
        }
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    };

    fetchInitialPosts();

    // Admin check logic remains the same
    if (!isGuest) {
      (async () => {
        const user = auth.currentUser;
        if (user) {
          const userData = await getUser(user.uid);
          setIsAdmin(userData?.role === "admin");
        }
      })();
    } else {
      setIsAdmin(false);
    }
  }, [isGuest]);

  // --- Function to fetch the next page ---
  const handleLoadMore = async () => {
    if (loadingMore || allDataLoaded || !lastVisible) return;

    setLoadingMore(true);
    try {
      const nextBatchQuery = query(
        collection(db, "posts"),
        orderBy("createdAt", "desc"),
        startAfter(lastVisible),
        limit(POSTS_PER_PAGE)
      );

      const docSnapshots = await getDocs(nextBatchQuery);
      if (docSnapshots.empty) {
        setAllDataLoaded(true);
        return;
      }

      const newPosts = docSnapshots.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Post, "id">),
      }));

      const lastDoc = docSnapshots.docs[docSnapshots.docs.length - 1];
      setLastVisible(lastDoc);
      setPosts((prevPosts) => [...prevPosts, ...newPosts]);

      if (docSnapshots.docs.length < POSTS_PER_PAGE) {
        setAllDataLoaded(true);
      }
    } catch (e) { console.error(e) }
    finally { setLoadingMore(false) }
  };

  const ListEmptyComponent = () => (
    <View className="flex-1 items-center justify-center mt-20">
      <Text className="text-center text-gray-600 font-heebo-medium text-lg">
        אין פוסטים עדיין
      </Text>
    </View>
  );

  // --- Component for the "Load More" button ---
  const renderFooter = () => {
    if (allDataLoaded) return null;
    if (!loading && posts.length === 0) return null; // Don't show button if list is empty

    return (
      <View className="items-center my-8">
        <TouchableOpacity
          onPress={handleLoadMore}
          disabled={loadingMore}
          className="bg-primary px-12 py-3 rounded-full shadow-lg"
        >
          {loadingMore ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-lg font-heebo-bold">
              טען עוד
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#1A4782" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {isAdmin && (
        <TouchableOpacity
          className="absolute top-4 right-4 w-14 h-14 bg-[#1A4782] rounded-full items-center justify-center shadow-lg z-10"
          onPress={() => router.push("/posts/create")}
        >
          <Text className="text-white text-2xl font-heeboBold">+</Text>
        </TouchableOpacity>
      )}

      <FlatList<Post>
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PostItem item={item} />}
        ListEmptyComponent={ListEmptyComponent}
        ListFooterComponent={renderFooter}
        contentContainerStyle={{
          paddingBottom: 120,
          paddingTop: isAdmin ? 60 : 20,
        }}
      />
    </SafeAreaView>
  );
}
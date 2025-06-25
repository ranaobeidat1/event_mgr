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
import { db, auth } from "../../FirebaseConfig";
import { getUser } from "../utils/firestoreUtils";
import { useAuth } from "../_layout";
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface Post {
  id: string;
  title: string;
  content: string;
  images?: string[];
  createdAt?: any;
}


type ViewMode = 'grid' | 'list';

const GallerySkeleton = () => (
  <View className="px-4">
    {[1, 2, 3].map((i) => (
      <View key={i} className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-6 overflow-hidden">
        <View className="w-full h-64 bg-gray-200" />
        <View className="p-4">
          <View className="w-3/4 h-5 bg-gray-200 rounded mb-2" />
          <View className="w-full h-4 bg-gray-200 rounded mb-1" />
          <View className="w-5/6 h-4 bg-gray-200 rounded" />
        </View>
      </View>
    ))}
  </View>
);

const PostItem = ({ item, viewMode }: { item: Post; viewMode: ViewMode }) => {
  const images = item.images || [];
  const total = images.length;
  const goToDetail = () => router.push(`/posts/${item.id}`);

  if (viewMode === 'list') {
    return (
      <TouchableOpacity
        onPress={goToDetail}
        className="mx-4 mb-6 bg-white rounded-2xl shadow-lg overflow-hidden"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 5,
        }}
      >
        {total > 0 && (
          <View className="relative">
            <Image
              source={{ uri: images[0] }}
              className="w-full h-56"
              resizeMode="cover"
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.7)']}
              className="absolute bottom-0 left-0 right-0 h-20"
            />
            {total > 1 && (
              <View className="absolute top-3 right-3 bg-black bg-opacity-60 px-2 py-1 rounded-full">
                <Text className="text-white text-xs font-heebo-medium">+{total - 1}</Text>
              </View>
            )}
          </View>
        )}
        <View className="p-5">
          <Text className="text-lg font-heebo-bold text-gray-900 text-right mb-2">
            {item.title}
          </Text>
          <Text className="text-gray-600 text-right font-heebo-regular" numberOfLines={3}>
            {item.content}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  // Grid view
  const cardWidth = (SCREEN_WIDTH - 32 - 8) / 2;
  
  return (
    <TouchableOpacity
      onPress={goToDetail}
      className="bg-white rounded-2xl shadow-lg overflow-hidden mb-4"
      style={{
        width: cardWidth,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
      }}
    >
      {total > 0 && (
        <View className="relative">
          <Image
            source={{ uri: images[0] }}
            style={{ width: cardWidth, height: cardWidth * 0.75 }}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.6)']}
            className="absolute bottom-0 left-0 right-0 h-16"
          />
          {total > 1 && (
            <View className="absolute top-2 right-2 bg-black bg-opacity-60 px-1.5 py-0.5 rounded-full">
              <Text className="text-white text-xs font-heebo-medium">+{total - 1}</Text>
            </View>
          )}
        </View>
      )}
      <View className="p-3">
        <Text className="text-sm font-heebo-bold text-gray-900 text-right mb-1" numberOfLines={2}>
          {item.title}
        </Text>
        <Text className="text-xs text-gray-600 text-right font-heebo-regular" numberOfLines={2}>
          {item.content}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default function PostsScreen() {
  const { isGuest } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  useEffect(() => {
    // Set up posts listener (available to both guests and authenticated users)
    const postsQuery = query(
      collection(db, "posts"),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
      setPosts(
        snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<Post, "id">) }))
      );
      setLoading(false);
    });

    // Only check for admin status if not a guest
    if (!isGuest) {
      (async () => {
        const user = auth.currentUser;
        if (user) {
          const userData = (await getUser(user.uid));
          setIsAdmin(userData?.role === "admin");
        }
      })();
    } else {
      // Reset admin status for guests
      setIsAdmin(false);
    }

    return unsubscribe;
  }, [isGuest]);

  const ListEmptyComponent = () => (
    <View className="flex-1 items-center justify-center mt-20">
      <Ionicons name="images-outline" size={64} color="#9CA3AF" />
      <Text className="text-center text-gray-600 font-heebo-medium text-lg mt-4">
        אין פוסטים עדיין
      </Text>
    </View>
  );

  const renderGridItem = ({ item, index }: { item: Post; index: number }) => (
    <View style={{ marginLeft: index % 2 === 0 ? 0 : 8, marginRight: index % 2 === 1 ? 0 : 8 }}>
      <PostItem item={item} viewMode={viewMode} />
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <GallerySkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header with view toggle */}
      <View className="bg-white px-4 py-3 border-b border-gray-100">
        <View className="flex-row justify-between items-center">
          <View className="flex-row bg-gray-100 rounded-lg p-1">
            <TouchableOpacity
              onPress={() => setViewMode('list')}
              className={`px-3 py-2 rounded-md ${
                viewMode === 'list' ? 'bg-white shadow-sm' : ''
              }`}
            >
              <Ionicons 
                name="list" 
                size={20} 
                color={viewMode === 'list' ? '#1A4782' : '#6B7280'} 
              />
            </TouchableOpacity>
          
          </View>
          {isAdmin && (
          <TouchableOpacity
                 className="w-14 h-14 bg-[#1A4782] rounded-full items-center justify-center"
                  style={{
                    shadowColor: '#1A4782',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 8,
                  }}
                  onPress={() => router.push("/posts/create")}
                  activeOpacity={0.8}
                >
                  <Text className="text-white text-3xl font-heebo-bold">+</Text>
                </TouchableOpacity>
      )}

        </View>
      </View>

      {isAdmin && (
        <Animated.View className="absolute bottom-6 right-6 z-10">
          <TouchableOpacity 
            className="w-14 h-14 bg-[#1A4782] rounded-full items-center justify-center"
            style={{
              shadowColor: '#1A4782',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
            onPress={() => router.push("/posts/create")}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={28} color="white" />
          </TouchableOpacity>
        </Animated.View>
      )}

      <FlatList<Post>
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={viewMode === 'grid' ? renderGridItem : ({ item }) => <PostItem item={item} viewMode={viewMode} />}
        ListEmptyComponent={ListEmptyComponent}
        numColumns={viewMode === 'grid' ? 2 : 1}
        key={viewMode}
        contentContainerStyle={{
          paddingBottom: 120,
          paddingTop: 16,
          paddingHorizontal: viewMode === 'grid' ? 16 : 0,
        }}
        columnWrapperStyle={viewMode === 'grid' ? { justifyContent: 'space-between' } : undefined}
      />
    </SafeAreaView>
  );
}
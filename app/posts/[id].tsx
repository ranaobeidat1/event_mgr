// app/posts/[id].tsx
export const screenOptions = {
  headerShown: false,
};

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
  Modal,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../FirebaseConfig';
import { getUser } from '../utils/firestoreUtils';

interface UserData { id: string; role?: string }
interface PostData { title: string; content: string; images?: string[]; authorId: string; createdAt?: any }

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function PostDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [postData, setPostData] = useState<PostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [startIndex, setStartIndex] = useState(0);

  const openModal = (index: number) => {
    setStartIndex(index);
    setModalVisible(true);
  };
  const closeModal = () => setModalVisible(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const snap = await getDoc(doc(db, 'posts', id));
        if (!snap.exists()) {
          Alert.alert('שגיאה', 'הפוסט לא נמצא');
          return router.back();
        }
        setPostData(snap.data() as PostData);

        const user = auth.currentUser;
        if (user) {
          const u = (await getUser(user.uid)) as UserData;
          setIsAdmin(u.role === 'admin');
        }
      } catch {
        Alert.alert('שגיאה', 'אירעה שגיאה בטעינת הפוסט');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const confirmDelete = () =>
    Alert.alert('מחק פוסט?', 'האם למחוק את הפוסט הזה?', [
      { text: 'ביטול', style: 'cancel' },
      {
        text: 'מחק',
        style: 'destructive',
        onPress: async () => {
          try {
            setDeleting(true);
            await deleteDoc(doc(db, 'posts', id));
            Alert.alert('נמחק', '', [{ text: 'אישור', onPress: () => router.replace('/(tabs)') }]);
          } catch {
            Alert.alert('שגיאה', 'אירעה שגיאה במחיקה');
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#1A4782" />
      </SafeAreaView>
    );
  }

  if (!postData) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center p-5">
        <Text className="text-lg text-[#1A4782]">אין פוסט להצגה.</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text className="text-[#1A4782]">חזרה</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <>
      {/* Full-screen swipeable images */}
      <Modal visible={modalVisible} animationType="fade" onRequestClose={closeModal}>
        <View className="flex-1 bg-black">
          <TouchableOpacity onPress={closeModal} className="absolute top-12 right-6 z-10 p-2">
            <Text className="text-white text-2xl">×</Text>
          </TouchableOpacity>

          <ScrollView
            horizontal
            pagingEnabled
            contentOffset={{ x: SCREEN_WIDTH * startIndex, y: 0 }}
            showsHorizontalScrollIndicator={false}
            style={{ flex: 1 }}
          >
            {postData.images?.map((uri, idx) => (
              <View key={idx} style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}>
                <Image
                  source={{ uri }}
                  style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
                  resizeMode="contain"
                />
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>

      <SafeAreaView className="flex-1 bg-white px-5">
        <ScrollView className="pb-10">
          {/* Title */}
          <Text className="text-3xl font-bold text-[#1A4782] text-center mb-6">
            {postData.title}
          </Text>

          {/* Content */}
          <Text className="text-base text-gray-800 mb-6">
            {postData.content}
          </Text>

          {/* Thumbnails */}
          {postData.images?.map((uri, idx) => (
            <TouchableOpacity key={idx} onPress={() => openModal(idx)} className="mb-4">
              <Image
                source={{ uri }}
                className="w-full aspect-square rounded-lg"
                resizeMode="cover"
              />
            </TouchableOpacity>
          ))}

          {/* Delete */}
          {isAdmin && (
            <TouchableOpacity
              onPress={confirmDelete}
              disabled={deleting}
              className={`${deleting ? 'bg-red-300' : 'bg-red-600'} py-3 rounded-full items-center`}
            >
              <Text className="text-white text-lg font-bold">
                {deleting ? 'מוחק…' : 'מחק פוסט'}
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

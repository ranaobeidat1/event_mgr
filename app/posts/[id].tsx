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
import { db, auth } from '../../FirebaseConfig';
import { getUser } from '../utils/firestoreUtils';
import { useAuth } from '../_layout';
import { ModernActionButtons } from '../components/ModernActionButtons';

interface UserData { id: string; role?: string; }
interface PostData { title: string; content: string; images?: string[]; authorId: string; createdAt?: any; }

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function PostDetails() {
  const { isGuest, setIsGuest } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();

  // Don’t fetch until the router gives us an id
  if (!id) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#1A4782" />
      </SafeAreaView>
    );
  }

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

        // Skip admin check for guest users
        if (isGuest) {
          setIsAdmin(false);
        } else {
          const user = auth.currentUser;
          if (user) {
            const u = (await getUser(user.uid)) as UserData;
            setIsAdmin(u.role === 'admin');
          }
        }
      } catch {
        Alert.alert('שגיאה', 'אירעה שגיאה בטעינת הפוסט');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isGuest]);

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
            Alert.alert('נמחק', '', [
              { text: 'אישור', onPress: () => router.replace('/(tabs)') }
            ]);
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

      <SafeAreaView className="flex-1 bg-white px-6" style={{direction: 'rtl'}}>
        {/* Header */}
        <View className="pt-5 pb-3">
          <View className="flex-row justify-start mb-4">
            <TouchableOpacity onPress={() => router.back()}>
              <Text className="text-primary text-2xl font-heebo-medium">חזרה</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Title */}
        <Text className="text-3xl font-bold text-primary text-center mb-6">
          {postData.title}
        </Text>

        {/* Content */}
        <Text className="text-xl text-black mb-6 text-start">
          {postData.content}
        </Text>

        <ScrollView className="pb-10 ">
          {/* Edit & Delete Buttons */}
          {isAdmin && (
            <View className="mb-4 items-center">
              <ModernActionButtons
                showEdit={true}
                showDelete={true}
                onEdit={() => router.push(`/posts/${id}/edit`)}
                onDelete={confirmDelete}
                disabled={deleting}
                size="large"
              />
            </View>
          )}
 

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
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

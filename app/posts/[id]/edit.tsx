// app/posts/[id]/edit.tsx
export const screenOptions = {
  headerShown: false,
};

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
// --- CORRECTED IMPORTS ---
import { db, storage } from '../../../FirebaseConfig'; // Correctly import native instances

interface PostData {
  title: string;
  content: string;
  images?: string[];
}

export default function EditPost() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [post, setPost] = useState<PostData>({
    title: '',
    content: '',
    images: [],
  });
  
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    (async () => {
      if (!id) return;
      try {
        // --- CORRECTED FIRESTORE SYNTAX ---
        const docRef = db.collection('posts').doc(id);
        const docSnap = await docRef.get();
        if (!docSnap.exists) {
          throw new Error('לא נמצא פוסט');
        }
        setPost(docSnap.data() as PostData);
      } catch (e: any) {
        Alert.alert('שגיאה', e.message, [
          { text: 'אוקיי', onPress: () => router.back() },
        ]);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('שגיאה', 'אין הרשאה לגישה לתמונות');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      const uris = result.assets.map((asset) => asset.uri);
      setPost((p) => ({
        ...p,
        images: [...(p.images ?? []), ...uris],
      }));
    }
  };

  const removeImage = (index: number) => {
    const allImages = post.images ?? [];
    const imageToRemove = allImages[index];

    if (imageToRemove && imageToRemove.startsWith('https://firebasestorage')) {
      setImagesToDelete(prev => [...prev, imageToRemove]);
    }
    
    setPost((p) => ({
      ...p,
      images: allImages.filter((_, i) => i !== index),
    }));
  };
  
  const uploadImage = async (uri: string) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    // --- CORRECTED STORAGE SYNTAX ---
    const storageRef = storage.ref(`posts/${id}/${Date.now()}`);
    await storageRef.put(blob);
    return await storageRef.getDownloadURL();
  };

  const deleteImageFromStorage = async (imageUrl: string) => {
    try {
      // --- CORRECTED STORAGE SYNTAX ---
      const imageRef = storage.refFromURL(imageUrl);
      await imageRef.delete();
    } catch (error) {
      console.error("Failed to delete image from storage:", error);
    }
  };

  const handleRemoveImage = (index: number) => {
    Alert.alert(
      "מחיקת תמונה",
      "האם אתה בטוח שברצונך למחוק את התמונה?",
      [
        { text: "ביטול", style: "cancel" },
        {
          text: "מחק",
          onPress: () => removeImage(index),
          style: "destructive",
        },
      ]
    );
  };

  const handleSave = async () => {
    if (
      post.title.trim() === '' &&
      post.content.trim() === '' &&
      (!post.images || post.images.length === 0)
    ) {
      Alert.alert('שגיאה', 'אנא הוסף לפחות כותרת, תוכן או תמונה');
      return;
    }

    setIsUploading(true);
    
    try {
      const newImageUris = post.images?.filter(uri => uri.startsWith('file://')) ?? [];
      const existingImageUrls = post.images?.filter(uri => !uri.startsWith('file://')) ?? [];
      
      const newImageUrls = await Promise.all(newImageUris.map(uploadImage));
      
      setIsUploading(false);
      setIsSaving(true);
      
      const finalImageUrls = [...existingImageUrls, ...newImageUrls];

      // --- CORRECTED FIRESTORE SYNTAX ---
      const postRef = db.collection('posts').doc(id);
      await postRef.update({
        title: post.title,
        content: post.content,
        images: finalImageUrls,
      });

      if (imagesToDelete.length > 0) {
        await Promise.all(imagesToDelete.map(url => deleteImageFromStorage(url)));
      }

      Alert.alert('הצלחה', 'השינויים נשמרו בהצלחה');
      router.replace(`/posts/${id}`);

    } catch (error) {
      console.error("Error saving post: ", error);
      Alert.alert('שגיאה', 'לא ניתן היה לשמור את השינויים.');
    } finally {
      setIsUploading(false);
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#1A4782" />
      </SafeAreaView>
    );
  }
  
  const isBusy = isUploading || isSaving;

  return (
    <SafeAreaView className="flex-1 bg-white" >
      <View className="px-6 pt-5 pb-3">
        <View className="flex-row justify-start mb-4">
          <TouchableOpacity onPress={() => router.back()} disabled={isBusy}>
            <Text className="text-primary text-2xl font-heebo-medium">
              חזרה
            </Text>
          </TouchableOpacity>
        </View>

        <View className="items-center">
          <Text className="text-3xl font-bold text-primary">
            עריכת פוסט
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-6">
        <Text className="mb-1 text-start text-xl">כותרת:</Text>
        <TextInput
          value={post.title}
          onChangeText={(t) => setPost((p) => ({ ...p, title: t }))}
          placeholder="כותרת"
          className="border border-gray-300 rounded-lg p-2 mb-4 text-lg"
          textAlign="right"
        />

        <Text className="mb-1 text-start text-xl">תוכן:</Text>
        <TextInput
          value={post.content}
          onChangeText={(t) => setPost((p) => ({ ...p, content: t }))}
          placeholder="תוכן"
          multiline
          numberOfLines={4}
          className="border border-gray-300 rounded-lg p-2 mb-4 h-32 text-top text-lg"
          textAlign="right"
        />

        <Text className="mb-2 text-start text-xl">תמונות:</Text>
        {post.images && post.images.length > 0 ? (
          <ScrollView
            horizontal
            className="h-40 mb-4"
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              alignItems: 'center',
              paddingHorizontal: 4,
            }}
          >
            {post.images.map((uri, index) => (
              <View key={index} className="relative mr-4">
                <Image
                  source={{ uri }}
                  className="w-36 h-36 rounded-lg"
                  resizeMode="cover"
                />
                <TouchableOpacity
                  onPress={() => handleRemoveImage(index)}
                  className="absolute top-1 right-1 bg-red-600 p-1 rounded-full"
                  disabled={isBusy}
                >
                  <Text className="text-white text-xs">×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        ) : (
          <View className="h-40 mb-4 flex items-center justify-center bg-gray-100 rounded-lg border border-dashed border-gray-300">
            <Text className="text-gray-500 font-heebo-medium text-base">
              אין תמונות בפוסט זה
            </Text>
            <Text className="text-gray-400 font-heebo-regular text-sm mt-1">
              ניתן להוסיף תמונות באמצעות הכפתור למטה
            </Text>
          </View>
        )}

        <TouchableOpacity
          onPress={pickImages}
          disabled={isBusy}
          className="bg-[#1A4782] py-3 rounded-full items-center mb-6"
        >
          <Text className="text-white text-xl font-heebo-bold">
            הוסף תמונות
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSave}
          disabled={isBusy}
          className="bg-[#1A4782] py-3 rounded-full items-center"
        >
         {isUploading ? (
            <Text className="text-white text-xl font-heebo-bold">מעלה תמונות...</Text>
          ) : isSaving ? (
            <Text className="text-white text-xl font-heebo-bold">שומר שינויים...</Text>
          ) : (
            <Text className="text-white text-xl font-heebo-bold">שמור שינויים</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

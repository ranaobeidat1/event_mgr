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
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../FirebaseConfig';

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch the existing post
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'posts', id));
        if (!snap.exists()) throw new Error('לא נמצא פוסט');
        setPost(snap.data() as PostData);
      } catch (e: any) {
        Alert.alert('שגיאה', e.message, [
          { text: 'אוקיי', onPress: () => router.back() },
        ]);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Pick new images
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
    if (result.canceled) return;
    const uris = result.assets.map((asset) => asset.uri);
    setPost((p) => ({
      ...p,
      images: [...(p.images ?? []), ...uris],
    }));
  };

  // Remove one of the existing images
  const removeImage = (idx: number) => {
    setPost((p) => ({
      ...p,
      images: p.images?.filter((_, i) => i !== idx) ?? [],
    }));
  };

  // Save changes: relaxed validation, everything else unchanged
  const save = async () => {
    // require at least one of title, content or images
    if (
      post.title.trim() === '' &&
      post.content.trim() === '' &&
      (!post.images || post.images.length === 0)
    ) {
      Alert.alert('שגיאה', 'אנא הוסף לפחות כותרת, תוכן או תמונה');
      return;
    }

    setSaving(true);
    try {
      await updateDoc(doc(db, 'posts', id), {
        title: post.title,
        content: post.content,
        images: post.images ?? [],
      });
      // original in-save navigation left intact
      router.replace(`/posts/${id}`);
    } catch {
      Alert.alert('שגיאה', 'לא ניתן לשמור שינויים');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#1A4782" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" style={{ direction: 'rtl' }}>
      {/* Header */}
      <View className="px-6 pt-5 pb-3">
        <View className="flex-row justify-start mb-4">
          <TouchableOpacity onPress={() => router.back()}>
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
        {post.images?.length ? (
          <ScrollView horizontal className="mb-4 space-x-2">
            {post.images.map((uri, idx) => (
              <View key={idx} className="relative">
                <Image
                  source={{ uri }}
                  className="w-24 h-24 rounded"
                  resizeMode="cover"
                />
                <TouchableOpacity
                  onPress={() => removeImage(idx)}
                  className="absolute top-0 right-0 bg-red-600 p-1 rounded-full"
                >
                  <Text className="text-white text-xs">×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        ) : null}

        <TouchableOpacity
          onPress={pickImages}
          disabled={saving}
          className="bg-[#1A4782] py-3 rounded-full items-center mb-6"
        >
          <Text className="text-white text-xl font-heebo-bold">
            {saving ? 'טוען…' : 'הוסף תמונות'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={async () => {
            await save();
            router.back();
            router.replace(`/posts/${id}`);
          }}
          disabled={saving}
          className="bg-[#1A4782] py-3 rounded-full items-center"
        >
          <Text className="text-white text-xl font-heebo-bold">
            {saving ? 'שומר…' : 'שמור שינויים'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

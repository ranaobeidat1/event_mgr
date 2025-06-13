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
  const [post, setPost] = useState<PostData>({ title: '', content: '', images: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // fetch existing post
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'posts', id));
        if (!snap.exists()) throw new Error('לא נמצא פוסט');
        setPost(snap.data() as PostData);
      } catch (e: any) {
        Alert.alert('שגיאה', e.message, [{ text: 'אוקיי', onPress: () => router.back() }]);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // pick multiple images
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

    const uris = result.assets.map(asset => asset.uri);
    setPost(p => ({ ...p, images: [...(p.images || []), ...uris] }));
  };

  // remove image
  const removeImage = (idx: number) => {
    setPost(p => ({
      ...p,
      images: p.images?.filter((_, i) => i !== idx) || [],
    }));
  };

  // save changes
  const save = async () => {
    if (!post.title.trim() || !post.content.trim()) {
      Alert.alert('שגיאה', 'כותרת ותוכן נדרשים');
      return;
    }
    setSaving(true);
    try {
      await updateDoc(doc(db, 'posts', id), {
        title: post.title,
        content: post.content,
        images: post.images || [],
      });
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
    <SafeAreaView className="flex-1 bg-white px-5">
      <ScrollView className="pb-10">
        <Text className="text-2xl font-bold text-[#1A4782] mb-4">עריכת פוסט</Text>

        <Text className="mb-1">כותרת:</Text>
        <TextInput
          value={post.title}
          onChangeText={t => setPost(p => ({ ...p, title: t }))}
          placeholder="כותרת"
          className="border border-gray-300 rounded-lg p-2 mb-4"
        />

        <Text className="mb-1">תוכן:</Text>
        <TextInput
          value={post.content}
          onChangeText={t => setPost(p => ({ ...p, content: t }))}
          placeholder="תוכן"
          multiline
          numberOfLines={4}
          className="border border-gray-300 rounded-lg p-2 mb-4 h-32 text-top"
        />

        <Text className="mb-2">תמונות:</Text>
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
          className="bg-green-600 py-3 rounded-full items-center mb-6"
        >
          <Text className="text-white text-lg">
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
          className="bg-blue-600 py-3 rounded-full items-center"
        >
          <Text className="text-white text-lg">
            {saving ? 'שומר…' : 'שמור שינויים'}
          </Text>
        </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      );
    }

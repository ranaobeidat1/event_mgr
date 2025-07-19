import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Image,
  Alert,SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
// --- CORRECTED IMPORTS ---
import { db, auth, storage } from '../../FirebaseConfig';
 import { FieldValue, Timestamp, GeoPoint } from '../../FirebaseConfig';

const CreatePostScreen = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

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
      setImages((prev) => [...prev, ...uris]);
    }
  };

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const uploadImagesAndGetUrls = async (uris: string[]) => {
    const uploadPromises = uris.map(async (uri, idx) => {
      const response = await fetch(uri);
      const blob = await response.blob();
      const user = auth.currentUser!;
      const timestamp = Date.now();
      // --- CORRECTED STORAGE SYNTAX ---
      const imageRef = storage.ref(`posts/${user.uid}/${timestamp}_${idx}`);
      await imageRef.put(blob);
      const downloadUrl = await imageRef.getDownloadURL();
      return downloadUrl;
    });
    return Promise.all(uploadPromises);
  };

  const handleSubmit = async () => {
    if (
      title.trim() === '' &&
      content.trim() === '' &&
      images.length === 0
    ) {
      Alert.alert('שגיאה', 'אנא הוסף לפחות כותרת, תוכן או תמונה');
      return;
    }

    setSaving(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('משתמש לא מזוהה');

      const imageUrls = images.length
        ? await uploadImagesAndGetUrls(images)
        : [];

      // --- CORRECTED FIRESTORE SYNTAX ---
      await db.collection('posts').add({
        title: title.trim() || null,
        content: content.trim() || null,
        images: imageUrls,
        authorId: user.uid,
        createdAt: FieldValue.serverTimestamp(), // Correct server timestamp
      });

      Alert.alert('הצלחה', 'הפוסט נוצר בהצלחה', [
        { text: 'אישור', onPress: () => router.replace('/(tabs)/gallery') },
      ]);

      setTitle('');
      setContent('');
      setImages([]);
    } catch (error) {
      console.error(error);
      Alert.alert('שגיאה', 'אירעה שגיאה ביצירת הפוסט');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="px-6 pt-5 pb-3">
          <View className="flex-row justify-start mb-4">
            <TouchableOpacity onPress={() => router.back()}>
              <Text className="text-[#1A4782] text-2xl font-heebo-medium">
                חזרה
              </Text>
            </TouchableOpacity>
          </View>

          <View className="items-center">
            <Text className="text-3xl font-bold text-[#1A4782]">
              יצירת פוסט חדש
            </Text>
          </View>
        </View>

        <ScrollView
          className="flex-1 px-6"
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          <Text className="mb-1 text-start text-xl">כותרת:</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-2 mb-4 text-lg"
            placeholder="כותרת הפוסט"
            placeholderTextColor="#9CA3AF"
            value={title}
            onChangeText={setTitle}
            textAlign="right"
          />

          <Text className="mb-1 text-start text-xl">תוכן:</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-2 mb-4 h-32 text-top text-lg"
            placeholder="תוכן הפוסט..."
            placeholderTextColor="#9CA3AF"
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={4}
            textAlign="right"
            textAlignVertical="top"
          />

          <Text className="mb-2 text-start text-xl">תמונות:</Text>
          {images.length > 0 && (
            <View style={{ height: 160 }} className="mb-4">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  alignItems: 'center',
                  paddingHorizontal: 4,
                }}
              >
                {images.map((uri, index) => (
                  <View key={index} className="relative mr-4">
                    <Image
                      source={{ uri }}
                      className="w-36 h-36 rounded-lg"
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      onPress={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-600 p-1 rounded-full"
                    >
                      <Text className="text-white text-xs">×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          <TouchableOpacity
            className="bg-[#1A4782] py-3 rounded-full items-center mb-6"
            onPress={pickImages}
            disabled={saving}
          >
            <Text className="text-white text-xl font-heebo-bold">
              {saving ? 'טוען...' : 'הוסף תמונות'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`bg-[#1A4782] py-3 rounded-full items-center ${
              saving ? 'opacity-50' : ''
            }`}
            onPress={handleSubmit}
            disabled={saving}
          >
             {saving ? (
                <ActivityIndicator color="white" />
             ) : (
                <Text className="text-white text-xl font-heebo-bold">
                    פרסם פוסט
                </Text>
             )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CreatePostScreen;

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { db, auth, storage } from '../../FirebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';

const CreatePostScreen = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Pick multiple images
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

  // Remove selected image by index
  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  // Upload images to Firebase Storage and return URLs
  const uploadImagesAndGetUrls = async (uris: string[]) => {
    const uploadPromises = uris.map(async (uri, idx) => {
      const response = await fetch(uri);
      const blob = await response.blob();
      const user = auth.currentUser!;
      const timestamp = Date.now();
      const imageRef = storageRef(
        storage,
        `posts/${user.uid}/${timestamp}_${idx}`
      );
      await uploadBytes(imageRef, blob);
      const downloadUrl = await getDownloadURL(imageRef);
      return downloadUrl;
    });
    return Promise.all(uploadPromises);
  };

  // Submit new post
  const handleSubmit = async () => {
    // require at least one of title, content or images
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

      // upload images if any
      const imageUrls = images.length
        ? await uploadImagesAndGetUrls(images)
        : [];

      // add to Firestore
      await addDoc(collection(db, 'posts'), {
        title: title.trim() || null,      // you can store null if empty
        content: content.trim() || null,  // same here
        images: imageUrls,
        authorId: user.uid,
        createdAt: serverTimestamp(),
      });

      Alert.alert('הצלחה', 'הפוסט נוצר בהצלחה', [
        { text: 'אישור', onPress: () => router.replace('/(tabs)') },
      ]);

      // reset form
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
    <SafeAreaView className="flex-1 bg-white" style={{ direction: 'rtl' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >

        {/* Header */}
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

        {/* Form */}
        <ScrollView
          className="flex-1 px-6"
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Title Input */}
          <Text className="mb-1 text-start text-xl">כותרת:</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-2 mb-4 text-lg"
            placeholder="כותרת הפוסט"
            placeholderTextColor="#9CA3AF"
            value={title}
            onChangeText={setTitle}
            textAlign="right"
          />

          {/* Content Input */}
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

          {/* Image Management */}
          <Text className="mb-2 text-start text-xl">תמונות:</Text>
          {images.length > 0 && (
            <ScrollView horizontal className="mb-4 space-x-2">
              {images.map((uri, i) => (
                <View key={i} className="relative">
                  <Image
                    source={{ uri }}
                    className="w-24 h-24 rounded"
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    onPress={() => removeImage(i)}
                    className="absolute top-0 right-0 bg-red-600 p-1 rounded-full"
                  >
                    <Text className="text-white text-xs">×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}

          {/* Add Images Button */}
          <TouchableOpacity
            className="bg-[#1A4782] py-3 rounded-full items-center mb-6"
            onPress={pickImages}
            disabled={saving}
          >
            <Text className="text-white text-xl font-heebo-bold">
              {saving ? 'טוען...' : 'הוסף תמונות'}
            </Text>
          </TouchableOpacity>

          {/* Submit Button */}
          <TouchableOpacity
            className={`bg-[#1A4782] py-3 rounded-full items-center ${
              saving ? 'opacity-50' : ''
            }`}
            onPress={handleSubmit}
            disabled={saving}
          >
            <Text className="text-white text-xl font-heebo-bold">
              {saving ? 'מפרסם...' : 'פרסם פוסט'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CreatePostScreen;

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { db, auth, storage } from '../FirebaseConfig';
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
      const uris = result.assets.map((asset: ImagePicker.ImagePickerAsset) => asset.uri);
      setImages(prev => [...prev, ...uris]);
    }
  };

  // Remove selected image by index
  const removeImage = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
  };

  // Upload images to Firebase Storage and return URLs
  const uploadImagesAndGetUrls = async (uris: string[]) => {
    const uploadPromises = uris.map(async (uri, idx) => {
      const response = await fetch(uri);
      const blob = await response.blob();
      const user = auth.currentUser!;
      const timestamp = Date.now();
      const imageRef = storageRef(storage, `posts/${user.uid}/${timestamp}_${idx}`);
      await uploadBytes(imageRef, blob);
      const downloadUrl = await getDownloadURL(imageRef);
      return downloadUrl;
    });
    return Promise.all(uploadPromises);
  };

  // Submit new post
  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('שגיאה', 'יש למלא כותרת ותוכן');
      return;
    }
    setSaving(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('משתמש לא מזוהה');

      const imageUrls = images.length > 0 ? await uploadImagesAndGetUrls(images) : [];

      await addDoc(collection(db, 'posts'), {
        title,
        content,
        images: imageUrls,
        authorId: user.uid,
        createdAt: serverTimestamp(),
      });

      Alert.alert('הצלחה', 'הפוסט נוצר בהצלחה', [
        { text: 'אישור', onPress: () => router.replace('/(tabs)') }
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
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <Text className="text-2xl font-heeboBold text-[#1A4782] mb-4 text-center">
        יצירת פוסט חדש
      </Text>

      <TextInput
        placeholder="כותרת"
        value={title}
        onChangeText={setTitle}
        className="border border-gray-300 rounded p-3 mb-4"
      />

      <TextInput
        placeholder="תוכן"
        value={content}
        onChangeText={setContent}
        multiline
        numberOfLines={4}
        className="border border-gray-300 rounded p-3 mb-4 h-32 text-top"
      />

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

      <TouchableOpacity
        className="bg-[#1A4782] rounded-full py-3 mb-4 items-center"
        onPress={pickImages}
        disabled={saving}
      >
        <Text className="text-white text-lg font-heeboBold">
          הוסף תמונות
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="bg-yellow-400 rounded-full py-3 items-center"
        onPress={handleSubmit}
        disabled={saving}
      >
        <Text className="text-black text-lg font-heeboBold">
          {saving ? 'שומר...' : 'פרסם פוסט'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default CreatePostScreen;
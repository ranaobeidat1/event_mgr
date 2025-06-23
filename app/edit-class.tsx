// app/edit-class.tsx
import * as ImagePicker from 'expo-image-picker';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { auth, db, storage } from '../FirebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

export default function EditClass() {
  const params = useLocalSearchParams();
  const classId = params.id as string;
  
  // Initialize state with existing values
  const [name, setName] = useState(params.name as string || '');
  const [description, setDescription] = useState(params.description as string || '');
  const [location, setLocation] = useState(params.location as string || '');
  const [schedule, setSchedule] = useState(params.schedule as string || '');
  const [maxCapacity, setMaxCapacity] = useState(params.maxCapacity?.toString() || '');
  const [payment, setPayment] = useState(params.payment as string || '');
  
  // Parse existing images from JSON string
  const existingImagesParam = params.existingImages as string || '[]';
  const [existingImages, setExistingImages] = useState<string[]>(
    JSON.parse(existingImagesParam)
  );
  const [newImageUris, setNewImageUris] = useState<string[]>([]);
  const [deletedImages, setDeletedImages] = useState<string[]>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Function to pick new images
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
      setNewImageUris(prev => [...prev, ...uris]);
    }
  };

  // Function to remove an existing image
  const removeExistingImage = (url: string, index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
    setDeletedImages(prev => [...prev, url]);
  };

  // Function to remove a new image
  const removeNewImage = (index: number) => {
    setNewImageUris(prev => prev.filter((_, i) => i !== index));
  };

  // Function to upload new images to Firebase Storage
  const uploadImages = async (localUris: string[]): Promise<string[]> => {
    setUploadingImages(true);
    const uploadedUrls: string[] = [];
    
    try {
      for (const uri of localUris) {
        const filename = `courses/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
        const response = await fetch(uri);
        const blob = await response.blob();
        const storageRef = ref(storage, filename);
        const snapshot = await uploadBytes(storageRef, blob);
        const downloadUrl = await getDownloadURL(snapshot.ref);
        uploadedUrls.push(downloadUrl);
      }
      
      return uploadedUrls;
    } catch (error) {
      console.error('Error uploading images:', error);
      throw error;
    } finally {
      setUploadingImages(false);
    }
  };

  // Function to delete images from Firebase Storage
  const deleteImagesFromStorage = async (urls: string[]) => {
    for (const url of urls) {
      try {
        // Extract the path from the URL
        const decodedUrl = decodeURIComponent(url);
        const startIndex = decodedUrl.indexOf('/o/') + 3;
        const endIndex = decodedUrl.indexOf('?');
        const filePath = decodedUrl.substring(startIndex, endIndex);
        
        const imageRef = ref(storage, filePath);
        await deleteObject(imageRef);
      } catch (error) {
        console.error('Error deleting image:', error);
        // Continue with other deletions even if one fails
      }
    }
  };

  // Function to handle form submission
  const handleSubmit = async () => {
    // Validate fields
    if (!name || !description || !location || !schedule || !maxCapacity) {
      Alert.alert('שגיאה', 'כל השדות הם שדות חובה');
      return;
    }

    const parsedCapacity = parseInt(maxCapacity);
    if (isNaN(parsedCapacity) || parsedCapacity <= 0) {
      Alert.alert('שגיאה', 'מספר משתתפים מקסימלי חייב להיות מספר חיובי');
      return;
    }

    setIsSubmitting(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('שגיאה', 'יש להתחבר מחדש');
        router.replace('/login');
        return;
      }

      // Upload new images if any
      let newUploadedUrls: string[] = [];
      if (newImageUris.length > 0) {
        try {
          newUploadedUrls = await uploadImages(newImageUris);
        } catch (error) {
          Alert.alert('שגיאה', 'אירעה שגיאה בהעלאת התמונות');
          setIsSubmitting(false);
          return;
        }
      }

      // Delete removed images from storage
      if (deletedImages.length > 0) {
        await deleteImagesFromStorage(deletedImages);
      }

      // Combine remaining existing images with new uploaded images
      const finalImageUrls = [...existingImages, ...newUploadedUrls];

      // Update document in Firestore
      const courseRef = doc(db, 'courses', classId);
      await updateDoc(courseRef, {
        name,
        description,
        location,
        schedule,
        maxCapacity: parsedCapacity,
        imageUrl: finalImageUrls,
        payment: payment || '',
        updatedAt: new Date(),
      });
      
      Alert.alert('הצלחה', 'החוג עודכן בהצלחה', [
        { 
          text: 'אישור', 
          onPress: () => router.back()
        }
      ]);
    } catch (error) {
      console.error('Error updating class:', error);
      Alert.alert('שגיאה', 'אירעה שגיאה בעדכון החוג. אנא נסה שוב מאוחר יותר.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
    <Stack.Screen options={{ headerShown: false }} />
    <SafeAreaView className="flex-1 bg-white" style={{direction: 'rtl'}}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-6 pt-6">
          <View className="flex-row justify-start mb-4">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-primary text-2xl font-heebo-medium">חזרה</Text>
          </TouchableOpacity>
        </View>

          <Text className="text-3xl font-heebo-bold text-center mb-8 text-primary">
            עריכת חוג
          </Text>

          <View className="mb-6">
            <Text className="text-xl font-heebo-medium mb-2 px-4">שם החוג</Text>
            <TextInput
              className="bg-gray-100 rounded-full px-5 py-3 text-xl font-heebo-regular text-right"
              value={name}
              onChangeText={setName}
              placeholder="הזן את שם החוג"
            />
          </View>

          <View className="mb-6">
            <Text className="text-xl font-heebo-medium mb-2 px-4">תיאור</Text>
            <TextInput
              className="bg-gray-100 rounded-full px-5 py-3 text-xl font-heebo-regular text-right"
              value={description}
              onChangeText={setDescription}
              placeholder="הזן תיאור קצר של החוג"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View className="mb-6">
            <Text className="text-xl font-heebo-medium mb-2 px-4">מיקום</Text>
            <TextInput
              className="bg-gray-100 rounded-full px-5 py-3 text-xl font-heebo-regular text-right"
              value={location}
              onChangeText={setLocation}
              placeholder="הזן את מיקום החוג"
            />
          </View>

          <View className="mb-6">
            <Text className="text-xl font-heebo-medium mb-2 px-4">לוח זמנים</Text>
            <TextInput
              className="bg-gray-100 rounded-full px-5 py-3 text-xl font-heebo-regular text-right"
              value={schedule}
              onChangeText={setSchedule}
              placeholder="לדוגמה: יום ראשון 16:00-17:30"
            />
          </View>

          <View className="mb-6">
            <Text className="text-xl font-heebo-medium mb-2 px-4">תשלום</Text>
            <TextInput
              className="bg-gray-100 rounded-full px-5 py-3 text-xl font-heebo-regular text-right"
              value={payment}
              onChangeText={setPayment}
              placeholder="לדוגמה: 150 ש״ח לחודש"
            />
          </View>

          <View className="mb-6">
            <Text className="text-xl font-heebo-medium mb-2 px-4">מספר משתתפים מקסימלי</Text>
            <TextInput
              className="bg-gray-100 rounded-full px-5 py-3 text-xl font-heebo-regular text-right"
              value={maxCapacity}
              onChangeText={setMaxCapacity}
              placeholder="הזן מספר"
              keyboardType="numeric"
            />
          </View>

          {/* Existing images */}
          {existingImages.length > 0 && (
            <View className="mb-6">
              <Text className="text-xl font-heebo-medium mb-2 px-4">תמונות קיימות:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {existingImages.map((uri, index) => (
                  <View key={`existing-${index}`} className="mr-2">
                    <Image
                      source={{ uri }}
                      className="w-24 h-24 rounded-lg"
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      className="absolute top-0 right-0 bg-red-500 rounded-full w-6 h-6 items-center justify-center"
                      onPress={() => removeExistingImage(uri, index)}
                    >
                      <Text className="text-white text-xs">X</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Image picker button */}
          <TouchableOpacity
            className="bg-primary rounded-full py-4 mb-4 items-center"
            onPress={pickImages}
          >
            <Text className="text-white text-xl font-heebo-bold">
              הוסף תמונות חדשות
            </Text>
          </TouchableOpacity>

          {/* New images preview */}
          {newImageUris.length > 0 && (
            <View className="mb-6">
              <Text className="text-lg font-heebo-medium mb-2 text-right">תמונות חדשות:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {newImageUris.map((uri, index) => (
                  <View key={`new-${index}`} className="mr-2">
                    <Image
                      source={{ uri }}
                      className="w-24 h-24 rounded-lg"
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      className="absolute top-0 right-0 bg-red-500 rounded-full w-6 h-6 items-center justify-center"
                      onPress={() => removeNewImage(index)}
                    >
                      <Text className="text-white text-xs">X</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Submit button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isSubmitting || uploadingImages}
            className={`bg-primary rounded-full py-4 mb-10 ${(isSubmitting || uploadingImages) ? 'opacity-70' : ''}`}
          >
            {uploadingImages ? (
              <View className="flex-row items-center justify-center">
                <ActivityIndicator color="white" size="small" />
                <Text className="text-white text-center text-xl font-heebo-bold mr-2">
                  מעלה תמונות...
                </Text>
              </View>
            ) : (
              <Text className="text-white text-center text-xl font-heebo-bold">
                {isSubmitting ? 'מעדכן חוג...' : 'עדכן חוג'}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  </>
  );
}
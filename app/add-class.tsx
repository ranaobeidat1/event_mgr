// app/add-class.tsx
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
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
import { router } from 'expo-router';
import { auth, db, storage } from './FirebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function AddClass() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [schedule, setSchedule] = useState('');
  const [maxCapacity, setMaxCapacity] = useState('');
  const [localImageUris, setLocalImageUris] = useState<string[]>([]);
  const [payment, setPayment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Function to pick images
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
      setLocalImageUris(prev => [...prev, ...uris]);
    }
  };

  // Function to remove an image
  const removeImage = (index: number) => {
    setLocalImageUris(prev => prev.filter((_, i) => i !== index));
  };

  // Function to upload images to Firebase Storage
  const uploadImages = async (localUris: string[]): Promise<string[]> => {
    setUploadingImages(true);
    const uploadedUrls: string[] = [];
    
    try {
      for (const uri of localUris) {
        // Create a unique filename
        const filename = `courses/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
        
        // Convert URI to blob
        const response = await fetch(uri);
        const blob = await response.blob();
        
        // Upload to Firebase Storage
        const storageRef = ref(storage, filename);
        const snapshot = await uploadBytes(storageRef, blob);
        
        // Get download URL
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

  // Function to handle form submission
  const handleSubmit = async () => {
    // Validate fields
    if (!name || !description || !location || !schedule || !maxCapacity) {
      Alert.alert('שגיאה', 'כל השדות הם שדות חובה');
      return;
    }

    // Validate max capacity is a number
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

      // Upload images if any
      let uploadedImageUrls: string[] = [];
      if (localImageUris.length > 0) {
        try {
          uploadedImageUrls = await uploadImages(localImageUris);
        } catch (error) {
          Alert.alert('שגיאה', 'אירעה שגיאה בהעלאת התמונות');
          setIsSubmitting(false);
          return;
        }
      }

      // Add document to Firestore
      const courseData = {
        name,
        description,
        location,
        schedule,
        maxCapacity: parsedCapacity,
        imageUrl: uploadedImageUrls, // Array of Firebase Storage URLs
        payment: payment || '', // Empty string if not provided
        createdBy: user.uid,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'courses'), courseData);
      
      Alert.alert('הצלחה', 'החוג נוסף בהצלחה', [
        { 
          text: 'אישור', 
          onPress: () => router.replace('/(tabs)/classes')
        }
      ]);
    } catch (error) {
      console.error('Error adding class:', error);
      Alert.alert('שגיאה', 'אירעה שגיאה בהוספת החוג. אנא נסה שוב מאוחר יותר.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-6 pt-6">
          <TouchableOpacity 
            className="mb-6" 
            onPress={() => router.back()}
          >
            <Text className="text-primary text-lg">חזרה</Text>
          </TouchableOpacity>

          <Text className="text-3xl font-heebo-bold text-center mb-8 text-primary">
            הוספת חוג חדש
          </Text>

          <View className="mb-6">
            <Text className="text-lg font-heebo-medium mb-2 text-right">שם החוג</Text>
            <TextInput
              className="bg-gray-100 rounded-full px-5 py-3 text-lg font-heebo-regular text-right"
              value={name}
              onChangeText={setName}
              placeholder="הזן את שם החוג"
            />
          </View>

          <View className="mb-6">
            <Text className="text-lg font-heebo-medium mb-2 text-right">תיאור</Text>
            <TextInput
              className="bg-gray-100 rounded-lg px-5 py-3 text-lg font-heebo-regular text-right"
              value={description}
              onChangeText={setDescription}
              placeholder="הזן תיאור קצר של החוג"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View className="mb-6">
            <Text className="text-lg font-heebo-medium mb-2 text-right">מיקום</Text>
            <TextInput
              className="bg-gray-100 rounded-full px-5 py-3 text-lg font-heebo-regular text-right"
              value={location}
              onChangeText={setLocation}
              placeholder="הזן את מיקום החוג"
            />
          </View>

          <View className="mb-6">
            <Text className="text-lg font-heebo-medium mb-2 text-right">לוח זמנים</Text>
            <TextInput
              className="bg-gray-100 rounded-full px-5 py-3 text-lg font-heebo-regular text-right"
              value={schedule}
              onChangeText={setSchedule}
              placeholder="לדוגמה: יום ראשון 16:00-17:30"
            />
          </View>

          <View className="mb-6">
            <Text className="text-lg font-heebo-medium mb-2 text-right">תשלום</Text>
            <TextInput
              className="bg-gray-100 rounded-full px-5 py-3 text-lg font-heebo-regular text-right"
              value={payment}
              onChangeText={setPayment}
              placeholder="לדוגמה: 150 ש״ח לחודש"
            />
          </View>

          <View className="mb-6">
            <Text className="text-lg font-heebo-medium mb-2 text-right">מספר משתתפים מקסימלי</Text>
            <TextInput
              className="bg-gray-100 rounded-full px-5 py-3 text-lg font-heebo-regular text-right"
              value={maxCapacity}
              onChangeText={setMaxCapacity}
              placeholder="הזן מספר"
              keyboardType="numeric"
            />
          </View>

          {/* Image picker button */}
          <TouchableOpacity
            className="bg-[#1A4782] rounded-full py-3 mb-4 items-center"
            onPress={pickImages}
          >
            <Text className="text-white text-lg font-heebo-bold">
              הוסף תמונות
            </Text>
          </TouchableOpacity>

          {/* Image preview */}
          {localImageUris.length > 0 && (
            <View className="mb-6">
              <Text className="text-lg font-heebo-medium mb-2 text-right">תמונות שנבחרו:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {localImageUris.map((uri, index) => (
                  <View key={index} className="mr-2">
                    <Image
                      source={{ uri }}
                      className="w-24 h-24 rounded-lg"
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      className="absolute top-0 right-0 bg-red-500 rounded-full w-6 h-6 items-center justify-center"
                      onPress={() => removeImage(index)}
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
                {isSubmitting ? 'מוסיף חוג...' : 'הוסף חוג'}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
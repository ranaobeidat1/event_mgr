// app/alerts/create-alert.tsx
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
  ActivityIndicator,
  Image, // For displaying a preview if you add image picking
} from 'react-native';
import { router } from 'expo-router';
import { db, auth, storage } from '../FirebaseConfig'; // Assuming storage might be used later
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker'; // Uncomment if you add image picking
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'; // For image upload

export default function CreateAlertScreen() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pickImages = async () => {
    if (isUploading || isSubmitting)
      return;

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('שגיאה', 'אין הרשאה לגישה לתמונות');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled && result.assets) {
      const uris = result.assets.map((asset) => asset.uri);
      setImages(prev => [...prev, ...uris]);
    }
  };

  const removeImage = (indexToRemove: number) => {
    setImages(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  // Upload images to firebase storage and return their URLs
  const uploadImgsAndGetFirebaseUrls = async (uris: string[]): Promise<string[]> => {
    setIsUploading(true);
    const user = auth.currentUser;
    if (!user){
      setIsUploading(false);
      throw new Error("User not authenticated for image upload.");
    }

    const uploadPromises = uris.map(async (uri, indx) => {
      try{
        const response = await fetch(uri); // Fetch the image data from local URI
        const blob = await response.blob();   // Convert to Blob
        
        const fileExtension = uri.split('.').pop || 'jpg';
        const fileName = `alert-${user.uid}-${Date.now()}-${indx}.${fileExtension}`;
        const imageRef = storageRef(storage, `alerts/${fileName}`); // Path in Firebase Storage

        console.log(`Uploading ${fileName} to Firebase Storage...`);
        await uploadBytes(imageRef, blob); // Upload the blob

        const downloadUrl = await getDownloadURL(imageRef); // Get the download URL
        console.log(`${fileName} uploaded. URL: ${downloadUrl}`);
        return downloadUrl;
      } catch (uploadError) {
        console.error(`Error uploading image ${uri}:`, uploadError);
        throw uploadError; // Re-throw to be caught by Promise.all or handleSubmit
      }
    });

    try {
      const urls = await Promise.all(uploadPromises);
      setIsUploading(false);
      return urls;
    } catch (error) {
      setIsUploading (false);
      console.error("One or more image uploads failed:", error);

      throw new Error("Image upload process failed.");
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() && !message.trim()) {
      Alert.alert('שגיאה', 'יש למלא כותרת או תוכן להתראה');
      return;
    }
    if(!message.trim() && images.length === 0 &&!title.trim()){
      Alert.alert('שגיאה', 'יש למלא תוכן כלשהו להתראה');
      return;
    }

    setIsSubmitting(true);

    let uploadedImageUrls: string[] = [];
   
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('שגיאה', 'משתמש לא מזוהה. אנא התחבר שוב.');
        router.replace('/login');
        setIsSubmitting(false);
        return;
      }

      if(images.length > 0){
        uploadedImageUrls = await uploadImgsAndGetFirebaseUrls(images);
      }

      const alertData = {
        title: title.trim(),
        message: message.trim(),
        images: uploadedImageUrls,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'alerts'), alertData);

      Alert.alert('הצלחה', 'ההתראה נוצרה ונשלחה בהצלחה', [
        {
          text: 'אישור',
          onPress: () => router.back(), // Or router.replace('/(tabs)/alerts')
        },
      ]);
      // Reset form fields first
        setTitle('');      // Reset title
        setMessage('');    // Reset message
        setImages([]);     // Reset images (local URIs)
        // Then navigate back
        router.back();     // This should take you to the alerts list
    } catch (error) {
      console.error('Error creating alert:', error);
      Alert.alert('שגיאה', 'אירעה שגיאה ביצירת ההתראה.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = isSubmitting || isUploading;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="px-6 pt-5 pb-3">
          <View className="flex-row justify-end mb-4">
            <TouchableOpacity onPress={() => router.back()}>
              <Text className="text-primary text-lg font-heebo-medium">חזרה</Text>
            </TouchableOpacity>
          
          </View>
            <View className="items-center">
              <Text className="text-3xl font-heebo-bold text-primary">
                יצירת התראה חדשה
              </Text>
            </View>
          </View>
         
        <ScrollView 
          className="flex-1 px-6"
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          <View className='mb-4'>
            <TextInput
              className="bg-gray-100 rounded-lg px-5 py-3 text-lg font-heebo-regular text-right"
              value={title}
              onChangeText={setTitle}
              placeholder="כתוב את כותרת ההתראה"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View className="mb-4">
            <TextInput
              className="bg-gray-100 rounded-lg px-5 py-3 text-lg font-heebo-regular text-right h-32"
              value={message}
              onChangeText={setMessage}
              placeholder="...כתוב את תוכן הודעת ההתראה כאן"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              textAlignVertical="top" // Important for multiline text input
            />
          </View>

          {/* Image Preview Section */}
          {images.length > 0 && (
            <View className="mb-4">
              <Text className="text-lg font-heebo-medium mb-2 text-right text-gray-700">
                תמונות שנבחרו ({images.length})
              </Text>
              <ScrollView horizontal className="space-x-2" showsHorizontalScrollIndicator={false}>
                {images.map((uri, index) => (
                  <View key={index} className="relative">
                    <Image
                      source={{ uri }}
                      className="w-24 h-24 rounded-lg"
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      onPress={() => !isLoading && removeImage(index)}
                      disabled={isLoading}
                      className="absolute -top-2 -right-2 bg-red-500 rounded-full w-6 h-6 items-center justify-center shadow"
                    >
                      <Text className="text-white text-xs font-bold">×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
          
          {/* Add Images Button */}
          <TouchableOpacity
            className= {`bg-[#1A4782] rounded-full py-3 mb-6 items-center ${isLoading ? 'opacity-50' : ''}`}
            onPress={pickImages}
            disabled={isLoading}
          >
            <Text className="text-white text-lg font-heebo-bold">
              {images.length > 0 ? 'הוסף תמונות נוספות' : 'הוסף תמונות'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isLoading}
            className={`bg-yellow-400 rounded-full py-4 mt-4 ${
              isLoading ? 'opacity-50' : ''
            }`}
          >
            {isLoading ? (
              <View className="flex-row items-center">
              <ActivityIndicator color="bg-yellow-400" size="large" />
              <Text className="text-black text-center text-xl font-heebo-bold ml-2">
                {isUploading ? 'מעלה תמונות...' : 'שולח התראה...'}
              </Text>
            </View>
            ) : (
              <Text className="text-white text-center text-xl font-heebo-bold">
                שלח התראה
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
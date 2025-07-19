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
// --- CORRECTED IMPORTS ---
import { auth, db, storage } from '../FirebaseConfig';
import { FieldValue, Timestamp, GeoPoint } from '../FirebaseConfig';
export default function EditClass() {
  const params = useLocalSearchParams();
  const classId = params.id as string;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [schedule, setSchedule] = useState('');
  const [maxCapacity, setMaxCapacity] = useState('');
  const [payment, setPayment] = useState('');
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImageUris, setNewImageUris] = useState<string[]>([]);
  const [deletedImages, setDeletedImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClassData = async () => {
      setLoading(true);
      try {
        // --- CORRECTED FIRESTORE SYNTAX ---
        const classRef = db.collection('courses').doc(classId);
        const classSnap = await classRef.get();

        if (classSnap.exists()) {
          const data = classSnap.data();
          if (data) {
            setName(data.name || '');
            setDescription(data.description || '');
            setLocation(data.location || '');
            setSchedule(data.schedule || '');
            setMaxCapacity(data.maxCapacity?.toString() || '');
            setPayment(data.payment || '');
            setExistingImages(data.imageUrl || []);
          }
        } else {
          Alert.alert('שגיאה', 'לא נמצא חוג עם מזהה זה');
          router.back();
        }
      } catch (error) {
        console.error('Error fetching class data:', error);
        Alert.alert('שגיאה', 'אירעה שגיאה בטעינת נתוני החוג');
      } finally {
        setLoading(false);
      }
    };

    fetchClassData();
  }, [classId]);

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

  const removeExistingImage = (url: string, index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
    setDeletedImages(prev => [...prev, url]);
  };

  const removeNewImage = (index: number) => {
    setNewImageUris(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (localUris: string[]): Promise<string[]> => {
    setUploadingImages(true);
    const uploadedUrls: string[] = [];
    try {
      for (const uri of localUris) {
        const filename = `courses/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
        const response = await fetch(uri);
        const blob = await response.blob();
        // --- CORRECTED STORAGE SYNTAX ---
        const storageRef = storage.ref(filename);
        await storageRef.put(blob);
        const downloadUrl = await storageRef.getDownloadURL();
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

  const deleteImagesFromStorage = async (urls: string[]) => {
    for (const url of urls) {
      try {
        // --- CORRECTED STORAGE SYNTAX ---
        const imageRef = storage.refFromURL(url);
        await imageRef.delete();
      } catch (error) {
        console.error('Error deleting image:', error);
      }
    }
  };

  const handleSubmit = async () => {
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

      if (deletedImages.length > 0) {
        await deleteImagesFromStorage(deletedImages);
      }

      const finalImageUrls = [...existingImages, ...newUploadedUrls];

      // --- CORRECTED FIRESTORE SYNTAX ---
      const courseRef = db.collection('courses').doc(classId);
      await courseRef.update({
        name,
        description,
        location,
        schedule,
        maxCapacity: parsedCapacity,
        imageUrl: finalImageUrls,
        payment: payment || '',
        updatedAt: FieldValue.serverTimestamp(), // Use correct server timestamp
      });

      Alert.alert('הצלחה', 'החוג עודכן בהצלחה', [
        { text: 'אישור', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error updating class:', error);
      Alert.alert('שגיאה', 'אירעה שגיאה בעדכון החוג. אנא נסה שוב מאוחר יותר.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
      return (
          <SafeAreaView className="flex-1 justify-center items-center bg-white">
              <ActivityIndicator size="large" color="#1A4782" />
          </SafeAreaView>
      )
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="flex-1 bg-white" style={{ direction: 'rtl' }}>
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
            <Text className="text-3xl font-heebo-bold text-center mb-8 text-primary">עריכת חוג</Text>

            {[{
              label: 'שם החוג', placeholder: 'הזן את שם החוג', value: name, setter: setName
            }, {
              label: 'תיאור', placeholder: 'הזן תיאור קצר של החוג', value: description, setter: setDescription, multiline: true
            }, {
              label: 'מיקום', placeholder: 'הזן את מיקום החוג', value: location, setter: setLocation
            }, {
              label: 'לוח זמנים', placeholder: 'לדוגמה: יום ראשון 16:00-17:30', value: schedule, setter: setSchedule
            }, {
              label: 'תשלום', placeholder: 'לדוגמה: 150 ש״ח לחודש', value: payment, setter: setPayment
            }, {
              label: 'מספר משתתפים מקסימלי', placeholder: 'הזן מספר', value: maxCapacity, setter: setMaxCapacity, keyboardType: 'numeric'
            }].map((field, index) => (
              <View className="mb-6" key={index}>
                <Text className="text-xl font-heebo-medium mb-2 px-4">{field.label}</Text>
                <TextInput
                  className="bg-gray-100 rounded-full px-5 py-3 text-xl font-heebo-regular text-right"
                  value={field.value}
                  onChangeText={field.setter}
                  placeholder={field.placeholder}
                  multiline={field.multiline || false}
                  numberOfLines={field.multiline ? 4 : 1}
                  textAlignVertical={field.multiline ? 'top' : 'center'}
                  keyboardType={field.keyboardType as import('react-native').KeyboardTypeOptions || 'default'}
                />
              </View>
            ))}

            {existingImages.length > 0 && (
              <View className="mb-6">
                <Text className="text-xl font-heebo-medium mb-2 px-4">תמונות קיימות:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {existingImages.map((uri, index) => (
                    <View key={`existing-${index}`} className="mr-2">
                      <Image source={{ uri }} className="w-24 h-24 rounded-lg" resizeMode="cover" />
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

            <TouchableOpacity
              className="bg-primary rounded-full py-4 mb-4 items-center"
              onPress={pickImages}
            >
              <Text className="text-white text-xl font-heebo-bold">הוסף תמונות חדשות</Text>
            </TouchableOpacity>

            {newImageUris.length > 0 && (
              <View className="mb-6">
                <Text className="text-lg font-heebo-medium mb-2 text-right">תמונות חדשות:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {newImageUris.map((uri, index) => (
                    <View key={`new-${index}`} className="mr-2">
                      <Image source={{ uri }} className="w-24 h-24 rounded-lg" resizeMode="cover" />
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

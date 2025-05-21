// app/add-class.tsx
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
} from 'react-native';
import { router } from 'expo-router';
import { auth, db } from './FirebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function AddClass() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [schedule, setSchedule] = useState('');
  const [maxCapacity, setMaxCapacity] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

      // Add document to Firestore
      const courseData = {
        name,
        description,
        location,
        schedule,
        maxCapacity: parsedCapacity,
        imageUrl: '', // Empty string for now
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
            <Text className="text-lg font-heebo-medium mb-2 text-right">מספר משתתפים מקסימלי</Text>
            <TextInput
              className="bg-gray-100 rounded-full px-5 py-3 text-lg font-heebo-regular text-right"
              value={maxCapacity}
              onChangeText={setMaxCapacity}
              placeholder="הזן מספר"
              keyboardType="numeric"
            />
          </View>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isSubmitting}
            className={`bg-primary rounded-full py-4 mb-10 ${isSubmitting ? 'opacity-70' : ''}`}
          >
            <Text className="text-white text-center text-xl font-heebo-bold">
              {isSubmitting ? 'מוסיף חוג...' : 'הוסף חוג'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
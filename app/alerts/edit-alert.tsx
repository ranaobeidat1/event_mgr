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
  ActivityIndicator,
  Switch, // Added import
} from 'react-native';
import { Picker } from '@react-native-picker/picker'; // Added import
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { db, auth } from '../FirebaseConfig';
import { collection, doc, updateDoc, getDocs, getDoc, query, where, serverTimestamp } from 'firebase/firestore';

// Interface for notification recipients
interface NotificationTarget {
  type: 'all' | 'course'; // Removed 'specific' as it's not used
  courseId?: string;
}

interface CourseData {
  id: string;
  name: string;
}

export default function EditAlertScreen() {
  const params = useLocalSearchParams();
  const alertId = params.alertId as string;
  
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Push notification settings
  const [sendPushNotification, setSendPushNotification] = useState(false); // Default to false for edits
  const [notificationTarget, setNotificationTarget] = useState<NotificationTarget>({ 
    type: 'all'
  });
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  // Load alert data and courses
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load courses first
        setLoadingCourses(true);
        const coursesSnapshot = await getDocs(collection(db, 'courses'));
        const coursesData = coursesSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name
        }));
        setCourses(coursesData);
        setLoadingCourses(false);

        // Load alert data
        if (alertId) {
          const alertDoc = await getDoc(doc(db, 'alerts', alertId));
          if (alertDoc.exists()) {
            const alertData = alertDoc.data();
            setTitle(alertData.title || '');
            setMessage(alertData.message || '');
            setNotificationTarget({
              type: alertData.targetType || 'all',
              courseId: alertData.targetCourseId || (coursesData.length > 0 ? coursesData[0].id : undefined)
            });
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
        Alert.alert('שגיאה', 'אירעה שגיאה בטעינת נתוני ההתראה');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [alertId]);
  
  // Get FCM tokens based on target
  const getFCMTokensForTarget = async (target: NotificationTarget): Promise<string[]> => {
    try {
      if (target.type === 'all') {
        const tokensSnapshot = await getDocs(collection(db, 'fcmTokens'));
        return tokensSnapshot.docs.map(doc => doc.data().token).filter(Boolean);
      } else if (target.type === 'course' && target.courseId) {
        const registrationsSnapshot = await getDocs(
          query(collection(db, 'Registrations'), where('courseId', '==', target.courseId))
        );
        const userIds = registrationsSnapshot.docs.map(doc => doc.data().userId);
        
        if (userIds.length === 0) return [];
        
        const tokensSnapshot = await getDocs(collection(db, 'fcmTokens'));
        return tokensSnapshot.docs
          .filter(doc => userIds.includes(doc.data().userId))
          .map(doc => doc.data().token)
          .filter(Boolean);
      }
      return [];
    } catch (error) {
      console.error('Error getting FCM tokens:', error);
      return [];
    }
  };

  // Send push notification using Expo Push API
  const sendPushNotifications = async (tokens: string[], alertTitle: string, alertMessage: string) => {
    if (tokens.length === 0) return;
    const messages = tokens.map(token => ({
      to: token, sound: 'default', title: alertTitle || 'עדכון התראה', body: alertMessage,
      data: { screen: '/(tabs)/alerts', alertId },
    }));
    try {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json', 'Accept-encoding': 'gzip, deflate', 'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });
    } catch (error) {
      console.error('Error sending push notifications:', error);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() && !message.trim()) {
      Alert.alert('שגיאה', 'יש למלא כותרת או תוכן להתראה');
      return;
    }
    if (!alertId) {
      Alert.alert('שגיאה', 'מזהה התראה חסר');
      return;
    }
    setIsSubmitting(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('משתמש לא מזוהה');

      // Update alert data in Firestore
      const alertData = {
        title: title.trim(),
        message: message.trim(),
        notificationSent: sendPushNotification, // Reflects if it was re-sent
        targetType: notificationTarget.type,
        targetCourseId: notificationTarget.type === 'course' ? notificationTarget.courseId : null,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
      };
      await updateDoc(doc(db, 'alerts', alertId), alertData);

      // Re-send push notifications if enabled
      if (sendPushNotification) {
        const tokens = await getFCMTokensForTarget(notificationTarget);
        if (tokens.length > 0) {
          await sendPushNotifications(tokens, title.trim(), message.trim());
        }
      }
      
      // Navigate back to previous screen
      router.back();

    } catch (error) {
      console.error('Error updating alert:', error);
      Alert.alert('שגיאה', 'אירעה שגיאה בעדכון ההתראה.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#1A4782" />
        <Text className="mt-4 text-lg font-heebo-medium text-gray-600">טוען נתונים...</Text>
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
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
                עריכת התראה
              </Text>
            </View>
          </View>
          
          <ScrollView 
            className="flex-1 px-6"
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            {/* Title Input */}
            <View className='mb-4'>
              <TextInput
                className="bg-gray-100 rounded-lg px-5 py-3 text-xl font-heebo-regular text-right"
                value={title}
                onChangeText={setTitle}
                placeholder="כתוב את כותרת ההתראה"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Message Input */}
            <View className="mb-4">
              <TextInput
                className="bg-gray-100 rounded-lg px-5 py-3 text-xl font-heebo-regular text-right h-32"
                value={message}
                onChangeText={setMessage}
                placeholder="...כתוב את תוכן הודעת ההתראה כאן"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>          

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting}
              className={`bg-yellow-400 rounded-full py-4 mt-4 ${isSubmitting ? 'opacity-50' : ''}`}
            >
              {isSubmitting ? (
                <View className="flex-row items-center justify-center">
                  <ActivityIndicator color="black" size="large" />
                  <Text className="text-black text-center text-xl font-heebo-bold ml-2">
                    מעדכן התראה...
                  </Text>
                </View>
              ) : (
                <Text className="text-black text-center text-xl font-heebo-bold">
                  עדכן התראה
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}
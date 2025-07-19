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
  Switch,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { db, auth } from '../../FirebaseConfig';
 import { FieldValue, Timestamp, GeoPoint } from '../../FirebaseConfig';
// Interface for notification recipients
interface NotificationTarget {
  type: 'all' | 'course';
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

  const [sendPushNotification, setSendPushNotification] = useState(false);
  const [notificationTarget, setNotificationTarget] = useState<NotificationTarget>({ 
    type: 'all'
  });
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        setLoadingCourses(true);
        const coursesSnapshot = await db.collection('courses').get();
        const coursesData = coursesSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name
        }));
        setCourses(coursesData);
        setLoadingCourses(false);

        if (alertId) {
          const alertDoc = await db.collection('alerts').doc(alertId).get();
          // --- THIS BLOCK IS FIXED ---
          // Use the 'exists' property (boolean), not a function
          if (alertDoc.exists()) { 
            const alertData = alertDoc.data();
            // Add a check to ensure alertData is not undefined before using it
            if (alertData) { 
              setTitle(alertData.title || '');
              setMessage(alertData.message || '');
              setNotificationTarget({
                type: alertData.targetType || 'all',
                courseId: alertData.targetCourseId || (coursesData.length > 0 ? coursesData[0].id : undefined)
              });
            }
          }
          // --- END FIX ---
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
  
  const getFCMTokensForTarget = async (target: NotificationTarget): Promise<string[]> => {
    try {
      if (target.type === 'all') {
        const tokensSnapshot = await db.collection('fcmTokens').get();
        return tokensSnapshot.docs.map(doc => doc.data().token).filter(Boolean);
      } else if (target.type === 'course' && target.courseId) {
        const registrationsSnapshot = await db.collection('Registrations').where('courseId', '==', target.courseId).get();
        const userIds = registrationsSnapshot.docs.map(doc => doc.data().userId);
        
        if (userIds.length === 0) return [];
        
        const tokensSnapshot = await db.collection('fcmTokens').get();
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

      const alertData = {
        title: title.trim(),
        message: message.trim(),
        notificationSent: sendPushNotification,
        targetType: notificationTarget.type,
        targetCourseId: notificationTarget.type === 'course' ? notificationTarget.courseId : null,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: user.uid,
      };
      await db.collection('alerts').doc(alertId).update(alertData);

      if (sendPushNotification) {
        const tokens = await getFCMTokensForTarget(notificationTarget);
        if (tokens.length > 0) {
          await sendPushNotifications(tokens, title.trim(), message.trim());
        }
      }
      
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
                <Text className="text-primary text-2xl font-heebo-medium">חזרה</Text>
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
            <View className='mb-4'>
              <TextInput
                className="bg-gray-100 rounded-lg px-5 py-3 text-xl font-heebo-regular text-right"
                value={title}
                onChangeText={setTitle}
                placeholder="כתוב את כותרת ההתראה"
                placeholderTextColor="#9CA3AF"
              />
            </View>

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

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting}
              className={`bg-[#1A4782] rounded-full py-4 mt-4 ${isSubmitting ? 'opacity-50' : ''}`}
            >
              {isSubmitting ? (
                <View className="flex-row items-center justify-center">
                  <ActivityIndicator color="white" size="small" />
                  <Text className="text-white text-center text-xl font-heebo-bold ml-2">
                    מעדכן התראה...
                  </Text>
                </View>
              ) : (
                <Text className="text-white text-center text-xl font-heebo-bold">
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

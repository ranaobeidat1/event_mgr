// app/alerts/create-alert.tsx
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
import { router } from 'expo-router';
import { db, auth } from '../../FirebaseConfig';
import { collection, addDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore';

// Interface for notification recipients
interface NotificationTarget {
  type: 'all' | 'course' | 'specific';
  courseId?: string;
  userIds?: string[];
}

interface CourseData {
  id: string;
  name: string;
}

export default function CreateAlertScreen() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Push notification settings
  const [sendPushNotification, setSendPushNotification] = useState(true);
  const [notificationTarget, setNotificationTarget] = useState<NotificationTarget>({ type: 'all' });
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  // Load courses for targeting
  useEffect(() => {
    const loadCourses = async () => {
      setLoadingCourses(true);
      try {
        const coursesSnapshot = await getDocs(collection(db, 'courses'));
        const coursesData = coursesSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name
        }));
        setCourses(coursesData);
      } catch (error) {
        console.error('Error loading courses:', error);
      } finally {
        setLoadingCourses(false);
      }
    };

    loadCourses();
  }, []);

  // Get FCM tokens based on target
  const getFCMTokensForTarget = async (target: NotificationTarget): Promise<string[]> => {
    try {
      if (target.type === 'all') {
        // Get all FCM tokens
        const tokensSnapshot = await getDocs(collection(db, 'fcmTokens'));
        return tokensSnapshot.docs.map(doc => doc.data().token).filter(Boolean);
      } else if (target.type === 'course' && target.courseId) {
        // Get tokens for users registered to a specific course
        const registrationsSnapshot = await getDocs(
          query(collection(db, 'Registrations'), where('courseId', '==', target.courseId))
        );
        const userIds = registrationsSnapshot.docs.map(doc => doc.data().userId);
        
        if (userIds.length === 0) return [];
        
        // Get FCM tokens for these users
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
      to: token,
      sound: 'default',
      title: alertTitle || 'התראה חדשה',
      body: alertMessage,
      data: { 
        screen: '/(tabs)/alerts',
        alertId: 'new' 
      },
    }));

    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });

      const result = await response.json();
      console.log('Push notification result:', result);
      
      if (result.errors) {
        console.error('Push notification errors:', result.errors);
      }
    } catch (error) {
      console.error('Error sending push notifications:', error);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() && !message.trim()) {
      Alert.alert('שגיאה', 'יש למלא כותרת או תוכן להתראה');
      return;
    }

    setIsSubmitting(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('שגיאה', 'משתמש לא מזוהה. אנא התחבר שוב.');
        router.replace('/login');
        setIsSubmitting(false);
        return;
      }

      // Create alert in Firestore
      const alertData = {
        title: title.trim(),
        message: message.trim(),
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        notificationSent: sendPushNotification,
        targetType: notificationTarget.type,
        targetCourseId: notificationTarget.courseId || null,
      };

      await addDoc(collection(db, 'alerts'), alertData);

      // Send push notifications if enabled
      if (sendPushNotification) {
        const tokens = await getFCMTokensForTarget(notificationTarget);
        if (tokens.length > 0) {
          await sendPushNotifications(tokens, title.trim(), message.trim());
          console.log(`✅ Push notifications sent to ${tokens.length} devices`);
        } else {
          console.log('⚠️ No FCM tokens found for target audience');
        }
      }

      Alert.alert('הצלחה', 'ההתראה נוצרה ונשלחה בהצלחה', [
        {
          text: 'אישור',
          onPress: () => router.back(),
        },
      ]);

      // Reset form
      setTitle('');
      setMessage('');
      setSendPushNotification(true);
      setNotificationTarget({ type: 'all' });
      router.back();
    } catch (error) {
      console.error('Error creating alert:', error);
      Alert.alert('שגיאה', 'אירעה שגיאה ביצירת ההתראה.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = isSubmitting;

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
          {/* Title Input */}
          <View className='mb-4'>
            <TextInput
              className="bg-gray-100 rounded-lg px-5 py-3 text-lg font-heebo-regular text-right"
              value={title}
              onChangeText={setTitle}
              placeholder="כתוב את כותרת ההתראה"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Message Input */}
          <View className="mb-4">
            <TextInput
              className="bg-gray-100 rounded-lg px-5 py-3 text-lg font-heebo-regular text-right h-32"
              value={message}
              onChangeText={setMessage}
              placeholder="...כתוב את תוכן הודעת ההתראה כאן"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Push Notification Toggle */}
          <View className="mb-4 p-4 bg-gray-50 rounded-lg">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-lg font-heebo-bold text-gray-800">שלח התראת פוש</Text>
              <Switch
                value={sendPushNotification}
                onValueChange={setSendPushNotification}
                trackColor={{ false: '#D1D5DB', true: '#1A4782' }}
                thumbColor={sendPushNotification ? '#FFFFFF' : '#F3F4F6'}
              />
            </View>
            
            {sendPushNotification && (
              <View>
                <Text className="text-sm text-gray-600 mb-3 text-right">בחר למי לשלוח:</Text>
                
                {/* Target Selection */}
                <View className="mb-3">
                  <TouchableOpacity
                    className={`p-3 rounded-lg border ${notificationTarget.type === 'all' ? 'bg-primary border-primary' : 'bg-white border-gray-300'}`}
                    onPress={() => setNotificationTarget({ type: 'all' })}
                  >
                    <Text className={`text-right font-heebo-medium ${notificationTarget.type === 'all' ? 'text-white' : 'text-gray-800'}`}>
                      כל המשתמשים
                    </Text>
                  </TouchableOpacity>
                </View>

                <View className="mb-3">
                  <TouchableOpacity
                    className={`p-3 rounded-lg border ${notificationTarget.type === 'course' ? 'bg-primary border-primary' : 'bg-white border-gray-300'}`}
                    onPress={() => setNotificationTarget({ type: 'course', courseId: courses[0]?.id })}
                  >
                    <Text className={`text-right font-heebo-medium ${notificationTarget.type === 'course' ? 'text-white' : 'text-gray-800'}`}>
                      משתמשים רשומים לחוג ספציפי
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Course Selection */}
                {notificationTarget.type === 'course' && (
                  <View className="bg-white border border-gray-300 rounded-lg">
                    {loadingCourses ? (
                      <View className="p-4">
                        <ActivityIndicator size="small" color="#1A4782" />
                      </View>
                    ) : (
                      <Picker
                        selectedValue={notificationTarget.courseId}
                        onValueChange={(courseId) => 
                          setNotificationTarget({ type: 'course', courseId })
                        }
                        style={{ textAlign: 'right' }}
                      >
                        {courses.map(course => (
                          <Picker.Item 
                            key={course.id} 
                            label={course.name} 
                            value={course.id} 
                          />
                        ))}
                      </Picker>
                    )}
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isLoading}
            className={`bg-yellow-400 rounded-full py-4 mt-4 ${isLoading ? 'opacity-50' : ''}`}
          >
            {isLoading ? (
              <View className="flex-row items-center justify-center">
                <ActivityIndicator color="black" size="large" />
                <Text className="text-black text-center text-xl font-heebo-bold ml-2">
                  שולח התראה...
                </Text>
              </View>
            ) : (
              <Text className="text-black text-center text-xl font-heebo-bold">
                שלח התראה
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
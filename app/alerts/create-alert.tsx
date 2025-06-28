// app/alerts/create-alert.tsx
// -----------------------------------------------------------------------------
// Create an alert + optionally push a notification
// -----------------------------------------------------------------------------
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
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
} from 'firebase/firestore';

// 🆕 helpers for tokens + push
import {
  getExpoTokensOfAllUsers,
  getUserIdsRegisteredToCourse,
  getExpoTokensFromUserIds,
} from '../utils/firestoreUtils';
import { sendPushNotifications } from '../utils/notificationService';

// ──────────────────────────────────────────────────────────────────────────────
interface NotificationTarget {
  type: 'all' | 'course';
  courseId?: string;
}

interface CourseData {
  id: string;
  name: string;
}

// ──────────────────────────────────────────────────────────────────────────────
export default function CreateAlertScreen() {
  const [title, setTitle]             = useState('');
  const [message, setMessage]         = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Push notification settings
  const [sendPush, setSendPush]         = useState(true);
  const [target, setTarget]             = useState<NotificationTarget>({ type: 'all' });

  // courses list for Picker
  const [courses, setCourses]         = useState<CourseData[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  // ──────────────────────────────────────────────────────────
  // Load courses once
  // ──────────────────────────────────────────────────────────
  useEffect(() => {
    const loadCourses = async () => {
      setLoadingCourses(true);
      try {
        const snap = await getDocs(collection(db, 'courses'));
        setCourses(
          snap.docs.map(d => ({ id: d.id, name: d.data().name } as CourseData))
        );
      } catch (err) {
        console.error('Error loading courses:', err);
      } finally {
        setLoadingCourses(false);
      }
    };
    loadCourses();
  }, []);

  // ──────────────────────────────────────────────────────────
  // Resolve Expo push-tokens based on target
  // ──────────────────────────────────────────────────────────
  const getTokensForTarget = async (): Promise<string[]> => {
    if (target.type === 'all') {
      return await getExpoTokensOfAllUsers();
    }

    if (target.type === 'course' && target.courseId) {
      const userIds = await getUserIdsRegisteredToCourse(target.courseId);
      return await getExpoTokensFromUserIds(userIds);
    }

    return [];
  };

  // ──────────────────────────────────────────────────────────
  // Submit handler
  // ──────────────────────────────────────────────────────────
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
        return;
      }

      // 1️⃣  Save alert in Firestore
      await addDoc(collection(db, 'alerts'), {
        title:        title.trim(),
        message:      message.trim(),
        createdBy:    user.uid,
        createdAt:    serverTimestamp(),
        notificationSent: sendPush,
        targetType:   target.type,
        targetCourseId: target.courseId || null,
      });

      // 2️⃣  Push notification (if toggled)
      if (sendPush) {
        const tokens = await getTokensForTarget();
        if (tokens.length) {
          await sendPushNotifications(tokens, title.trim(), message.trim());
          console.log(`✅ Sent to ${tokens.length} devices`);
        } else {
          console.log('⚠️ No tokens found for this target');
        }
      }

      Alert.alert('הצלחה', 'ההתראה נוצרה ונשלחה בהצלחה', [
        { text: 'אישור', onPress: () => router.back() },
      ]);

      // reset form
      setTitle('');
      setMessage('');
      setSendPush(true);
      setTarget({ type: 'all' });
    } catch (err) {
      console.error('Error creating alert:', err);
      Alert.alert('שגיאה', 'אירעה שגיאה ביצירת ההתראה.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ──────────────────────────────────────────────────────────
  // UI
  // ──────────────────────────────────────────────────────────
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
          {/* title */}
          <View className="mb-4">
            <TextInput
              className="bg-gray-100 rounded-lg px-5 py-3 text-lg font-heebo-regular text-right"
              placeholder="כתוב את כותרת ההתראה"
              placeholderTextColor="#9CA3AF"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* message */}
          <View className="mb-4">
            <TextInput
              className="bg-gray-100 rounded-lg px-5 py-3 text-lg font-heebo-regular text-right h-32"
              placeholder="...כתוב את תוכן הודעת ההתראה כאן"
              placeholderTextColor="#9CA3AF"
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* toggle */}
          <View className="mb-4 p-4 bg-gray-50 rounded-lg">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-lg font-heebo-bold text-gray-800">
                שלח התראת פוש
              </Text>
              <Switch
                value={sendPush}
                onValueChange={setSendPush}
                trackColor={{ false: '#D1D5DB', true: '#1A4782' }}
                thumbColor={sendPush ? '#FFFFFF' : '#F3F4F6'}
              />
            </View>

            {sendPush && (
              <View>
                <Text className="text-sm text-gray-600 mb-3 text-right">
                  בחר למי לשלוח:
                </Text>

                {/* all users */}
                <View className="mb-3">
                  <TouchableOpacity
                    className={`p-3 rounded-lg border ${
                      target.type === 'all'
                        ? 'bg-primary border-primary'
                        : 'bg-white border-gray-300'
                    }`}
                    onPress={() => setTarget({ type: 'all' })}
                  >
                    <Text
                      className={`text-right font-heebo-medium ${
                        target.type === 'all' ? 'text-white' : 'text-gray-800'
                      }`}
                    >
                      כל המשתמשים
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* course users */}
                <View className="mb-3">
                  <TouchableOpacity
                    className={`p-3 rounded-lg border ${
                      target.type === 'course'
                        ? 'bg-primary border-primary'
                        : 'bg-white border-gray-300'
                    }`}
                    onPress={() =>
                      setTarget({ type: 'course', courseId: courses[0]?.id })
                    }
                  >
                    <Text
                      className={`text-right font-heebo-medium ${
                        target.type === 'course'
                          ? 'text-white'
                          : 'text-gray-800'
                      }`}
                    >
                      משתמשים רשומים לחוג ספציפי
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* picker */}
                {target.type === 'course' && (
                  <View className="bg-white border border-gray-300 rounded-lg">
                    {loadingCourses ? (
                      <View className="p-4">
                        <ActivityIndicator size="small" color="#1A4782" />
                      </View>
                    ) : (
                      <Picker
                        selectedValue={target.courseId}
                        onValueChange={courseId =>
                          setTarget({ type: 'course', courseId })
                        }
                        style={{ textAlign: 'right' }}
                      >
                        {courses.map(c => (
                          <Picker.Item key={c.id} label={c.name} value={c.id} />
                        ))}
                      </Picker>
                    )}
                  </View>
                )}
              </View>
            )}
          </View>

          {/* submit */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isLoading}
            className={`bg-yellow-400 rounded-full py-4 mt-4 ${
              isLoading ? 'opacity-50' : ''
            }`}
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

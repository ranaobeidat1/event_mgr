import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Modal,
  Image,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { db, auth, storage } from '../../FirebaseConfig';
import { getUser } from '../utils/firestoreUtils';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  limit,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Picker } from '@react-native-picker/picker';
import type { Timestamp } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';

interface AlertData {
  id: string;
  title?: string;
  message: string;
  createdAt: Timestamp;
}
interface Course {
  id: string;
  name: string;
  logoUrl?: string;
}
interface CircleData {
  id: string;
  courseId: string;
  courseName: string;
  logoUri?: string | null;
}

export default function PostsScreen() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [circles, setCircles] = useState<CircleData[]>([]);
  const [loadingCircles, setLoadingCircles] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [newLogoUri, setNewLogoUri] = useState<string | null>(null);

  useEffect(() => {
    const checkAdmin = async () => {
      const user = auth.currentUser;
      if (user) {
        const userData = await getUser(user.uid);
        setIsAdmin(userData?.role === 'admin');
      }
    };
    checkAdmin();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'alerts'), orderBy('createdAt', 'desc'), limit(3));
    return onSnapshot(
      q,
      snap => {
        setAlerts(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<AlertData, 'id'>) })));
        setLoadingAlerts(false);
      },
      () => setLoadingAlerts(false)
    );
  }, []);

  useEffect(() => {
    return onSnapshot(
      collection(db, 'courses'),
      snap => {
        setCourses(snap.docs.map(d => {
          const data = d.data() as any;
          return { id: d.id, name: data.name, logoUrl: data.logoUrl };
        }));
        setLoadingCourses(false);
      },
      () => setLoadingCourses(false)
    );
  }, []);

  useEffect(() => {
    return onSnapshot(
      collection(db, 'circles'),
      snap => {
        setCircles(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<CircleData, 'id'>) })));
        setLoadingCircles(false);
      },
      () => setLoadingCircles(false)
    );
  }, []);

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('אין הרשאה לגישה לאלבום תמונות');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!res.canceled) {
      setNewLogoUri(res.assets[0].uri);
    }
  };

  const addCircle = async () => {
    if (!isAdmin) {
      Alert.alert('אין הרשאות מתאימות');
      return;
    }
    if (!selectedCourseId) return;
    if (circles.length >= 6) {
      Alert.alert('הגעת למספר המרבי של עיגולים');
      return;
    }
    const course = courses.find(c => c.id === selectedCourseId);
    if (!course) return;

    let logoToSave = course.logoUrl ?? null;
    try {
      if (newLogoUri) {
        const response = await fetch(newLogoUri);
        const blob = await response.blob();
        const storageRef = ref(storage, `posts/${course.id}_${Date.now()}`);
        await uploadBytes(storageRef, blob);
        logoToSave = await getDownloadURL(storageRef);
      }
      await addDoc(collection(db, 'circles'), {
        courseId: course.id,
        courseName: course.name,
        logoUri: logoToSave,
        createdAt: serverTimestamp(),
      });
    } catch {
      Alert.alert('שגיאה ביצירת עיגול');
    }
    setModalVisible(false);
    setSelectedCourseId('');
    setNewLogoUri(null);
  };

  const removeCircle = async (id: string) => {
    if (!isAdmin) {
      Alert.alert('אין הרשאות מתאימות');
      return;
    }
    try {
      await deleteDoc(doc(db, 'circles', id));
    } catch {
      Alert.alert('שגיאה במחיקת עיגול');
    }
  };

  if (loadingAlerts || loadingCourses || loadingCircles) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#1A4782" />
      </SafeAreaView>
    );
  }

  const rows: CircleData[][] = [];
  for (let i = 0; i < circles.length; i += 3) {
    rows.push(circles.slice(i, i + 3));
  }

  return (
    <SafeAreaView className="flex-1 bg-white pt-4">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-[#1A4782] text-center text-2xl font-heebo-bold mb-3">
          ברוכים הבאים לאפליקציה שלנו!
        </Text>

        {/* Notification Rectangle */}
       <View style={{
  borderRadius: 20,
  padding: 2,
  backgroundColor: '#1A4782',
  shadowColor: '#1A4782',
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.9,      // Higher for more intense glow
  shadowRadius: 20,        // Bigger radius for larger spread
  elevation: 20,           // Stronger Android glow
  marginHorizontal: 16,
  marginBottom: 16,
}}>
  <View className="bg-white rounded-2xl overflow-hidden p-4">
    
    <Text className="text-[#1A4782] font-heebo-bold text-right text-lg mb-2">התראות אחרונות</Text>
    {alerts.map((a) => (
      <View key={a.id} className="bg-[#1A4782] rounded-2xl p-4 mb-3">
        {a.title && (
          <Text className="text-white font-heebo-bold text-xl text-right mb-1">{a.title}</Text>
        )}
        <Text className="text-white text-base text-right font-tahoma">{a.message}</Text>
      </View>
    ))}
  </View>
</View>


        <Text className="text-[#1A4782] text-xl font-heebo-bold text-center mb-2 mt-4">
          הקורסים שלנו
        </Text>

        <View className="mx-4 mb-6 mt-2">
          {rows.map((row, idx) => (
            <View key={idx} className="flex-row justify-center mb-4">
              {row.map((c) => (
                <View key={c.id} className="items-center relative mx-3">
                  <TouchableOpacity
                    onPress={() => router.push(`/classes/${c.courseId}`)}
                    className="w-28 h-28 rounded-full bg-[#1A4782] justify-center items-center shadow-lg relative"
                    activeOpacity={0.85}
                  >
                    {c.logoUri ? (
                      <>
                        <Image source={{ uri: c.logoUri }} className="w-20 h-20 rounded-full mb-1" />
                        <View className="absolute bottom-1 px-1">
                          <Text
                            className="text-white text-m font-Heebo-Bold text-center"
                            numberOfLines={2}
                            adjustsFontSizeToFit
                            style={{
                              textShadowColor: 'black',
                              textShadowOffset: { width: 1, height: 1 },
                              textShadowRadius: 2,
                              maxWidth: 80,
                            }}
                          >
                            {c.courseName}
                          </Text>
                        </View>
                      </>
                    ) : (
                      <Text className="text-white text-base text-center px-2">{c.courseName}</Text>
                    )}
                  </TouchableOpacity>

                  {isAdmin && (
                    <TouchableOpacity
                      onPress={() => removeCircle(c.id)}
                      className="absolute -top-2 -right-2 bg-red-500 rounded-full w-7 h-7 justify-center items-center shadow"
                    >
                      <Text className="text-white text-xs">×</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          ))}
          {isAdmin && circles.length < 6 && (
  <View className="items-center relative mx-3">
    <TouchableOpacity
      onPress={() => setModalVisible(true)}
      className="w-28 h-28 rounded-full border-2 border-dashed border-gray-400 justify-center items-center"
      activeOpacity={0.8}
    >
      <View className="w-12 h-12 rounded-full bg-[#1A4782] justify-center items-center">
        <Text className="text-white text-3xl font-bold">+</Text>
      </View>
    </TouchableOpacity>
  </View>
)}
        </View>

        <View className="flex-row justify-center mb-20 mt-2">
          <TouchableOpacity
            onPress={() => router.push('/classes')}
            className="px-10 py-4 bg-[#1A4782] rounded-full"
            activeOpacity={0.85}
          >
            <Text className="text-white text-base font-heebo-bold">ראה עוד</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="w-11/12 bg-white p-4 rounded-xl">
            <Text className="mb-2">בחר קורס לבחירה:</Text>
            <View className="border border-gray-300 rounded-lg mb-3">
              <Picker selectedValue={selectedCourseId} onValueChange={setSelectedCourseId}>
                <Picker.Item label="-- בחר קורס --" value="" />
                {courses.map(course => (
                  <Picker.Item key={course.id} label={course.name} value={course.id} />
                ))}
              </Picker>
            </View>
            <TouchableOpacity
              onPress={pickImage}
              className="bg-[#1A4782] px-3 py-2 rounded-md mb-3 items-center"
            >
              <Text className="text-white">העלה לוגו (אופציונלי)</Text>
            </TouchableOpacity>
            {newLogoUri && (
              <Image source={{ uri: newLogoUri }} className="w-24 h-24 rounded-full mx-auto mb-3" />
            )}
            <View className="flex-row justify-end space-x-2">
              <TouchableOpacity
                onPress={addCircle}
                disabled={!selectedCourseId}
                className="px-4 py-2 bg-[#1A4782] rounded-md"
              >
                <Text className="text-white">הוסף</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  setSelectedCourseId('');
                  setNewLogoUri(null);
                }}
                className="px-4 py-2 bg-gray-300 rounded-md"
              >
                <Text className="text-black">ביטול</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

import { StyleSheet } from 'react-native'; // Add this at the bottom or top

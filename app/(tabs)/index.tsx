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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

// --- CORRECTED IMPORTS ---
import { db, auth, storage } from '../../FirebaseConfig'; // Assuming these are correctly configured
import { getUser } from '../utils/firestoreUtils'; // Assuming this utility exists
import { useAuth } from "../_layout";

import { FieldValue, Timestamp, GeoPoint } from '../../FirebaseConfig';
// --- Interface Definitions ---
interface AlertData {
  id: string;
  title?: string;
  message: string;
  createdAt: FirebaseFirestoreTypes.Timestamp;
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
  const insets = useSafeAreaInsets();
  const bottomPadding = insets.bottom + 100;

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
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const user = auth.currentUser;
      if (user) {
        const userData = await getUser(user.uid);
        setIsAdmin(userData?.role === 'admin');
      }
    })();
  }, []);

  useEffect(() => {
    // --- CORRECTED QUERY SYNTAX ---
    const query = db.collection('alerts').orderBy('createdAt', 'desc').limit(3);
    const unsubscribe = query.onSnapshot(
      (snap) => {
        setAlerts(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<AlertData, 'id'>) })));
        setLoadingAlerts(false);
      }, 
      (err) => {
        console.error("Error fetching alerts:", err);
        setLoadingAlerts(false);
      }
    );
    return unsubscribe;
  }, []);

  useEffect(() => {
    // --- CORRECTED QUERY SYNTAX ---
    const unsubscribe = db.collection('courses').onSnapshot(
      (snap) => {
        setCourses(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Course, 'id'>) })));
        setLoadingCourses(false);
      },
      (err) => {
        console.error("Error fetching courses:", err);
        setLoadingCourses(false);
      }
    );
    return unsubscribe;
  }, []);

  useEffect(() => {
    // --- CORRECTED QUERY SYNTAX ---
    const unsubscribe = db.collection('circles').onSnapshot(
      (snap) => {
        setCircles(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<CircleData, 'id'>) })));
        setLoadingCircles(false);
      },
      (err) => {
        console.error("Error fetching circles:", err);
        setLoadingCircles(false);
      }
    );
    return unsubscribe;
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
    if (!isAdmin) return Alert.alert('אין הרשאות מתאימות');
    if (!selectedCourseId) return;
    if (circles.length >= 6) return Alert.alert('הגעת למספר המרבי של עיגולים');
    const course = courses.find(c => c.id === selectedCourseId);
    if (!course) return;

    let logoToSave = course.logoUrl ?? null;
    try {
      if (newLogoUri) {
        const response = await fetch(newLogoUri);
        const blob = await response.blob();
        // --- CORRECTED STORAGE SYNTAX ---
        const storageRef = storage.ref(`posts/${course.id}_${Date.now()}`);
        await storageRef.put(blob);
        logoToSave = await storageRef.getDownloadURL();
        // --- END CORRECTION ---
      }
      // --- CORRECTED FIRESTORE SYNTAX ---
      await db.collection('circles').add({
        courseId: course.id,
        courseName: course.name,
        logoUri: logoToSave,
        createdAt:FieldValue.serverTimestamp(), // Correct server timestamp
      });
      // --- END CORRECTION ---
    } catch {
      Alert.alert('שגיאה ביצירת עיגול');
    }
    setModalVisible(false);
    setSelectedCourseId('');
    setNewLogoUri(null);
  };

  const removeCircle = async (id: string) => {
  if (!isAdmin) {
    return Alert.alert('אין הרשאות מתאימות');
  }

  try {
    // 1) Load the document to get its logoUri
    const docSnap = await db.collection('circles').doc(id).get();
    const data = docSnap.data();
    const logoUri = data?.logoUri as string | undefined;

    // 2) If there’s an image, delete it from Storage
    if (logoUri) {
      // `storage` here is your RNFB storage instance imported from FirebaseConfig
      const imageRef = storage.refFromURL(logoUri);
      await imageRef.delete();
    }

    // 3) Now delete the Firestore document
    await db.collection('circles').doc(id).delete();

    // 4) Update local UI state (you already remove it from your array)
    setCircles(prev => prev.filter(c => c.id !== id));
  } catch (e) {
    console.error('Error deleting circle & image:', e);
    Alert.alert('שגיאה', 'אירעה שגיאה במחיקת העיגול.');
  }
};


  if (loadingAlerts || loadingCourses || loadingCircles) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#1A4782" />
      </SafeAreaView>
    );
  }

  const rows: CircleData[][] = [];
  for (let i = 0; i < circles.length; i += 3) {
    rows.push(circles.slice(i, i + 3));
  }
  
  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        contentContainerStyle={{ paddingBottom: bottomPadding }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-[#1A4782] text-center text-2xl font-heebo-bold my-3">
          ברוכים הבאים לאפליקציה שלנו!
        </Text>

        <View className="mx-4 mb-4 rounded-[20px] p-0.5 bg-[#1A4782] shadow-2xl shadow-black">
          <View className="bg-white rounded-2xl p-4">
            <Text className="text-[#1A4782] text-lg font-bold text-right mb-2">
              התראות אחרונות
            </Text>
            {alerts.map(a => {
              const isExpanded = expandedAlertId === a.id;
              return (
                <TouchableOpacity
                  key={a.id}
                  onPress={() => setExpandedAlertId(isExpanded ? null : a.id)}
                  className="bg-[#1A4782] rounded-2xl p-4 mb-3"
                  activeOpacity={0.8}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="w-8 h-8 rounded-full bg-white justify-center items-center">
                      <Ionicons
                        name={isExpanded ? 'chevron-down' : 'chevron-back'}
                        size={20}
                        color="#1A4782"
                      />
                    </View>
                    {a.title && (
                      <Text
                        className="text-white text-2xl text-right flex-1 mr-3 font-heebo-bold"
                        numberOfLines={2}
                      >
                        {a.title}
                      </Text>
                    )}
                  </View>
                  {isExpanded && (
                    <View className="mt-3 pt-3 border-t border-white/30">
                      <Text className="text-white text-lg text-right font-tahoma">
                        {a.message}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <Text className="text-[#1A4782] text-xl font-bold text-center my-2">החוגים שלנו</Text>

        <View className="mx-4 mb-6">
          {rows.map((row, idx) => (
            <View key={idx} className="flex-row justify-center mb-4">
              {row.map(c => (
                <View key={c.id} className="items-center mx-3">
                  <TouchableOpacity
                    onPress={() => router.push(`/classes/${c.courseId}`)}
                    className="w-28 h-28 rounded-full bg-[#1A4782] justify-center items-center shadowcdxl relative shadow-black"
                    activeOpacity={0.85}
                  >
                    {c.logoUri ? (
                      <>
                        <Image source={{ uri: c.logoUri }} className="w-20 h-20 rounded-full mb-1" />
                        <View className="absolute bottom-1 px-1">
                          <Text className="text-white text-sm font-heebo-bold text-center max-w-[80px]">
                            {c.courseName}
                          </Text>
                        </View>
                      </>
                    ) : (
                      <Text className="text-white font-bold text-center px-2">{c.courseName}</Text>
                    )}
                  </TouchableOpacity>

                  {isAdmin && (
                    <TouchableOpacity
                      onPress={() => removeCircle(c.id)}
                      className="absolute -top-2 -right-2 bg-red-600 rounded-xl w-6 h-6 justify-center items-center shadow-md"
                    >
                      <Text className="text-white text-xs leading-3 font-bold">×</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          ))}

          {isAdmin && circles.length < 6 && (
              <View className="items-center mx-3">
                <TouchableOpacity
                  onPress={() => setModalVisible(true)}
                  className="w-28 h-28 rounded-full border-2 border-dashed border-gray-400 justify-center items-center"
                  activeOpacity={0.8}
                >
                  <View className="w-12 h-12 rounded-full bg-[#1A4782] justify-center items-center">
                    <Text className="text-white text-3xl font-bold -mt-1">+</Text>
                  </View>
                </TouchableOpacity>
            </View>
          )}
        </View>

        <View className="items-center mt-2">
          <TouchableOpacity
            onPress={() => router.push('/classes')}
            className="px-6 py-3 bg-[#1A4782] rounded-full"
            activeOpacity={0.85}
          >
            <Text className="text-white text-base font-bold">ראה עוד</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-center items-center">
          <View className="w-[92%] bg-white p-4 rounded-2xl">
            <Text className="mb-2 text-base font-medium text-right">בחר קורס לבחירה:</Text>
            <View className="border border-gray-300 rounded-lg mb-3">
              <Picker selectedValue={selectedCourseId} onValueChange={setSelectedCourseId}>
                <Picker.Item label="-- בחר קורס --" value="" />
                {courses.map(course => (
                  <Picker.Item key={course.id} label={course.name} value={course.id} />
                ))}
              </Picker>
            </View>
            <TouchableOpacity onPress={pickImage} className="bg-[#1A4782] py-2 px-3 rounded-md mb-3 items-center">
              <Text className="text-white">העלה לוגו (אופציונלי)</Text>
            </TouchableOpacity>
            {newLogoUri && (
              <Image source={{ uri: newLogoUri }} className="w-24 h-24 rounded-full self-center mb-3" />
            )}
            <View className="flex-row justify-end gap-3">
               <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  setSelectedCourseId('');
                  setNewLogoUri(null);
                }}
                className="bg-gray-300 px-3 py-2 rounded-md"
              >
                <Text className="text-black">ביטול</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={addCircle}
                disabled={!selectedCourseId}
                className={`bg-[#1A4782] px-3 py-2 rounded-md ${!selectedCourseId ? 'opacity-50' : ''}`}
              >
                <Text className="text-white">הוסף</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// app/(tabs)/alerts.tsx
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Modal,
  Dimensions, // To get screen width/height
  StyleSheet,
} from "react-native";
import { router  } from "expo-router";
import { auth, db } from "../FirebaseConfig";
import { getUser } from "../utils/firestoreUtils"; // Import getUser 
import { collection, query, orderBy, onSnapshot, Timestamp } from "firebase/firestore"; // Firestore imports

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface UserData {
  id: string;
  role?: string;
}

interface AlertData {
  id: string; // Firestore document ID
  title?: string;
  message: string;
  images?: string[]; // Array of image URIs (local for now, will be public URLs later)
  createdBy: string;
  createdAt: Timestamp; // Firestore Timestamp
}

export default function AlertsScreen() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true); // To handle loading state for user check
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]); // Images of the currently selected alert
  const [selectedImageIndex, setSelectedImageIndex] = useState(0); // Starting index for the modal
  const [expandedAlerts, setExpandedAlerts] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const checkUserRole = async () => {
      setLoadingUser(true); // Start loading user
      const user = auth.currentUser;
      if (user) {
        try {
          const userData = (await getUser(user.uid)) as UserData | null;
          if (userData?.role === "admin"){
            setIsAdmin(true);
          }
      } catch (error) {
        console.error("Error fetching user data for admin check:", error);
      }
    }
    setLoadingUser(false);
  };
  checkUserRole();



  // --- Fetch Alerts ---
  setLoadingAlerts(true); // Start loading alerts
  const alertQuery = query(
    collection(db, "alerts"),
    orderBy("createdAt", "desc") // Oreder by newest first
  );

  const unsubscribe = onSnapshot(
    alertQuery,
    (snapshot) => {
        const fetchedAlerts = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<AlertData, "id">), // Exclude id from the data
      }))
      .filter(alert => (alert.message && alert.message.trim() !== '') || (alert.title && alert.title.trim() !== ''));

      setAlerts(fetchedAlerts);
      setLoadingAlerts(false);
    },
    
    (error) => {
      console.error("Error fetching alerts:", error);
      setLoadingAlerts(false);
    }
  );

    // Cleanup listener on unmount
    return () =>
       unsubscribe();
  }, []);

    const formatDate = (timestamp: Timestamp | null | undefined) => {
    if (!timestamp|| typeof timestamp.toDate !== 'function') return '';
    return timestamp.toDate().toLocaleDateString('he-IL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
  };

  // --- Image Modal Functions ---
  const openImageModal = (imagesFromAlert: string[] = [], index: number) => {
    setSelectedImages(imagesFromAlert);
    setSelectedImageIndex(index);
    setModalVisible(true);
  };

  const closeImageModal = () => {
    setModalVisible(false);
    setSelectedImages([]);
  };

  // --- Read More Toggle ---
  const toggleReadMore = (alertId: string) => {
    setExpandedAlerts(prev => ({
      ...prev,
      [alertId]: !prev[alertId]
    }));
  };


    if (loadingUser || loadingAlerts){
      return (
        <SafeAreaView className="flex-1 items-center justify-center bg-white gap-4">
          <ActivityIndicator size="large" color="#1A4782" />
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView className="flex-1 bg-white">
        {isAdmin && (
        <TouchableOpacity
          className="absolute top-4 right-4 w-14 h-14 bg-yellow-400 rounded-full items-center justify-center shadow-lg z-10"
          onPress={() => router.push("/alerts/create-alert")}
        >
          <Text className="text-black text-2xl font-heeboBold">
            +
          </Text>
        </TouchableOpacity>
      )}

      <View className="pt-6 pb-4">
        <Text className="text-3xl font-heebo-bold text-center mt-5 text-primary">
            עדכונים
        </Text>
      </View>

      <ScrollView 
        className="flex-1 w-full"
        contentContainerStyle={{ paddingBottom: isAdmin ? 120 : 20, paddingTop: 20 }} // Adjust padding if FAB is present
      >

      {/* Content Area */}
      {alerts.length === 0 ?  (
        <View className="flex-1 justify-center items-center px-4"> {/* Added more top margin for loader */}
          <Text className="text-center text-gray-500 font-heebo-regular">
            אין התראות עדיין
          </Text>
        </View>
    ) : (
      <View className="px-4 space-y-6 pt-6">
        {alerts.map((alert) => {
          const isExpanded = expandedAlerts[alert.id];
          const messageNeedsTruncation = alert.message && alert.message.length > 150;

          return (
            <View key={alert.id} className="bg-gray-50 p-4 rounded-xl shadow">
              {/* ... (alert item rendering remains the same) ... */}
                {alert.title && alert.title.trim() !== '' && (
                  <Text className="text-xl font-heebo-bold text-primary mb-2 text-right">
                    {alert.title}
                  </Text>
              )}

              {alert.message && alert.message.trim() !== '' && (
                <View className="mb-3">
                  <Text
                    className="text-base font-heebo-regular text-gray-800 text-right leading-relaxed"
                    numberOfLines={isExpanded || !messageNeedsTruncation ? undefined : 3}
                  >
                 {alert.message}
                </Text>
                {messageNeedsTruncation && (
                  <TouchableOpacity 
                    onPress={() => toggleReadMore(alert.id)}
                    className="mt-1 self-end"
                  >
                  <Text className="text-primary font-heebo-medium">
                    {isExpanded ? 'הצג פחות' : 'קרא עוד'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
            
          {alert.images && alert.images.length > 0 && (
            <View className="mt-3 space-y-2">
              {alert.images.map((imgUri, idx) => (
                <TouchableOpacity
                  key={idx}
                  className="w-full h-48 rounded-lg bg-gray-200"
                  //resizeMode="cover"
                  onPress={() => openImageModal(alert.images!, idx)}
                >
                  <Image
                    source={{ uri: imgUri }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                    onError={(e) =>
                    console.log("Failed to load image:", imgUri, e.nativeEvent.error)}
                  />
                </TouchableOpacity>
              ))}
              </View>
            )}
 
            <Text className="text-xs text-gray-500 font-heebo-light mt-3 text-left">
              {formatDate(alert.createdAt)}
            </Text>
          </View>
        );
      })}
    </View>
      )}
         </ScrollView>
          {/* Full-screen Image Viewer Modal (remains the same) */}
          <Modal visible={modalVisible} transparent={false} animationType="fade" onRequestClose={closeImageModal}>
            {/* ... Modal content ... */}
          <SafeAreaView className="flex-1 bg-black">
          <TouchableOpacity
            className="absolute top-12 right-6 z-50 p-2 bg-black/60 rounded-full"
            onPress={closeImageModal}
          >
          <Text className="text-white text-2xl font-bold leading-none" style={{lineHeight: 28}}>×</Text>
          </TouchableOpacity>
          {selectedImages.length > 0 && (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              contentOffset={{ x: SCREEN_WIDTH * selectedImageIndex, y: 0 }}
              style={{ flex: 1 }}
            >
              {selectedImages.map((uri, idx) => (
                <View key={idx} style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }} className="justify-center items-center">
                  <Image
                    source={{ uri }}
                    style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT * 0.9 }}
                    resizeMode="contain"
                    onError={(e) => console.log("Modal image load error:", uri, e.nativeEvent.error)}
                  />
                </View>
              ))}
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

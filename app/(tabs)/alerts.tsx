// app/(tabs)/alerts.tsx
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { auth, db } from "../FirebaseConfig";
import { getUser } from "../utils/firestoreUtils";
import { collection, query, orderBy, onSnapshot, Timestamp } from "firebase/firestore";

interface UserData {
  id: string;
  role?: string;
}

interface AlertData {
  id: string;
  title?: string;
  message: string;
  createdBy: string;
  createdAt: Timestamp;
  notificationSent?: boolean;
  targetType?: string;
  targetCourseId?: string;
}

export default function AlertsScreen() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(true);
  const [expandedAlerts, setExpandedAlerts] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const checkUserRole = async () => {
      setLoadingUser(true);
      const user = auth.currentUser;
      if (user) {
        try {
          const userData = (await getUser(user.uid)) as UserData | null;
          if (userData?.role === "admin") {
            setIsAdmin(true);
          }
        } catch (error) {
          console.error("Error fetching user data for admin check:", error);
        }
      }
      setLoadingUser(false);
    };
    
    checkUserRole();

    // Fetch Alerts
    setLoadingAlerts(true);
    const alertQuery = query(
      collection(db, "alerts"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      alertQuery,
      (snapshot) => {
        const fetchedAlerts = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<AlertData, "id">),
        }))
        .filter(alert => 
          (alert.message && alert.message.trim() !== '') || 
          (alert.title && alert.title.trim() !== '')
        );

        setAlerts(fetchedAlerts);
        setLoadingAlerts(false);
      },
      (error) => {
        console.error("Error fetching alerts:", error);
        setLoadingAlerts(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const formatDate = (timestamp: Timestamp | null | undefined) => {
    if (!timestamp || typeof timestamp.toDate !== 'function') return '';
    return timestamp.toDate().toLocaleDateString('he-IL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleReadMore = (alertId: string) => {
    setExpandedAlerts(prev => ({
      ...prev,
      [alertId]: !prev[alertId]
    }));
  };

  if (loadingUser || loadingAlerts) {
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
          <Text className="text-black text-2xl font-heeboBold">+</Text>
        </TouchableOpacity>
      )}

      <View className="pt-6 pb-4">
        <Text className="text-3xl font-heebo-bold text-center mt-5 text-primary">
          עדכונים
        </Text>
      </View>

      <ScrollView 
        className="flex-1 w-full"
        contentContainerStyle={{ 
          paddingBottom: isAdmin ? 120 : 20, 
          paddingTop: 20 
        }}
      >
        {alerts.length === 0 ? (
          <View className="flex-1 justify-center items-center px-4">
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
                  {/* Alert Title */}
                  {alert.title && alert.title.trim() !== '' && (
                    <Text className="text-xl font-heebo-bold text-primary mb-2 text-right">
                      {alert.title}
                    </Text>
                  )}

                  {/* Alert Message */}
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

                  {/* Alert Metadata */}
                  <View className="flex-row justify-between items-center mt-3">
                    <Text className="text-xs text-gray-500 font-heebo-light text-left">
                      {formatDate(alert.createdAt)}
                    </Text>
                    
                    {/* Show notification status for admins */}
                    {isAdmin && (
                      <View className="flex-row items-center">
                        {alert.notificationSent && (
                          <View className="bg-green-100 px-2 py-1 rounded-full mr-2">
                            <Text className="text-xs text-green-800 font-heebo-medium">
                              נשלח
                            </Text>
                          </View>
                        )}
                        {alert.targetType && (
                          <View className="bg-blue-100 px-2 py-1 rounded-full">
                            <Text className="text-xs text-blue-800 font-heebo-medium">
                              {alert.targetType === 'all' ? 'כולם' : 'חוג ספציפי'}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
// app/(tabs)/alerts.tsx
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { auth, db } from "../FirebaseConfig";
import { getUser } from "../utils/firestoreUtils";
import { collection, query, orderBy, onSnapshot, Timestamp, doc, deleteDoc } from "firebase/firestore";

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
  const [deletingAlerts, setDeletingAlerts] = useState<Record<string, boolean>>({});

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

    const handleDeleteAlert = async (alertId: string, alertTitle?: string) => {
    Alert.alert(
      "מחיקת התראה",
      `האם אתה בטוח שברצונך למחוק את ההתראה${alertTitle ? ` "${alertTitle}"` : ""}?`,
      [
        {
          text: "ביטול",
          style: "cancel"
        },
        {
          text: "מחק",
          style: "destructive",
          onPress: async () => {
            setDeletingAlerts(prev => ({ ...prev, [alertId]: true }));
            try {
              await deleteDoc(doc(db, "alerts", alertId));
              console.log("Alert deleted successfully:", alertId);
              Alert.alert("הצלחה", "ההתראה נמחקה בהצלחה");
            } catch (error) {
              console.error("Error deleting alert:", error);
              Alert.alert("שגיאה", "אירעה שגיאה במחיקת ההתראה");
            } finally {
              setDeletingAlerts(prev => ({ ...prev, [alertId]: false }));
            }
          }
        }
      ]
    );
  };

  const handleEditAlert = (alert: AlertData) => {
    router.push({
      pathname: "../alerts/edit-alert",
      params: {
        alertId: alert.id,
        title: alert.title || "",
        message: alert.message || "",
        targetType: alert.targetType || "all",
        targetCourseId: alert.targetCourseId || "",
      }
    });
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
          paddingTop: 10 
        }}
       >
        {alerts.length === 0 ? (
          <View className="flex-1 justify-center items-center px-4">
            <Text className="text-center text-gray-500 font-heebo-regular">
              אין התראות עדיין
            </Text>
          </View>
        ) : (
          <View className="px-4">
          
            {alerts.map((alert) => {
              const isExpanded = expandedAlerts[alert.id];
              const messageNeedsTruncation = alert.message && alert.message.length > 150;
              const isDeleting = deletingAlerts[alert.id];

              return (
                <View key={alert.id} className="bg-primary p-5 rounded-3xl shadow-lg mb-5">
                  {/* Admin Actions */}
                  {isAdmin && (
                    <View className="flex-row justify-end mb-3 gap-2">
                      <TouchableOpacity
                        className="bg-green-600 px-5 py-2 rounded-full"
                        onPress={() => handleEditAlert(alert)}
                        disabled={isDeleting}
                      >
                        <Text className="text-white text-xl font-heebo-medium">עריכה</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        className="bg-red-500 px-5 py-2 rounded-full flex-row items-center"
                        onPress={() => handleDeleteAlert(alert.id, alert.title)}
                        disabled={isDeleting}
                      >
                        {isDeleting ? (
                          <ActivityIndicator size="small" color="white" />
                        ) : (
                          <Text className="text-white text-xl font-heebo-medium">מחק</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}
                  
                  {/* Alert Title */}
                  {alert.title && alert.title.trim() !== '' && (
                    <Text className="text-3xl font-heebo-bold text-white mb-2 text-right leading-relaxed">
                      {alert.title}
                    </Text>
                  )}

                  {/* Alert Message */}
                  {alert.message && alert.message.trim() !== '' && (
                    <View className="mb-3">
                      <Text
                        className="text-2xl font-heebo-regular text-white text-right leading-relaxed"
                        numberOfLines={isExpanded || !messageNeedsTruncation ? undefined : 3}
                      >
                        {alert.message}
                      </Text>
                      {messageNeedsTruncation && (
                        <TouchableOpacity 
                          onPress={() => toggleReadMore(alert.id)}
                          className="mt-1 self-end"
                        >
                          <Text className="text-yellow-400 font-heebo-medium">
                            {isExpanded ? 'הצג פחות' : 'קרא עוד'}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}

                  {/* Alert Metadata */}
                  <View className="flex-row justify-between items-center mt-3">
                    <Text className="text-2xl text-gray-300 font-heebo-light text-left">
                      {formatDate(alert.createdAt)}
                    </Text>
                    
                    {/* Show notification status for admins */}
                    {isAdmin && (
                      <View className="flex-row items-center">
                        {alert.notificationSent && (
                          <View className="bg-green-600 px-2 py-1 rounded-full mr-2">
                            <Text className="text-xs text-white font-heebo-medium">
                              נשלח
                            </Text>
                          </View>
                        )}
                        {alert.targetType && (
                          <View className="bg-blue-500 px-2 py-1 rounded-full">
                            <Text className="text-xs text-white font-heebo-medium">
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
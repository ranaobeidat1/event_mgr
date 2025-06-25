// app/(tabs)/alerts.tsx
import React, { useEffect, useState, useRef } from "react";
import {
  ScrollView,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Animated,
} from "react-native";
import { router } from "expo-router";
import { auth, db } from "../../FirebaseConfig";
import { getUser } from "../utils/firestoreUtils";
import { collection, query, orderBy, onSnapshot, Timestamp, doc, deleteDoc } from "firebase/firestore";
import { ModernActionButtons } from "../components/ModernActionButtons";

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
  const [refreshing, setRefreshing] = useState(false);
  
  // Animation refs for cards
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnims = useRef<{ [key: string]: Animated.Value }>({}).current;

  useEffect(() => {
    checkUserRole();
    fetchAlerts();
  }, []);

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

  const fetchAlerts = () => {
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
        
        // Animate in the cards
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      },
      (error) => {
        console.error("Error fetching alerts:", error);
        setLoadingAlerts(false);
      }
    );

    return unsubscribe;
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await checkUserRole();
    fetchAlerts();
    setTimeout(() => setRefreshing(false), 1000);
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

  const animatePress = (alertId: string) => {
    if (!scaleAnims[alertId]) {
      scaleAnims[alertId] = new Animated.Value(1);
    }
    
    Animated.sequence([
      Animated.timing(scaleAnims[alertId], {
        toValue: 0.98,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnims[alertId], {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const renderAlertSkeleton = () => (
    <View className="px-4">
      {[1, 2, 3].map((i) => (
        <View key={i} className="bg-white rounded-2xl mb-4 p-5 border border-[#1A4782]" style={{
          shadowColor: '#1A4782',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 5,
        }}>
          <View className="bg-gray-200 h-6 w-3/4 rounded mb-3 animate-pulse" />
          <View className="bg-gray-200 h-4 w-full rounded mb-2 animate-pulse" />
          <View className="bg-gray-200 h-4 w-5/6 rounded mb-4 animate-pulse" />
          <View className="bg-gray-200 h-3 w-1/3 rounded animate-pulse" />
        </View>
      ))}
    </View>
  );

  if (loadingUser || loadingAlerts) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="pt-6 pb-4">
          <Text className="text-3xl font-heebo-bold text-center mt-5 text-primary">
            עדכונים
          </Text>
        </View>
        {renderAlertSkeleton()}
      </SafeAreaView>
    );
  }

  const renderEmptyState = () => (
    <View className="flex-1 justify-center items-center px-8 py-20">
      <View className="bg-white rounded-full p-8 mb-6" style={{
        shadowColor: '#1A4782',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
      }}>
        <Text className="text-6xl text-center">📢</Text>
      </View>
      <Text className="text-2xl font-heebo-bold text-gray-800 mb-2 text-center">
        אין התראות עדיין
      </Text>
      <Text className="text-lg font-heebo-regular text-gray-500 text-center">
        כאן יופיעו כל העדכונים וההודעות החשובות
      </Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {isAdmin && (
        <Animated.View
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 10,
            transform: [{
              scale: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1],
              })
            }]
          }}
        >
          <TouchableOpacity
           className="w-14 h-14 bg-[#1A4782] rounded-full items-center justify-center"
            style={{
              shadowColor: '#1A4782',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 8,
            }}
            onPress={() => router.push("/alerts/create-alert")}
            activeOpacity={0.8}
          >
            <Text className="text-white text-3xl font-heebo-bold">+</Text>
          </TouchableOpacity>
        </Animated.View>
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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {alerts.length === 0 ? (
          renderEmptyState()
        ) : (
          <Animated.View className="px-4" style={{ opacity: fadeAnim }}>
            {alerts.map((alert, index) => {
              const isExpanded = expandedAlerts[alert.id];
              const messageNeedsTruncation = alert.message && alert.message.length > 150;
              const isDeleting = deletingAlerts[alert.id];
              
              if (!scaleAnims[alert.id]) {
                scaleAnims[alert.id] = new Animated.Value(1);
              }

              return (
                <Animated.View 
                  key={alert.id}
                  style={{
                    transform: [{ scale: scaleAnims[alert.id] }],
                    opacity: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 1],
                    })
                  }}
                >
                  <TouchableOpacity
                    activeOpacity={0.95}
                    onPressIn={() => animatePress(alert.id)}
                    onPress={() => messageNeedsTruncation && toggleReadMore(alert.id)}
                    className="bg-white p-6 rounded-2xl mb-4 border-2 border-blue-100"
                    style={{
                      shadowColor: '#1A4782',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.1,
                      shadowRadius: 8,
                      elevation: 5,
                    }}
                  >
                    {/* Admin Actions */}
                    {isAdmin && (
                      <View className="flex-row justify-end mb-3">
                        <ModernActionButtons
                          showEdit={true}
                          showDelete={true}
                          onEdit={() => handleEditAlert(alert)}
                          onDelete={() => handleDeleteAlert(alert.id, alert.title)}
                          disabled={isDeleting}
                          size="medium"
                        />
                      </View>
                    )}
                    
                    {/* Alert Title */}
                    {alert.title && alert.title.trim() !== '' && (
                      <Text className="text-2xl font-heebo-bold text-gray-900 mb-3 text-right leading-relaxed">
                        {alert.title}
                      </Text>
                    )}

                    {/* Alert Message */}
                    {alert.message && alert.message.trim() !== '' && (
                      <View className="mb-4">
                        <Text
                          className="text-lg font-heebo-regular text-gray-700 text-right leading-relaxed"
                          numberOfLines={isExpanded || !messageNeedsTruncation ? undefined : 3}
                        >
                          {alert.message}
                        </Text>
                        {messageNeedsTruncation && (
                          <TouchableOpacity 
                            onPress={() => toggleReadMore(alert.id)}
                            className="mt-2 self-end"
                          >
                            <Text className="text-blue-500 font-heebo-medium text-base">
                              {isExpanded ? 'הצג פחות ▲' : 'קרא עוד ▼'}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}

                    {/* Alert Metadata */}
                    <View className="flex-row justify-between items-center pt-4 border-t border-gray-100">
                      <Text className="text-sm text-gray-500 font-heebo-light">
                        {formatDate(alert.createdAt)}
                      </Text>
                      
                      {/* Show notification status for admins */}
                      {isAdmin && (
                        <View className="flex-row items-center gap-2">
                          {alert.notificationSent && (
                            <View className="bg-green-100 px-3 py-1 rounded-full">
                              <Text className="text-xs text-green-700 font-heebo-medium">
                                ✓ נשלח
                              </Text>
                            </View>
                          )}
                          {alert.targetType && (
                            <View className="bg-blue-100 px-3 py-1 rounded-full">
                              <Text className="text-xs text-blue-700 font-heebo-medium">
                                {alert.targetType === 'all' ? '👥 כולם' : '🎯 חוג ספציפי'}
                              </Text>
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
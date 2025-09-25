// app/(tabs)/alerts.tsx

import React, { useEffect, useState, useCallback } from "react";
import {
  ScrollView,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  NativeSyntheticEvent, // Import this type
  TextLayoutEventData,  // Import this type
} from "react-native";
import { router } from "expo-router";
import { auth, db } from "../../FirebaseConfig";
import { getUser } from "../utils/firestoreUtils";
import { FirebaseFirestoreTypes } from "@react-native-firebase/firestore";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";

interface AlertData {
  id: string;
  title?: string;
  message: string;
  createdBy: string;
  createdAt?: FirebaseFirestoreTypes.Timestamp | Date | null;
  notificationSent?: boolean;
  targetType?: "all" | "course";
  targetCourseId?: string;
}

const ALERTS_PAGE_SIZE = 10;
const MAX_LINES = 4; // Define max lines as a constant

export default function AlertsScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(true);

  const [filter, setFilter] = useState<"all" | "general" | "course">("all");
  const [expandedAlerts, setExpandedAlerts] = useState<Record<string, boolean>>({});
  const [deletingAlerts, setDeletingAlerts] = useState<Record<string, boolean>>({});
  
  // --- FIX #1 of 3: Add new state to track which alerts are actually truncated ---
  const [isTruncated, setIsTruncated] = useState<Record<string, boolean>>({});

  // Pagination state
  const [lastVisible, setLastVisible] = useState<FirebaseFirestoreTypes.DocumentData | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [allDataLoaded, setAllDataLoaded] = useState(false);

  // 1) Check user role on mount
  const checkUserRole = useCallback(async () => {
    setLoadingUser(true);
    const user = auth.currentUser;
    if (user) {
      const userData = (await getUser(user.uid)) as { role?: string } | null;
      setIsAdmin(userData?.role === "admin");
    }
    setLoadingUser(false);
  }, []);

  // 2) Real‑time listener for first page of alerts
  useEffect(() => {
    checkUserRole();

    setLoadingAlerts(true);
    const firstPageQuery = db
      .collection("alerts")
      .orderBy("createdAt", "desc")
      .limit(ALERTS_PAGE_SIZE);

    const unsubscribe = firstPageQuery.onSnapshot(
      (snap) => {
        const docs = snap.docs.map(d => ({
          id: d.id,
          ...(d.data() as Omit<AlertData, "id">),
        }));
        setAlerts(docs);

        const lastDoc = snap.docs[snap.docs.length - 1] || null;
        setLastVisible(lastDoc);
        setAllDataLoaded(snap.docs.length < ALERTS_PAGE_SIZE);
        setLoadingAlerts(false);
      },
      (error) => {
        console.error("Alerts onSnapshot error:", error);
        Alert.alert("שגיאה", "לא ניתן לטעון את ההתראות.");
        setLoadingAlerts(false);
      }
    );

    return () => unsubscribe();
  }, [checkUserRole]);

  // 3) Load more (older) alerts
  const handleLoadMore = async () => {
    if (loadingMore || allDataLoaded || !lastVisible) return;
    setLoadingMore(true);

    const nextPageQuery = db
      .collection("alerts")
      .orderBy("createdAt", "desc")
      .startAfter(lastVisible)
      .limit(ALERTS_PAGE_SIZE);

    try {
      const snap = await nextPageQuery.get();
      if (snap.empty) {
        setAllDataLoaded(true);
      } else {
        const more = snap.docs.map(d => ({
          id: d.id,
          ...(d.data() as Omit<AlertData, "id">),
        }));
        setAlerts(prev => [...prev, ...more]);
        const lastDoc = snap.docs[snap.docs.length - 1];
        setLastVisible(lastDoc);
        if (snap.docs.length < ALERTS_PAGE_SIZE) {
          setAllDataLoaded(true);
        }
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Could not load more alerts.");
    } finally {
      setLoadingMore(false);
    }
  };

  // Helpers
  const formatDate = (ts?: FirebaseFirestoreTypes.Timestamp | Date | null) => {
    if (!ts) return "";
    const dateObj =
      typeof (ts as any)?.toDate === "function"
        ? (ts as any).toDate()
        : (ts as unknown as Date);
    return dateObj.toLocaleDateString("he-IL", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };
  
  // --- FIX #2 of 3: New function to handle text layout and check for truncation ---
  const handleTextLayout = (
    e: NativeSyntheticEvent<TextLayoutEventData>,
    alertId: string
  ) => {
    const wasTruncated = e.nativeEvent.lines.length >= MAX_LINES;
    if (wasTruncated && !isTruncated[alertId]) {
      setIsTruncated(prev => ({ ...prev, [alertId]: true }));
    }
  };

  const toggleReadMore = (id: string) =>
    setExpandedAlerts(e => ({ ...e, [id]: !e[id] }));

  const handleDeleteAlert = (alertId: string, title?: string) =>
    Alert.alert(
      "מחיקת התראה",
      `האם אתה בטוח שברצונך למחוק את ההתראה${title ? ` "${title}"` : ""}?`,
      [
        { text: "ביטול", style: "cancel" },
        {
          text: "מחק",
          style: "destructive",
          onPress: async () => {
            setDeletingAlerts(d => ({ ...d, [alertId]: true }));
            try {
              await db.collection("alerts").doc(alertId).delete();
              setAlerts(prev => prev.filter(a => a.id !== alertId));
              Alert.alert("הצלחה", "ההתראה נמחקה בהצלחה");
            } catch {
              Alert.alert("שגיאה", "אירעה שגיאה במחיקת ההתראה");
            } finally {
              setDeletingAlerts(d => ({ ...d, [alertId]: false }));
            }
          },
        },
      ]
    );

  const handleEditAlert = (alert: AlertData) =>
    router.push({
      pathname: "../alerts/edit-alert",
      params: {
        alertId: alert.id,
        title: alert.title ?? "",
        message: alert.message,
        targetType: alert.targetType ?? "all",
        targetCourseId: alert.targetCourseId ?? "",
      },
    });

  // Loading state
  if (loadingUser || loadingAlerts) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#1A4782" />
      </SafeAreaView>
    );
  }

  // Filter
  const filteredAlerts = alerts.filter(a => {
    if (filter === "all") return true;
    if (filter === "general") return a.targetType === "all";
    if (filter === "course") return a.targetType === "course";
    return true;
  });

  return (
    <SafeAreaView className="flex-1 bg-white">
      {isAdmin && (
        <TouchableOpacity
          onPress={() => router.push("/alerts/create-alert")}
          className="absolute top-4 right-4 z-10 w-14 h-14 bg-[#1A4782] rounded-full items-center justify-center shadow-lg"
        >
          <Text className="text-white text-2xl font-heeboBold">+</Text>
        </TouchableOpacity>
      )}

      <View className="pt-6 pb-2">
        <Text className="text-3xl font-heebo-bold text-center text-primary">
          עדכונים
        </Text>
      </View>

      <View className="flex-row-reverse justify-center items-center px-4 mb-4">
        {[
          { key: "all", label: "הכל" },
          { key: "general", label: "כלליות" },
          { key: "course", label: "חוגים" },
        ].map(tab => {
          const sel = filter === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setFilter(tab.key as any)}
              className={`mx-1 px-6 py-2 rounded-full border-2 ${
                sel
                  ? "bg-primary border-primary"
                  : "bg-white border-primary border-opacity-50"
              }`}
            >
              <Text
                className={`text-lg font-heebo-medium ${
                  sel ? "text-white" : "text-primary"
                }`}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + tabBarHeight,
        }}
      >
        {filteredAlerts.length === 0 ? (
          <View className="mt-10 items-center">
            <Text className="text-gray-500 font-heebo-regular">
              אין התראות להצגה
            </Text>
          </View>
        ) : (
          filteredAlerts.map(alert => {
            const isExpanded = expandedAlerts[alert.id];
            const deleting = deletingAlerts[alert.id];
            
            // --- FIX #3 of 3: Use the new state to decide if the button should show ---
            const showReadMoreButton = isTruncated[alert.id];

            return (
              <View
                key={alert.id}
                className="bg-primary rounded-3xl p-5 shadow-lg mb-6"
              >
                {isAdmin && (
                  <View className="flex-row justify-end mb-3 space-x-2">
                    <TouchableOpacity
                      onPress={() => handleEditAlert(alert)}
                      disabled={deleting}
                      className="bg-green-600 px-4 py-2 rounded-full"
                    >
                      <Text className="text-white text-xl font-heebo-medium">
                        עריכה
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteAlert(alert.id, alert.title)}
                      disabled={deleting}
                      className="bg-red-500 px-4 py-2 rounded-full"
                    >
                      {deleting ? (
                        <ActivityIndicator color="white" />
                      ) : (
                        <Text className="text-white text-xl font-heebo-medium">
                          מחק
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}

                {alert.title?.trim() && (
                  <Text className="text-white text-3xl font-heebo-bold mb-2 text-right">
                    {alert.title}
                  </Text>
                )}

                <View className="mb-3">
                  {isExpanded ? (
                    <Text
                      className="text-white text-xl font-heebo-regular leading-relaxed text-right"
                    >
                      {alert.message}
                    </Text>
                  ) : (
                    <Text
                      className="text-white text-xl font-heebo-regular leading-relaxed text-right"
                      numberOfLines={MAX_LINES}
                      ellipsizeMode="tail"
                      onTextLayout={(e) => handleTextLayout(e, alert.id)}
                    >
                      {alert.message}
                    </Text>
                  )}

                  {showReadMoreButton && (
                    <TouchableOpacity
                      onPress={() => toggleReadMore(alert.id)}
                      activeOpacity={0.7}
                      className="mt-4 w-full bg-white/20 py-3 rounded-lg items-center justify-center"
                    >
                      <Text className="text-base text-white font-heebo-bold">
                        {isExpanded ? "הצג פחות" : "קרא עוד"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View className="flex-row justify-between items-center">
                  <Text className="text-gray-300 text-2xl font-heebo-light">
                    {alert.createdAt ? formatDate(alert.createdAt) : ""}
                  </Text>
                  {isAdmin && (
                    <View className="flex-row space-x-2">
                      {alert.notificationSent && (
                        <View className="bg-green-600 px-2 py-1 rounded-full">
                          <Text className="text-white text-xs font-heebo-medium">
                            נשלח
                          </Text>
                        </View>
                      )}
                      {alert.targetType && (
                        <View className="bg-blue-500 px-2 py-1 rounded-full">
                          <Text className="text-white text-xs font-heebo-medium">
                            {alert.targetType === "all"
                              ? "כולם"
                              : "חוג ספציפי"}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              </View>
            );
          })
        )}

        {!allDataLoaded && (
          <View className="items-center my-4">
            <TouchableOpacity
              onPress={handleLoadMore}
              disabled={loadingMore}
              className="bg-primary px-12 py-3 rounded-full shadow-lg"
            >
              {loadingMore ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-lg font-heebo-bold">
                  טען עוד
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
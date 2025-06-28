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
import { auth, db } from "../../FirebaseConfig";
import { getUser } from "../utils/firestoreUtils";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
  doc,
  deleteDoc,
} from "firebase/firestore";

interface AlertData {
  id: string;
  title?: string;
  message: string;
  createdBy: string;
  createdAt?: Timestamp | Date | null;
  notificationSent?: boolean;
  targetType?: "all" | "course";
  targetCourseId?: string;
}

export default function AlertsScreen() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(true);

  const [filter, setFilter] = useState<"all" | "general" | "course">("all");
  const [expandedAlerts, setExpandedAlerts] = useState<Record<string, boolean>>({});
  const [deletingAlerts, setDeletingAlerts] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const checkUserRole = async () => {
      setLoadingUser(true);
      const user = auth.currentUser;
      if (user) {
        const userData = (await getUser(user.uid)) as { role?: string } | null;
        if (userData?.role === "admin") setIsAdmin(true);
      }
      setLoadingUser(false);
    };
    checkUserRole();

    setLoadingAlerts(true);
    const alertQuery = query(
      collection(db, "alerts"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(
      alertQuery,
      (snap) => {
        const fetched = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<AlertData, "id">) }))
          .filter((a) => a.message.trim() || (a.title?.trim() ?? ""));
        setAlerts(fetched);
        setLoadingAlerts(false);
      },
      (err) => {
        console.error(err);
        setLoadingAlerts(false);
      }
    );
    return () => unsub();
  }, []);

  // Safe formatDate without instanceof
  const formatDate = (ts?: Timestamp | Date | null) => {
    if (!ts) return "";
    let dateObj: Date;
    // Firestore Timestamp has a toDate() method
    if (
      typeof (ts as any)?.toDate === "function"
    ) {
      dateObj = (ts as any).toDate();
    } else {
      // assume it's a JS Date
      dateObj = ts as Date;
    }
    return dateObj.toLocaleDateString("he-IL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const toggleReadMore = (id: string) =>
    setExpandedAlerts((e) => ({ ...e, [id]: !e[id] }));

  const handleDeleteAlert = async (alertId: string, title?: string) => {
    Alert.alert(
      "מחיקת התראה",
      `האם אתה בטוח שברצונך למחוק את ההתראה${title ? ` "${title}"` : ""}?`,
      [
        { text: "ביטול", style: "cancel" },
        {
          text: "מחק",
          style: "destructive",
          onPress: async () => {
            setDeletingAlerts((d) => ({ ...d, [alertId]: true }));
            try {
              await deleteDoc(doc(db, "alerts", alertId));
              Alert.alert("הצלחה", "ההתראה נמחקה בהצלחה");
            } catch {
              Alert.alert("שגיאה", "אירעה שגיאה במחיקת ההתראה");
            } finally {
              setDeletingAlerts((d) => ({ ...d, [alertId]: false }));
            }
          },
        },
      ]
    );
  };

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

  if (loadingUser || loadingAlerts) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#1A4782" />
      </SafeAreaView>
    );
  }

  const filteredAlerts = alerts.filter((a) => {
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
          className="absolute top-4 right-4 z-10 w-14 h-14 bg-[#1A4782] rounded-full items-center justify-center shadow-lg z-10"
        >
          <Text className="text-white text-2xl font-heeboBold">+</Text>
        </TouchableOpacity>
      )}

      {/* Header */}
      <View className="pt-6 pb-2">
        <Text className="text-3xl font-heebo-bold text-center text-primary">
          עדכונים
        </Text>
      </View>

      {/* Segmented Control */}
      <View className="flex-row-reverse justify-center items-center px-4 mb-4">
        {[
          { key: "all", label: "הכל" },
          { key: "general", label: "כלליות" },
          { key: "course", label: "חוגים" },
        ].map((tab) => {
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

      {/* Alerts List */}
      <ScrollView
        contentContainerStyle={{
          paddingBottom: isAdmin ? 120 : 20,
          paddingHorizontal: 16,
        }}
      >
        {filteredAlerts.length === 0 ? (
          <View className="mt-10 items-center">
            <Text className="text-gray-500 font-heebo-regular">
              אין התראות להצגה
            </Text>
          </View>
        ) : (
          filteredAlerts.map((alert) => {
            const isExpanded = expandedAlerts[alert.id];
            const needsTrunc = alert.message.length > 150;
            const deleting = deletingAlerts[alert.id];

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
                  <Text
                    className="text-white text-xl font-heebo-regular leading-relaxed text-right"
                    numberOfLines={isExpanded ? undefined : 4}
                  >
                    {alert.message}
                  </Text>
                  {needsTrunc && (
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
      </ScrollView>
    </SafeAreaView>
  );
}

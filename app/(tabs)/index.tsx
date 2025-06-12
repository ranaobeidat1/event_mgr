import React, { useEffect, useState } from "react";
import { SafeAreaView, View, Text, ActivityIndicator, ScrollView } from "react-native";
import { db } from "../FirebaseConfig";
import { collection, query, orderBy, onSnapshot, limit } from "firebase/firestore";
import type { Timestamp } from "firebase/firestore";

interface AlertData {
  id: string;
  title?: string;
  message: string;
  createdAt: Timestamp;
}

export default function PostsScreen() {
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "alerts"),
      orderBy("createdAt", "desc"),
      limit(3)
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setAlerts(
          snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<AlertData, "id">) }))
        );
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#1A4782" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white pt-4">
      <Text className="text-[#1A4782] text-center text-2xl font-heebo-bold mb-3">
        ברוכים הבאים לאפליקציה שלנו!
      </Text>
      <Text className="text-[#1A4782] text-right text-lg font-tahoma mx-4 mb-2">
        התראות אחרונות
      </Text>

      <View className="bg-[#1A4782] p-4 mx-4 rounded-2xl mb-4">
        <ScrollView>
          {alerts.map((alert) => (
            <View key={alert.id} className="relative bg-white rounded-2xl p-4 mb-3 overflow-hidden">
              {/* subtle glare */}
              <View className="absolute top-2 left-0 w-1/2 h-1 bg-white opacity-20 rotate-12" />
              {alert.title ? (
                <Text className="font-heebo-bold text-[#1A4782] text-base mb-1">
                  {alert.title}
                </Text>
              ) : null}
              <Text className="font-tahoma text-gray-800 text-base">
                {alert.message}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

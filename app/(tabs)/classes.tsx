// app/(tabs)/classes.tsx
import React, { useEffect, useState } from "react";
import { ScrollView, Text, View, SafeAreaView, TouchableOpacity } from "react-native";
import { Link } from "expo-router";
import { collection, getDocs } from "firebase/firestore";
import { auth, db } from "../FirebaseConfig";
import { getUser } from "../utils/firestoreUtils";

// Define interface for user data
interface UserData {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  createdAt?: any;
}

export default function Index() {
  const [classes, setClasses] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check if current user is admin
        const user = auth.currentUser;
        if (user) {
          const userData = await getUser(user.uid) as UserData;
          setIsAdmin(userData?.role === "admin");
        }

        // Fetch classes from Firestore
        const querySnapshot = await getDocs(collection(db, "courses"));
        const coursesList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setClasses(coursesList);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-primary text-xl font-heebo-medium">Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}>
        <Text className="text-3xl font-heebo-bold text-center mt-5 text-primary">
          חוגים
        </Text>
        
        {/* Admin-only Add Class button */}
        {isAdmin && (
          <Link href="/add-class" asChild>
            <TouchableOpacity className="bg-secondary rounded-full px-6 py-4 shadow-md mt-6 mx-auto">
              <Text className="text-white font-heebo-bold text-lg text-center">הוסף חוג חדש</Text>
            </TouchableOpacity>
          </Link>
        )}

        {/* Container for clickable class pills */}
        <View className="mt-8 flex flex-col gap-8">
          {classes.length > 0 ? (
            classes.map((cls) => (
              <Link key={cls.id} href={`/classes/${cls.id}`}>
                <View className="bg-primary rounded-full px-14 py-8 shadow-md w-full items-center">
                  <Text className="text-white font-heebo-bold text-xl">{cls.name}</Text>
                </View>
              </Link>
            ))
          ) : (
            <Text className="text-center text-gray-600 font-heebo-medium text-lg mt-4">
              אין חוגים זמינים כרגע
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
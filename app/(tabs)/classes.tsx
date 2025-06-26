import React, { useEffect, useState } from "react";
import {
  ScrollView,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { collection, getDocs } from "firebase/firestore";
import { auth, db } from "../../FirebaseConfig";
import { getUser } from "../utils/firestoreUtils";
import { useAuth } from "../_layout";
import { LinearGradient } from 'expo-linear-gradient'; // make sure this is imported
import { StyleSheet } from 'react-native';
interface UserData {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  createdAt?: any;
}

interface ClassData {
  id: string;
  name: string;
  description?: string;
  location?: string;
  schedule?: string;
  payment?: string;
  maxCapacity?: number;
}

export default function Index() {
  const { isGuest } = useAuth();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<ClassData[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredClasses(classes);
    } else {
      const filtered = classes.filter((cls) => {
        const nameMatch = cls.name?.toLowerCase().includes(searchQuery.toLowerCase());
        const descriptionMatch = cls.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const locationMatch = cls.location?.toLowerCase().includes(searchQuery.toLowerCase());
        const scheduleMatch = cls.schedule?.toLowerCase().includes(searchQuery.toLowerCase());
        return nameMatch || descriptionMatch || locationMatch || scheduleMatch;
      });
      setFilteredClasses(filtered);
    }
  }, [classes, searchQuery]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!isGuest) {
          const user = auth.currentUser;
          if (user) {
            const userData = (await getUser(user.uid)) as UserData;
            setIsAdmin(userData?.role === "admin");
          }
        }

        const querySnapshot = await getDocs(collection(db, "courses"));
        const coursesList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
          description: doc.data().description,
          location: doc.data().location,
          schedule: doc.data().schedule,
          payment: doc.data().payment,
          maxCapacity: doc.data().maxCapacity,
        }));

        setClasses(coursesList);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isGuest]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-primary text-xl font-heebo-medium">טוען...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}>
        <Text className="text-3xl font-heebo-bold text-center mt-5 text-primary">חוגים</Text>

        {isAdmin && (
          <Link href="/add-class" asChild>
            <TouchableOpacity className="bg-secondary rounded-full px-6 py-4 shadow-md mt-6 mx-auto">
              <Text className="text-white font-heebo-bold text-lg text-center">הוסף חוג חדש</Text>
            </TouchableOpacity>
          </Link>
        )}

        {/* Search Input */}
       <View className="mt-6 mb-4 relative">
  <View
    style={{
      padding: 3,
      borderRadius: 999,
      backgroundColor: '#1A4782',
      shadowColor: '#1A4782',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.9,
      shadowRadius: 10,
      elevation: 12, // Android glow
    }}
  >
    <View className="bg-white rounded-full">
      <TextInput
        className="rounded-full px-5 py-3 text-lg font-heebo-regular text-right"
        placeholder="חפש חוגים..."
        placeholderTextColor="#9CA3AF"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
    </View>
  </View>

  {searchQuery.trim() !== '' && (
    <TouchableOpacity
      className="absolute left-7 top-1/2 -translate-y-1/2"
      onPress={() => setSearchQuery('')}
    >
      <Text className="text-gray-500 text-lg">×</Text>
    </TouchableOpacity>
  )}
</View>


        <View className="flex flex-col gap-8">
          {searchQuery.trim() !== "" && (
            <View className="mb-2">
              <Text className="text-sm text-gray-600 font-heebo-medium text-right">
                נמצאו {filteredClasses.length} חוגים
              </Text>
            </View>
          )}

          {filteredClasses.length > 0 ? (
            filteredClasses.map((cls) => (
              <Link key={cls.id} href={`/classes/${cls.id}`} asChild>
                <TouchableOpacity className="bg-primary rounded-3xl p-6 shadow-md w-full">
                  <Text className="text-white font-heebo-bold text-2xl mb-2 text-right">{cls.name}</Text>

                  {/* Location and Schedule Pills */}
                  <View className="flex-row flex-wrap gap-2 justify-end mb-2 items-center">
                    {/* Location pill */}
                    {cls.location && (
                      <View className="flex-row items-center bg-white px-3 py-1 rounded-full">
                        <Text className="text-primary text-s ml-1 font-heebo-regular">{cls.location}</Text>
                        <Text className="text-primary text-sm">📍</Text>
                      </View>
                    )}

                    {/* Schedule pills */}
                    {cls.schedule &&
                      cls.schedule.split(",").map((entry, idx) => (
                        <View
                          key={idx}
                          className="flex-row items-center bg-white px-3 py-1 rounded-full"
                        >
                          <Text className="text-primary text-s ml-1 font-heebo-regular">{entry.trim()}</Text>
                          <Text className="text-primary text-sm">🕒</Text>
                        </View>
                      ))}
                  </View>
                </TouchableOpacity>
              </Link>
            ))
          ) : (
            <Text className="text-center text-gray-600 font-heebo-medium text-lg mt-4">
              {searchQuery.trim() !== ""
                ? "לא נמצאו חוגים התואמים לחיפוש"
                : "אין חוגים זמינים כרגע"}
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

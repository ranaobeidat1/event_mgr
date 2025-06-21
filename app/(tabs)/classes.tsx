// app/(tabs)/classes.tsx
import React, { useEffect, useState } from "react";
import { 
  ScrollView, 
  Text, 
  View, 
  SafeAreaView, 
  TouchableOpacity,
  TextInput 
} from "react-native";
import { Link, useRouter } from "expo-router";
import { collection, getDocs } from "firebase/firestore";
import { auth, db } from "../../FirebaseConfig";
import { getUser } from "../utils/firestoreUtils";
import { useAuth } from "../_layout";

// Define interface for user data
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

  // Filter classes based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredClasses(classes);
    } else {
      const filtered = classes.filter(cls => {
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
        // Check if current user is admin (only for authenticated users, not guests)
        if (!isGuest) {
          const user = auth.currentUser;
          if (user) {
            const userData = await getUser(user.uid) as UserData;
            setIsAdmin(userData?.role === "admin");
          }
        }

        // Fetch classes from Firestore (both guests and authenticated users can see classes)
        const querySnapshot = await getDocs(collection(db, "courses"));
        const coursesList = querySnapshot.docs.map(doc => ({
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

        {/* Search Box */}
        <View className="mt-6 mb-4">
          <TextInput
            className="bg-gray-100 rounded-full px-5 py-3 text-lg font-heebo-regular text-right"
            placeholder="חפש חוגים..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.trim() !== "" && (
            <TouchableOpacity
              className="absolute left-7 top-1/2 transform -translate-y-1/2"
              onPress={() => setSearchQuery("")}
            >
              <Text className="text-gray-500 text-lg">×</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Container for clickable class pills */}
        <View className="flex flex-col gap-8">
          {/* Search Results Counter */}
          {searchQuery.trim() !== "" && (
            <View className="mb-2">
              <Text className="text-sm text-gray-600 font-heebo-medium text-right">
                נמצאו {filteredClasses.length} חוגים
              </Text>
            </View>
          )}

          {filteredClasses.length > 0 ? (
            filteredClasses.map((cls) => (
              <Link key={cls.id} href={`/classes/${cls.id}`}>
                <View className="bg-primary rounded-full px-14 py-8 shadow-md w-full items-center">
                  <Text className="text-white font-heebo-bold text-xl">{cls.name}</Text>
                  {searchQuery.trim() !== "" && cls.description && (
                    <Text className="text-white font-heebo-regular text-sm mt-1 text-center" numberOfLines={1}>
                      {cls.description}
                    </Text>
                  )}
                </View>
              </Link>
            ))
          ) : (
            <Text className="text-center text-gray-600 font-heebo-medium text-lg mt-4">
              {searchQuery.trim() !== "" ? "לא נמצאו חוגים התואמים לחיפוש" : "אין חוגים זמינים כרגע"}
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
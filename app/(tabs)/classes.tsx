import React, { useEffect, useState } from "react";
import {
  ScrollView,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { Link } from "expo-router";
import { collection, getDocs } from "firebase/firestore";
import { auth, db } from "../../FirebaseConfig";
import { getUser } from "../utils/firestoreUtils";
import { useAuth } from "../_layout";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";

interface UserData {
  id: string;
  role?: string;
}
interface ClassData {
  id: string;
  name: string;
  location?: string;
  schedule?: string;
}

export default function Index() {
  const { isGuest } = useAuth();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  const [classes, setClasses] = useState<ClassData[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<ClassData[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // filter logic
  useEffect(() => {
    if (!searchQuery.trim()) return void setFilteredClasses(classes);
    const q = searchQuery.toLowerCase();
    setFilteredClasses(
      classes.filter(c =>
        [c.name, c.location, c.schedule]
          .filter(Boolean)
          .some(str => str!.toLowerCase().includes(q))
      )
    );
  }, [classes, searchQuery]);

  // fetch classes + role
  useEffect(() => {
    (async () => {
      try {
        if (!isGuest && auth.currentUser) {
          const ud = (await getUser(auth.currentUser.uid)) as UserData;
          setIsAdmin(ud.role === "admin");
        }
        const snap = await getDocs(collection(db, "courses"));
        setClasses(
          snap.docs.map(d => ({
            id: d.id,
            name: d.data().name,
            location: d.data().location,
            schedule: d.data().schedule,
          }))
        );
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [isGuest]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-primary text-xl">טוען...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {isAdmin && (
        <Link href="/add-class" asChild>
          <TouchableOpacity className="absolute top-4 right-4 w-14 h-14 bg-[#1A4782] rounded-full items-center justify-center shadow-lg z-10">
            <Text className="text-white text-2xl">+</Text>
          </TouchableOpacity>
        </Link>
      )}

      <View className="pt-6 pb-2">
        <Text className="text-3xl font-heebo-bold text-center text-primary">
          חוגים
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          // this ensures we clear BOTH system inset + the tab bar + your extra
          paddingBottom:
            insets.bottom + tabBarHeight  + (isAdmin ? 12 : 20),
        }}
      >
        {/* Search */}
        <View className="mt-6 mb-4 relative">
          <View
            style={{
              padding: 3,
              borderRadius: 999,
              backgroundColor: "#1A4782",
              shadowColor: "#1A4782",
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.9,
              shadowRadius: 10,
              elevation: 12,
            }}
          >
            <View className="bg-white rounded-full">
              <TextInput
                className="rounded-full px-5 py-3 text-lg text-right"
                placeholder="חפש חוגים..."
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>
          {!!searchQuery.trim() && (
            <TouchableOpacity
              className="absolute left-7 top-1/2 -translate-y-1/2"
              onPress={() => setSearchQuery("")}
            >
              <Text className="text-gray-500 text-lg">×</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Results */}
        <View className="flex flex-col gap-8">
          {!!searchQuery.trim() && (
            <Text className="text-sm text-gray-600 text-right mb-2">
              נמצאו {filteredClasses.length} חוגים
            </Text>
          )}

          {filteredClasses.map((cls) => (
            <Link key={cls.id} href={`/classes/${cls.id}`} asChild>
              <TouchableOpacity className="bg-primary rounded-3xl p-6 shadow-md w-full">
                <Text className="text-white text-2xl mb-4 text-right font-heebo-bold">
                  {cls.name}
                </Text>
                <View className="flex flex-col items-end gap-y-2">
                  {cls.location && (
                    <View className="flex-row items-center bg-white px-3 py-1 rounded-full">
                      <Text className="text-primary text-sm">📍</Text>
                      <Text className="text-primary mr-2 text-right font-heebo-regular">{cls.location}</Text>
                    </View>
                  )}
                  {cls.schedule && (
                    <View className="flex-row flex-wrap justify-end gap-2">
                      {cls.schedule.split(",").map((e, i) => (
                        <View
                          key={i}
                          className="flex-row items-center bg-white px-3 py-1 rounded-full"
                        >
                          <Text className="text-primary text-sm">🕒</Text>
                          <Text className="text-primary mr-2 text-right font-heebo-regular">
                            {e.trim()}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </Link>
          ))}

          {!filteredClasses.length && (
            <Text className="text-center text-gray-600 text-lg mt-4">
              {searchQuery.trim()
                ? "לא נמצאו חוגים התואמים לחיפוש"
                : "אין חוגים זמינים כרגע"}
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// app/users.tsx
import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router'; 
import { auth, db } from '../FirebaseConfig';
import { getUser } from './utils/firestoreUtils';

// Interface for user data
interface UserData {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  createdAt?: any;
}

export default function UsersScreen() {
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);

  useEffect(() => {
    const checkAdminAndFetchUsers = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          router.replace('/login');
          return;
        }

        const userData = await getUser(user.uid) as UserData;
        if (userData?.role !== "admin") {
          Alert.alert("אין גישה", "רק מנהלים יכולים לגשת לעמוד זה");
          router.back();
          return;
        }
        
        setIsAdmin(true);

        // --- CHANGE HERE: Use a real-time listener instead of a one-time fetch ---
        const unsubscribe = db.collection("users").onSnapshot(querySnapshot => {
          const usersList = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as UserData[];
          
          setUsers(usersList);
          // We also update filteredUsers here so the search works with live data
          setFilteredUsers(usersList);
          setLoading(false); // Stop loading once we have the initial data
        }, (error) => {
          console.error("Error fetching users:", error);
          Alert.alert("שגיאה", "אירעה שגיאה בטעינת המשתמשים");
          setLoading(false);
        });
        
        // Return the unsubscribe function to be called on component unmount
        return unsubscribe;

      } catch (error) {
        console.error("Error setting up user listener:", error);
        setLoading(false);
      }
    };

    let unsubscribe: (() => void) | undefined;
    checkAdminAndFetchUsers().then(unsub => {
      if (unsub) {
        unsubscribe = unsub;
      }
    });

    // Cleanup function for useEffect
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // This useEffect for searching remains the same, it will now just work with live data
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const lowercasedQuery = searchQuery.toLowerCase();
      const filtered = users.filter(user => {
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
        const email = (user.email || '').toLowerCase();
        return fullName.includes(lowercasedQuery) || email.includes(lowercasedQuery);
      });
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  const toggleUserRole = async (userId: string, currentRole: string | undefined) => {
    try {
      const newRole = currentRole === "admin" ? "user" : "admin";
      
      await db.collection("users").doc(userId).update({
        role: newRole
      });
      
      // --- CHANGE HERE: The manual state update below is no longer needed! ---
      // The onSnapshot listener will automatically update the state for us when
      // the data changes in Firestore.
      
      Alert.alert("עודכן בהצלחה", `הרשאות משתמש עודכנו ל${newRole === "admin" ? "מנהל" : "משתמש רגיל"}`);
    } catch (error) {
      console.error("Error updating user role:", error);
      Alert.alert("שגיאה", "אירעה שגיאה בעדכון הרשאות המשתמש");
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#1A4782" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" style={{direction: 'rtl'}}>
      <View className="px-6 pt-5 pb-3">
        <View className="flex-row justify-start mb-4">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-primary text-2xl font-heebo-medium">חזרה</Text>
          </TouchableOpacity>
        </View>

      <View className="items-center">
        <Text className="text-3xl font-bold text-primary">
          רשימת משתמשים
        </Text>
      </View>
    </View>

    <ScrollView className="flex-1 px-6">

        <View className="mb-4">
          <TextInput
            className="bg-gray-100 rounded-full px-5 py-3 text-lg text-right"
            placeholder="חפש לפי שם או אימייל..."
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

        <View>
          {searchQuery.trim() !== "" && (
            <View className="mb-2">
              <Text className="text-sm text-gray-600 text-right">
                נמצאו {filteredUsers.length} משתמשים
              </Text>
            </View>
          )}

          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <View 
                key={user.id} 
                className="bg-gray-100 rounded-lg p-4 mb-4 flex-row-reverse justify-between items-center"
              >
                <View>
                  <Text className="text-lg font-medium text-right">
                    {`${user.firstName || ''} ${user.lastName || ''}`.trim()}
                  </Text>
                  <Text className="text-gray-600 text-right">
                    {user.email}
                  </Text>
                  <View className="flex-row-reverse mt-1">
                    <Text className="text-gray-600 text-right">
                      תפקיד:
                    </Text>
                    <Text className={`font-medium ml-1 ${user.role === "admin" ? "text-green-600" : "text-blue-600"}`}>
                      {user.role === "admin" ? "מנהל" : "משתמש רגיל"}
                    </Text>
                  </View>
                </View>

                {user.id !== auth.currentUser?.uid && (
                  <TouchableOpacity
                    className={`px-4 py-2 rounded-full ${user.role === "admin" ? "bg-yellow-500" : "bg-blue-500"}`}
                    onPress={() => toggleUserRole(user.id, user.role)}
                  >
                    <Text className="text-white font-medium">
                      {user.role === "admin" ? "הסר הרשאות מנהל" : "הפוך למנהל"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          ) : (
            <Text className="text-center text-gray-600 text-lg mt-4">
              {searchQuery.trim() !== "" ? "לא נמצאו משתמשים התואמים לחיפוש" : "לא נמצאו משתמשים"}
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
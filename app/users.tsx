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
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';

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

  // Check if current user is admin and fetch all users
  useEffect(() => {
    const checkAdminAndFetchUsers = async () => {
      try {
        // Check if current user is admin
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

        // Fetch all users from Firestore
        const querySnapshot = await getDocs(collection(db, "users"));
        const usersList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as UserData[];
        
        setUsers(usersList);
        setFilteredUsers(usersList); // Initialize filtered list
      } catch (error) {
        console.error("Error fetching users:", error);
        Alert.alert("שגיאה", "אירעה שגיאה בטעינת המשתמשים");
      } finally {
        setLoading(false);
      }
    };

    checkAdminAndFetchUsers();
  }, []);

  // Filter users based on search query
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

  // Toggle user role between admin and user
  const toggleUserRole = async (userId: string, currentRole: string | undefined) => {
    try {
      const newRole = currentRole === "admin" ? "user" : "admin";
      
      // Update user role in Firestore
      await updateDoc(doc(db, "users", userId), {
        role: newRole
      });
      
      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, role: newRole } : user
        )
      );
      
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
      {/* Header */}
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

      {/* Search Bar */}
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
          {/* Search Results Counter */}
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

                {/* Don't show toggle button for current user */}
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
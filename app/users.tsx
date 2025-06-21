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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
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
      } catch (error) {
        console.error("Error fetching users:", error);
        Alert.alert("שגיאה", "אירעה שגיאה בטעינת המשתמשים");
      } finally {
        setLoading(false);
      }
    };

    checkAdminAndFetchUsers();
  }, []);

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
      <View className="flex-row-reverse items-center justify-between bg-white h-14 px-5 border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} style={{transform: [{rotate: '180deg'}]}} />
        </TouchableOpacity>
        <Text className="text-lg font-semibold">ניהול משתמשים</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView className="flex-1 px-4">
        <Text className="text-xl font-bold text-primary mt-6 mb-4 text-center">
          רשימת משתמשים
        </Text>

        {users.length === 0 ? (
          <Text className="text-center text-gray-500 mt-4">
            לא נמצאו משתמשים
          </Text>
        ) : (
          users.map((user) => (
            <View 
              key={user.id} 
              className="bg-gray-100 rounded-lg p-4 mb-4 flex-row-reverse justify-between items-center"
            >
              <View>
                <Text className="text-lg font-medium text-right">
                  {user.firstName} {user.lastName}
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
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
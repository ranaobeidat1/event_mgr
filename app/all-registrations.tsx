// app/all-registrations.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
  TextInput
} from 'react-native';
import { router, Stack } from 'expo-router';
import { auth, db } from '../FirebaseConfig';

// --- Using the UserData interface for app users ---
interface UserData {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
}

// Renamed component to reflect its new purpose
export default function AllUsersScreen() {
  // --- State now holds users, not registrations ---
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // This effect now fetches from the 'users' collection in real-time
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      router.replace('/login');
      return;
    }

    // --- 1. CHANGED DATA SOURCE: Fetching from 'users' collection ---
    const unsubscribe = db.collection('users').onSnapshot(snapshot => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as UserData[];
      
      setUsers(usersData);
      setFilteredUsers(usersData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching users:", error);
      Alert.alert('שגיאה', 'אירעה שגיאה בטעינת המשתמשים');
      setLoading(false);
    });

    // Unsubscribe from the listener when the component unmounts
    return () => unsubscribe();
  }, []);

  // Search logic now filters the users list
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

  // --- 2. ADDED EDIT FUNCTIONALITY: Navigates to an edit screen ---
  const handleEditUser = (user: UserData) => {
    router.push({
      pathname: './edit-user',
      params: { 
        userId: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
       },
    });
  };

  const renderItem = ({ item, index }: { item: UserData, index: number }) => {
    const fullName = item.firstName || item.lastName ? `${item.firstName || ''} ${item.lastName || ''}` : 'שם לא ידוע';
    
    return (
      <View style={[styles.tableRow, index % 2 === 0 ? styles.evenRow : styles.oddRow]}>
        <Text style={[styles.cell, styles.nameCell]}>{fullName}</Text>
        <Text style={[styles.cell, styles.emailCell]}>{item.email || 'לא צוין'}</Text>
        {/* --- 3. ADDED EDIT BUTTON to each row --- */}
        <TouchableOpacity style={styles.editButton} onPress={() => handleEditUser(item)}>
          <Text style={styles.editButtonText}>ערוך</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1A4782" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="flex-1 bg-white" style={{direction: 'rtl'}}>
        <View className="px-6 pt-5 pb-3">
          <View className="flex-row justify-start mb-4">
            <TouchableOpacity onPress={() => router.back()}>
              <Text className="text-primary text-2xl font-heebo-medium">חזרה</Text>
            </TouchableOpacity>
          </View>
          <View className="items-center">
            <Text className="text-3xl font-bold text-primary">
              רשימת כל המשתמשים
            </Text>
          </View>
        </View>

        <View className="px-6 mb-4">
          <TextInput
            className="bg-gray-100 rounded-full px-5 py-3 text-lg text-right"
            placeholder="חפש לפי שם או אימייל..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {searchQuery.trim() !== '' && (
          <View className="px-6 mb-2">
            <Text className="text-sm text-gray-600 text-right">
              נמצאו {filteredUsers.length} משתמשים
            </Text>
          </View>
        )}
        
        {filteredUsers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery.trim() !== "" ? "לא נמצאו תוצאות" : "אין משתמשים במערכת"}
            </Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            <View style={styles.tableHeader}>
              <Text style={[styles.headerCell, styles.nameCell]}>שם</Text>
              <Text style={[styles.headerCell, styles.emailCell]}>אימייל</Text>
              <View style={styles.editButton} /> {/* Placeholder for alignment */}
            </View>
            
            <FlatList
              data={filteredUsers}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
            />
          </View>
        )}
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  // ... (keeping your styles, but adding new ones for the button)
  container: { 
    flex: 1, 
    backgroundColor: '#f0f4f8' 
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  emptyContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  emptyText: { 
    fontSize: 16, 
    fontFamily: 'Heebo-Medium', 
    color: '#666' 
  },
  listContainer: {
    flex: 1,
    marginHorizontal: 16,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1A4782',
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  headerCell: {
    color: 'white',
    fontFamily: 'Heebo-Bold',
    fontSize: 14,
    textAlign: 'right',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  evenRow: {
    backgroundColor: '#f9f9f9',
  },
  oddRow: {
    backgroundColor: '#ffffff',
  },
  cell: {
    fontFamily: 'Heebo-Regular',
    fontSize: 14,
    textAlign: 'right',
  },
  nameCell: {
    flex: 1.5,
  },
  emailCell: {
    flex: 2,
  },
  editButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: {
    color: '#007BFF',
    fontFamily: 'Heebo-Medium',
  },
});


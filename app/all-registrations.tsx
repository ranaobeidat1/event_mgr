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
  ScrollView,
  TextInput
} from 'react-native';
import { router, useFocusEffect, Stack } from 'expo-router';
import { collection, getDocs } from 'firebase/firestore';
import { db, auth } from '../FirebaseConfig';
import { getUser, UserData } from './utils/firestoreUtils';
 
interface RegistrationData {
  id: string;
  userId: string;
  courseId: string;
  registrationDate: any;
  status: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  email?: string;
  userData?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
}

const AllRegistrationsList = () => {
  const [registrations, setRegistrations] = useState<RegistrationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredRegistrations, setFilteredRegistrations] = useState<RegistrationData[]>([]);

  const fetchRegistrations = useCallback(async () => {
    // Verify current user is admin
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('שגיאה', 'יש להתחבר מחדש');
      router.replace('/login');
      return;
    }

    try {
      const userData = await getUser(user.uid) as UserData | null;
      if (userData?.role !== 'admin') {
        Alert.alert('גישה נדחתה', 'רק מנהלים רשאים לצפות בדף זה');
        router.back();
        return;
      }

      setIsAdmin(true);
      setLoading(true);
      
      // Fetch all registrations
      const registrationsRef = collection(db, 'Registrations');
      const querySnapshot = await getDocs(registrationsRef);

      const registrationsData: RegistrationData[] = [];
      
      // Process each registration
      for (const doc of querySnapshot.docs) {
        const registration = {
          id: doc.id,
          ...doc.data()
        } as RegistrationData;
        
        
        registrationsData.push(registration);
      }

      setRegistrations(registrationsData);
      setFilteredRegistrations(registrationsData); // Initialize filtered list
    } catch (error) {
      console.error('Error fetching registrations:', error);
      Alert.alert('שגיאה', 'אירעה שגיאה בטעינת הנרשמים');
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter registrations based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredRegistrations(registrations);
    } else {
      const lowercasedQuery = searchQuery.toLowerCase();
      const filtered = registrations.filter(registration => {
        const fullName = `${registration.firstName || ''} ${registration.lastName || ''}`.toLowerCase();
        const email = (registration.email || '').toLowerCase();
        return fullName.includes(lowercasedQuery) || email.includes(lowercasedQuery);
      });
      setFilteredRegistrations(filtered);
    }
  }, [searchQuery, registrations]);

  // useFocusEffect runs every time the screen comes into focus, ensuring data is fresh.
  useFocusEffect(
    useCallback(() => {
      fetchRegistrations();
    }, [fetchRegistrations])
  );

  const renderItem = ({ item, index }: { item: RegistrationData, index: number }) => {
    const fullName = item.firstName || item.lastName ? `${item.firstName || ''} ${item.lastName || ''}` : 'שם לא ידוע';
    
    return (
      <View style={[styles.tableRow, index % 2 === 0 ? styles.evenRow : styles.oddRow]}>
        <Text style={[styles.cell, styles.nameCell]}>{fullName}</Text>
        <Text style={[styles.cell, styles.emailCell]}>{item.email || 'לא צוין'}</Text>
      </View>
    );
  };

  // Don't show anything until we've verified the user is an admin
  if (!isAdmin && loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1A4782" />
          <Text style={styles.loadingText}>מאמת הרשאות וטוען נתונים...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
    <Stack.Screen options={{ headerShown: false }} />
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
                רשימת כל הנרשמים
              </Text>
            </View>
          </View>

        {/* Search Bar */}
      <View className="px-6 mb-4">
        <TextInput
          className="bg-gray-100 rounded-full px-5 py-3 text-lg text-right"
          placeholder="חפש לפי שם או אימייל..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.trim() !== "" && (
          <TouchableOpacity
            className="absolute left-11 top-1/2 transform -translate-y-1/2"
            onPress={() => setSearchQuery("")}
          >
            <Text className="text-gray-500 text-lg">×</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Search Results Counter */}
      {searchQuery.trim() !== "" && (
        <View className="px-6 mb-2">
          <Text className="text-sm text-gray-600 text-right">
            נמצאו {filteredRegistrations.length} נרשמים
          </Text>
        </View>
      )}
      
      {filteredRegistrations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {searchQuery.trim() !== "" ? "לא נמצאו תוצאות" : "אין נרשמים במערכת"}
          </Text>
        </View>
      ) : (
        <View style={styles.listContainer}>
          {/* Header row */}
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, styles.nameCell]}>שם</Text>
            <Text style={[styles.headerCell, styles.emailCell]}>אימייל</Text>
          </View>
          
          {/* Registrations rows using FlatList */}
          <FlatList
            data={filteredRegistrations}
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
  container: { 
    flex: 1, 
    backgroundColor: '#f0f4f8' 
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  loadingText: { 
    marginTop: 10, 
    fontSize: 16, 
    color: '#1A4782', 
    fontFamily: 'Heebo-Medium' 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  headerTitle: { 
    fontSize: 20, 
    fontFamily: 'Heebo-Bold', 
    color: '#1A4782',
    textAlign: 'center'
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
    margin: 16,
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
    flex: 1,
  },
  emailCell: {
    flex: 2,
  }
});

export default AllRegistrationsList;
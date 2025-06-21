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
  FlatList
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { collection, getDocs } from 'firebase/firestore';
import { db, auth } from '../FirebaseConfig';
import { getUser, UserData } from './utils/firestoreUtils';
import { Ionicons } from '@expo/vector-icons';

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
    } catch (error) {
      console.error('Error fetching registrations:', error);
      Alert.alert('שגיאה', 'אירעה שגיאה בטעינת הנרשמים');
    } finally {
      setLoading(false);
    }
  }, []);

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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} style={{transform: [{rotate: '180deg'}]}} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>רשימת כל הנרשמים</Text>
        <View style={{width: 28}} />
      </View>
      
      {registrations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>אין נרשמים במערכת</Text>
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
            data={registrations}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
          />
        </View>
      )}
    </SafeAreaView>
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
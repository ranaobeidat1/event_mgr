// app/registrations-list.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList
} from 'react-native';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { collection, query, where, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../FirebaseConfig';
import { getUser, UserData } from './utils/firestoreUtils';
import { ModernDeleteButton } from './components/ModernActionButtons';

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

const RegistrationsList = () => {
  const { courseId, courseName } = useLocalSearchParams();
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

      
        const userData = await getUser(user.uid) as UserData | null;
        if (userData?.role !== 'admin') {
          Alert.alert('גישה נדחתה', 'רק מנהלים רשאים לצפות בדף זה');
          router.back();
          return;
        }

        setLoading(true);
        try {
        // Fetch registrations for this course
        const registrationsRef = collection(db, 'Registrations');
        const q = query(registrationsRef, where('courseId', '==', courseId));
        const querySnapshot = await getDocs(q);

        const registrationsData: RegistrationData[] = [];
        
        // Process each registration
        for (const doc of querySnapshot.docs) {
          const registration = {
            id: doc.id,
            ...doc.data()
          } as RegistrationData;
          
          // If the registration doesn't have firstName/lastName/phoneNumber stored directly,
          // try to get it from the user's profile (for backward compatibility)
          if (!registration.firstName || !registration.lastName) {
            if (registration.userId) {
              const userDetails = await getUser(registration.userId) as UserData | null;
              registration.userData = {
                firstName: userDetails?.firstName || '',
                lastName: userDetails?.lastName || '',
                email: userDetails?.email || ''
              };
            }
          }
          
          registrationsData.push(registration);
        }

        setRegistrations(registrationsData);
      } catch (error) {
        console.error('Error fetching registrations:', error);
        Alert.alert('שגיאה', 'אירעה שגיאה בטעינת הנרשמים');
      } finally {
        setLoading(false);
      }
    }, [courseId]);

    // useFocusEffect runs every time the screen comes into focus, ensuring data is fresh.
    useFocusEffect(
      useCallback(() => {
        fetchRegistrations();
      }, [fetchRegistrations])
    );

    const handleDeleteRegistration = (registrationId: string, userName: string) => {
    Alert.alert(
      "מחיקת הרשמה",
      `האם אתה בטוח שברצונך למחוק את ההרשמה של ${userName}?`,
      [
        {
          text: "ביטול",
          style: "cancel"
        },
        {
          text: "מחק",
          style: "destructive",
          onPress: async () => {
            try {
              // Delete the document from Firestore
              await deleteDoc(doc(db, "Registrations", registrationId));
              
              // Update the local state to remove the item from the list instantly
              setRegistrations(prevRegistrations =>
                prevRegistrations.filter(reg => reg.id !== registrationId)
              );
              
              Alert.alert("הצלחה", "ההרשמה נמחקה בהצלחה.");
            } catch (error) {
              console.error("Error deleting registration:", error);
              Alert.alert("שגיאה", "אירעה שגיאה במחיקת ההרשמה.");
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item, index }: { item: RegistrationData, index: number }) => {
    const fullName = `${item.firstName || ''} ${item.lastName || ''}`;
    
    return (
      <View style={[styles.tableRow, index % 2 === 0 ? styles.evenRow : styles.oddRow]}>
        <Text style={[styles.cell, styles.nameCell]}>{fullName}</Text>
        <Text style={[styles.cell, styles.phoneCell]}>{item.phoneNumber || 'לא צוין'}</Text>
        <Text style={[styles.cell, styles.emailCell]}>{item.email || 'לא צוין'}</Text>
        <View style={styles.actionCell}>
          <ModernDeleteButton
            onPress={() => handleDeleteRegistration(item.id, fullName)}
            size="small"
          />
        </View>
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
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Text style={styles.backButtonText}>חזרה</Text>
        </TouchableOpacity>
        <View style={styles.headerTitles}>
          <Text style={styles.headerTitle} numberOfLines={1}>נרשמים: {courseName}</Text>
          <Text style={styles.headerSubtitle}>סה"כ: {registrations.length}</Text>
        </View>
      </View>
      
      {registrations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>אין נרשמים לחוג זה עדיין</Text>
        </View>
      ) : (
        <View style={styles.listContainer}>
          {/* Header row */}
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, styles.nameCell]}>שם</Text>
            <Text style={[styles.headerCell, styles.phoneCell]}>טלפון</Text>
            <Text style={[styles.headerCell, styles.emailCell]}>אימייל</Text>
            <Text style={[styles.headerCell, styles.actionCell]}>פעולות</Text>
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
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 16, color: '#1A4782', fontFamily: 'Heebo-Medium' },
  header: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', 
  },
  backButton: {
    position: 'absolute',
    right: 15,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  backButtonText: { 
    fontSize: 21, 
    color: '#1A4782', 
    fontFamily: 'Heebo-Medium' 
  },
  headerTitles: { 
    alignItems: 'center'
  },
  headerTitle: { 
    fontSize: 22, 
    fontFamily: 'Heebo-Bold', 
    color: '#1A4782' 
  },
  headerSubtitle: { fontSize: 16, fontFamily: 'Heebo-Medium', color: '#666' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, fontFamily: 'Heebo-Medium', color: '#666' },
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
    flex: 2.5,
  },
  phoneCell: {
    flex: 2,
  },
  emailCell: {
    flex: 3.5,
  },
  actionCell: { flex: 1.5, alignItems: 'center' },

  // Styles for the delete button
  deleteButton: {
    backgroundColor: '#D9534F',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  deleteButtonText: {
    color: 'white',
    fontFamily: 'Heebo-Bold',
    fontSize: 12,
  },
});

export default RegistrationsList;
// app/registrations-list.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from './FirebaseConfig';
import { getUser } from './utils/firestoreUtils';

interface RegistrationData {
  id: string;
  userId: string;
  courseId: string;
  registrationDate: any;
  status: string;
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

  useEffect(() => {
    const checkAdminAndFetchData = async () => {
      // Verify current user is admin
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('שגיאה', 'יש להתחבר מחדש');
        router.replace('/login');
        return;
      }

      try {
        const userData = await getUser(user.uid);
        if (userData?.role !== 'admin') {
          Alert.alert('גישה נדחתה', 'רק מנהלים רשאים לצפות בדף זה');
          router.back();
          return;
        }

        setIsAdmin(true);

        // Fetch registrations for this course
        const registrationsRef = collection(db, 'Registrations');
        const q = query(registrationsRef, where('courseId', '==', courseId));
        const querySnapshot = await getDocs(q);

        const registrationsData: RegistrationData[] = [];
        
        // Process each registration and get the user details
        for (const doc of querySnapshot.docs) {
          const registration = {
            id: doc.id,
            ...doc.data()
          } as RegistrationData;

          // Get user details for each registration
          if (registration.userId) {
            const userDetails = await getUser(registration.userId);
            registration.userData = {
              firstName: userDetails?.firstName || '',
              lastName: userDetails?.lastName || '',
              email: userDetails?.email || ''
            };
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
    };

    checkAdminAndFetchData();
  }, [courseId]);

  // Don't show anything until we've verified the user is an admin
  if (!isAdmin && loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1A4782" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>חזרה</Text>
        </TouchableOpacity>

        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>
            רשימת נרשמים: {courseName}
          </Text>
          <Text style={styles.headerSubtitle}>
            סה"כ נרשמים: {registrations.length}
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1A4782" />
            <Text style={styles.loadingText}>טוען נרשמים...</Text>
          </View>
        ) : (
          <>
            {registrations.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>אין נרשמים לחוג זה עדיין</Text>
              </View>
            ) : (
              <View style={styles.registrationsContainer}>
                {/* Header row */}
                <View style={styles.tableHeader}>
                  <Text style={[styles.headerCell, styles.nameCell]}>שם</Text>
                  <Text style={[styles.headerCell, styles.emailCell]}>אימייל</Text>
                  <Text style={[styles.headerCell, styles.dateCell]}>תאריך הרשמה</Text>
                  <Text style={[styles.headerCell, styles.statusCell]}>סטטוס</Text>
                </View>

                {/* Registrations rows */}
                {registrations.map((registration, index) => {
                  // Format date if available
                  const date = registration.registrationDate?.toDate
                    ? registration.registrationDate.toDate().toLocaleDateString('he-IL')
                    : 'לא זמין';

                  return (
                    <View 
                      key={registration.id} 
                      style={[
                        styles.tableRow,
                        index % 2 === 0 ? styles.evenRow : styles.oddRow
                      ]}
                    >
                      <Text style={[styles.cell, styles.nameCell]}>
                        {registration.userData?.firstName} {registration.userData?.lastName}
                      </Text>
                      <Text style={[styles.cell, styles.emailCell]}>
                        {registration.userData?.email}
                      </Text>
                      <Text style={[styles.cell, styles.dateCell]}>
                        {date}
                      </Text>
                      <Text style={[styles.cell, styles.statusCell, 
                        registration.status === 'active' ? styles.activeStatus : styles.inactiveStatus
                      ]}>
                        {registration.status === 'active' ? 'פעיל' : 'לא פעיל'}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#1A4782',
    fontFamily: 'Heebo-Medium',
  },
  backButton: {
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: '#1A4782',
    fontFamily: 'Heebo-Medium',
  },
  headerContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Heebo-Bold',
    color: '#1A4782',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: 'Heebo-Medium',
    color: '#666',
    textAlign: 'center',
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Heebo-Medium',
    color: '#666',
  },
  registrationsContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1A4782',
    padding: 12,
  },
  headerCell: {
    color: 'white',
    fontFamily: 'Heebo-Bold',
    fontSize: 14,
    textAlign: 'right',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 12,
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
    flex: 3,
  },
  emailCell: {
    flex: 4,
  },
  dateCell: {
    flex: 2,
  },
  statusCell: {
    flex: 1,
    textAlign: 'center',
  },
  activeStatus: {
    color: '#4CAF50',
  },
  inactiveStatus: {
    color: '#F44336',
  }
});

export default RegistrationsList;
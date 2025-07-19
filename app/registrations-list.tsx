// app/registrations-list.tsx
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
// --- THIS IS THE FIX ---
// Added useLocalSearchParams to the import from expo-router
import { router, useFocusEffect, Stack, useLocalSearchParams } from 'expo-router';
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

const RegistrationsList = () => {
  const { courseId, courseName } = useLocalSearchParams();
  const [registrations, setRegistrations] = useState<RegistrationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredRegistrations, setFilteredRegistrations] = useState<RegistrationData[]>([]);

  const fetchRegistrations = useCallback(async () => {
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
      
      const registrationsRef = db.collection('Registrations');
      const q = registrationsRef.where('courseId', '==', courseId);
      const querySnapshot = await q.get();

      const registrationsData: RegistrationData[] = [];
      
      for (const doc of querySnapshot.docs) {
        const registration = {
          id: doc.id,
          ...doc.data()
        } as RegistrationData;
        
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
      setFilteredRegistrations(registrationsData);
    } catch (error) {
      console.error('Error fetching registrations:', error);
      Alert.alert('שגיאה', 'אירעה שגיאה בטעינת הנרשמים');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

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
              await db.collection("Registrations").doc(registrationId).delete();
              
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
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => handleDeleteRegistration(item.id, fullName)}
          >
            <Text style={styles.deleteButtonText}>מחק</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

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
      <View className="px-6 pt-5 pb-3">
            <View className="flex-row justify-start mb-4">
              <TouchableOpacity onPress={() => router.back()}>
                <Text className="text-primary text-2xl font-heebo-medium">חזרה</Text>
              </TouchableOpacity>
            </View>
      
          <View className="items-center">
            <Text className="text-3xl font-bold text-primary">
            נרשמים: {courseName}
            </Text>
            <Text className="text-lg font-medium text-gray-600">סה"כ: {registrations.length}</Text>
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
        {searchQuery.trim() !== "" && (
          <TouchableOpacity
            className="absolute left-11 top-1/2 transform -translate-y-1/2"
            onPress={() => setSearchQuery("")}
          >
            <Text className="text-gray-500 text-lg">×</Text>
          </TouchableOpacity>
        )}
      </View>

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
            {searchQuery.trim() !== "" ? "לא נמצאו תוצאות" : "אין נרשמים לחוג זה עדיין"}
          </Text>
        </View>
      ) : (
        <View style={styles.listContainer}>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, styles.nameCell]}>שם</Text>
            <Text style={[styles.headerCell, styles.phoneCell]}>טלפון</Text>
            <Text style={[styles.headerCell, styles.emailCell]}>אימייל</Text>
            <Text style={[styles.headerCell, styles.actionCell]}>פעולות</Text>
          </View>
          
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
    flex: 2.5,
  },
  phoneCell: {
    flex: 2,
  },
  emailCell: {
    flex: 3.5,
  },
  actionCell: { flex: 1.5, alignItems: 'center' },
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

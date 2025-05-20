// app/classes/[id].tsx
import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  Alert 
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { doc, getDoc, collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../FirebaseConfig';
import { getUser } from '../utils/firestoreUtils';

interface UserData {
  id: string;
  role?: string;
  // Add other user properties as needed
}

interface CourseData {
  name: string;
  description: string;
  location: string;
  schedule: string;
  maxCapacity: number;
  imageUrl?: string;
  createdAt?: any;
  createdBy?: string;
}

const ClassDetails = () => {
  const { id } = useLocalSearchParams();
  const [courseData, setCourseData] = useState<CourseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registrationsCount, setRegistrationsCount] = useState(0);
  const [registering, setRegistering] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        // Get course details
        const courseRef = doc(db, "courses", id as string);
        const courseSnap = await getDoc(courseRef);
        
        if (courseSnap.exists()) {
          setCourseData(courseSnap.data() as CourseData);
          
          // Check current user
          const user = auth.currentUser;
          if (user) {
            // Check if user is admin
            const userData = await getUser(user.uid) as UserData;
            setIsAdmin(userData?.role === "admin");
            
            // Check if current user is registered (only for non-admin users)
            if (userData?.role !== "admin") {
              const registrationsRef = collection(db, "Registrations");
              const q = query(
                registrationsRef, 
                where("userId", "==", user.uid),
                where("courseId", "==", id)
              );
              const querySnapshot = await getDocs(q);
              setIsRegistered(!querySnapshot.empty);
            }
          }
          
          // Get total registrations count
          const registrationsCountQuery = query(
            collection(db, "Registrations"),
            where("courseId", "==", id)
          );
          const registrationsSnapshot = await getDocs(registrationsCountQuery);
          setRegistrationsCount(registrationsSnapshot.size);
        } else {
          Alert.alert("שגיאה", "החוג לא נמצא");
          router.back();
        }
      } catch (error) {
        console.error("Error fetching class data:", error);
        Alert.alert("שגיאה", "אירעה שגיאה בטעינת פרטי החוג");
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [id]);

  const handleRegistration = async () => {
    if (isAdmin) {
      // Admin shouldn't register for courses
      return;
    }
    
    if (isRegistered) {
      // Already registered
      Alert.alert("הודעה", "כבר נרשמת לחוג זה");
      return;
    }
    
    // Check if class is full
    if (registrationsCount >= (courseData?.maxCapacity || 0)) {
      Alert.alert("מצטערים", "החוג מלא");
      return;
    }
    
    setRegistering(true);
    
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("שגיאה", "יש להתחבר כדי להירשם לחוג");
        router.replace('/login');
        return;
      }
      
      // Add registration to Firestore
      await addDoc(collection(db, "Registrations"), {
        userId: user.uid,
        courseId: id,
        registrationDate: serverTimestamp(),
        status: "active"
      });
      
      setIsRegistered(true);
      setRegistrationsCount(prev => prev + 1);
      Alert.alert("ההרשמה הושלמה", "נרשמת בהצלחה לחוג");
    } catch (error) {
      console.error("Error registering for class:", error);
      Alert.alert("שגיאה", "אירעה שגיאה בהרשמה לחוג");
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>טוען פרטי חוג...</Text>
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
          <Text style={styles.headerTitle}>{courseData?.name}</Text>
        </View>
        
        <View style={styles.infoContainer}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>תיאור</Text>
            <Text style={styles.infoValue}>{courseData?.description}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>מיקום</Text>
            <Text style={styles.infoValue}>{courseData?.location}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>לוח זמנים</Text>
            <Text style={styles.infoValue}>{courseData?.schedule}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>מקומות</Text>
            <Text style={styles.infoValue}>{registrationsCount}/{courseData?.maxCapacity}</Text>
          </View>
        </View>
        
        {/* Only show registration button for regular users, not for admins */}
        {!isAdmin && (
          <TouchableOpacity 
            style={[
              styles.registerButton, 
              isRegistered && styles.registeredButton,
              registrationsCount >= (courseData?.maxCapacity || 0) && styles.fullButton
            ]} 
            onPress={handleRegistration}
            disabled={isRegistered || registering || registrationsCount >= (courseData?.maxCapacity || 0)}
          >
            <Text style={styles.registerButtonText}>
              {isRegistered ? 'רשום כבר' : 
              registrationsCount >= (courseData?.maxCapacity || 0) ? 'החוג מלא' : 
              registering ? 'מבצע הרשמה...' : 'הרשם לחוג'}
            </Text>
          </TouchableOpacity>
        )}
        
        {/* For admin users, show button to view registered users */}
        {isAdmin && (
          <TouchableOpacity 
            style={styles.adminButton} 
            onPress={() => router.push({
              pathname: '../registrations-list',
              params: { courseId: id, courseName: courseData?.name }
            })}
          >
            <Text style={styles.registerButtonText}>
              צפה ברשימת הנרשמים
            </Text>
          </TouchableOpacity>
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 18,
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
    fontSize: 28,
    fontFamily: 'Heebo-Bold',
    color: '#1A4782',
    textAlign: 'center',
  },
  infoContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoItem: {
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 16,
    fontFamily: 'Heebo-Bold',
    color: '#1A4782',
    marginBottom: 4,
    textAlign: 'right',
  },
  infoValue: {
    fontSize: 16,
    fontFamily: 'Heebo-Regular',
    color: '#333',
    textAlign: 'right',
  },
  registerButton: {
    backgroundColor: '#1A4782',
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  registeredButton: {
    backgroundColor: '#4CAF50',
  },
  fullButton: {
    backgroundColor: '#9e9e9e',
  },
  adminButton: {
    backgroundColor: '#FF9800',
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Heebo-Bold',
  },
});

export default ClassDetails;
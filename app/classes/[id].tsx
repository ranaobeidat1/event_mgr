import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  Image,
  Dimensions,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
// --- CORRECTED IMPORTS ---
import { db, auth } from '../../FirebaseConfig';
import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { getUser, UserData } from '../utils/firestoreUtils';
import { useAuth } from '../_layout';
 import { FieldValue, Timestamp, GeoPoint } from '../../FirebaseConfig';
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CourseData {
  name: string;
  description: string;
  location: string;
  schedule: string;
  maxCapacity: number;
  imageUrl?: string[];
  payment?: string;
  createdAt?: FirebaseFirestoreTypes.Timestamp; // Use correct type
  createdBy?: string;
}

const ClassDetails = () => {
  const { isGuest } = useAuth();
  const { id } = useLocalSearchParams();
  const [courseData, setCourseData] = useState<CourseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registrationsCount, setRegistrationsCount] = useState(0);
  const [registering, setRegistering] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [userRegistrationId, setUserRegistrationId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const fetchCourseData = useCallback(async () => {
    try {
      if (!id) return;
      
      // --- CORRECTED FIRESTORE SYNTAX ---
      const courseRef = db.collection("courses").doc(id as string);
      const courseSnap = await courseRef.get();
      
      if (courseSnap.exists()) {
        setCourseData(courseSnap.data() as CourseData);
        
        if (isGuest) {
          setIsAdmin(false);
          setIsRegistered(false);
        } else {
          const user = auth.currentUser;
          if (user) {
            const userData = await getUser(user.uid) as UserData;
            setIsAdmin(userData?.role === "admin");
            
            if (userData) {
              setFirstName(userData.firstName || '');
              setLastName(userData.lastName || '');
            }
            
            if (userData?.role !== "admin") {
              const registrationsRef = db.collection("Registrations");
              const q = registrationsRef
                .where("userId", "==", user.uid)
                .where("courseId", "==", id);
              const querySnapshot = await q.get();
              setIsRegistered(!querySnapshot.empty);
              
              if (!querySnapshot.empty) {
                setUserRegistrationId(querySnapshot.docs[0].id);
              }
            }
          }
        }
        
        const registrationsCountQuery = db.collection("Registrations").where("courseId", "==", id);
        const registrationsSnapshot = await registrationsCountQuery.get();
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
  }, [id, isGuest]);

  useFocusEffect(
    useCallback(() => {
      fetchCourseData();
    }, [fetchCourseData])
  );

  const handleDeleteClass = async () => {
    try {
      setLoading(true);
      
      // --- CORRECTED FIRESTORE SYNTAX ---
      const registrationsRef = db.collection("Registrations");
      const q = registrationsRef.where("courseId", "==", id);
      const querySnapshot = await q.get();
      
      const batch = db.batch();
      
      querySnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      const courseRef = db.collection("courses").doc(id as string);
      batch.delete(courseRef);
      
      await batch.commit();
      
      Alert.alert("הצלחה", "החוג נמחק בהצלחה", [
        {
          text: "אישור",
          onPress: () => router.replace('/(tabs)/classes')
        }
      ]);
    } catch (error) {
      console.error("Error deleting class:", error);
      Alert.alert("שגיאה", "אירעה שגיאה במחיקת החוג");
      setLoading(false);
    }
  };

  const handleRegistration = async () => {
    if (isAdmin) {
      return;
    }
    
    if (isGuest) {
      Alert.alert(
        "דרושה הרשמה",
        "עליך להירשם כדי להצטרף לחוג. האם ברצונך לעבור למסך ההתחברות?",
        [
          { text: "לא תודה", style: "cancel" },
          {
            text: "כן, עבור להתחברות",
            onPress: () => {
              router.back();
              router.replace('/login'); 
            },
          },
        ]
      );
      return;
    }
    
    if (isRegistered) {
      Alert.alert("הודעה", "כבר השארת פרטים לחוג זה");
      return;
    }
    
    if (registrationsCount >= (courseData?.maxCapacity || 0)) {
      Alert.alert("מצטערים", "החוג מלא");
      return;
    }
    
    setShowRegistrationModal(true);
  };

  const handleRegistrationSubmit = async () => {
    if (!firstName.trim() || !lastName.trim() || !phoneNumber.trim()) {
      Alert.alert("שגיאה", "כל השדות הם שדות חובה");
      return;
    }
    
    const phoneRegex = /^0[0-9]{8,9}$/;
    if (!phoneRegex.test(phoneNumber)) {
      Alert.alert("שגיאה", "מספר טלפון לא תקין");
      return;
    }
    
    setRegistering(true);
    setShowRegistrationModal(false);
    
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("שגיאה", "יש להתחבר כדי להירשם לחוג");
        router.replace('/login');
        return;
      }
      
      // --- CORRECTED FIRESTORE SYNTAX ---
      const docRef = await db.collection("Registrations").add({
        userId: user.uid,
        courseId: id,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phoneNumber.trim(),
        email: user.email || '',
        registrationDate: FieldValue.serverTimestamp(),
        status: "active"
      });
      
      setIsRegistered(true);
      setUserRegistrationId(docRef.id);
      setRegistrationsCount(prev => prev + 1);
      Alert.alert("הצלחה", "הפרטים נשלחו בהצלחה");
    } catch (error) {
      console.error("Error registering for class:", error);
      Alert.alert("שגיאה", "אירעה שגיאה בהשארת פרטים לחוג");
    } finally {
      setRegistering(false);
    }
  };

  const handleCancelRegistration = async () => {
    Alert.alert(
      "מחק הפרטים",
      "האם אתה בטוח שברצונך למחק את הפרטים לחוג זה?",
      [
        { text: "לא", style: "cancel" },
        {
          text: "כן, מחק פרטים",
          style: "destructive",
          onPress: async () => {
            setCancelling(true);
            
            try {
              const user = auth.currentUser;
              if (!user) {
                Alert.alert("שגיאה", "יש להתחבר מחדש");
                router.replace('/login');
                return;
              }
              
              if (!userRegistrationId) {
                Alert.alert("שגיאה", "לא נמצאה הרשמה לביטול");
                return;
              }
              
              // --- CORRECTED FIRESTORE SYNTAX ---
              await db.collection("Registrations").doc(userRegistrationId).delete();
              
              setIsRegistered(false);
              setUserRegistrationId(null);
              setRegistrationsCount(prev => Math.max(0, prev - 1));
              
              Alert.alert("הצלחה", "הפרטים נמחקו בהצלחה");
            } catch (error) {
              console.error("Error cancelling registration:", error);
              Alert.alert("שגיאה", "אירעה שגיאה במחיקת הפרטים");
            } finally {
              setCancelling(false);
            }
          }
        }
      ]
    );
  };

  const openImageModal = (index: number) => {
    setCurrentImageIndex(index);
    setModalVisible(true);
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
    <>
      <Modal
        visible={showRegistrationModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRegistrationModal(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>טופס השארת פרטים לחוג</Text>
            
            <Text style={styles.inputLabel}>שם פרטי</Text>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="הזן שם פרטי"
              textAlign="right"
            />
            
            <Text style={styles.inputLabel}>שם משפחה</Text>
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder="הזן שם משפחה"
              textAlign="right"
            />
            
            <Text style={styles.inputLabel}>מספר טלפון</Text>
            <TextInput
              style={styles.input}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="050-1234567"
              keyboardType="phone-pad"
              textAlign="right"
            />
            
            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleRegistrationSubmit}
              >
                <Text style={styles.modalButtonText}>שלח פרטים</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelModalButton]}
                onPress={() => setShowRegistrationModal(false)}
              >
                <Text style={styles.modalButtonText}>ביטול</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={modalVisible}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setModalVisible(false)}
          >
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
          
          <ScrollView
            horizontal
            pagingEnabled
            contentOffset={{ x: SCREEN_WIDTH * currentImageIndex, y: 0 }}
            showsHorizontalScrollIndicator={false}
          >
            {courseData?.imageUrl?.map((uri, idx) => (
              <View key={idx} style={styles.fullScreenImageContainer}>
                <Image
                  source={{ uri }}
                  style={styles.fullScreenImage}
                  resizeMode="contain"
                />
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>

      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>חזרה</Text>
          </TouchableOpacity>
          
          <View style={styles.headerContainer}>
            <Text style={styles.headerTitle}>{courseData?.name}</Text>
          </View>

          {courseData?.imageUrl && courseData.imageUrl.length > 0 && (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.imageGallery}
            >
              {courseData.imageUrl.map((uri, index) => (
                <TouchableOpacity 
                  key={index} 
                  onPress={() => openImageModal(index)}
                  style={styles.imageContainer}
                >
                  <Image
                    source={{ uri }}
                    style={styles.galleryImage}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
          
          <View style={styles.infoContainer}>
            <Text style={styles.descriptionText}>{courseData?.description}</Text>
            <Text style={styles.infoLine}>
              <Text style={styles.infoLineLabel}>מיקום: </Text>{courseData?.location}
            </Text>
            <Text style={styles.infoLine}>
              <Text style={styles.infoLineLabel}>ימים: </Text>{courseData?.schedule}
            </Text>
            {courseData?.payment && (
              <Text style={styles.infoLine}>
                <Text style={styles.infoLineLabel}>תשלום: </Text>{courseData.payment}
              </Text>
            )}
            {isAdmin && (
              <Text style={styles.infoLine}>
                <Text style={styles.infoLineLabel}>מקומות: </Text>
                {registrationsCount}/{courseData?.maxCapacity}
              </Text>
            )}
          </View>  

          {!isAdmin && (
            <>
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
                  {isRegistered ? 'השארת פרטים כבר' : 
                  registrationsCount >= (courseData?.maxCapacity || 0) ? 'החוג מלא' : 
                  registering ? 'שולח פרטים...' : 'השארת פרטי'}
                </Text>
              </TouchableOpacity>
              
              {isRegistered && (
                <TouchableOpacity 
                  style={styles.cancelButton} 
                  onPress={handleCancelRegistration}
                  disabled={cancelling}
                >
                  <Text style={styles.registerButtonText}>
                    {cancelling ? 'מבטל הרשמה...' : 'מחק הפרטים'}
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}
          
          {isAdmin && (
            <>
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
              
              <TouchableOpacity 
                style={styles.editButton} 
                onPress={() => router.push({
                  pathname: '../edit-class',
                  params: { 
                    id: id,
                    name: courseData?.name,
                    description: courseData?.description,
                    location: courseData?.location,
                    schedule: courseData?.schedule,
                    maxCapacity: courseData?.maxCapacity,
                    payment: courseData?.payment || '',
                    existingImages: JSON.stringify(courseData?.imageUrl || [])
                  }
                })}
              >
                <Text style={styles.registerButtonText}>
                  ערוך חוג
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.deleteButton} 
                onPress={() => {
                  Alert.alert(
                    "מחיקת חוג",
                    "האם אתה בטוח שברצונך למחוק חוג זה? פעולה זו אינה ניתנת לביטול ותמחק את כל ההרשמות הקשורות.",
                    [
                      { text: "ביטול", style: "cancel" },
                      { 
                        text: "מחק", 
                        style: "destructive",
                        onPress: handleDeleteClass
                      }
                    ]
                  );
                }}
              >
                <Text style={styles.registerButtonText}>
                  מחק חוג
                </Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

// Styles are kept separate for clarity
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
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 21,
    color: '#1A4782',
    fontFamily: 'Heebo-Medium',
  },
  headerContainer: {
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: 32,
    fontFamily: 'Heebo-Bold',
    color: '#1A4782',
    textAlign: 'right',
  },
  imageGallery: {
    marginHorizontal: -20,
    marginBottom: 20,
    maxHeight: 300,
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: 300,
  },
  galleryImage: {
    width: SCREEN_WIDTH,
    height: 300, 
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 30,
  },
  fullScreenImageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  fullScreenImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  infoContainer: { 
    marginBottom: 24,
  },
  descriptionText: {
  fontSize: 20,
  fontFamily: 'Tahoma',
  color: '#1A4782',
  textAlign: 'right',
  lineHeight: 24,
  marginBottom: 16,
  },
  infoLine: {
    fontSize: 20,
    fontFamily: 'Tahoma',
    color: '#1F2937',
    textAlign: 'right',
    marginBottom: 8,
  },
  infoLineLabel: {
    fontFamily: 'Tahoma',
    color: '#1A4782',
  },
  registerButton: {
    backgroundColor: '#1A4782',
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  registeredButton: {
    backgroundColor: '#1A4782',
  },
  fullButton: {
    backgroundColor: '#1A4782',
  },
  adminButton: {
    backgroundColor: '#1A4782',
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
  editButton: {
    backgroundColor: '#1A4782',
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  deleteButton: {
    backgroundColor: '#1A4782',
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: 'Heebo-Bold',
    color: '#1A4782',
    textAlign: 'center',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontFamily: 'Heebo-Medium',
    color: '#1A4782',
    marginBottom: 5,
    textAlign: 'right',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 25,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Heebo-Regular',
    marginBottom: 15,
    backgroundColor: '#f5f5f5',
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 25,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  submitButton: {
    backgroundColor: '#1A4782',
  },
  cancelModalButton: {
    backgroundColor: '#1A4782',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 18,
    fontFamily: 'Heebo-Bold',
  },
  cancelButton: {
    backgroundColor: '#1A4782',
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
});

export default ClassDetails;

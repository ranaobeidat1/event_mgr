// app/utils/firestoreUtils.ts
import { 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    setDoc, 
    updateDoc, 
    deleteDoc, 
    query, 
    where 
  } from 'firebase/firestore';
  import { db } from '../../FirebaseConfig';
  
  // User interface to define the structure
  export interface UserData {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    role?: string;
  }

  // Get a single user by ID
  export const getUser = async (userId: string): Promise<UserData | null> => {
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as UserData;
    } else {
      return null;
    }
  };
  
  // Update user data
  export const updateUser = async (userId: string, userData: any) => {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, userData);
  };
  
  // Add other collection operations as needed, for example:
  
  // For the courses collection
  export const getCourses = async () => {
    const querySnapshot = await getDocs(collection(db, "courses"));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  };
  
  // For the alerts collection
  export const getAlerts = async (userId: string) => {
    const alertsRef = collection(db, "alerts");
    const q = query(alertsRef, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  };
  
  // For posts collection
  export const getPosts = async () => {
    const querySnapshot = await getDocs(collection(db, "posts"));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  };
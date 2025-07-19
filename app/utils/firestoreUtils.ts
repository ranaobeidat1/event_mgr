// app/utils/firestoreUtils.ts
// -----------------------------------------------------------------------------
// Centralised helpers for Firestore reads / writes + notification-helpers
// -----------------------------------------------------------------------------

// --- CORRECTED IMPORTS ---
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { db } from '../../FirebaseConfig';

// ──────────────────────────────────────────────────────────────────────────────
//  MODEL TYPES
// ──────────────────────────────────────────────────────────────────────────────
export interface UserData {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  role?: string;
  createdAt?: FirebaseFirestoreTypes.Timestamp; // Use correct type
  expoPushToken?: string;
}

export interface CourseData {
  id: string;
  name: string;
  logoUrl?: string;
}

export interface RegistrationData {
  id: string;
  userId: string;
  courseId: string;
  status: 'active' | 'cancelled';
  registrationDate: FirebaseFirestoreTypes.Timestamp; // Use correct type
}

// ──────────────────────────────────────────────────────────────────────────────
//  GENERIC USER HELPERS
// ──────────────────────────────────────────────────────────────────────────────
export const getUser = async (userId: string): Promise<UserData | null> => {
  // --- CORRECTED FIRESTORE SYNTAX ---
  const userRef = db.collection('users').doc(userId);
  const snap = await userRef.get();
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as UserData) : null;
};

export const createUser = async (userId: string, data: Partial<UserData>) =>
  // --- CORRECTED FIRESTORE SYNTAX ---
  db.collection('users').doc(userId).set(data, { merge: true });

export const updateUser = async (userId: string, data: Partial<UserData>) =>
  // --- CORRECTED FIRESTORE SYNTAX ---
  db.collection('users').doc(userId).update(data);

export const deleteUser = async (userId: string) =>
  // --- CORRECTED FIRESTORE SYNTAX ---
  db.collection('users').doc(userId).delete();

// ──────────────────────────────────────────────────────────────────────────────
//  COURSE / REGISTRATION QUERIES
// ──────────────────────────────────────────────────────────────────────────────
export const getCourses = async (): Promise<CourseData[]> => {
  // --- CORRECTED FIRESTORE SYNTAX ---
  const snap = await db.collection('courses').get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as CourseData));
};

export const getRegistrations = async (
  userId: string
): Promise<RegistrationData[]> => {
  // --- CORRECTED FIRESTORE SYNTAX ---
  const q = db.collection('Registrations').where('userId', '==', userId);
  const snap = await q.get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as RegistrationData));
};

// ──────────────────────────────────────────────────────────────────────────────
//  NOTIFICATION-FOCUSED HELPERS
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Returns all userIds with an *active* registration for the given course.
 */
export const getUserIdsRegisteredToCourse = async (
  courseId: string
): Promise<string[]> => {
  // --- CORRECTED FIRESTORE SYNTAX ---
  const q = db.collection('Registrations')
    .where('courseId', '==', courseId)
    .where('status', '==', 'active');

  const snap = await q.get();
  return snap.docs.map(d => d.data().userId as string);
};

/**
 * Converts an array of userIds to **valid Expo push tokens only**.
 */
export const getExpoTokensFromUserIds = async (
  userIds: string[]
): Promise<string[]> => {
  if (userIds.length === 0) {
    return [];
  }
  const tokens: string[] = [];
  // Firestore 'in' query is more efficient than multiple gets
  // Note: 'in' queries are limited to 30 items in the array. If you expect more, you'll need to batch this.
  const usersSnapshot = await db.collection('users').where(FirebaseFirestoreTypes.FieldPath.documentId(), 'in', userIds).get();
  
  usersSnapshot.forEach(uSnap => {
      const t = uSnap.data().expoPushToken as string | undefined;
      if (t) tokens.push(t);
  });

  return tokens;
};


/**
 * Returns every Expo token in the system (for general broadcasts).
 */
export const getExpoTokensOfAllUsers = async (): Promise<string[]> => {
  // --- CORRECTED FIRESTORE SYNTAX ---
  const snap = await db.collection('users').get();
  return snap.docs
    .map(d => d.data().expoPushToken as string | undefined)
    .filter((token): token is string => !!token); // Type guard for filtering
};

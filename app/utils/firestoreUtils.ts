// app/utils/firestoreUtils.ts
// -----------------------------------------------------------------------------
// Centralised helpers for Firestore reads / writes + notification-helpers
// -----------------------------------------------------------------------------

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
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
  createdAt?: Timestamp;
  expoPushToken?: string;            // <── NEW
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
  registrationDate: Timestamp;
}

// ──────────────────────────────────────────────────────────────────────────────
//  GENERIC USER HELPERS
// ──────────────────────────────────────────────────────────────────────────────
export const getUser = async (userId: string): Promise<UserData | null> => {
  const userRef = doc(db, 'users', userId);
  const snap   = await getDoc(userRef);
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as UserData) : null;
};

export const createUser = async (userId: string, data: Partial<UserData>) =>
  setDoc(doc(db, 'users', userId), data, { merge: true });

export const updateUser = async (userId: string, data: Partial<UserData>) =>
  updateDoc(doc(db, 'users', userId), data);

export const deleteUser = async (userId: string) =>
  deleteDoc(doc(db, 'users', userId));

// ──────────────────────────────────────────────────────────────────────────────
//  COURSE / REGISTRATION QUERIES
// ──────────────────────────────────────────────────────────────────────────────
export const getCourses = async (): Promise<CourseData[]> => {
  const snap = await getDocs(collection(db, 'courses'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as CourseData));
};

export const getRegistrations = async (
  userId: string
): Promise<RegistrationData[]> => {
  const q    = query(collection(db, 'Registrations'), where('userId', '==', userId));
  const snap = await getDocs(q);
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
  const regsRef = collection(db, 'Registrations');
  const q = query(
    regsRef,
    where('courseId', '==', courseId),
    where('status', '==', 'active')
  );

  const snap = await getDocs(q);
  return snap.docs.map(d => d.data().userId as string);
};

/**
 * Converts an array of userIds to **valid Expo push tokens only**.
 */
export const getExpoTokensFromUserIds = async (
  userIds: string[]
): Promise<string[]> => {
  const tokens: string[] = [];
  for (const uid of userIds) {
    const uSnap = await getDoc(doc(db, 'users', uid));
    if (uSnap.exists()) {
      const t = uSnap.data().expoPushToken as string | undefined;
      if (t) tokens.push(t);
    }
  }
  return tokens;
};

/**
 * Returns every Expo token in the system (for general broadcasts).
 */
export const getExpoTokensOfAllUsers = async (): Promise<string[]> => {
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs
    .map(d => d.data().expoPushToken as string | undefined)
    .filter(Boolean) as string[];
};

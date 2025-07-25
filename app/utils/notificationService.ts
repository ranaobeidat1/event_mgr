// app/utils/notificationService.ts
// -----------------------------------------------------------------------------
// 1) Registers the device and stores token in Firestore
// 2) Sends push notifications through Expo
// -----------------------------------------------------------------------------

import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import axios from 'axios';
import { Platform } from 'react-native';
import { auth, db } from '../../FirebaseConfig';
// REMOVED: Incorrect import from web SDK
// import { doc, updateDoc } from 'firebase/firestore';

// ──────────────────────────────────────────────────────────────────────────────
//  REGISTER + SAVE TOKEN
// ──────────────────────────────────────────────────────────────────────────────
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  // 1.  Android channel (visual config)
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1A4782',
    });
  }

  // 2.  Ask permission & get token (physical device only)
  if (!Device.isDevice) {
    console.log('Must use physical device for push notifications');
    return null;
  }

  const perms = await Notifications.getPermissionsAsync();
  if (perms.status !== 'granted') {
    const res = await Notifications.requestPermissionsAsync();
    if (res.status !== 'granted') {
      console.log('Permission for notifications NOT granted');
      return null;
    }
  }

  // Use the new project ID format if available
  try {
    const expoPushToken = await Notifications.getExpoPushTokenAsync({
        // Optionally add your EAS Project ID here if you have one
        // projectId: 'YOUR_EAS_PROJECT_ID',
    });
    token = expoPushToken.data;
    console.log('Expo push token:', token);
  } catch (e) {
      console.error("Failed to get Expo push token", e);
      return null;
  }


  // 3.  Save token to Firestore ⇢ users/{uid}.expoPushToken
  const user = auth.currentUser;
  if (user && token) {
    try {
      // --- THIS IS THE FIX ---
      // Use the correct native syntax to update the document
      await db.collection('users').doc(user.uid).update({ expoPushToken: token });
      console.log('Token saved for user', user.uid);
    } catch (err) {
      console.error('Could not save expo token:', err);
    }
  }

  return token;
}

export const sendPushNotifications = async (
  tokens: string[],
  title: string,
  body: string
) => {
  if (!tokens.length) return;

  const messages = tokens.map(to => ({ to, sound: 'default', title, body }));

  // Expo API = 100 msgs / request
  while (messages.length) {
    const chunk = messages.splice(0, 100);
    try {
        await axios.post('https://exp.host/--/api/v2/push/send', chunk, {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error("Error sending push notification chunk:", error);
    }
  }
};

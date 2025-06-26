import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { db } from '../../FirebaseConfig';
import { doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1A4782',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }
    
    try {
      // Get project ID from your app config
      const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
      
      if (!projectId) {
        console.error('Project ID not found in Constants');
        throw new Error('Project ID not found');
      }
      
      token = (await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      })).data;
      
      console.log('✅ Push token generated:', token);
    } catch (error) {
      console.error('❌ Error getting push token:', error);
      return null;
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}

// Save FCM token to Firestore for a user
export async function saveFCMTokenToFirestore(userId: string, token: string): Promise<void> {
  try {
    const tokenRef = doc(db, 'fcmTokens', userId);
    await setDoc(tokenRef, {
      token,
      userId,
      updatedAt: new Date(),
      platform: Platform.OS,
    }, { merge: true });
    
    console.log('✅ FCM token saved to Firestore');
  } catch (error) {
    console.error('❌ Error saving FCM token:', error);
  }
}

// Remove FCM token from Firestore (when user logs out)
export async function removeFCMTokenFromFirestore(userId: string): Promise<void> {
  try {
    const tokenRef = doc(db, 'fcmTokens', userId);
    await deleteDoc(tokenRef);
    
    console.log('✅ FCM token removed from Firestore');
  } catch (error) {
    console.error('❌ Error removing FCM token:', error);
  }
}

// Set up notification listeners
export function setupNotificationListeners() {
  const foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {
    console.log('📱 Notification received in foreground:', notification);
  });

  const backgroundSubscription = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('📱 Notification tapped:', response);
  });

  return {
    foregroundSubscription,
    backgroundSubscription,
  };
}

// Clean up notification listeners
export function cleanupNotificationListeners(subscriptions: any) {
  subscriptions.foregroundSubscription?.remove();
  subscriptions.backgroundSubscription?.remove();
}
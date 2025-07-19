// app/edit-user.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { db } from '../FirebaseConfig';

export default function EditUserScreen() {
  const router = useRouter();
  // 1. Gets the user data passed from the previous screen
  const params = useLocalSearchParams();
  const userId = params.userId as string;

  // 2. State to manage the form inputs, pre-filled with the user's current data
  const [firstName, setFirstName] = useState(params.firstName as string || '');
  const [lastName, setLastName] = useState(params.lastName as string || '');
  const [isSaving, setIsSaving] = useState(false);

  // 3. Function to save the changes to Firestore
  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('שדות ריקים', 'נא למלא שם פרטי ושם משפחה.');
      return;
    }
    if (!userId) {
      Alert.alert('שגיאה', 'מזהה משתמש חסר.');
      return;
    }

    setIsSaving(true);
    try {
      const userRef = db.collection('users').doc(userId);
      await userRef.update({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });

      Alert.alert('הצלחה', 'פרטי המשתמש עודכנו בהצלחה.');
      router.back(); // 4. Navigates back to the user list after saving
    } catch (error) {
      console.error("Error updating user:", error);
      Alert.alert('שגיאה', 'אירעה שגיאה בעדכון פרטי המשתמש.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'עריכת משתמש', headerShown: false }} />
      
      <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.backButton}>חזרה</Text>
          </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>עריכת משתמש</Text>
        <Text style={styles.emailText}>אימייל: {params.email}</Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>שם פרטי</Text>
          <TextInput
            value={firstName}
            onChangeText={setFirstName}
            placeholder="הזן שם פרטי"
            style={styles.input}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>שם משפחה</Text>
          <TextInput
            value={lastName}
            onChangeText={setLastName}
            placeholder="הזן שם משפחה"
            style={styles.input}
          />
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={isSaving}>
          {isSaving ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.saveButtonText}>שמור שינויים</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    direction: 'rtl',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  backButton: {
    color: '#1A4782',
    fontSize: 18,
    fontFamily: 'Heebo-Medium',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Heebo-Bold',
    color: '#1A4782',
    textAlign: 'center',
    marginBottom: 16,
  },
  emailText: {
    fontSize: 16,
    fontFamily: 'Heebo-Regular',
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Heebo-Medium',
    color: '#333',
    marginBottom: 8,
    textAlign: 'right',
  },
  input: {
    backgroundColor: '#f0f4f8',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Heebo-Regular',
    textAlign: 'right',
  },
  saveButton: {
    backgroundColor: '#1A4782',
    borderRadius: 8,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontFamily: 'Heebo-Bold',
  },
});
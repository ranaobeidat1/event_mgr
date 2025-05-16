import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { auth } from './FirebaseConfig'; // Adjust the path as necessary
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
} from 'firebase/auth';

export default function RegisterScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Redirect if already signed in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) router.replace('/');
    });
    return unsubscribe;
  }, []);

  const handleRegister = () => {
    setError('');
    createUserWithEmailAndPassword(auth, email.trim(), password)
      .then(() => {
        // Optionally update user profile with firstName/lastName via updateProfile
        router.replace('/');
      })
      .catch((err) => setError(err.message));
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
          <View className="m-5 p-4 border border-gray-300 rounded-lg items-center">
            <Image
              source={require('../assets/icons/logoIcon.png')}
              className="w-24 h-24 mb-3"
              resizeMode="contain"
            />
            

            <View className="w-full mb-4">
              <TextInput
                className="w-full bg-gray-100 rounded-full px-4 py-3 mb-3 text-base"
                placeholder="First Name"
                value={firstName}
                onChangeText={setFirstName}
              />
              <TextInput
                className="w-full bg-gray-100 rounded-full px-4 py-3 mb-3 text-base"
                placeholder="Last Name"
                value={lastName}
                onChangeText={setLastName}
              />
              <TextInput
                className="w-full bg-gray-100 rounded-full px-4 py-3 mb-3 text-base"
                placeholder="Email"
                value={email}
                keyboardType="email-address"
                autoCapitalize="none"
                onChangeText={setEmail}
              />
              <TextInput
                className="w-full bg-gray-100 rounded-full px-4 py-3 text-base"
                placeholder="Password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            {error ? (
              <Text className="text-red-500 mb-3 text-center">{error}</Text>
            ) : null}

            <TouchableOpacity
              onPress={handleRegister}
              className="w-full bg-blue-900 rounded-full py-3 mb-3 items-center"
            >
              <Text className="text-white text-lg font-Heebo-Bold">להירשם</Text>
            </TouchableOpacity>

          
           
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// app/login.tsx
import React, { useState } from 'react';
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
import { Link, router } from 'expo-router';

// ← Here’s the correct relative path:
import { auth } from './FirebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';

export default function LoginScreen() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState<string | null>(null);

  const handleLogin = () => {
    setError(null);
    signInWithEmailAndPassword(auth, email.trim(), password)
      .then(() => {
        // this will load app/(tabs)/index.tsx
          router.replace('/(tabs)');
      })
      .catch(err => setError(err.message));
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
          <View className="mx-5 p-6 bg-white border border-gray-200 rounded-xl shadow-md">
            <Image
              source={require('../assets/icons/logoIcon.png')}
              className="w-28 h-28 mx-auto mb-6"
              resizeMode="contain"
            />


            <View className="space-y-4">
              <TextInput
                className="w-full bg-gray-100 rounded-full px-5 py-3 text-base font-Heebo-Regular"
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#9CA3AF"
              />

              <TextInput
                className="w-full bg-gray-100 rounded-full px-5 py-3 text-base font-Heebo-Regular"
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {error ? (
              <Text className="mt-4 text-center text-red-500 font-Heebo-Regular">
                {error}
              </Text>
            ) : null}

            <TouchableOpacity
              onPress={handleLogin}
              className="mt-6 bg-blue-900 rounded-full px-6 py-3 items-center"
            >
              <Text className="text-white text-lg font-Heebo-Bold">התחברות</Text>
            </TouchableOpacity>

            <View className="flex-row justify-center mt-4">
              <Link href="/register" asChild>
                <TouchableOpacity>
                  <Text className="text-blue-900 font-Heebo-Bold text-base">
                  להרשמה
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

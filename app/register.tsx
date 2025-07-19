// app/register.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView, // Added SafeAreaView for consistency
} from 'react-native';
import { router } from 'expo-router';
// --- CORRECTED IMPORTS ---
import { auth, db } from '../FirebaseConfig';
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore'; // Correct type import
import { useAuth } from './_layout'; 
 import { FieldValue, Timestamp, GeoPoint } from '../FirebaseConfig';
export default function RegisterScreen() {
  const { setIsGuest } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const logoScale = useRef(new Animated.Value(0)).current;
  const fieldAnims = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  useEffect(() => {
    // --- CORRECTED AUTH LISTENER SYNTAX ---
    const unsub = auth.onAuthStateChanged(user => {
      if (user) router.replace('/(tabs)');
    });
    return unsub;
  }, []);

  useEffect(() => {
    Animated.sequence([
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 5,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.stagger(
        150,
        fieldAnims.map(anim =>
          Animated.timing(anim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          })
        )
      ),
    ]).start();
  }, []);

  const handleRegister = async () => {
    setError(null);
    if (!firstName || !lastName || !email || !password) {
      setError('All fields are required');
      return;
    }

    try {
      // --- CORRECTED AUTH & FIRESTORE SYNTAX ---
      const { user } = await auth.createUserWithEmailAndPassword(
        email.trim(),
        password
      );

      await db.collection('users').doc(user.uid).set({
        firstName,
        lastName,
        email,
        role: 'user',
        createdAt: FieldValue.serverTimestamp(), // Correct server timestamp
      });

      setIsGuest(false);
      router.replace('/(tabs)');
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('That email address is already in use!');
      } else if (err.code === 'auth/invalid-email') {
        setError('That email address is invalid!');
      } else {
        setError(err.message);
      }
      console.error('Registration error:', err);
    }
  };

  const interpY = (anim: Animated.Value) =>
    anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] });

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'flex-start',
            alignItems: 'center',
            paddingTop: 60,
            paddingHorizontal: 20,
          }}
        >
          <Animated.Image
            source={require('../assets/icons/logoIcon.png')}
            style={{
              width: 192,
              height: 192,
              marginBottom: 48,
              transform: [{ scale: logoScale }],
            }}
            resizeMode="contain"
          />

          <View className="w-full mt-10">
            <Animated.View
              style={{
                opacity: fieldAnims[0],
                transform: [{ translateY: interpY(fieldAnims[0]) }],
              }}
            >
              <TextInput
                className="w-full bg-gray-300 rounded-full px-5 py-3 text-lg font-Heebo-Regular mb-6 text-right"
                placeholder="שם פרטי"
                value={firstName}
                onChangeText={setFirstName}
                placeholderTextColor="#9CA3AF"
              />
            </Animated.View>

            <Animated.View
              style={{
                opacity: fieldAnims[1],
                transform: [{ translateY: interpY(fieldAnims[1]) }],
              }}
            >
              <TextInput
                className="w-full bg-gray-300 rounded-full px-5 py-3 text-lg font-Heebo-Regular mb-6 text-right"
                placeholder="שם משפחה"
                value={lastName}
                onChangeText={setLastName}
                placeholderTextColor="#9CA3AF"
              />
            </Animated.View>

            <Animated.View
              style={{
                opacity: fieldAnims[2],
                transform: [{ translateY: interpY(fieldAnims[2]) }],
              }}
            >
              <TextInput
                className="w-full bg-gray-300 rounded-full px-5 py-3 text-lg font-Heebo-Regular mb-6 text-right"
                placeholder="מייל"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#9CA3AF"
              />
            </Animated.View>

            <Animated.View
              style={{
                opacity: fieldAnims[3],
                transform: [{ translateY: interpY(fieldAnims[3]) }],
              }}
            >
              <TextInput
                className="w-full bg-gray-300 rounded-full px-5 py-3 text-lg font-Heebo-Regular text-right"
                placeholder="סיסמא"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholderTextColor="#9CA3AF"
              />
            </Animated.View>

            {error && (
              <Animated.View
                style={{
                  opacity: fieldAnims[3],
                  transform: [{ translateY: interpY(fieldAnims[3]) }],
                }}
              >
                <Text className="text-center text-red-500 font-Heebo-Regular mt-4">
                  {error}
                </Text>
              </Animated.View>
            )}

            <Animated.View
              style={{
                opacity: fieldAnims[4],
                transform: [{ translateY: interpY(fieldAnims[4]) }],
              }}
            >
              <TouchableOpacity
                onPress={handleRegister}
                className="mt-6 bg-primary rounded-full px-4 py-3 items-center w-2/3 self-center"
              >
                <Text className="text-white text-xl font-Heebo-Bold">
                  להירשם
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

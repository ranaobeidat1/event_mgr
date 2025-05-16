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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';
import { auth } from './FirebaseConfig';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
} from 'firebase/auth';

export default function RegisterScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [error, setError]         = useState<string | null>(null);

  // animation refs
  const logoScale = useRef(new Animated.Value(0)).current;
  const fieldAnims = [
    useRef(new Animated.Value(0)).current, // firstName
    useRef(new Animated.Value(0)).current, // lastName
    useRef(new Animated.Value(0)).current, // email
    useRef(new Animated.Value(0)).current, // password
    useRef(new Animated.Value(0)).current, // button
  ];

  // redirect if already signed in
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, user => {
      if (user) router.replace('/(tabs)');
    });
    return unsub;
  }, []);

  // run logo pop then stagger fields
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

  const handleRegister = () => {
    setError(null);
    createUserWithEmailAndPassword(auth, email.trim(), password)
      .then(() => router.replace('/(tabs)'))
      .catch(err => setError(err.message));
  };

  // helper for interpolated translateY
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
          {/* Animated logo */}
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

          {/* Inputs and button, each in its own Animated.View */}
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
                  opacity: fieldAnims[3], // fade error with password field
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

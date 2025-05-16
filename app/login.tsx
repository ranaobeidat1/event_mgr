// app/login.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';
import { auth } from './FirebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';

export default function LoginScreen() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState<string | null>(null);

  const logoAnim   = useRef(new Animated.Value(0)).current;
  const fieldAnims = [
    useRef(new Animated.Value(0)).current, // email
    useRef(new Animated.Value(0)).current, // password
    useRef(new Animated.Value(0)).current, // button + link
  ];

  const { height } = Dimensions.get('window');
  // initial offset so logo starts centered, then moves to its spot at top (~60px)
  const logoTranslateY = logoAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [height / 2 - 120, 0],
  });

  useEffect(() => {
    Animated.sequence([
      Animated.timing(logoAnim, {
        toValue: 1,
        duration: 700,
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

  const handleLogin = () => {
    setError(null);
    signInWithEmailAndPassword(auth, email.trim(), password)
      .then(() => router.replace('/(tabs)'))
      .catch(err => setError(err.message));
  };

  // helper for fields animation
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
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingTop: 60,
          }}
        >
          {/* logo pops in from center to top */}
          <Animated.Image
            source={require('../assets/icons/logoIcon.png')}
            style={{
              width: 192,
              height: 192,
              marginBottom: 48,
              transform: [{ translateY: logoTranslateY }],
            }}
            resizeMode="contain"
          />

          <View className="w-full">
            {/* email field */}
            <Animated.View
              style={{
                opacity: fieldAnims[0],
                transform: [{ translateY: interpY(fieldAnims[0]) }],
              }}
            >
              <TextInput
                className="w-full bg-gray-300 rounded-full px-5 py-3 text-lg font-Heebo-Regular mb-8 text-right"
                placeholder="מייל"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </Animated.View>

            {/* password field */}
            <Animated.View
              style={{
                opacity: fieldAnims[1],
                transform: [{ translateY: interpY(fieldAnims[1]) }],
              }}
            >
              <TextInput
                className="w-full bg-gray-300 rounded-full px-5 py-3 text-lg font-Heebo-Regular mb-8 text-right"
                placeholder="סיסמא"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </Animated.View>

            {/* button */}
            <Animated.View
              style={{
                opacity: fieldAnims[2],
                transform: [{ translateY: interpY(fieldAnims[2]) }],
              }}
            >
              {error && (
                <Text className="text-center text-red-500 font-Heebo-Regular mb-4">
                  {error}
                </Text>
              )}
              <TouchableOpacity
                onPress={handleLogin}
                className="bg-primary rounded-full px-4 py-3 items-center w-2/3 self-center mb-4"
              >
                <Text className="text-white text-xl font-Heebo-Bold">
                  התחברות
                </Text>
              </TouchableOpacity>
              <View className="flex-row justify-center">
                <Link href="/register" asChild>
                  <TouchableOpacity>
                    <Text className="text-primary font-Heebo-Bold text-lg">
                      להרשמה
                    </Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

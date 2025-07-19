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
  StyleSheet, // Import StyleSheet
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';
import { auth } from '../FirebaseConfig';

import { useAuth } from './_layout';
import { registerForPushNotificationsAsync } from './utils/notificationService';

export default function LoginScreen() {
  const { setIsGuest } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const logoAnim = useRef(new Animated.Value(0)).current;
  const fieldAnims = [
    useRef(new Animated.Value(0)).current, // email
    useRef(new Animated.Value(0)).current, // password
    useRef(new Animated.Value(0)).current, // button + links
    useRef(new Animated.Value(0)).current, // guest button
  ];

  const { height } = Dimensions.get('window');
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

  const handleLogin = async () => {
    setError(null);
    try {
      await auth.signInWithEmailAndPassword(email.trim(), password);
      await registerForPushNotificationsAsync();
      setIsGuest(false);
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleGuestLogin = () => {
    setIsGuest(true);
    router.replace('/(tabs)');
  };

  const interpY = (anim: Animated.Value) =>
    anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] });

  return (
    <SafeAreaView style={styles.flexContainer}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flexContainer}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingTop: 60,
          }}
        >
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

          <View style={styles.fullWidth}>
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

              {/* START: FIX FOR LINKS */}
              <View style={styles.linkContainer}>
                <Link href="/register" asChild>
                  <TouchableOpacity>
                    <Text style={styles.registerLink}>
                      להרשמה
                    </Text>
                  </TouchableOpacity>
                </Link>
              </View>
              <View style={[styles.linkContainer, { marginTop: 8 }]}>
                <Link href="/forgot-password" asChild>
                  <TouchableOpacity>
                    <Text style={styles.forgotPasswordLink}>
                      שכחת סיסמה?
                    </Text>
                  </TouchableOpacity>
                </Link>
              </View>
              {/* END: FIX FOR LINKS */}

            </Animated.View>

            {/* Guest Mode Button */}
            <Animated.View
              style={{
                opacity: fieldAnims[3],
                transform: [{ translateY: interpY(fieldAnims[3]) }],
                marginTop: 20,
              }}
            >
              <TouchableOpacity
                onPress={handleGuestLogin}
                className="bg-gray-400 rounded-full px-4 py-3 items-center w-2/3 self-center"
              >
                <Text className="text-white text-xl font-Heebo-Bold">
                  המשך כאורח
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Define styles using StyleSheet for better compatibility
const styles = StyleSheet.create({
  flexContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  fullWidth: {
    width: '100%',
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  // Style for the "Register" link
  registerLink: {
    color: '#1A4782', // Assuming a primary color, adjust if needed
    fontFamily: 'Heebo-Bold', // Make sure this font is loaded in your project
    fontSize: 18,
  },
  // Style for the "Forgot Password" link
  forgotPasswordLink: {
    color: '#1A4782', // Assuming a primary color, adjust if needed
    fontFamily: 'Heebo-Regular', // Make sure this font is loaded
    fontSize: 18,
    textDecorationLine: 'underline',
  },
});

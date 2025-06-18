import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { forgotPassword } from '../FirebaseConfig';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  // Animation refs
  const logoAnim = useRef(new Animated.Value(0)).current;
  const fieldsAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(logoAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true
      }),
      Animated.timing(fieldsAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true
      })
    ]).start();
  }, []);

  const handleReset = async () => {
    if (!email.trim()) {
      return Alert.alert('שגיאה', 'אנא הזן כתובת מייל תקפה.');
    }
    setLoading(true);
    try {
      await forgotPassword(email.trim());
      Alert.alert(
        'הודעת איפוס נשלחה',
        'בדוק את התיבה הנכנסת (ואם צריך, גם את הספאם).',
        [{ text: 'אישור', onPress: () => router.back() }]
      );
    } catch (err: any) {
      Alert.alert('שגיאה', err.message || 'משהו השתבש. אנא נסה שוב.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white justify-center p-6">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-center"
      >
        {/* Animated logo */}
        <Animated.View
          style={{
            opacity: logoAnim,
            alignItems: 'center',
            justifyContent: 'center',
            transform: [{ scale: logoAnim.interpolate({ inputRange: [0,1], outputRange: [0.8,1] }) }]
          }}
        >
          <Animated.Image
            source={require('../assets/icons/logoIcon.png')}
            style={{
              width: 192,
              height: 192,
              marginBottom: 48,
              alignSelf: 'center',
              transform: [{
          translateY: logoAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [40, 0]
          })
              }],
            }}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Animated fields container */}
        <Animated.View
          style={{ opacity: fieldsAnim, transform: [{ translateY: fieldsAnim.interpolate({ inputRange: [0,1], outputRange: [20,0] }) }] }}
        >
          <Text className="text-2xl font-Heebo-Bold text-center mb-6">
            שכחתי סיסמה
          </Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="הזן מייל"
            keyboardType="email-address"
            autoCapitalize="none"
            className="w-full bg-gray-200 rounded-full px-5 py-3 mb-4 text-base"
          />
          <TouchableOpacity
            onPress={handleReset}
            disabled={loading}
            className="bg-primary rounded-full px-4 py-3 items-center"
          >
            <Text className="text-white text-lg font-Heebo-Bold">
              {loading ? 'שולח...' : 'שלח קישור לאיפוס'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
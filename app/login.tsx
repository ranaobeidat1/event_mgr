import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Link, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // Add your login logic here
    console.log({ email, password });
    
    // Navigate to home screen after login
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.formContainer}>
            {/* Logo */}
            <Image
              source={require('../assets/icons/logoIcon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            
            {/* Hebrew Text below logo */}
            <Text style={styles.subtitleHebrew}>לאזרח הותיק בקהילה</Text>
            
            {/* Form Inputs */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              
              <TextInput
                style={styles.input}
                placeholder="password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
            
            {/* Login Button */}
            <TouchableOpacity 
              style={styles.loginButton}
              onPress={handleLogin}
            >
              <Text style={styles.loginButtonText}>התחברות</Text>
            </TouchableOpacity>
            
            {/* Registration Link */}
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>אין לך חשבון? </Text>
              <Link href="/register" asChild>
                <TouchableOpacity>
                  <Text style={styles.registerLink}>הירשם עכשיו</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  formContainer: {
    margin: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 10,
  },
  titleHebrew: {
    fontFamily: 'Heebo-Bold',
    fontSize: 24,
    textAlign: 'center',
    color: '#000',
  },
  subtitleHebrew: {
    fontFamily: 'Heebo-Regular',
    fontSize: 16,
    textAlign: 'center',
    color: '#555',
    marginBottom: 30,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    backgroundColor: '#f0e6e6',
    borderRadius: 25,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  loginButton: {
    width: '100%',
    backgroundColor: '#1A4782',
    borderRadius: 25,
    padding: 15,
    alignItems: 'center',
  },
  loginButtonText: {
    fontFamily: 'Heebo-Bold',
    color: 'white',
    fontSize: 18,
  },
  registerContainer: {
    flexDirection: 'row',
    marginTop: 20,
  },
  registerText: {
    fontFamily: 'Heebo-Regular',
    fontSize: 14,
  },
  registerLink: {
    fontFamily: 'Heebo-Bold',
    fontSize: 14,
    color: '#1A4782',
  },
});

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
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RegisterScreen() {
  // State for form inputs
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Function to handle registration
  const handleRegister = () => {
    // Add your registration logic here
    console.log({ firstName, lastName, email, password });
    
    // Navigate to home screen after registration
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
            <Text style={styles.titleHebrew}>עמותת סחלב</Text>
            <Text style={styles.subtitleHebrew}>לאזרח הותיק בקהילה</Text>
            
            {/* Form Inputs */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="first name"
                value={firstName}
                onChangeText={setFirstName}
              />
              
              <TextInput
                style={styles.input}
                placeholder="last name"
                value={lastName}
                onChangeText={setLastName}
              />
              
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
            
            {/* Register Button */}
            <TouchableOpacity 
              style={styles.registerButton}
              onPress={handleRegister}
            >
              <Text style={styles.registerButtonText}>להירשם</Text>
            </TouchableOpacity>
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    margin: 20,
    borderRadius: 8,
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
  registerButton: {
    width: '100%',
    backgroundColor: '#1A4782', // Using your app's primary color
    borderRadius: 25,
    padding: 15,
    alignItems: 'center',
  },
  registerButtonText: {
    fontFamily: 'Heebo-Bold',
    color: 'white',
    fontSize: 18,
  },
});
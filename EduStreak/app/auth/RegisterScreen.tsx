import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth } from '../../config/firebase'; // Adjust path as necessary

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const router = useRouter();

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      // Navigate to a different screen on successful registration, login or home
      router.replace('/auth/LoginScreen' as any); // Example navigation, redirect to login
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#ccc"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#ccc"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        placeholderTextColor="#ccc"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />
      <TouchableOpacity style={styles.buttonContainer} onPress={handleRegister}>
        <Text style={styles.buttonText}>Register</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.linkButton} onPress={() => router.push('/auth/LoginScreen' as any)}>
        <Text style={styles.linkButtonText}>Already have an account? Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#000', // Black background
  },
  title: {
    fontSize: 24,
    marginBottom: 24, // Increased margin
    textAlign: 'center',
    color: '#d05b52', // Updated color
  },
  input: {
    height: 40,
    borderColor: '#d05b52', // Updated color
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
    color: '#fff', // White text for input
    backgroundColor: '#333', // Darker background for input
  },
  buttonContainer: {
    backgroundColor: '#d05b52', // Updated color
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff', // White text for buttons
    fontSize: 16,
  },
  linkButton: {
    marginTop: 10,
    alignItems: 'center',
  },
  linkButtonText: {
    color: '#d05b52', // Updated color
    fontSize: 16,
  },
}); 
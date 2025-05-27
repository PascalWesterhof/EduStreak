import { useRouter } from 'expo-router';
import { sendPasswordResetEmail } from 'firebase/auth';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth } from '../../config/firebase'; // Adjust path as necessary

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const router = useRouter();

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert('Password Reset', 'If an account exists for this email, a password reset link has been sent.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (error: any) {
      // It's good practice not to reveal if an email exists or not for security reasons
      // So, show a generic message even if there's an error like 'auth/user-not-found'
      console.error('Forgot Password Error:', error);
      Alert.alert('Password Reset', 'If an account exists for this email, a password reset link has been sent.', [{ text: 'OK', onPress: () => router.back() }]);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reset Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your email"
        placeholderTextColor="#ccc"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TouchableOpacity style={styles.buttonContainer} onPress={handleResetPassword}>
        <Text style={styles.buttonText}>Send Reset Link</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.linkButton} onPress={() => router.back()}>
        <Text style={styles.linkButtonText}>Back to Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#000', // Matching LoginScreen style
  },
  title: {
    fontSize: 24,
    marginBottom: 24,
    textAlign: 'center',
    color: '#d05b52', // Matching LoginScreen style
  },
  input: {
    height: 40,
    borderColor: '#d05b52', // Matching LoginScreen style
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
    color: '#fff', // Matching LoginScreen style
    backgroundColor: '#333', // Matching LoginScreen style
  },
  buttonContainer: {
    backgroundColor: '#d05b52', // Matching LoginScreen style
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff', // Matching LoginScreen style
    fontSize: 16,
  },
  linkButton: {
    marginTop: 15,
    alignItems: 'center',
  },
  linkButtonText: {
    color: '#d05b52', // Matching LoginScreen style
    fontSize: 16,
  },
}); 
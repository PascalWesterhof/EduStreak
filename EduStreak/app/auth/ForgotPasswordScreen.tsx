import { useRouter } from 'expo-router';
import { sendPasswordResetEmail } from 'firebase/auth';
import React, { useState } from 'react';
import { Alert, Image, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
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
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Image source={require('../../assets/icons/back_arrow.png')} style={styles.backArrow} />
      </TouchableOpacity>
      <Image source={require('../../assets/images/splash_icon_edustreak.png')} style={styles.logo} />
      <Text style={styles.headerText}>FORGOT PASSWORD?</Text>
      <Text style={styles.subHeaderText}>
Enter your email address and we'll send you a link to reset your password.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Email address"
        placeholderTextColor="#A9A9A9"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TouchableOpacity style={styles.sendButton} onPress={handleResetPassword}>
        <Text style={styles.sendButtonText}>SEND RESET LINK</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.backToLoginLink} onPress={() => router.back()}>
        <Text style={styles.backToLoginLinkText}>Back to <Text style={styles.backToLoginLinkTextHighlight}>LOG IN</Text></Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? 40 : 60,
    paddingHorizontal: 20,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 45 : 65,
    left: 20,
    zIndex: 1,
    padding: 10,
  },
  backArrow: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  logo: {
    width: 180,
    height: 90,
    resizeMode: 'contain',
    marginBottom: 20,
    marginTop: 20,
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 10,
    textAlign: 'center',
  },
  subHeaderText: {
    fontSize: 14,
    color: '#666666', // Grey color for subtext
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20, // Add some horizontal padding for better text wrapping
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 20, // Increased margin
    width: '100%',
    fontSize: 16,
    color: '#000000',
  },
  sendButton: {
    backgroundColor: '#d05b52',
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 30,
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backToLoginLink: {
    marginTop: 10,
  },
  backToLoginLinkText: {
    color: '#000000',
    fontSize: 14,
    textAlign: 'center',
  },
  backToLoginLinkTextHighlight: {
    color: '#d05b52',
    fontWeight: 'bold',
  },
}); 
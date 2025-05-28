import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore'; // Added for Firestore
import React, { useState } from 'react';
import { Alert, Image, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../../config/firebase'; // Adjust path as necessary

export default function RegisterScreen() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const router = useRouter();

  const handleRegister = async () => {
    if (!displayName || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: displayName });

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        displayName: displayName,
        email: user.email,
        friends: [],
        friendRequestsSent: [],
        friendRequestsReceived: [],
        points: 0,
        currentStreak: 0,
        longestStreak: 0
      });

      Alert.alert('Registration Successful', 'Your account has been created.');
      router.replace('/auth/LoginScreen');
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Image source={require('../../assets/icons/back_arrow.png')} style={styles.backArrow} />
      </TouchableOpacity>
      <Image source={require('../../assets/images/splash_icon_edustreak.png')} style={styles.logo} />
      <Text style={styles.headerText}>CREATE ACCOUNT</Text>

      <TextInput
        style={styles.input}
        placeholder="Display Name"
        placeholderTextColor="#A9A9A9"
        value={displayName}
        onChangeText={setDisplayName}
        autoCapitalize="words"
      />
      <TextInput
        style={styles.input}
        placeholder="Email address"
        placeholderTextColor="#A9A9A9"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#A9A9A9"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        placeholderTextColor="#A9A9A9"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />
      <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
        <Text style={styles.registerButtonText}>CREATE ACCOUNT</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.loginLink} onPress={() => router.push('/auth/LoginScreen')}>
        <Text style={styles.loginLinkText}>Already have an account? <Text style={styles.loginLinkTextHighlight}>LOG IN</Text></Text>
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
    padding:10,
  },
  backArrow: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  logo: {
    width: 180, // Slightly smaller for register if needed
    height: 90,
    resizeMode: 'contain',
    marginBottom: 20,
    marginTop: 20,
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 30,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 15,
    width: '100%',
    fontSize: 16,
    color: '#000000',
  },
  registerButton: {
    backgroundColor: '#d05b52',
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 30,
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginLink: {
    marginTop: 10,
  },
  loginLinkText: {
    color: '#000000',
    fontSize: 14,
    textAlign: 'center',
  },
  loginLinkTextHighlight: {
    color: '#d05b52',
    fontWeight: 'bold',
  },
}); 
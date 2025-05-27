import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { useRouter } from 'expo-router';
import { GoogleAuthProvider, signInWithCredential, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import React, { useState } from 'react';
import { Alert, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth } from '../../config/firebase'; // Adjust path as necessary

// Configure Google Sign In only for native platforms
if (Platform.OS !== 'web') {
  GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_WEB_CLIENT_ID,
  });
}

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Navigate to a different screen on successful login, e.g., home
      router.replace('/(tabs)/' as any); // Navigate to the default tab screen
    } catch (error: any) {
      Alert.alert('Login Failed', error.message);
    }
  };

  const handleGoogleSignIn = async () => {
    if (Platform.OS === 'web') {
      try {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
        // Firebase auth state change will handle navigation via RootLayout
        router.replace('/(tabs)/' as any); // Or rely on RootLayout's auth listener
      } catch (error: any) {
        Alert.alert('Google Sign In Error (Web)', error.message);
        console.error('Google Sign In Error (Web): ', error);
      }
    } else {
      // Native Google Sign-In
      try {
        await GoogleSignin.hasPlayServices();
        const userInfo = await GoogleSignin.signIn();
        if (userInfo.idToken) {
          const googleCredential = GoogleAuthProvider.credential(userInfo.idToken);
          await signInWithCredential(auth, googleCredential);
          router.replace('/(tabs)/' as any);
        } else {
          Alert.alert('Google Sign In Error', 'No ID token present in Google User Info.');
        }
      } catch (error: any) {
        if (error.code === statusCodes.SIGN_IN_CANCELLED) {
          Alert.alert('Cancelled', 'Google Sign In was cancelled.');
        } else if (error.code === statusCodes.IN_PROGRESS) {
          Alert.alert('In Progress', 'Google Sign In is already in progress.');
        } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
          Alert.alert('Play Services Error', 'Google Play Services not available or outdated.');
        } else {
          Alert.alert('Google Sign In Error', error.message);
          console.error('Google Sign In Error: ', error);
        }
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
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
      <TouchableOpacity style={styles.buttonContainer} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.linkButton} onPress={() => router.push('/auth/ForgotPasswordScreen' as any)}>
        <Text style={styles.linkButtonText}>Forgot Password?</Text>
      </TouchableOpacity>
      <View style={styles.spacer} />
      <TouchableOpacity style={styles.buttonContainer} onPress={handleGoogleSignIn}>
        <Text style={styles.buttonText}>Sign in with Google</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.linkButton} onPress={() => router.push('/auth/RegisterScreen' as any)}>
        <Text style={styles.linkButtonText}>Don't have an account? Register</Text>
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
  spacer: {
    height: 10,
  }
}); 
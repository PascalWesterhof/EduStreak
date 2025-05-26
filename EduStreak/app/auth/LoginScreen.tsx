import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { useRouter } from 'expo-router';
import { GoogleAuthProvider, signInWithCredential, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import React, { useState } from 'react';
import { Alert, Button, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
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
      // Navigate to a different screen on successful login, (home)
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
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title="Login" onPress={handleLogin} />
      <View style={styles.spacer} />
      <Button title="Sign in with Google" onPress={handleGoogleSignIn} />
      <Button title="Don't have an account? Register" onPress={() => router.push('/auth/RegisterScreen' as any)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  spacer: {
    height: 10, 
  }
}); 
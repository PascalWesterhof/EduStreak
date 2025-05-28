import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { useRouter } from 'expo-router';
import { GoogleAuthProvider, signInWithCredential, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import React, { useState } from 'react';
import { Alert, Image, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
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
      router.replace('/(tabs)'); // Navigate to the default tab screen
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
        router.replace('/(tabs)'); // Or rely on RootLayout's auth listener
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
          router.replace('/(tabs)');
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
      <Image source={require('../../assets/images/splash_icon_edustreak.png')} style={styles.logo} />
      
      <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignIn}>
        <Image source={require('../../assets/images/google_icon.png')} style={styles.googleIcon} />
        <Text style={styles.googleButtonText}>CONTINUE WITH GOOGLE</Text>
      </TouchableOpacity>

      <Text style={styles.orText}>OR LOG IN WITH EMAIL</Text>

      <TextInput
        style={styles.input}
        placeholder="Email address"
        placeholderTextColor="#A9A9A9" // Light grey placeholder text
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#A9A9A9" // Light grey placeholder text
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
        <Text style={styles.loginButtonText}>LOG IN</Text>
      </TouchableOpacity>
      <View style={styles.linksContainer}>
        <TouchableOpacity onPress={() => router.push('/auth/ForgotPasswordScreen')}>
          <Text style={styles.linkText}>Forgot Password?</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/auth/RegisterScreen')}>
          <Text style={[styles.linkText, styles.signUpText]}>SIGN UP</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // White background
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? 40 : 60, // Adjust top padding for status bar
    paddingHorizontal: 20,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 45 : 65, // Adjust for status bar
    left: 20,
    zIndex: 1, // Ensure it's above other elements
    padding: 10, // Add padding for easier touch
  },
  backArrow: {
    width: 24, // Adjust as needed
    height: 24, // Adjust as needed
    resizeMode: 'contain',
  },
  logo: {
    width: 200, // Adjust as needed
    height: 100, // Adjust as needed
    resizeMode: 'contain',
    marginBottom: 40,
    marginTop: 20, // Add some margin top if back button is present
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0', // Light grey border
    borderRadius: 25, // Rounded corners
    paddingVertical: 12,
    paddingHorizontal: 30,
    marginBottom: 20,
    width: '100%',
    justifyContent: 'center',
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 15,
  },
  googleButtonText: {
    color: '#000000', // Black text
    fontSize: 14,
    fontWeight: 'bold',
  },
  orText: {
    color: '#d05b52', // Theme color
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#F5F5F5', // Light grey background
    borderRadius: 10, // Rounded corners
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 15,
    width: '100%',
    fontSize: 16,
    color: '#000000', // Black text
  },
  loginButton: {
    backgroundColor: '#d05b52', // Theme color
    borderRadius: 25, // Rounded corners
    paddingVertical: 15,
    paddingHorizontal: 30,
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  loginButtonText: {
    color: '#FFFFFF', // White text
    fontSize: 16,
    fontWeight: 'bold',
  },
  linksContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10, // Add some padding if needed
  },
  linkText: {
    color: '#000000', // Black text
    fontSize: 14,
    fontWeight: 'bold',
  },
  signUpText: {
    color: '#d05b52', // Theme color
  },
}); 
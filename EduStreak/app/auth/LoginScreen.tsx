import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { useRouter } from 'expo-router';
import { GoogleAuthProvider, signInWithCredential, signInWithEmailAndPassword, signInWithPopup, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import { Alert, Image, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../../config/firebase'; // Adjust path as necessary
import { colors } from '../../constants/Colors'; // Corrected path
import { globalStyles } from '../../styles/globalStyles';

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

  // Helper function to create or update user document in Firestore
  const createOrUpdateUserDocument = async (user: User) => {
    if (!user) return;
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      // Document doesn't exist, create it
      try {
        await setDoc(userDocRef, {
          uid: user.uid,
          displayName: user.displayName || user.email || "Anonymous User", // Fallback if displayName and email are null/empty
          email: user.email,
          photoURL: user.photoURL || null, // Store photoURL if available
          points: 0,
          currentStreak: 0,
          longestStreak: 0,
          lastCompletionDate: null, // Added this field
          bio: '' // Added default empty bio
        });
        console.log("Firestore user document created for Google user:", user.uid);
      } catch (error) {
        console.error("Error creating Firestore document for Google user:", error);
        Alert.alert("Error", "Could not save user profile data after Google Sign-In.");
      }
    } else {
      console.log("Firestore user document already exists for Google user:", user.uid);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Login Failed', error.message);
    }
  };

  const handleGoogleSignIn = async () => {
    if (Platform.OS === 'web') {
      try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        await createOrUpdateUserDocument(result.user); // Create/update Firestore doc
        router.replace('/(tabs)');
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
          const result = await signInWithCredential(auth, googleCredential);
          await createOrUpdateUserDocument(result.user); // Create/update Firestore doc
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
        <Text style={[globalStyles.bodyText, styles.googleButtonTextCustom]}>CONTINUE WITH GOOGLE</Text>
      </TouchableOpacity>

      <Text style={[globalStyles.mutedText, styles.orTextCustom]}>OR LOG IN WITH EMAIL</Text>

      <TextInput
        style={[globalStyles.inputBase, styles.inputCustom]}
        placeholder="Email address"
        placeholderTextColor={colors.placeholderText} 
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={[globalStyles.inputBase, styles.inputCustom]}
        placeholder="Password"
        placeholderTextColor={colors.placeholderText} 
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity style={[globalStyles.inputBase, styles.loginButtonCustom]} onPress={handleLogin}>
        <Text style={[globalStyles.bodyText, styles.loginButtonTextCustom]}>LOG IN</Text>
      </TouchableOpacity>
      <View style={styles.linksContainer}>
        <TouchableOpacity onPress={() => router.push('/auth/ForgotPasswordScreen')}>
          <Text style={[globalStyles.bodyText, styles.linkTextCustom]}>Forgot Password?</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/auth/RegisterScreen')}>
          <Text style={[globalStyles.bodyText, styles.linkTextCustom, styles.signUpTextCustom]}>SIGN UP</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white, // Use theme white for auth screens
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
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderColor,
    borderRadius: 25,
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
  googleButtonTextCustom: { // Based on globalStyles.bodyText
    color: colors.textDefault, // Was black
    fontWeight: 'bold',
  },
  orTextCustom: { // Based on globalStyles.mutedText
    color: colors.primary, // Theme color (was #d05b52)
    fontWeight: 'bold',
    marginBottom: 20,
  },
  inputCustom: { // Based on globalStyles.inputBase
    width: '100%', // Kept local
    borderRadius: 10, // Keep local override if different from inputBase
    paddingVertical: 15, // Keep local override
    paddingHorizontal: 20, // Keep local override
    marginBottom: 15, // Keep local override
  },
  loginButtonCustom: { // Based on globalStyles.inputBase for shape, then color override
    backgroundColor: colors.primary, // Theme color (was #d05b52)
    alignItems: 'center',
    width: '100%',
    borderRadius: 25, // Specific for this button
    paddingVertical: 15, // Specific for this button
    paddingHorizontal: 30, // Specific for this button
    marginBottom: 20, // Specific for this button
  },
  loginButtonTextCustom: { // Based on globalStyles.bodyText
    color: colors.white, // White text
    fontWeight: 'bold',
  },
  linksContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10, // Add some padding if needed
  },
  linkTextCustom: { // Based on globalStyles.bodyText
    color: colors.textDefault, // Was black
    fontWeight: 'bold',
  },
  signUpTextCustom: { // Extends linkTextCustom
    color: colors.primary, // Theme color (was #d05b52)
  },
}); 
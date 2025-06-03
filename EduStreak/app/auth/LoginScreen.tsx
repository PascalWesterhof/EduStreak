import { statusCodes } from '@react-native-google-signin/google-signin';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colors } from '../../constants/Colors';
import { signInWithEmail, signInWithGoogle as signInWithGoogleService } from '../../services/authService';
import { globalStyles } from '../../styles/globalStyles';

/**
 * `LoginScreen` provides options for user authentication.
 * It allows users to sign in using their email and password or via Google Sign-In.
 * Successful authentication navigates the user to the main application area (tabs).
 * It handles various states including input validation and error messages from the auth services.
 */
export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  /**
   * Handles the email and password login process.
   * Validates that both email and password fields are filled.
   * Calls the `signInWithEmail` service function from `authService`.
   * On successful login, navigates the user to the main app section ('/(tabs)').
   * Displays an alert if login fails.
   */
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }
    try {
      await signInWithEmail(email, password);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Login Failed', error.message);
    }
  };

  /**
   * Handles the Google Sign-In process.
   * Calls the `signInWithGoogleService` function from `authService` which encapsulates
   * platform-specific Google Sign-In logic and user document creation/update.
   * On successful sign-in, navigates the user to the main app section ('/(tabs)').
   * Handles specific Google Sign-In errors (e.g., cancelled, in progress, play services unavailable)
   * as well as generic errors, displaying appropriate alerts to the user.
   */
  const handleGoogleSignIn = async () => {
    try {
      // Platform-specific logic is now within the service
      // The service also handles ensureUserDocument
      await signInWithGoogleService(); 
      console.log("[LoginScreen] Google Sign-In successful via service, navigating to tabs.");
      router.replace('/(tabs)');
    } catch (error: any) {
      // Handle specific Google Sign-In errors returned by the service
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        Alert.alert('Cancelled', 'Google Sign In was cancelled.');
      } else if (error.code === statusCodes.IN_PROGRESS && Platform.OS !== 'web') { // IN_PROGRESS is native only
        Alert.alert('In Progress', 'Google Sign In is already in progress.');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE && Platform.OS !== 'web') { // PLAY_SERVICES_NOT_AVAILABLE is native only
        Alert.alert('Play Services Error', 'Google Play Services not available or outdated.');
      } else {
        // Generic error from service (could be network, no ID token, or re-thrown Firebase error)
        Alert.alert('Google Sign In Error', error.message || "An unexpected error occurred during Google Sign-In.");
        console.error('[LoginScreen] Google Sign In Error: ', error);
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
    color: colors.primary,
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
    backgroundColor: colors.primary, 
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
    color: colors.primary, 
  },
}); 
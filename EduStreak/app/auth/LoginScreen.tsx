import { statusCodes } from '@react-native-google-signin/google-signin';
import { useRouter } from 'expo-router';
import React, { useState, useMemo } from 'react';
import { Image, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { signInWithEmail, signInWithGoogle as signInWithGoogleService } from '../../functions/authService';
import { getGlobalStyles } from '../../styles/globalStyles';
import { showAlert } from "../../utils/showAlert";
import { authScreenFixedColors, ColorScheme } from '../../constants/Colors';

const getScreenStyles = (colors: ColorScheme, appGlobalStyles: any) => StyleSheet.create({
   container: {
      flex: 1,
      backgroundColor: colors.background,
      alignItems: 'center',
      paddingTop: Platform.OS === 'android' ? 40 : 60,
      paddingHorizontal: 20,
    },
    logo: {
      width: 200,
      height: 100,
      resizeMode: 'contain',
      marginBottom: 40,
      marginTop: 20,
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
    googleButtonTextCustom: {
      color: colors.textDefault,
      fontWeight: 'bold',
    },
    orTextCustom: {
      color: colors.primary,
      fontWeight: 'bold',
      marginBottom: 20,
    },
    inputCustom: {
      width: '100%',
      borderRadius: 10,
      paddingVertical: 15,
      paddingHorizontal: 20,
      marginBottom: 15,
    },
    loginButtonCustom: {
      backgroundColor: colors.primary,
      alignItems: 'center',
      width: '100%',
      borderRadius: 25,
      paddingVertical: 15,
      paddingHorizontal: 30,
      marginBottom: 20,
    },
    loginButtonTextCustom: {
      color: colors.primaryText,
      fontWeight: 'bold',
    },
    linksContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
      paddingHorizontal: 10,
    },
    linkTextCustom: {
      color: colors.textDefault,
      fontWeight: 'bold',
    },
    signUpTextCustom: {
      color: colors.primary,
    },
  });

/**
 * `LoginScreen` provides options for user authentication.
 * It allows users to sign in using their email and password or via Google Sign-In.
 * Successful authentication navigates the user to the main application area (tabs).
 * It handles various states including input validation and error messages from the auth services.
 */
export default function LoginScreen() {
   const fixedAuthColors = authScreenFixedColors;
   const appGlobalStyles = useMemo(() => getGlobalStyles(fixedAuthColors), []); // fixedAuthColors is stabiel, dus [] dependency is ok
   const screenStyles = useMemo(() => getScreenStyles(fixedAuthColors, appGlobalStyles), [appGlobalStyles]); // afhankelijk van appGlobalStyles omdat het wordt meegegeven

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
      showAlert('Error', 'Please enter both email and password.');
      return;
    }
    try {
      await signInWithEmail(email, password);
      router.replace('/');
    } catch (error: any) {
      showAlert('Login Failed', error.message);
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
      router.replace('/');
    } catch (error: any) {
      // Handle specific Google Sign-In errors returned by the service
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        showAlert('Cancelled', 'Google Sign In was cancelled.');
      } else if (error.code === statusCodes.IN_PROGRESS && Platform.OS !== 'web') { // IN_PROGRESS is native only
        showAlert('In Progress', 'Google Sign In is already in progress.');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE && Platform.OS !== 'web') { // PLAY_SERVICES_NOT_AVAILABLE is native only
        showAlert('Play Services Error', 'Google Play Services not available or outdated.');
      } else {
        // Generic error from service (could be network, no ID token, or re-thrown Firebase error)
        showAlert('Google Sign In Error', error.message || "An unexpected error occurred during Google Sign-In.");
        console.error('[LoginScreen] Google Sign In Error: ', error);
      }
    }
  };

  return (
   <View style={screenStyles.container}>
        <Image source={require('../../assets/images/splash_icon_edustreak.png')} style={screenStyles.logo} />

        <TouchableOpacity style={screenStyles.googleButton} onPress={handleGoogleSignIn}>
          <Image source={require('../../assets/images/google-logo.png')} style={screenStyles.googleIcon} />
          <Text style={[appGlobalStyles.bodyText, screenStyles.googleButtonTextCustom]}>CONTINUE WITH GOOGLE</Text>
        </TouchableOpacity>

        <Text style={[appGlobalStyles.mutedText, screenStyles.orTextCustom]}>OR LOG IN WITH EMAIL</Text>

        <TextInput
          style={[appGlobalStyles.inputBase, screenStyles.inputCustom]}
          placeholder="Email address"
          placeholderTextColor={fixedAuthColors.placeholderText}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={[appGlobalStyles.inputBase, screenStyles.inputCustom]}
          placeholder="Password"
          placeholderTextColor={fixedAuthColors.placeholderText}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TouchableOpacity style={[appGlobalStyles.inputBase, screenStyles.loginButtonCustom]} onPress={handleLogin}>
          <Text style={[appGlobalStyles.bodyText, screenStyles.loginButtonTextCustom]}>LOG IN</Text>
        </TouchableOpacity>
        <View style={screenStyles.linksContainer}>
          <TouchableOpacity onPress={() => router.push('/auth/ForgotPasswordScreen')}>
            <Text style={[appGlobalStyles.bodyText, screenStyles.linkTextCustom]}>Forgot Password?</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/auth/RegisterScreen')}>
            <Text style={[appGlobalStyles.bodyText, screenStyles.linkTextCustom, screenStyles.signUpTextCustom]}>SIGN UP</Text>
          </TouchableOpacity>
        </View>
      </View>
  );
};

import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colors } from '../../constants/Colors';
import { resetPassword } from '../../services/authService'; // Import the service function
import { globalStyles } from '../../styles/globalStyles';

/**
 * `ForgotPasswordScreen` allows users to request a password reset link.
 * Users enter their email address, and upon submission, a request is made to the
 * `authService.resetPassword` function. A generic confirmation message is shown
 * regardless of whether an account exists for the provided email, to prevent
 * account enumeration.
 */
export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const router = useRouter();

  /**
   * Handles the password reset process.
   * It validates that an email is entered, then calls the `resetPassword` service function.
   * Displays a generic alert message to the user indicating that if an account exists,
   * a reset link has been sent. This is done for security reasons to avoid confirming
   * whether an email address is registered.
   * Navigates back to the previous screen after the alert.
   */
  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address.');
      return;
    }
    try {
      // Call the service function for password reset
      await resetPassword(email);
      // Show generic success/info message regardless of actual outcome, as per original logic
      Alert.alert('Password Reset', 'If an account exists for this email, a password reset link has been sent.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (error: any) {
      // Show a generic message even if there's an error from the service
      console.error('[ForgotPasswordScreen] Password Reset Error:', error.message);
      Alert.alert('Password Reset', 'If an account exists for this email, a password reset link has been sent.', [{ text: 'OK', onPress: () => router.back() }]);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Image source={require('../../assets/icons/back_arrow.png')} style={styles.backArrow} />
      </TouchableOpacity>
      <Image source={require('../../assets/images/splash_icon_edustreak.png')} style={styles.logo} />
      <Text style={[globalStyles.titleText, styles.headerTextCustom]}>FORGOT PASSWORD?</Text>
      <Text style={[globalStyles.bodyText, styles.subHeaderTextCustom]}>
Enter your email address and we'll send you a link to reset your password.
      </Text>

      <TextInput
        style={[globalStyles.inputBase, styles.inputCustom]}
        placeholder="Email address"
        placeholderTextColor={colors.placeholderText}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TouchableOpacity style={[globalStyles.inputBase, styles.sendButtonCustom]} onPress={handleResetPassword}>
        <Text style={[globalStyles.bodyText, styles.sendButtonTextCustom]}>SEND RESET LINK</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.backToLoginLinkContainer} onPress={() => router.back()}>
        <Text style={[globalStyles.bodyText, styles.backToLoginLinkTextCustom]}>Back to <Text style={styles.backToLoginLinkTextHighlightCustom}>LOG IN</Text></Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
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
    tintColor: colors.textDefault,
  },
  logo: {
    width: 180,
    height: 90,
    resizeMode: 'contain',
    marginBottom: 20,
    marginTop: 20,
  },
  headerTextCustom: {
    color: colors.textDefault,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subHeaderTextCustom: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20, 
  },
  inputCustom: {
    width: '100%',
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sendButtonCustom: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    width: '100%',
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 30,
    marginBottom: 20,
  },
  sendButtonTextCustom: {
    color: colors.white,
    fontWeight: 'bold',
  },
  backToLoginLinkContainer: {
    marginTop: 10,
  },
  backToLoginLinkTextCustom: {
    color: colors.textDefault,
    textAlign: 'center',
  },
  backToLoginLinkTextHighlightCustom: {
    color: colors.primary,
    fontWeight: 'bold',
  },
}); 
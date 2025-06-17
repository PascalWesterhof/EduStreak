import { useRouter } from 'expo-router';
import React, { useState, useMemo } from 'react'; // Add useMemo
import { Image, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { authScreenFixedColors, ColorScheme } from '../../constants/Colors'; // Importeer authScreenFixedColors and ColorScheme
import { resetPassword } from '../../functions/authService'; // Import the service function
import { getGlobalStyles } from '../../styles/globalStyles';
import { showAlert } from "../../utils/showAlert";

const getScreenStyles = (colors: ColorScheme, appGlobalStyles: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background, // << use 'colors'
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
    tintColor: colors.textDefault, // << use 'colors'
  },
  logo: {
    width: 180,
    height: 90,
    resizeMode: 'contain',
    marginBottom: 20,
    marginTop: 20,
  },
  headerTextCustom: {
    textAlign: 'center',
    // Color comes from appGlobalStyles.titleText, which uses 'colors.textDefault'
  },
  subHeaderTextCustom: {
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
    // Color comes from appGlobalStyles.bodyText, which uses 'colors.textSecondary'
  },
  inputCustom: {
    ...appGlobalStyles.inputBase, // inputBase uses 'colors' through getGlobalStyles
    width: '100%',
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sendButtonCustom: {
    backgroundColor: colors.primary, // << use 'colors'
    alignItems: 'center',
    width: '100%',
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 30,
    marginBottom: 20,
  },
  sendButtonTextCustom: {
    color: colors.primaryText, // << use 'colors'
    fontWeight: 'bold',
  },
  backToLoginLinkContainer: {
    marginTop: 10,
  },
  backToLoginLinkTextCustom: {
    textAlign: 'center',
    // Color comes from appGlobalStyles.bodyText
  },
  backToLoginLinkTextHighlightCustom: {
    color: colors.primary, // << use 'colors'
    fontWeight: 'bold',
  },
});

/**
 * `ForgotPasswordScreen` allows users to request a password reset link.
 * Users enter their email address, and upon submission, a request is made to the
 * `authService.resetPassword` function. A generic confirmation message is shown
 * regardless of whether an account exists for the provided email, to prevent
 * account enumeration.
 */
export default function ForgotPasswordScreen() {
// Gebruik de geïmporteerde vaste kleuren voor authenticatie
  const fixedAuthColors = authScreenFixedColors;

  // Genereer globale stijlen met deze vaste kleuren
  const appGlobalStyles = useMemo(() => getGlobalStyles(fixedAuthColors), []); // Dependency array kan leeg zijn
  // Genereer schermstijlen met de vaste kleuren en de daarop gebaseerde globale stijlen
  const screenStyles = useMemo(() => getScreenStyles(fixedAuthColors, appGlobalStyles), [appGlobalStyles]);

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
      showAlert('Error', 'Please enter your email address.');
      return;
    }
    try {
      // Call the service function for password reset
      await resetPassword(email);
      // Show generic success/info message regardless of actual outcome, as per original logic
      showAlert('Password Reset', 'If an account exists for this email, a password reset link has been sent.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (error: any) {
      // Show a generic message even if there's an error from the service
      console.error('[ForgotPasswordScreen] Password Reset Error:', error.message);
      showAlert('Password Reset', 'If an account exists for this email, a password reset link has been sent.', [{ text: 'OK', onPress: () => router.back() }]);
    }
  };

  return (
    <View style={screenStyles.container}>
          <TouchableOpacity onPress={() => router.back()} style={screenStyles.backButton}>
            <Image source={require('../../assets/icons/back_arrow.png')} style={screenStyles.backArrow} />
          </TouchableOpacity>
          <Image source={require('../../assets/images/splash_icon_edustreak.png')} style={screenStyles.logo} />

          <Text style={[appGlobalStyles.titleText, screenStyles.headerTextCustom]}>FORGOT PASSWORD?</Text>
          <Text style={[appGlobalStyles.bodyText, screenStyles.subHeaderTextCustom]}>
            Enter your email address and we'll send you a link to reset your password.
          </Text>

          <TextInput
            style={screenStyles.inputCustom} // inputCustom gebruikt nu fixedAuthColors via getScreenStyles
            placeholder="Email address"
            placeholderTextColor={fixedAuthColors.placeholderText} // << Gebruik fixedAuthColors
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TouchableOpacity style={screenStyles.sendButtonCustom} onPress={handleResetPassword}>
            <Text style={[appGlobalStyles.bodyText, screenStyles.sendButtonTextCustom]}>SEND RESET LINK</Text>
          </TouchableOpacity>
          <TouchableOpacity style={screenStyles.backToLoginLinkContainer} onPress={() => router.back()}>
            <Text style={[appGlobalStyles.bodyText, screenStyles.backToLoginLinkTextCustom]}>
              Back to <Text style={screenStyles.backToLoginLinkTextHighlightCustom}>LOG IN</Text>
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

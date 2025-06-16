import { useRouter } from 'expo-router';
// Firebase Auth imports to be removed or reduced:
// import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import React, { useState } from 'react';
import { Alert, Image, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth } from '../../config/firebase';
import { authScreenFixedColors, ColorScheme } from '../../constants/Colors'; // << NIEUW
import { getGlobalStyles } from '../../styles/globalStyles';           // << NIEUW
import { changeUserPassword, reauthenticateCurrentUser } from '../../functions/authService'; // Import service functions
import { showAlert } from '../../utils/showAlert';

const getScreenStyles = (colors: ColorScheme, appGlobalStyles: any) => StyleSheet.create({
  // De bestaande stijlen van 'styles' hieronder, maar met 'colors' argument
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: colors.headerBackground, // << THEMA (of colors.background als header dezelfde kleur heeft)
  },
  backButton: {
    padding: 10,
  },
  backArrowIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
    tintColor: colors.primaryText, // << THEMA (of colors.textDefault afhankelijk van je header achtergrond)
  },
  headerTitleCustom: { // Wordt gebruikt SAMEN MET appGlobalStyles.headerText
    color: colors.primaryText, // << THEMA (of colors.textDefault)
    fontSize: 20,
  },
  headerRightPlaceholder: {
    width: 24 + 20,
  },
  containerCustom: { // Wordt gebruikt SAMEN MET appGlobalStyles.contentContainer
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexGrow: 1,
    // backgroundColor: colors.background, // Komt van appGlobalStyles.screenContainer
  },
  labelCustom: { // Wordt gebruikt SAMEN MET appGlobalStyles.bodyText
    color: colors.textDefault, // << THEMA (was colors.primaryText, aanpassen aan je vaste witte thema)
    marginBottom: 8,
    marginTop: 15,
    fontSize: 16,
  },
  input: { // Dit lijkt een unieke stijl, dus we maken het thematisch
    backgroundColor: colors.inputBackground, // << THEMA (was #DE7460)
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    color: colors.textInput, // << THEMA (was #fff)
    marginBottom: 10,
    // Overweeg borderColor: colors.inputBorder als je dat wilt toevoegen
  },
  button: { // Basis knopstijl
    backgroundColor: colors.primary, // << THEMA (was #DE7460)
    borderRadius: 6,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: colors.primaryText, // << THEMA (was #fff)
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButton: { // Specifieke override voor de save knop
    backgroundColor: colors.accent, // << THEMA (was #C0573F, gebruik je accentkleur of een variant van primary)
    // Als je wilt dat deze donkerder is dan de primaire knop, definieer dan een specifieke kleur
    // in authScreenFixedColors, bijv. colors.primaryDark
  },
  buttonDisabled: {
    backgroundColor: colors.textMuted, // << THEMA (was #A0A0A0, gebruik een gedempte kleur)
    opacity: 0.7, // Opaciteit kan blijven
  },
  errorTextCustom: { // Wordt gebruikt SAMEN MET appGlobalStyles.errorText
    color: colors.error, // << THEMA (was #FFBABA, gebruik je standaard error kleur)
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 5,
    fontSize: 14,
  }
});

/**
 * `ChangePasswordScreen` allows users who signed up with email and password to change their password.
 * It requires the user to enter their current password, a new password, and confirm the new password.
 * It performs validation for all fields, including password strength and matching new passwords.
 * Re-authentication and password update operations are handled by `authService` functions.
 * Users signed in via external providers (e.g., Google) are informed that they cannot change their password here.
 */
export default function ChangePasswordScreen() {
  const router = useRouter();
  const fixedAuthColors = authScreenFixedColors;
  // Genereer globale stijlen met deze vaste kleuren
  const appGlobalStyles = useMemo(() => getGlobalStyles(fixedAuthColors), []);
  // Genereer schermstijlen met de vaste kleuren en de daarop gebaseerde globale stijlen
  const screenStyles = useMemo(() => getScreenStyles(fixedAuthColors, appGlobalStyles), [appGlobalStyles]);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  /**
   * Handles the password update process.
   * It performs several client-side validations:
   * - Checks if the user is signed in with an email/password provider.
   * - Ensures all fields are filled.
   * - Verifies that the new password and confirmation match.
   * - Checks for minimum password length.
   * If validations pass, it calls `reauthenticateCurrentUser` and then `changeUserPassword`
   * from the `authService` to update the password.
   * Displays success or error alerts based on the outcome.
   */
  const handleUpdatePassword = async () => {
    setError(''); 
    const user = auth.currentUser;

    // Initial checks remain in component
    if (user) {
      const passwordProvider = user.providerData.find(p => p.providerId === 'password');
      if (!passwordProvider) {
        Alert.alert(
          'Invalid Action',
          'Password changes are not applicable for accounts signed in via external providers (e.g., Google).',
          [{ text: 'OK', onPress: () => router.back() }]
        );
        return;
      }
    }
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      showAlert('Missing Fields', 'Please fill in all password fields.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      showAlert('Password Mismatch', 'New passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      showAlert('Weak Password', 'New password should be at least 6 characters long.');
      return;
    }
    if (!user) { // Should ideally not happen if passwordProvider check passed
      showAlert('Error', 'User not found. Please re-login.');
      return;
    }

    setIsSaving(true);
    try {
      // Use service to re-authenticate
      await reauthenticateCurrentUser(user, currentPassword);
      console.log("[ChangePasswordScreen] User re-authenticated successfully via service.");

      // Use service to update password
      await changeUserPassword(user, newPassword);
      console.log("[ChangePasswordScreen] User password updated successfully via service.");

      showAlert('Success', 'Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');

    } catch (err: any) {
      console.error("[ChangePasswordScreen] Change Password Error via service:", err);
      let errorMessage = 'Failed to update password. Please try again.';
      if (err.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect current password. Please try again.';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'The new password is too weak. Please choose a stronger password.';
      } else if (err.code === 'auth/requires-recent-login') {
        errorMessage = 'This operation is sensitive and requires recent authentication. Please log out and log back in.';
      }
      // Consider also specific errors from our service if we threw custom ones
      else if (err.message === "User or user email not available for re-authentication.") {
        errorMessage = "Could not verify your current session. Please re-login.";
      }
      setError(errorMessage);
      showAlert('Error', errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  return (
      // Gebruik appGlobalStyles.screenContainer voor de basis achtergrondkleur
      <SafeAreaView style={appGlobalStyles.screenContainer}>
        {/* Voor een vast licht thema, is dark-content meestal correct */}
        <StatusBar barStyle="dark-content" />

        {/* Gebruik screenStyles voor de header en andere elementen */}
        <View style={screenStyles.headerContainer}>
          <TouchableOpacity onPress={() => router.back()} style={screenStyles.backButton}>
            <Image source={require('../../assets/icons/back_arrow.png')} style={screenStyles.backArrowIcon} />
          </TouchableOpacity>
          <Text style={[appGlobalStyles.headerText, screenStyles.headerTitleCustom]}>Change Password</Text>
          <View style={screenStyles.headerRightPlaceholder} />
        </View>

        {/* appGlobalStyles.contentContainer kan hier ook worden gebruikt als basis voor de ScrollView content */}
        <ScrollView contentContainerStyle={[appGlobalStyles.contentContainer, screenStyles.containerCustom]}>
          <Text style={[appGlobalStyles.bodyText, screenStyles.labelCustom]}>Current Password</Text>
          <TextInput
            style={screenStyles.input} // << Gebruik screenStyles
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Enter your current password"
            placeholderTextColor={fixedAuthColors.placeholderText} // << Gebruik fixedAuthColors
            secureTextEntry
            editable={!isSaving}
          />

          <Text style={[appGlobalStyles.bodyText, screenStyles.labelCustom]}>New Password</Text>
          <TextInput
            style={screenStyles.input} // << Gebruik screenStyles
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Enter your new password (min. 6 characters)"
            placeholderTextColor={fixedAuthColors.placeholderText} // << Gebruik fixedAuthColors
            secureTextEntry
            editable={!isSaving}
          />

          <Text style={[appGlobalStyles.bodyText, screenStyles.labelCustom]}>Confirm New Password</Text>
          <TextInput
            style={screenStyles.input} // << Gebruik screenStyles
            value={confirmNewPassword}
            onChangeText={setConfirmNewPassword}
            placeholder="Confirm your new password"
            placeholderTextColor={fixedAuthColors.placeholderText} // << Gebruik fixedAuthColors
            secureTextEntry
            editable={!isSaving}
          />

          {error ? <Text style={[appGlobalStyles.errorText, screenStyles.errorTextCustom]}>{error}</Text> : null}

          <TouchableOpacity
            style={[screenStyles.button, screenStyles.saveButton, isSaving && screenStyles.buttonDisabled]}
            onPress={handleUpdatePassword}
            disabled={isSaving}
          >
            <Text style={screenStyles.buttonText}>{isSaving ? 'Updating...' : 'Update Password'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }
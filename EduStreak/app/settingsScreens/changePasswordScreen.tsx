import { useRouter } from 'expo-router';
// Firebase Auth imports to be removed or reduced:
// import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import React, { useMemo, useState } from 'react';
import { Alert, Image, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth } from '../../config/firebase';
import { authScreenFixedColors, ColorScheme } from '../../constants/Colors'; // << NIEUW
import { changeUserPassword, reauthenticateCurrentUser } from '../../functions/authService'; // Import service functions
import { getGlobalStyles } from '../../styles/globalStyles'; // << NIEUW
import { showAlert } from '../../utils/showAlert';

/**
 * This function creates all the style rules for this screen.
 * It's a "fixed theme" screen, so it uses the `authScreenFixedColors`.
 * @param colors - An object containing all the colors for the auth theme.
 * @param appGlobalStyles - The global styles object, passed in for reference.
 * @returns A StyleSheet object containing all the styles for this component.
 */
const getScreenStyles = (colors: ColorScheme, appGlobalStyles: any) => StyleSheet.create({
  // Style for the header section at the top of the screen.
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  // Style for the tappable area of the back button.
  backButton: {
    padding: 10,
  },
  // Style for the back arrow image itself.
  backArrowIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
    tintColor: colors.primaryText, // << THEMA (of colors.textDefault afhankelijk van je header achtergrond)
  },
  // Custom style for the header title, used with a global style.
  headerTitleCustom: { // Wordt gebruikt SAMEN MET appGlobalStyles.headerText
    color: colors.primaryText, // << THEMA (of colors.textDefault)
    fontSize: 20,
  },
  // A placeholder view on the right to perfectly center the title.
  headerRightPlaceholder: {
    width: 24 + 20,
  },
  // Custom style for the main content container.
  containerCustom: { // Wordt gebruikt SAMEN MET appGlobalStyles.contentContainer
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexGrow: 1,
    // backgroundColor: colors.background, // Komt van appGlobalStyles.screenContainer
  },
  // Custom style for a text label above an input field.
  labelCustom: { // Wordt gebruikt SAMEN MET appGlobalStyles.bodyText
    color: colors.textDefault, // << THEMA (was colors.primaryText, aanpassen aan je vaste witte thema)
    marginBottom: 8,
    marginTop: 15,
    fontSize: 16,
  },
  // Style for a text input field.
  input: { // Dit lijkt een unieke stijl, dus we maken het thematisch
    backgroundColor: colors.inputBackground, // << THEMA (was #DE7460)
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    color: colors.textInput, // << THEMA (was #fff)
    marginBottom: 10,
    // Overweeg borderColor: colors.inputBorder als je dat wilt toevoegen
  },
  // General style for a button.
  button: { // Basis knopstijl
    backgroundColor: colors.primary, // << THEMA (was #DE7460)
    borderRadius: 6,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  // Style for the text inside a button.
  buttonText: {
    color: colors.primaryText, // << THEMA (was #fff)
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Specific style for the "Update Password" button.
  saveButton: { // Specifieke override voor de save knop
    backgroundColor: colors.accent, // << THEMA (was #C0573F, gebruik je accentkleur of een variant van primary)
    // Als je wilt dat deze donkerder is dan de primaire knop, definieer dan een specifieke kleur
    // in authScreenFixedColors, bijv. colors.primaryDark
  },
  // Style to apply to a button when it is disabled.
  buttonDisabled: {
    backgroundColor: colors.textMuted, // << THEMA (was #A0A0A0, gebruik een gedempte kleur)
    opacity: 0.7, // Opaciteit kan blijven
  },
  // Custom style for the error message text.
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
  // --- Hooks for Navigation, Theming, and State Management ---
  const router = useRouter();
  // We use a fixed set of colors for all authentication-related screens for a consistent look.
  const fixedAuthColors = authScreenFixedColors;
  // `useMemo` prevents the global styles from being recalculated on every render, which is a performance optimization.
  const appGlobalStyles = useMemo(() => getGlobalStyles(fixedAuthColors), []);
  // We also memoize the screen-specific styles.
  const screenStyles = useMemo(() => getScreenStyles(fixedAuthColors, appGlobalStyles), [appGlobalStyles]);
  
  // --- State Variables ---
  // `useState` creates state variables. When their value is updated, the component re-renders.
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false); // To show a "Updating..." state on the button.
  const [error, setError] = useState(''); // To store and display any error messages.

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
    setError(''); // Clear any previous errors.
    const user = auth.currentUser;

    // --- Pre-update validation ---
    // 1. Check if the user is logged in and if they used a password to sign up.
    if (user) {
      const passwordProvider = user.providerData.find(p => p.providerId === 'password');
      if (!passwordProvider) {
        // If not a password user (e.g., signed in with Google), show an alert and stop.
        Alert.alert(
          'Invalid Action',
          'Password changes are not applicable for accounts signed in via external providers (e.g., Google).',
          [{ text: 'OK', onPress: () => router.back() }]
        );
        return;
      }
    }
    // 2. Check if any fields are empty.
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      showAlert('Missing Fields', 'Please fill in all password fields.');
      return;
    }
    // 3. Check if the new passwords match.
    if (newPassword !== confirmNewPassword) {
      showAlert('Password Mismatch', 'New passwords do not match.');
      return;
    }
    // 4. Check for minimum password length.
    if (newPassword.length < 6) {
      showAlert('Weak Password', 'New password should be at least 6 characters long.');
      return;
    }
    // 5. Final check for user existence before proceeding.
    if (!user) { // Should ideally not happen if passwordProvider check passed
      showAlert('Error', 'User not found. Please re-login.');
      return;
    }

    setIsSaving(true); // Put the UI into a "saving" state.
    try {
      // This is a sensitive operation, so Firebase requires the user to re-authenticate first.
      // We call our service function to handle this.
      await reauthenticateCurrentUser(user, currentPassword);
      console.log("[ChangePasswordScreen] User re-authenticated successfully via service.");

      // After successful re-authentication, we can update the password.
      // We call our service function to handle this.
      await changeUserPassword(user, newPassword);
      console.log("[ChangePasswordScreen] User password updated successfully via service.");

      // On success, show a confirmation message and clear the input fields.
      showAlert('Success', 'Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');

    } catch (err: any) {
      // If any step in the `try` block fails, we land here.
      console.error("[ChangePasswordScreen] Change Password Error via service:", err);
      let errorMessage = 'Failed to update password. Please try again.';
      // Provide more specific feedback based on the error code from Firebase.
      if (err.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect current password. Please try again.';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'The new password is too weak. Please choose a stronger password.';
      } else if (err.code === 'auth/requires-recent-login') {
        errorMessage = 'This operation is sensitive and requires recent authentication. Please log out and log back in.';
      }
      // Check for custom errors from our own service.
      else if (err.message === "User or user email not available for re-authentication.") {
        errorMessage = "Could not verify your current session. Please re-login.";
      }
      // Display the error message to the user.
      setError(errorMessage);
      showAlert('Error', errorMessage);
    } finally {
      // This block always runs, on success or failure.
      setIsSaving(false); // Reset the UI state.
    }
  };

  // --- Render Logic ---
  // The component returns JSX, which describes what the UI should look like.
  return (
      // SafeAreaView ensures content doesn't overlap with system UI like the status bar or notches.
      <SafeAreaView style={[appGlobalStyles.screenContainer, { backgroundColor: '#D1624A' }]}>
        {/* StatusBar controls the appearance of the system status bar. 'dark-content' makes the text/icons dark. */}
        <StatusBar barStyle="dark-content" />

        {/* Custom Header */}
        <View style={screenStyles.headerContainer}>
          <TouchableOpacity onPress={() => router.push('/settingsScreens/profileSettings')} style={screenStyles.backButton}>
            <Image source={require('../../assets/icons/back_arrow.png')} style={screenStyles.backArrowIcon} />
          </TouchableOpacity>
          <Text style={[appGlobalStyles.headerText, screenStyles.headerTitleCustom]}>Change Password</Text>
          <View style={screenStyles.headerRightPlaceholder} />
        </View>

        {/* The main content area is a ScrollView to allow scrolling on smaller screens. */}
        <ScrollView contentContainerStyle={[appGlobalStyles.contentContainer, screenStyles.containerCustom, { backgroundColor: '#D1624A', flexGrow: 1 }]}> 
          {/* Current Password Input */}
          <Text style={[appGlobalStyles.bodyText, screenStyles.labelCustom]}>Current Password</Text>
          <TextInput
            style={screenStyles.input} // << Gebruik screenStyles
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Enter your current password"
            placeholderTextColor={fixedAuthColors.placeholderText} // << Gebruik fixedAuthColors
            secureTextEntry // Hides the password input.
            editable={!isSaving} // Prevent editing while saving.
          />

          {/* New Password Input */}
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

          {/* Confirm New Password Input */}
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

          {/* Conditionally render the error message if one exists. */}
          {error ? <Text style={[appGlobalStyles.errorText, screenStyles.errorTextCustom]}>{error}</Text> : null}

          {/* Update Password Button */}
          <TouchableOpacity
            style={[screenStyles.button, screenStyles.saveButton, isSaving && screenStyles.buttonDisabled]}
            onPress={handleUpdatePassword}
            disabled={isSaving} // Disable button while saving.
          >
            {/* Show different text on the button depending on the `isSaving` state. */}
            <Text style={screenStyles.buttonText}>{isSaving ? 'Updating...' : 'Update Password'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }
import { useRouter } from 'expo-router';
import { User } from 'firebase/auth';
import React, { useEffect, useMemo, useState } from 'react'; // << Voeg useMemo toe
import { Image, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth } from '../../config/firebase';
import { authScreenFixedColors, ColorScheme } from '../../constants/Colors'; // << NIEUW
import { deleteUserAccount } from '../../functions/authService';
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
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: colors.headerBackground, // << THEMA
  },
  backButton: {
    padding: 10,
  },
  backArrowIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
    tintColor: colors.primaryText, // << THEMA
  },
  headerTitleCustom: { // Wordt gebruikt SAMEN MET appGlobalStyles.headerText
    color: colors.primaryText, // << THEMA
    fontSize: 20,
  },
  headerRightPlaceholder: {
    width: 24 + 20,
  },
  containerCustom: { // Wordt gebruikt SAMEN MET appGlobalStyles.contentContainer
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexGrow: 1,
    justifyContent: 'center',
    // backgroundColor: colors.background, // Komt van appGlobalStyles.screenContainer
  },
  warningTitleCustom: { // Wordt gebruikt SAMEN MET appGlobalStyles.headerText (of een nieuwe globalStyle.warningTitle)
    color: colors.warning, // << THEMA (was #FFD700, gebruik je thema warning kleur)
    textAlign: 'center',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  warningTextCustom: { // Wordt gebruikt SAMEN MET appGlobalStyles.bodyText
    color: colors.textDefault, // << THEMA (was colors.primaryText, gebruik je standaard tekstkleur)
    textAlign: 'center',
    marginBottom: 25,
    fontSize: 16,
    lineHeight: 22,
  },
  infoTextCustom: { // Wordt gebruikt SAMEN MET appGlobalStyles.mutedText
    color: colors.textMuted, // << THEMA (was #F0F0F0)
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
    fontSize: 14,
  },
  labelCustom: { // Wordt gebruikt SAMEN MET appGlobalStyles.bodyText
    color: colors.textDefault, // << THEMA (was colors.primaryText)
    marginBottom: 8,
    marginTop: 15,
    fontSize: 16,
  },
  input: {
    backgroundColor: colors.inputBackground, // << THEMA (was #DE7460)
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    color: colors.textInput, // << THEMA (was #fff)
    marginBottom: 20,
  },
  button: {
    backgroundColor: colors.primary, // << THEMA (was #DE7460)
    borderRadius: 6,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  deleteConfirmButton: {
    backgroundColor: colors.error, // << THEMA (was #B22222, gebruik je thema error/destructieve actie kleur)
  },
  buttonDisabled: {
    backgroundColor: colors.textMuted, // << THEMA (gebruik een gedempte kleur)
    opacity: 0.7, // Behoud opacity of maak het onderdeel van de themakleur voor disabled state
  },
  buttonText: {
    color: colors.primaryText, // << THEMA (was #fff)
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorTextCustom: { // Wordt gebruikt SAMEN MET appGlobalStyles.errorText
    color: colors.error, // << THEMA (was #FFBABA)
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 10,
    fontSize: 14,
  }
});

/**
 * `DeleteAccountScreen` provides the interface for users to permanently delete their account.
 * It displays a prominent warning about the irreversibility of the action.
 * For users signed in with email/password, it requires them to enter their current password
 * as a confirmation step before proceeding with deletion.
 * For users signed in via external providers, it informs them about the nature of their sign-in.
 * The actual account deletion logic (including re-authentication if needed, Firestore data removal,
 * and Firebase Auth user deletion) is handled by the `deleteUserAccount` function in `authService`.
 */
export default function DeleteAccountScreen() {
  const router = useRouter();
  const fixedAuthColors = authScreenFixedColors;
  const appGlobalStyles = useMemo(() => getGlobalStyles(fixedAuthColors), []);
  const screenStyles = useMemo(() => getScreenStyles(fixedAuthColors, appGlobalStyles), [appGlobalStyles]);
  const [currentPassword, setCurrentPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [isPasswordProviderUser, setIsPasswordProviderUser] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  /**
   * This `useEffect` hook runs once when the component mounts.
   * It checks the currently logged-in user to determine if they signed up using an
   * email and password, which is needed to conditionally show the password input field.
   */
  useEffect(() => {
    const user = auth.currentUser;
    setCurrentUser(user);
    if (user) {
      // We check the user's provider data to see if 'password' is one of them.
      const passwordProvider = user.providerData.find(p => p.providerId === 'password');
      // The '!!' converts the result to a boolean (true if found, false if not) and sets our state.
      setIsPasswordProviderUser(!!passwordProvider);
    }
  }, []);

  /**
   * Handles the final confirmation and execution of the account deletion process.
   * Ensures the user is logged in. If the user signed up with email/password,
   * it validates that the current password has been entered.
   * Calls the `deleteUserAccount` service function, passing the current user object and
   * the current password (if applicable).
   * Displays success or error alerts based on the outcome from the service.
   * On successful deletion, navigates the user to the Login screen.
   */
  const handleConfirmDelete = async () => {
    setError(''); // Clear any previous errors.

    // --- Pre-delete validation ---
    if (!currentUser) {
      showAlert('Error', 'User not found. Please re-login.');
      router.replace('/auth/LoginScreen'); // Redirect to login if no user is found.
      return;
    }

    // If it's a password user, they MUST provide their password to confirm.
    if (isPasswordProviderUser && !currentPassword) {
      showAlert('Password Required', 'Please enter your current password to confirm account deletion.');
      return;
    }

    setIsProcessing(true); // Put the UI into a "deleting" state.
    try {
      // The service function needs the password only if it's a password user.
      const passwordForService = isPasswordProviderUser && currentPassword ? currentPassword : undefined;
      // Call the service function to handle all deletion steps (re-auth, delete data, delete auth user).
      await deleteUserAccount(currentUser, passwordForService);

      // On success, show a final confirmation message and redirect to the login screen.
      showAlert('Account Deleted', 'Your account and associated data have been permanently deleted.');
      router.replace('/auth/LoginScreen');

    } catch (err: any) {
      // If any step in the `try` block fails, we land here.
      console.error("[DeleteAccountScreen] Delete Account Error via service:", err);
      let errorMessage = 'Failed to delete account. Please try again.';
      // Provide more specific feedback based on the error code from Firebase.
      if (err.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect current password. Please try again.';
      } else if (err.code === 'auth/requires-recent-login') {
        errorMessage = 'This operation is sensitive and requires recent authentication. Please sign out and log back in, then try deleting your account again.';
      }
      // Display the error message to the user.
      setError(errorMessage);
      showAlert('Error', errorMessage);
    } finally {
      // This block always runs, on success or failure.
      setIsProcessing(false); // Reset the UI state.
    }
  };

  return (
     <SafeAreaView style={appGlobalStyles.screenContainer}>
          <StatusBar barStyle="dark-content" />
          <View style={screenStyles.headerContainer}>
            <TouchableOpacity onPress={() => router.back()} style={screenStyles.backButton} disabled={isProcessing}>
              <Image source={require('../../assets/icons/back_arrow.png')} style={screenStyles.backArrowIcon} />
            </TouchableOpacity>
            <Text style={[appGlobalStyles.headerText, screenStyles.headerTitleCustom]}>Delete Account</Text>
            <View style={screenStyles.headerRightPlaceholder} />
          </View>

          <ScrollView contentContainerStyle={[appGlobalStyles.contentContainer, screenStyles.containerCustom]}>
            <Text style={[appGlobalStyles.headerText, screenStyles.warningTitleCustom]}>WARNING!</Text>
            <Text style={[appGlobalStyles.bodyText, screenStyles.warningTextCustom]}>
              This action is permanent and cannot be undone. All your data, including habits, progress, and streaks, will be permanently erased.
            </Text>

            {isPasswordProviderUser && (
              <>
                <Text style={[appGlobalStyles.bodyText, screenStyles.labelCustom]}>Enter Current Password to Confirm:</Text>
                <TextInput
                  style={screenStyles.input}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Your current password"
                  placeholderTextColor={fixedAuthColors.placeholderText} // << Gebruik fixedAuthColors
                  secureTextEntry
                  editable={!isProcessing}
                />
              </>
            )}

            {!isPasswordProviderUser && currentUser && (
                 <Text style={[appGlobalStyles.mutedText, screenStyles.infoTextCustom]}>
                    You are signed in with {currentUser.providerData[0]?.providerId || 'an external provider'}.
                    Ensure you are certain before proceeding.
                 </Text>
            )}

            {error ? <Text style={[appGlobalStyles.errorText, screenStyles.errorTextCustom]}>{error}</Text> : null}

            <TouchableOpacity
                style={[screenStyles.button, screenStyles.deleteConfirmButton, isProcessing && screenStyles.buttonDisabled]}
                onPress={handleConfirmDelete}
                disabled={isProcessing}
            >
              <Text style={screenStyles.buttonText}>{isProcessing ? 'Deleting...' : 'Confirm & Delete My Account'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      );
    }

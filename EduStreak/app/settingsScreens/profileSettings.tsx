import { useRouter } from 'expo-router';
import { onAuthStateChanged, User } from 'firebase/auth';
import React, { useEffect, useMemo, useState } from 'react'; // << Voeg useMemo toe
import { Image, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { auth } from '../../config/firebase';
import { authScreenFixedColors, ColorScheme } from '../../constants/Colors'; // << NIEUW
import { updateUserAuthProfile } from '../../functions/authService';
import { getGlobalStyles } from '../../styles/globalStyles'; // << NIEUW
import { showAlert, showConfirmationDialog } from '../../utils/showAlert';

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
    // backgroundColor: colors.background, // Komt van appGlobalStyles.screenContainer
  },
  loadingTextCustom: { // Wordt gebruikt SAMEN MET appGlobalStyles.bodyText
    color: colors.textDefault, // << THEMA (was colors.primaryText)
    textAlign: 'center',
    marginTop: 50,
    fontSize: 18,
  },
  profilePicContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  profilePic: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary, // << THEMA (was #DE7460)
    marginBottom: 10,
    borderWidth: 2,
    borderColor: colors.primaryText, // << THEMA (of colors.textDefault afhankelijk van de achtergrond)
  },
  inputContainer: {
    marginBottom: 20,
  },
  labelCustom: { // Wordt gebruikt SAMEN MET appGlobalStyles.bodyText
    color: colors.textDefault, // << THEMA (was colors.primaryText)
    marginBottom: 8,
    fontSize: 16,
  },
  input: {
    backgroundColor: colors.inputBackground, // << THEMA (was #DE7460)
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    color: colors.textInput, // << THEMA (was #fff)
  },
  button: {
    backgroundColor: colors.primary, // << THEMA (was #DE7460)
    borderRadius: 6,
    padding: 15,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: colors.primaryText, // << THEMA (was #fff)
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    backgroundColor: colors.textMuted, // << THEMA (was #A0A0A0)
    opacity: 0.7, // Kan blijven
  },
  infoTextCustom: { // Wordt gebruikt SAMEN MET appGlobalStyles.mutedText
    color: colors.textMuted, // << THEMA (was #F0F0F0)
    textAlign: 'center',
    marginHorizontal: 20,
    marginBottom: 10,
    marginTop: -5,
    fontSize: 12,
  },
  saveButton: {
    backgroundColor: colors.accent, // << THEMA (was #C0573F, gebruik je accent of een variant van primary)
  },
  deleteAccountButton: {
    backgroundColor: colors.error, // << THEMA (was #E74C3C)
    borderColor: colors.errorDark, // << THEMA (was #C0392B, definieer een donkerdere error kleur indien nodig)
    borderWidth: 1,
  },
  deleteAccountButtonText: {
    color: colors.primaryText, // << THEMA (was #FFFFFF, primaryText als achtergrond error donker is)
    fontWeight: 'bold',
    fontSize: 16,
  }
});

/**
 * `ProfileSettingsScreen` allows users to manage their profile information.
 * It displays the user's current display name and provides an option to update it.
 * It also offers navigation to change their password (if applicable) and to delete their account.
 * The screen fetches and updates user data via `authService`.
 * It handles loading and saving states, and distinguishes between users signed in
 * with email/password versus external providers for certain actions (e.g., password change).
 */
export default function ProfileSettingsScreen() {
 const router = useRouter();
  // We use a fixed set of colors for all authentication-related screens for a consistent look.
  const fixedAuthColors = authScreenFixedColors;
  // `useMemo` prevents the global styles from being recalculated on every render, which is a performance optimization.
  const appGlobalStyles = useMemo(() => getGlobalStyles(fixedAuthColors), []);
  // We also memoize the screen-specific styles. They only recalculate if the global styles change (which they won't here).
  const screenStyles = useMemo(() => getScreenStyles(fixedAuthColors, appGlobalStyles), [appGlobalStyles]);
  const [displayName, setDisplayName] = useState('');
  const [originalDisplayName, setOriginalDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPasswordProvider, setIsPasswordProvider] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  /**
   * This `useEffect` hook runs once when the component mounts to set up a listener
   * for Firebase authentication changes. It updates the component's state whenever a user
   * logs in or out.
   */
  useEffect(() => {
    setIsLoading(true);
    // `onAuthStateChanged` is a Firebase function that listens for auth events.
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      setCurrentUser(user);
      if (user) {
        // If a user is logged in, we populate our state variables with their data.
        const name = user.displayName || "User Name";
        setDisplayName(name);
        setOriginalDisplayName(name);
        // We check the user's provider data to see if 'password' is one of them.
        const passwordProvider = user.providerData.find(p => p.providerId === 'password');
        setIsPasswordProvider(!!passwordProvider); // The '!!' converts the result to a boolean.
      } else {
        // If no user is logged in, reset the state.
        setDisplayName("Guest");
        setOriginalDisplayName("Guest");
        setIsPasswordProvider(false);
      }
      setIsLoading(false); // Hide the loading spinner.
    });
    // The returned function is a "cleanup" function. It runs when the component
    // is unmounted to prevent memory leaks by removing the listener.
    return () => unsubscribe();
  }, []);

  /**
   * Handles saving changes to the user's display name.
   * Validates that the display name has actually changed and is not empty.
   * Calls the `updateUserAuthProfile` service function to persist the changes
   * to Firebase Auth and the user's Firestore document.
   * Displays alerts for success or failure.
   */
  const handleSaveChanges = async () => {
    // --- Pre-save validation ---
    if (!currentUser) {
        showAlert("Error", "No user session found. Please re-login.");
        setIsSaving(false);
        return; // Stop the function.
    }
    // Check if the name was actually changed.
    if (displayName === originalDisplayName) {
      showAlert("No Changes", "Your display name is the same.");
      return;
    }
    // Check if the new name is just empty spaces.
    const trimmedDisplayName = displayName.trim();
    if (!trimmedDisplayName) {
      showAlert("Invalid Name", "Display name cannot be empty.");
      return;
    }

    setIsSaving(true); // Put the UI into a "saving" state.
    try {
      // Call the service function to update the profile in Firebase.
      await updateUserAuthProfile(currentUser, { displayName: trimmedDisplayName });
      setOriginalDisplayName(trimmedDisplayName); // Update the "original" name to the new name.
      showAlert('Success', 'Display name updated successfully!');
    } catch (error: any) {
      console.error("[ProfileSettings] Error updating display name via service:", error);
      showAlert('Error', error.message || 'An unexpected error occurred. Please try again.');
    } finally {
      // This block always runs, on success or failure.
      setIsSaving(false); // Reset the UI state.
    }
  };

  /**
   * Navigates to the Change Password screen.
   * If the user is signed in via an external provider (e.g., Google), an alert is shown
   * informing them to manage their password through their provider, and navigation is blocked.
   */
  const handleChangePassword = () => {
    if (!isPasswordProvider) {
      // If the user did not sign in with a password, they can't change it here.
      showAlert(
        "External Account",
        "You are signed in with an external account (e.g., Google). Please manage your password through your provider."
      );
      return; // Stop the function.
    }
    // Navigate to the change password screen.
    router.push('/settingsScreens/changePasswordScreen');
    console.log('Navigating to Change Password Screen');
  };

  /**
   * Initiates the account deletion process.
   * Displays a confirmation alert to the user. If confirmed, navigates to the
   * `DeleteAccountScreen` for the final steps of account deletion.
   */
  const handleDeleteAccount = () => {
    // Use a utility to show a confirmation pop-up.
    showConfirmationDialog(
      "Delete Account", // Title of the dialog
      "Are you absolutely sure you want to delete your account? This action is permanent and cannot be undone.", // Message
      () => {
        // This function is the "callback" that runs only if the user presses the confirm button.
        console.log("User confirmed account deletion. Navigating to delete screen...");
        router.push('/settingsScreens/deleteAccountScreen');
      },
      "Delete My Account" // Text for the confirm button
    );
  };

  return (
    <SafeAreaView style={[appGlobalStyles.screenContainer, { backgroundColor: '#D1624A' }]}> // Set background color
        <StatusBar barStyle="dark-content" />
        <View style={screenStyles.headerContainer}>
          <TouchableOpacity onPress={() => router.push('/settings')} style={screenStyles.backButton}>
            <Image source={require('../../assets/icons/back_arrow.png')} style={screenStyles.backArrowIcon} />
          </TouchableOpacity>
          <Text style={[appGlobalStyles.headerText, screenStyles.headerTitleCustom]}>Profile Settings</Text>
          <View style={screenStyles.headerRightPlaceholder} />
        </View>

        <ScrollView contentContainerStyle={[appGlobalStyles.contentContainer, screenStyles.containerCustom, { backgroundColor: '#D1624A', flexGrow: 1 }]}> // Set background color
          {isLoading ? (
            <Text style={[appGlobalStyles.bodyText, screenStyles.loadingTextCustom]}>Loading profile...</Text>
          ) : (
            <>
              <View style={screenStyles.profilePicContainer}>
                <Image
                  source={require('../../assets/images/splash_icon_edustreak.png')}
                  style={screenStyles.profilePic}
                />
              </View>

              <View style={screenStyles.inputContainer}>
                <Text style={[appGlobalStyles.bodyText, screenStyles.labelCustom]}>Display Name</Text>
                <TextInput
                  style={screenStyles.input}
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="Enter your display name"
                  placeholderTextColor={fixedAuthColors.placeholderText} // << Gebruik fixedAuthColors
                  editable={!isSaving}
                />
              </View>

              <TouchableOpacity
                style={[screenStyles.button, (!isPasswordProvider || isLoading) && screenStyles.buttonDisabled]}
                onPress={handleChangePassword}
                disabled={isLoading || !isPasswordProvider}
              >
                <Text style={screenStyles.buttonText}>Change Password</Text>
              </TouchableOpacity>
              {!isPasswordProvider && !isLoading && (
                  <Text style={[appGlobalStyles.mutedText, screenStyles.infoTextCustom]}>
                      Password changes are managed through your external sign-in provider (e.g., Google).
                  </Text>
              )}

              <TouchableOpacity
                style={[screenStyles.button, screenStyles.deleteAccountButton]}
                onPress={handleDeleteAccount}
              >
                <Text style={screenStyles.deleteAccountButtonText}>Delete Account</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[screenStyles.button, screenStyles.saveButton, isSaving && screenStyles.buttonDisabled]}
                onPress={handleSaveChanges}
                disabled={isSaving}
              >
                <Text style={screenStyles.buttonText}>{isSaving ? 'Saving Name...' : 'Save Changes'}</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }
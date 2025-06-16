import { useRouter } from 'expo-router';
import { onAuthStateChanged, User } from 'firebase/auth';
import React, { useEffect, useState, useMemo } from 'react'; // << Voeg useMemo toe
import { Image, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { auth } from '../../config/firebase';
import { authScreenFixedColors, ColorScheme } from '../../constants/Colors'; // << NIEUW
import { getGlobalStyles } from '../../styles/globalStyles';           // << NIEUW
import { updateUserAuthProfile } from '../../functions/authService';
import { showAlert, showConfirmationDialog } from '../../utils/showAlert';

const getScreenStyles = (colors: ColorScheme, appGlobalStyles: any) => StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: colors.accent, // << THEMA
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
  // Gebruik de geïmporteerde vaste kleuren voor authenticatie/instellingen
  const fixedAuthColors = authScreenFixedColors;
  // Genereer globale stijlen met deze vaste kleuren
  const appGlobalStyles = useMemo(() => getGlobalStyles(fixedAuthColors), []);
  // Genereer schermstijlen met de vaste kleuren en de daarop gebaseerde globale stijlen
  const screenStyles = useMemo(() => getScreenStyles(fixedAuthColors, appGlobalStyles), [appGlobalStyles]);
  const [displayName, setDisplayName] = useState('');
  const [originalDisplayName, setOriginalDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPasswordProvider, setIsPasswordProvider] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      setCurrentUser(user);
      if (user) {
        const name = user.displayName || "User Name";
        setDisplayName(name);
        setOriginalDisplayName(name);
        const passwordProvider = user.providerData.find(p => p.providerId === 'password');
        setIsPasswordProvider(!!passwordProvider);
      } else {
        setDisplayName("Guest");
        setOriginalDisplayName("Guest");
        setIsPasswordProvider(false);
      }
      setIsLoading(false);
    });
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
    if (!currentUser) {
        showAlert("Error", "No user session found. Please re-login.");
        setIsSaving(false);
        return;
    }
    if (displayName === originalDisplayName) {
      showAlert("No Changes", "Your display name is the same.");
      return;
    }
    const trimmedDisplayName = displayName.trim();
    if (!trimmedDisplayName) {
      showAlert("Invalid Name", "Display name cannot be empty.");
      return;
    }
    setIsSaving(true);
    try {
      await updateUserAuthProfile(currentUser, { displayName: trimmedDisplayName });
      setOriginalDisplayName(trimmedDisplayName);
      showAlert('Success', 'Display name updated successfully!');
    } catch (error: any) {
      console.error("[ProfileSettings] Error updating display name via service:", error);
      showAlert('Error', error.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Navigates to the Change Password screen.
   * If the user is signed in via an external provider (e.g., Google), an alert is shown
   * informing them to manage their password through their provider, and navigation is blocked.
   */
  const handleChangePassword = () => {
    if (!isPasswordProvider) {
      showAlert(
        "External Account",
        "You are signed in with an external account (e.g., Google). Please manage your password through your provider."
      );
      return;
    }
    router.push('/settingsScreens/changePasswordScreen');
    console.log('Navigating to Change Password Screen');
  };

  /**
   * Initiates the account deletion process.
   * Displays a confirmation alert to the user. If confirmed, navigates to the
   * `DeleteAccountScreen` for the final steps of account deletion.
   */
  const handleDeleteAccount = () => {
    showConfirmationDialog(
      "Delete Account",
      "Are you absolutely sure you want to delete your account? This action is permanent and cannot be undone.",
      () => {
        console.log("User confirmed account deletion. Navigating to delete screen...");
        router.push('/settingsScreens/deleteAccountScreen');
      },
      "Delete My Account"
    );
  };

  return (
  <SafeAreaView style={appGlobalStyles.screenContainer}>
        <StatusBar barStyle="dark-content" />
        <View style={screenStyles.headerContainer}>
          <TouchableOpacity onPress={() => router.back()} style={screenStyles.backButton}>
            <Image source={require('../../assets/icons/back_arrow.png')} style={screenStyles.backArrowIcon} />
          </TouchableOpacity>
          <Text style={[appGlobalStyles.headerText, screenStyles.headerTitleCustom]}>Profile Settings</Text>
          <View style={screenStyles.headerRightPlaceholder} />
        </View>

        <ScrollView contentContainerStyle={[appGlobalStyles.contentContainer, screenStyles.containerCustom]}>
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
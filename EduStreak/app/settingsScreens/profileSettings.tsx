import { useRouter } from 'expo-router';
import { onAuthStateChanged, User } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { Alert, Image, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { auth } from '../../config/firebase';
import { colors } from '../../constants/Colors';
import { updateUserAuthProfile } from '../../functions/authService';
import { globalStyles } from '../../styles/globalStyles';

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
        Alert.alert("Error", "No user session found. Please re-login.");
        setIsSaving(false);
        return;
    }
    if (displayName === originalDisplayName) {
      Alert.alert("No Changes", "Your display name is the same.");
      return;
    }
    const trimmedDisplayName = displayName.trim();
    if (!trimmedDisplayName) {
      Alert.alert("Invalid Name", "Display name cannot be empty.");
      return;
    }
    setIsSaving(true);
    try {
      await updateUserAuthProfile(currentUser, { displayName: trimmedDisplayName });
      setOriginalDisplayName(trimmedDisplayName);
      Alert.alert('Success', 'Display name updated successfully!');
    } catch (error: any) {
      console.error("[ProfileSettings] Error updating display name via service:", error);
      Alert.alert('Error', error.message || 'An unexpected error occurred. Please try again.');
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
      Alert.alert(
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
    Alert.alert(
      "Delete Account",
      "Are you absolutely sure you want to delete your account? This action is permanent and cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete My Account",
          style: "destructive",
          onPress: () => {
            console.log("User confirmed account deletion. Navigating to delete screen...");
            router.push('/settingsScreens/deleteAccountScreen');
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={globalStyles.screenContainer}>
      <StatusBar barStyle="light-content" />
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Image source={require('../../assets/icons/back_arrow.png')} style={styles.backArrowIcon} />
        </TouchableOpacity>
        <Text style={[globalStyles.headerText, styles.headerTitleCustom]}>Profile Settings</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={[globalStyles.contentContainer, styles.containerCustom]}>
        {isLoading ? (
          <Text style={[globalStyles.bodyText, styles.loadingTextCustom]}>Loading profile...</Text>
        ) : (
          <>
            <View style={styles.profilePicContainer}>
              <Image 
                source={require('../../assets/images/splash_icon_edustreak.png')} 
                style={styles.profilePic}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[globalStyles.bodyText, styles.labelCustom]}>Display Name</Text>
              <TextInput
                style={styles.input}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Enter your display name"
                placeholderTextColor="#F8C5BA"
                editable={!isSaving}
              />
            </View>

            <TouchableOpacity 
              style={[styles.button, (!isPasswordProvider || isLoading) && styles.buttonDisabled]}
              onPress={handleChangePassword}
              disabled={isLoading || !isPasswordProvider}
            >
              <Text style={styles.buttonText}>Change Password</Text>
            </TouchableOpacity>
            {!isPasswordProvider && !isLoading && (
                <Text style={[globalStyles.mutedText, styles.infoTextCustom]}>
                    Password changes are managed through your external sign-in provider (e.g., Google).
                </Text>
            )}

            <TouchableOpacity 
              style={[styles.button, styles.deleteAccountButton]}
              onPress={handleDeleteAccount}
            >
              <Text style={styles.deleteAccountButtonText}>Delete Account</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, styles.saveButton, isSaving && styles.buttonDisabled]}
              onPress={handleSaveChanges}
              disabled={isSaving}
            >
              <Text style={styles.buttonText}>{isSaving ? 'Saving Name...' : 'Save Changes'}</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    tintColor: colors.primaryText,
  },
  headerTitleCustom: {
    color: colors.primaryText,
    fontSize: 20,
  },
  headerRightPlaceholder: {
    width: 24 + 20,
  },
  containerCustom: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexGrow: 1,
  },
  loadingTextCustom: {
    color: colors.primaryText,
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
    backgroundColor: '#DE7460',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: colors.primaryText,
  },
  inputContainer: {
    marginBottom: 20,
  },
  labelCustom: {
    color: colors.primaryText,
    marginBottom: 8,
    fontSize: 16,
  },
  input: {
    backgroundColor: '#DE7460',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    color: '#fff',
  },
  button: {
    backgroundColor: '#DE7460',
    borderRadius: 6,
    padding: 15,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    backgroundColor: '#A0A0A0',
    opacity: 0.7,
  },
  infoTextCustom: {
    color: '#F0F0F0',
    textAlign: 'center',
    marginHorizontal: 20,
    marginBottom: 10,
    marginTop: -5,
    fontSize: 12,
  },
  saveButton: {
    backgroundColor: '#C0573F',
  },
  deleteAccountButton: {
    backgroundColor: '#E74C3C',
    borderColor: '#C0392B',
    borderWidth: 1,
  },
  deleteAccountButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  }
}); 
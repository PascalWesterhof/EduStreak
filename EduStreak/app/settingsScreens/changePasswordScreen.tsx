import { useRouter } from 'expo-router';
// Firebase Auth imports to be removed or reduced:
// import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import React, { useState } from 'react';
import { Alert, Image, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth } from '../../config/firebase';
import { colors } from '../../constants/Colors';
import { changeUserPassword, reauthenticateCurrentUser } from '../../functions/authService'; // Import service functions
import { globalStyles } from '../../styles/globalStyles';

/**
 * `ChangePasswordScreen` allows users who signed up with email and password to change their password.
 * It requires the user to enter their current password, a new password, and confirm the new password.
 * It performs validation for all fields, including password strength and matching new passwords.
 * Re-authentication and password update operations are handled by `authService` functions.
 * Users signed in via external providers (e.g., Google) are informed that they cannot change their password here.
 */
export default function ChangePasswordScreen() {
  const router = useRouter();
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
      Alert.alert('Missing Fields', 'Please fill in all password fields.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      Alert.alert('Password Mismatch', 'New passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Weak Password', 'New password should be at least 6 characters long.');
      return;
    }
    if (!user) { // Should ideally not happen if passwordProvider check passed
      Alert.alert('Error', 'User not found. Please re-login.');
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

      Alert.alert('Success', 'Password updated successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
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
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={globalStyles.screenContainer}>
      <StatusBar barStyle="light-content" />
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Image source={require('../../assets/icons/back_arrow.png')} style={styles.backArrowIcon} />
        </TouchableOpacity>
        <Text style={[globalStyles.headerText, styles.headerTitleCustom]}>Change Password</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={[globalStyles.contentContainer, styles.containerCustom]}>
        <Text style={[globalStyles.bodyText, styles.labelCustom]}>Current Password</Text>
        <TextInput
          style={styles.input}
          value={currentPassword}
          onChangeText={setCurrentPassword}
          placeholder="Enter your current password"
          placeholderTextColor="#F8C5BA"
          secureTextEntry
          editable={!isSaving}
        />

        <Text style={[globalStyles.bodyText, styles.labelCustom]}>New Password</Text>
        <TextInput
          style={styles.input}
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="Enter your new password (min. 6 characters)"
          placeholderTextColor="#F8C5BA"
          secureTextEntry
          editable={!isSaving}
        />

        <Text style={[globalStyles.bodyText, styles.labelCustom]}>Confirm New Password</Text>
        <TextInput
          style={styles.input}
          value={confirmNewPassword}
          onChangeText={setConfirmNewPassword}
          placeholder="Confirm your new password"
          placeholderTextColor="#F8C5BA"
          secureTextEntry
          editable={!isSaving}
        />
        
        {error ? <Text style={[globalStyles.errorText, styles.errorTextCustom]}>{error}</Text> : null}

        <TouchableOpacity style={[styles.button, styles.saveButton, isSaving && styles.buttonDisabled]} onPress={handleUpdatePassword} disabled={isSaving}>
          <Text style={styles.buttonText}>{isSaving ? 'Updating...' : 'Update Password'}</Text>
        </TouchableOpacity>
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
  labelCustom: {
    color: colors.primaryText,
    marginBottom: 8,
    marginTop: 15,
    fontSize: 16,
  },
  input: {
    backgroundColor: '#DE7460',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    color: '#fff',
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#DE7460',
    borderRadius: 6,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#C0573F',
  },
  buttonDisabled: {
    backgroundColor: '#A0A0A0',
    opacity: 0.7,
  },
  errorTextCustom: {
    color: '#FFBABA',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 5,
    fontSize: 14,
  }
}); 
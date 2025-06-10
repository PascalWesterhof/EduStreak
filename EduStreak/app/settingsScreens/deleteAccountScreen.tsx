import { useRouter } from 'expo-router';
import { User } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { Alert, Image, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth } from '../../config/firebase';
import { colors } from '../../constants/Colors';
import { deleteUserAccount } from '../../functions/authService';
import { globalStyles } from '../../styles/globalStyles';

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
  const [currentPassword, setCurrentPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [isPasswordProviderUser, setIsPasswordProviderUser] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const user = auth.currentUser;
    setCurrentUser(user);
    if (user) {
      const passwordProvider = user.providerData.find(p => p.providerId === 'password');
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
    setError('');
    if (!currentUser) {
      Alert.alert('Error', 'User not found. Please re-login.');
      router.replace('/auth/LoginScreen');
      return;
    }

    if (isPasswordProviderUser && !currentPassword) {
      Alert.alert('Password Required', 'Please enter your current password to confirm account deletion.');
      return;
    }

    setIsProcessing(true);
    try {
      const passwordForService = isPasswordProviderUser && currentPassword ? currentPassword : undefined;
      await deleteUserAccount(currentUser, passwordForService);

      Alert.alert('Account Deleted', 'Your account and associated data have been permanently deleted.', [
        { text: 'OK', onPress: () => router.replace('/auth/LoginScreen') }
      ]);

    } catch (err: any) {
      console.error("[DeleteAccountScreen] Delete Account Error via service:", err);
      let errorMessage = 'Failed to delete account. Please try again.';
      if (err.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect current password. Please try again.';
      } else if (err.code === 'auth/requires-recent-login') {
        errorMessage = 'This operation is sensitive and requires recent authentication. Please sign out and log back in, then try deleting your account again.';
      }
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={globalStyles.screenContainer}>
      <StatusBar barStyle="light-content" />
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} disabled={isProcessing}>
          <Image source={require('../../assets/icons/back_arrow.png')} style={styles.backArrowIcon} />
        </TouchableOpacity>
        <Text style={[globalStyles.headerText, styles.headerTitleCustom]}>Delete Account</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={[globalStyles.contentContainer, styles.containerCustom]}>
        <Text style={[globalStyles.headerText, styles.warningTitleCustom]}>WARNING!</Text>
        <Text style={[globalStyles.bodyText, styles.warningTextCustom]}>
          This action is permanent and cannot be undone. All your data, including habits, progress, and streaks, will be permanently erased.
        </Text>

        {isPasswordProviderUser && (
          <>
            <Text style={[globalStyles.bodyText, styles.labelCustom]}>Enter Current Password to Confirm:</Text>
            <TextInput
              style={styles.input}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Your current password"
              placeholderTextColor="#F8C5BA"
              secureTextEntry
              editable={!isProcessing}
            />
          </>
        )}

        {!isPasswordProviderUser && currentUser && (
             <Text style={[globalStyles.mutedText, styles.infoTextCustom]}>
                You are signed in with {currentUser.providerData[0]?.providerId || 'an external provider'}. 
                Ensure you are certain before proceeding.
             </Text>
        )}
        
        {error ? <Text style={[globalStyles.errorText, styles.errorTextCustom]}>{error}</Text> : null}

        <TouchableOpacity 
            style={[styles.button, styles.deleteConfirmButton, isProcessing && styles.buttonDisabled]}
            onPress={handleConfirmDelete} 
            disabled={isProcessing}
        >
          <Text style={styles.buttonText}>{isProcessing ? 'Deleting...' : 'Confirm & Delete My Account'}</Text>
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
    justifyContent: 'center',
  },
  warningTitleCustom: {
    color: '#FFD700',
    textAlign: 'center',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  warningTextCustom: {
    color: colors.primaryText,
    textAlign: 'center',
    marginBottom: 25,
    fontSize: 16,
    lineHeight: 22,
  },
  infoTextCustom: {
    color: '#F0F0F0',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
    fontSize: 14,
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
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#DE7460',
    borderRadius: 6,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  deleteConfirmButton: {
    backgroundColor: '#B22222',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorTextCustom: {
    color: '#FFBABA',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 10,
    fontSize: 14,
  }
}); 
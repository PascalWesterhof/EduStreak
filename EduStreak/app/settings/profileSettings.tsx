import { useRouter } from 'expo-router';
import { onAuthStateChanged, updateProfile, User } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { Alert, Image, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { auth } from '../../config/firebase';
import { colors } from '../../constants/Colors';
import { globalStyles } from '../../styles/globalStyles';

// Placeholder for a function that would update the user's display name on the backend
const updateUserDisplayName = async (newName: string) => {
  console.log(`Attempting to update display name to: ${newName}`);
  const user = auth.currentUser;
  if (user) {
    try {
      await updateProfile(user, { displayName: newName });
      console.log(`Display name updated to: ${newName} in Firebase`);
      return true;
    } catch (error) {
      console.error("Error updating Firebase profile: ", error);
      return false;
    }
  } else {
    console.log("No user found to update display name.");
    return false;
  }
};

export default function ProfileSettingsScreen() {
  const router = useRouter();

  const [displayName, setDisplayName] = useState('');
  const [originalDisplayName, setOriginalDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPasswordProvider, setIsPasswordProvider] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      if (user) {
        const name = user.displayName || "User Name";
        setDisplayName(name);
        setOriginalDisplayName(name);
        console.log("User display name set to:", name);

        const passwordProvider = user.providerData.find(p => p.providerId === 'password');
        setIsPasswordProvider(!!passwordProvider);
        if (!passwordProvider) {
          console.log("User signed in with a third-party provider.");
        }

      } else {
        console.log("ProfileSettings: User is signed out.");
        setDisplayName("Guest");
        setOriginalDisplayName("Guest");
        setIsPasswordProvider(false);
      }
      setIsLoading(false);
    });

    return () => unsubscribe(); // Cleanup subscription
  }, []);

  const handleSaveChanges = async () => {
    if (displayName === originalDisplayName) {
      Alert.alert("No Changes", "Your display name is the same.");
      return;
    }
    if (!displayName.trim()) {
      Alert.alert("Invalid Name", "Display name cannot be empty.");
      return;
    }
    setIsSaving(true);
    try {
      const success = await updateUserDisplayName(displayName.trim());
      if (success) {
        setOriginalDisplayName(displayName.trim());
        Alert.alert('Success', 'Display name updated successfully!');
        router.back();
      } else {
        Alert.alert('Error', 'Failed to update display name. Please try again.');
      }
    } catch (error) {
      console.error("Error updating display name:", error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = () => {
    if (!isPasswordProvider) {
      Alert.alert(
        "External Account",
        "You are signed in with an external account (e.g., Google). Please manage your password through your provider."
      );
      return;
    }
    router.push('/settings/changePasswordScreen');
    console.log('Navigating to Change Password Screen');
  };

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
            router.push('/settings/deleteAccountScreen');
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
import { useRouter } from 'expo-router';
import { sendPasswordResetEmail } from 'firebase/auth';
import React, { useState } from 'react';
import { Alert, Image, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth } from '../../config/firebase';
import { colors } from '../../constants/Colors';
import { globalStyles } from '../../styles/globalStyles';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const router = useRouter();

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert('Password Reset', 'If an account exists for this email, a password reset link has been sent.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (error: any) {
      // Show a generic message even if there's an error like 'auth/user-not-found'
      console.error('Forgot Password Error:', error);
      Alert.alert('Password Reset', 'If an account exists for this email, a password reset link has been sent.', [{ text: 'OK', onPress: () => router.back() }]);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Image source={require('../../assets/icons/back_arrow.png')} style={styles.backArrow} />
      </TouchableOpacity>
      <Image source={require('../../assets/images/splash_icon_edustreak.png')} style={styles.logo} />
      <Text style={[globalStyles.titleText, styles.headerTextCustom]}>FORGOT PASSWORD?</Text>
      <Text style={[globalStyles.bodyText, styles.subHeaderTextCustom]}>
Enter your email address and we'll send you a link to reset your password.
      </Text>

      <TextInput
        style={[globalStyles.inputBase, styles.inputCustom]}
        placeholder="Email address"
        placeholderTextColor={colors.placeholderText}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TouchableOpacity style={[globalStyles.inputBase, styles.sendButtonCustom]} onPress={handleResetPassword}>
        <Text style={[globalStyles.bodyText, styles.sendButtonTextCustom]}>SEND RESET LINK</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.backToLoginLinkContainer} onPress={() => router.back()}>
        <Text style={[globalStyles.bodyText, styles.backToLoginLinkTextCustom]}>Back to <Text style={styles.backToLoginLinkTextHighlightCustom}>LOG IN</Text></Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
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
    tintColor: colors.textDefault,
  },
  logo: {
    width: 180,
    height: 90,
    resizeMode: 'contain',
    marginBottom: 20,
    marginTop: 20,
  },
  headerTextCustom: {
    color: colors.textDefault,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subHeaderTextCustom: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20, 
  },
  inputCustom: {
    width: '100%',
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sendButtonCustom: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    width: '100%',
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 30,
    marginBottom: 20,
  },
  sendButtonTextCustom: {
    color: colors.white,
    fontWeight: 'bold',
  },
  backToLoginLinkContainer: {
    marginTop: 10,
  },
  backToLoginLinkTextCustom: {
    color: colors.textDefault,
    textAlign: 'center',
  },
  backToLoginLinkTextHighlightCustom: {
    color: colors.primary,
    fontWeight: 'bold',
  },
}); 
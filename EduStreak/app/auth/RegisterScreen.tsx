import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import { Alert, Image, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../../config/firebase';
import { colors } from '../../constants/Colors';
import { globalStyles } from '../../styles/globalStyles';

export default function RegisterScreen() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const router = useRouter();

  const handleRegister = async () => {
    if (!displayName || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: displayName });

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        displayName: displayName,
        email: user.email,
        points: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastCompletionDate: null,
        photoURL: user.photoURL || ''
      });

      Alert.alert('Registration Successful', 'Your account has been created.');
      router.replace('/auth/LoginScreen');
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Image source={require('../../assets/icons/back_arrow.png')} style={styles.backArrow} />
      </TouchableOpacity>
      <Image source={require('../../assets/images/splash_icon_edustreak.png')} style={styles.logo} />
      <Text style={[globalStyles.titleText, styles.headerTextCustom]}>CREATE ACCOUNT</Text>

      <TextInput
        style={[globalStyles.inputBase, styles.inputCustom]}
        placeholder="Display Name"
        placeholderTextColor={colors.placeholderText}
        value={displayName}
        onChangeText={setDisplayName}
        autoCapitalize="words"
      />
      <TextInput
        style={[globalStyles.inputBase, styles.inputCustom]}
        placeholder="Email address"
        placeholderTextColor={colors.placeholderText}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={[globalStyles.inputBase, styles.inputCustom]}
        placeholder="Password"
        placeholderTextColor={colors.placeholderText}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TextInput
        style={[globalStyles.inputBase, styles.inputCustom]}
        placeholder="Confirm Password"
        placeholderTextColor={colors.placeholderText}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />
      <TouchableOpacity style={[globalStyles.inputBase, styles.registerButtonCustom]} onPress={handleRegister}>
        <Text style={[globalStyles.bodyText, styles.registerButtonTextCustom]}>CREATE ACCOUNT</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.loginLinkContainer} onPress={() => router.push('/auth/LoginScreen')}>
        <Text style={[globalStyles.bodyText, styles.loginLinkTextCustom]}>Already have an account? <Text style={[styles.loginLinkTextHighlightCustom]}>LOG IN</Text></Text>
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
    padding:10,
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
    marginBottom: 30,
  },
  inputCustom: {
    width: '100%',
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  registerButtonCustom: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    width: '100%',
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 30,
    marginBottom: 20,
  },
  registerButtonTextCustom: {
    color: colors.white,
    fontWeight: 'bold',
  },
  loginLinkContainer: {
    marginTop: 10,
  },
  loginLinkTextCustom: {
    color: colors.textDefault,
    textAlign: 'center',
  },
  loginLinkTextHighlightCustom: {
    color: colors.primary,
    fontWeight: 'bold',
  },
}); 
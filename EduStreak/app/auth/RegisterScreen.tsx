import { useRouter } from 'expo-router';
import React, { useState, useMemo } from 'react'; // << Voeg useMemo toe
import { Image, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { authScreenFixedColors, ColorScheme } from '../../constants/Colors'; // << Importeer authScreenFixedColors en ColorScheme
import { registerWithEmail } from '../../functions/authService';
import { getGlobalStyles } from '../../styles/globalStyles'; // << Importeer de functie
import { showAlert } from "../../utils/showAlert";

const getScreenStyles = (colors: ColorScheme, appGlobalStyles: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background, // << Gebruik 'colors' (was colors.white)
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
    tintColor: colors.textDefault, // << Gebruik 'colors'
  },
  logo: {
    width: 180,
    height: 90,
    resizeMode: 'contain',
    marginBottom: 20,
    marginTop: 20,
  },
  headerTextCustom: { // Wordt gebruikt SAMEN MET appGlobalStyles.titleText
    // color: colors.textDefault, // Komt nu van appGlobalStyles.titleText
    fontWeight: 'bold', // Kan blijven als lokale override/specificatie
    marginBottom: 30,
  },
  inputCustom: { // Wordt gebruikt SAMEN MET appGlobalStyles.inputBase
    // ...appGlobalStyles.inputBase, // Als je de basis uit globale stijlen wilt
    // backgroundColor: colors.inputBackground, // Komt van appGlobalStyles.inputBase
    width: '100%',
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  registerButtonCustom: {
    // ...appGlobalStyles.inputBase, // Als basis voor vorm als dat gewenst is
    backgroundColor: colors.primary, // << Gebruik 'colors'
    alignItems: 'center',
    width: '100%',
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 30,
    marginBottom: 20,
  },
  registerButtonTextCustom: { // Wordt gebruikt SAMEN MET appGlobalStyles.bodyText
    color: colors.primaryText, // << Gebruik 'colors' (was colors.white)
    fontWeight: 'bold',
  },
  loginLinkContainer: {
    marginTop: 10,
  },
  loginLinkTextCustom: { // Wordt gebruikt SAMEN MET appGlobalStyles.bodyText
    // color: colors.textDefault, // Komt van appGlobalStyles.bodyText
    textAlign: 'center',
  },
  loginLinkTextHighlightCustom: {
    color: colors.primary, // << Gebruik 'colors'
    fontWeight: 'bold',
  },
});

/**
 * `RegisterScreen` allows new users to create an account.
 * It collects display name, email, password, and password confirmation.
 * Validates the input fields and calls the `registerWithEmail` service function
 * from `authService` to create the user account and associated Firestore document.
 * Navigates to the Login screen upon successful registration.
 */
export default function RegisterScreen() {
  const fixedAuthColors = authScreenFixedColors;

    // Genereer globale stijlen met deze vaste kleuren
    const appGlobalStyles = useMemo(() => getGlobalStyles(fixedAuthColors), []);
    const screenStyles = useMemo(() => getScreenStyles(fixedAuthColors, appGlobalStyles), [appGlobalStyles]);

    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const router = useRouter();

  /**
   * Handles the user registration process.
   * Validates that all fields are filled and that passwords match.
   * Calls the `registerWithEmail` service function with the display name, email, and password.
   * On successful registration, displays a success alert and navigates to the Login screen.
   * If registration fails, displays an error alert with the message from the service.
   */
  const handleRegister = async () => {
    if (!displayName || !email || !password || !confirmPassword) {
      showAlert('Error', 'Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      showAlert('Error', 'Passwords do not match.');
      return;
    }
    try {
      // Call the service function for registration
      await registerWithEmail(displayName, email, password);
      showAlert('Registration Successful', 'Your account has been created.');
      router.replace('/auth/LoginScreen'); // Navigate to Login on success
    } catch (error: any) {
      console.error("[RegisterScreen] Registration failed:", error.message);
      showAlert('Registration Failed', error.message);
    }
  };

  return (
    <View style={screenStyles.container}>
         <TouchableOpacity onPress={() => router.back()} style={screenStyles.backButton}>
           <Image source={require('../../assets/icons/back_arrow.png')} style={screenStyles.backArrow} />
         </TouchableOpacity>
         <Image source={require('../../assets/images/splash_icon_edustreak.png')} style={screenStyles.logo} />

         <Text style={[appGlobalStyles.titleText, screenStyles.headerTextCustom]}>CREATE ACCOUNT</Text>

         <TextInput
           style={[appGlobalStyles.inputBase, screenStyles.inputCustom]}
           placeholder="Display Name"
           placeholderTextColor={fixedAuthColors.placeholderText} // << Gebruik fixedAuthColors
           value={displayName}
           onChangeText={setDisplayName}
           autoCapitalize="words"
         />
         <TextInput
           style={[appGlobalStyles.inputBase, screenStyles.inputCustom]}
           placeholder="Email address"
           placeholderTextColor={fixedAuthColors.placeholderText} // << Gebruik fixedAuthColors
           value={email}
           onChangeText={setEmail}
           keyboardType="email-address"
           autoCapitalize="none"
         />
         <TextInput
           style={[appGlobalStyles.inputBase, screenStyles.inputCustom]}
           placeholder="Password"
           placeholderTextColor={fixedAuthColors.placeholderText} // << Gebruik fixedAuthColors
           value={password}
           onChangeText={setPassword}
           secureTextEntry
         />
         <TextInput
           style={[appGlobalStyles.inputBase, screenStyles.inputCustom]}
           placeholder="Confirm Password"
           placeholderTextColor={fixedAuthColors.placeholderText} // << Gebruik fixedAuthColors
           value={confirmPassword}
           onChangeText={setConfirmPassword}
           secureTextEntry
         />
         {/* registerButtonCustom is al volledig gedefinieerd in getScreenStyles met vaste kleuren */}
         {/* Je kunt appGlobalStyles.inputBase hier weglaten als de vorm niet exact die van een input hoeft te zijn */}
         <TouchableOpacity style={[appGlobalStyles.inputBase, screenStyles.registerButtonCustom]} onPress={handleRegister}>
           <Text style={[appGlobalStyles.bodyText, screenStyles.registerButtonTextCustom]}>CREATE ACCOUNT</Text>
         </TouchableOpacity>
         <TouchableOpacity style={screenStyles.loginLinkContainer} onPress={() => router.push('/auth/LoginScreen')}>
           <Text style={[appGlobalStyles.bodyText, screenStyles.loginLinkTextCustom]}>
             Already have an account? <Text style={screenStyles.loginLinkTextHighlightCustom}>LOG IN</Text>
           </Text>
         </TouchableOpacity>
       </View>
     );
   }
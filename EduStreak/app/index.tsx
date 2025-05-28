import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const logo = require("../assets/images/fire-logo.png");

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    // Implement login logic here
    console.log("Login attempt with:", email, password);
    // router.replace("/(drawer)/home"); // Navigate to home after login
  };

  const handleGoogleSignIn = () => {
    // Implement Google Sign-In logic here
    console.log("Attempting Google Sign-In");
  };

  return (
    <View style={styles.container}>
      <Image source={logo} style={styles.logo} />

      <TouchableOpacity
        style={styles.googleButton}
        onPress={handleGoogleSignIn}
      >
        <Image
          source={require("../assets/images/google-logo.png")}
          style={styles.googleIcon}
        />

        <Text style={styles.googleButtonText}>CONTINUE WITH GOOGLE</Text>
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        placeholder="Email address"
        placeholderTextColor="#888"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#888"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
        <Text style={styles.loginButtonText}>LOG IN</Text>
      </TouchableOpacity>

      <View style={styles.linksContainer}>
        <TouchableOpacity onPress={() => router.push("./forgot-password")}>
          <Text style={styles.linkText}>Forgot Password?</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("./signup")}>
          <Text style={[styles.linkText, styles.signUpText]}>SIGN UP</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 3,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 50,
  },

  logo: {
    width: 500,
    height: 100,
    resizeMode: "contain",
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 30,
    color: "#000", // Adjust color as needed
  },

  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },

  googleButton: {
    backgroundColor: "#fff",
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 30,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    flexDirection: "row",
  },

  googleButtonText: {
    color: "#555",
    fontSize: 16,
    fontWeight: "bold",
    alignItems: "center",
  },

  orText: {
    color: "#D35400", // Orange color for "OR LOG IN WITH EMAIL"
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 20,
  },

  input: {
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    width: "100%",
    fontSize: 16,
    color: "#000",
  },

  loginButton: {
    backgroundColor: "#CD5C5C", // Reddish button color
    borderRadius: 25,
    paddingVertical: 15,
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
  },

  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },

  linksContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },

  linkText: {
    color: "#555",
    fontSize: 14,
    marginLeft: 30,
  },

  signUpText: {
    color: "#D35400", // Orange color for "SIGN UP"
    fontWeight: "bold",
    marginRight: 30,
  },
});

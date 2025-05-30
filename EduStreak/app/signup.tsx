import { Link, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const logo = require("../assets/images/fire-logo.png");

export default function SignupScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");

  const handleSignup = () => {
    if (password !== repeatPassword) {
      alert("Passwords do not match!");
      return;
    }
    console.log("Signup attempt with:", email, password);
    // router.replace("/(drawer)/home"); // Navigate to home after signup
  };

  return (
    <View style={styles.container}>
      {Platform.OS !== "web" && (
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButtonContainer}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
      )}
      <Image source={logo} style={styles.logo} />
      {/* <Text style={styles.title}>Edu Streak</Text> */}

      <Text style={styles.headerText}>OR SIGN UP WITH EMAIL</Text>

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
      <TextInput
        style={styles.input}
        placeholder="Repeat password"
        placeholderTextColor="#888"
        value={repeatPassword}
        onChangeText={setRepeatPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.signupButton} onPress={handleSignup}>
        <Text style={styles.signupButtonText}>CREATE ACCOUNT</Text>
      </TouchableOpacity>

      <View style={styles.linksContainer}>
        <Link href="./forgot-password" asChild>
          <TouchableOpacity>
            <Text style={styles.linkText}>Forgot Password?</Text>
          </TouchableOpacity>
        </Link>
        <Link href="./" asChild>
          <TouchableOpacity>
            <Text style={[styles.linkText, styles.loginText]}>LOG IN</Text>
          </TouchableOpacity>
        </Link>
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
  backButtonContainer: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 30,
    left: 20,
    zIndex: 1,
  },
  backButtonText: {
    fontSize: 24,
    color: "#000",
  },
  logo: {
    width: 500,
    height: 100,
    resizeMode: "contain",
    marginBottom: 10,
  },
  headerText: {
    color: "#D35400",
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
  signupButton: {
    backgroundColor: "#CD5C5C",
    borderRadius: 25,
    paddingVertical: 15,
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
  },
  signupButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  linksContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 20,
  },
  linkText: {
    color: "#555",
    fontSize: 14,
  },
  loginText: {
    color: "#D35400",
    fontWeight: "bold",
  },
});

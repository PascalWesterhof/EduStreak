import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

import { getAuth } from "firebase/auth";
import { createGroup } from "../functions/groupService";
import { showAlert } from "../utils/showAlert";

const CreateGroup = () => {
  const navigation = useNavigation();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleCreateGroup = async () => {
    const user = getAuth().currentUser;
    if (!user) {
      showAlert("Error", "No user is logged in.");
      return;
    }

    if (!name.trim()) {
      showAlert("Error", "Group name is required.");
      return;
    }

    try {
      const groupId = await createGroup(user.uid, name.trim(), description.trim());
      console.log("Group created with ID:", groupId);
      navigation.navigate("groupboard");
    } catch (error) {
      console.error("Error creating group:", error);
      showAlert("Error", "Something went wrong while creating the group.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        {/* Title & Subtitle */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Create Group</Text>
          <Text style={styles.subtitle}>
            Bring your friends or classmates together to build consistent habits!
          </Text>
        </View>

        {/* Input fields */}
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Group name"
            value={name}
            onChangeText={setName}
            placeholderTextColor="#aaa"
          />
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Description (optional)"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            placeholderTextColor="#aaa"
          />
        </View>

        {/* Create Button */}
        <TouchableOpacity style={styles.button} onPress={handleCreateGroup}>
          <Text style={styles.buttonText}>CREATE GROUP</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CreateGroup;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  titleContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 14,
    color: "#7C7C7C",
    marginTop: 4,
  },
  form: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  input: {
    backgroundColor: "#F2F2F5",
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  textarea: {
    height: 120,
    textAlignVertical: "top",
  },
  button: {
    backgroundColor: "#D05B52",
    marginTop: 24,
    marginHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 40,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
});

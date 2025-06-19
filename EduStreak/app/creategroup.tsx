import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

import { getAuth } from "firebase/auth";
import { createGroup } from "../functions/groupService";
import { showAlert } from "../utils/showAlert";
import { useTheme } from '../functions/themeFunctions/themeContext';
import { ColorScheme } from '../constants/Colors';


// Predefined local images
const GROUP_IMAGES = [
  require("../assets/groupImages/image1.png"),
  require("../assets/groupImages/image2.png"),
  require("../assets/groupImages/image3.png"),
];

// Get the image key used in Firestore ("group1", "group2", etc.)
const getImageKey = (image: any): string | null => {
  if (!image) return null;
  const index = GROUP_IMAGES.indexOf(image);
  return index !== -1 ? `group${index + 1}` : null;
};

const getThemedStyles = (colors: ColorScheme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  titleContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  form: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  input: {
    backgroundColor: colors.inputBackground,
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    color: colors.textInput,
    borderColor: colors.inputBorder,
    borderWidth: 1,
  },
  textarea: {
    height: 120,
    textAlignVertical: "top",
  },
  imagePickerLabel: {
    fontWeight: "bold",
    marginBottom: 8,
    color: colors.text,
  },
  button: {
    backgroundColor: colors.primary,
    marginTop: 24,
    marginHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 40,
    alignItems: "center",
  },
  buttonText: {
    color: colors.primaryText,
    fontWeight: "bold",
    fontSize: 14,
  },
  backButton: {
    backgroundColor: colors.cardBackground,
    borderColor: colors.primary,
    borderWidth: 2,
    marginTop: 16,
    marginHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 40,
    alignItems: "center",
  },
  backButtonText: {
    color: colors.primary,
    fontWeight: "bold",
    fontSize: 14,
  },
  imagePicker: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  imageWrapper: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
  },
  image: {
    width: 60,
    height: 60,
    resizeMode: "cover",
  },
});

const CreateGroup = () => {
  const navigation = useNavigation();
  const { colors: themeColors } = useTheme();
  const styles = React.useMemo(() => getThemedStyles(themeColors), [themeColors]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [groupImage, setGroupImage] = useState<any | null>(null);

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
      const groupId = await createGroup(
        user.uid,
        name.trim(),
        description.trim(),
        getImageKey(groupImage) // This sends "group1", "group2", etc.
      );
      console.log("Group created with ID:", groupId);
      navigation.navigate("groupboard");
    } catch (error: any) {
      console.error("Error creating group:", error);
      if (error.message.includes("already exists")) {
        showAlert("Duplicate Name", "A group with this name already exists.");
      } else {
        showAlert("Error", "Something went wrong while creating the group.");
      }
    }
  };

  return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Create Group</Text>
            <Text style={styles.subtitle}>
              Bring your friends or classmates together to build consistent habits!
            </Text>
          </View>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Group name"
              value={name}
              onChangeText={setName}
              placeholderTextColor={themeColors.placeholderText} //
            />
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Description (optional)"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              placeholderTextColor={themeColors.placeholderText} //
              maxLength={300}
            />

            <Text style={styles.imagePickerLabel}>
              Pick a group image:
            </Text>
            <View style={styles.imagePicker}>
              {GROUP_IMAGES.map((imgSource, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => setGroupImage(imgSource)}
                  style={[
                    styles.imageWrapper,
                    groupImage === imgSource && {
                      borderColor: themeColors.primary, //
                      borderWidth: 3,
                    },
                  ]}
                >
                  <Image source={imgSource} style={styles.image} />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity style={styles.button} onPress={handleCreateGroup}>
            <Text style={styles.buttonText}>Create Group</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate("groupboard")}
          >
            <Text style={styles.backButtonText}>Return to Group Board</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  };

export default CreateGroup;

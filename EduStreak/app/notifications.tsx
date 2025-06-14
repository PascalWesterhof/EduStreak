import React, { useState, useLayoutEffect, useEffect } from "react";
import {
  Text,
  View,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Modal,
  Pressable,
  Button,
  ScrollView,
  Image,
  Platform,
} from "react-native";
import { useNavigation, DrawerActions, useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { usePushNotifications } from "./usePushNotifications";
import {notificationReminder} from "./helpers/notificationReminder"

import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../config/firebase";

import {
  fetchUserHabits,
} from "../functions/habitService";
import { checkAndResetDailyStreak } from "../functions/userService";


const isWeb = Platform.OS === "web";
// Interfaces for better type checking
interface Habit {
  id: string;
  name: string;
  // add other habit properties if needed
}

interface Notification {
  id: string;
  title: string;
  body?: string;
  time?: string;
}

export default function Notifications() {
  const navigation = useNavigation();
  const router = useRouter();

  // Custom hook to handle push notifications logic (registering tokens, listening, etc.)
  const { expoPushToken, notifications } = usePushNotifications();

  // State to manage the selected notification for modal display
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // State to store habits and loading state
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Track current user info
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState("User");

  // On component mount, cancel all notifications to start fresh
useEffect(() => {
  (async () => {
    await cancelAllNotifications();
  })();
}, []);

  // This runs whenever the screen is focused (like React Navigation's focus event)
useFocusEffect(
  React.useCallback(() => {
      // Listen for Firebase auth changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log("[Notifications] Auth: User signed in - ID:", user.uid);
        setCurrentUserId(user.uid);
        setUserName(user.displayName || "User");

          // Reset daily streak if necessary (custom app logic)
        await checkAndResetDailyStreak(user.uid);

        try {
            // Fetch user's habits from the backend or Firebase
          const { habits: fetchedHabits } = await fetchUserHabits(user.uid);
          setHabits(fetchedHabits);
          console.log("[Notifications] Data fetched and set successfully.");

            // Schedule notifications for each habit, defaulting to 8 AM reminder time
          for (const habit of fetchedHabits) {
            // Use a default time (e.g., 8 AM) or attach time to habit if available
            const time = new Date();
            time.setHours(8);
            time.setMinutes(0);

            await scheduleDailyHabitReminder(habit.name, time);
          }
        } catch (error) {
          console.error("[Notifications] Error loading data: ", error);
          setHabits([]);
        } finally {
          setIsLoading(false);
        }
      } else {
          // If no user logged in, redirect to login screen
        console.log("[Notifications] Auth: No user found. Redirecting to login.");
        router.replace("/auth/LoginScreen");
      }
    });
      // Cleanup listener on screen unfocus or unmount
    return () => {
      console.log("[Notifications] Cleanup: Auth listener.");
      unsubscribe();
    };
  }, [router])
);
  // Setup screen header and hamburger menu icon
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: "Notifications",
      headerTitleStyle: {
        color: "#fff",
        fontSize: 24,
        fontWeight: "bold",
      },
      headerStyle: {
        backgroundColor: "#D1624A",
      },
      headerTintColor: "#fff",
      headerLeft: () => (
        <Pressable
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          style={{ paddingHorizontal: 16 }}
        >
          <Image
            source={require("../assets/icons/burger_menu_icon.png")}
            style={{ width: 24, height: 24 }}
          />
        </Pressable>
      ),
    });
  }, [navigation]);

  // When user taps on a notification item, show modal with details
  const onPressNotification = (item: Notification) => {
      console.log("Tapped notification:", item)
    setSelectedNotification(item);
    setModalVisible(true);
  };

  // Render a single notification in the FlatList
  const renderItem = ({ item }: { item: Notification }) => (
    <Pressable onPress={() => onPressNotification(item)} style={styles.notificationItem}>
      <MaterialIcons name="notifications-active" size={20} color="#fff" style={styles.icon} />
      <View style={{ flex: 1 }}>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.time}>{item.time}</Text>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No notifications yet.</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <ScrollView style={{ maxHeight: 300 }}>
              <Text style={styles.modalTitle}>{selectedNotification?.title}</Text>
              <Text style={styles.modalBody}>
                {selectedNotification?.body || "No additional content"}
              </Text>
            </ScrollView>
            <Button title="Close" onPress={() => setModalVisible(false)} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#D1624A",
  },
  listContainer: {
    paddingHorizontal: 16,
  },
  notificationItem: {
    borderBottomWidth: 1,
    borderBottomColor: "#f0c0b0",
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    marginRight: 12,
  },
  title: {
    color: "#fff",
    fontSize: 14,
    marginBottom: 4,
  },
  time: {
    color: "#f8d8c8",
    fontSize: 12,
  },
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 20,
    width: "80%",
  },
  modalTitle: {
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 12,
  },
  modalBody: {
    fontSize: 14,
    marginBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "#fff",
  },
});

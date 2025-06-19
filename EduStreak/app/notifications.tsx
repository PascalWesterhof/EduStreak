// Importing necessary libraries and components
import { MaterialIcons } from "@expo/vector-icons";
import { DrawerActions, useFocusEffect, useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useLayoutEffect, useState } from "react";
import {
  Button,
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

// Helper functions for notifications and reminders
import { scheduleDailyHabitReminder } from "../helpers/notificationReminder";
import { usePushNotifications } from "../helpers/usePushNotifications";
// Firebase authentication
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../config/firebase";
// Functions to fetch and manage user and habit data
import { fetchUserHabits } from "../functions/habitService";
import { checkAndResetDailyStreak } from "../functions/userService";
// Platform check (web or native)
const isWeb = Platform.OS === "web";
// TypeScript interfaces for strong typing
interface Habit {
  id: string;
  name: string;
}

interface Notification {
  id: string;
  title: string;
  body?: string;
  time?: string;
}

export default function Notifications() {
  const navigation = useNavigation(); // Used to customize navigation options
  const router = useRouter(); // Used to navigate programmatically

  const { expoPushToken, notifications } = usePushNotifications(); // Custom hook for managing push notifications

  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null); // Selected notification for modal
  const [modalVisible, setModalVisible] = useState(false); // Control modal visibility

  const [habits, setHabits] = useState<Habit[]>([]); // User's habits list
  const [isLoading, setIsLoading] = useState(true); // Loading state

  const [currentUserId, setCurrentUserId] = useState<string | null>(null); // Current user ID
  const [userName, setUserName] = useState("User"); // Current user name

  // Listen to focus events on this screen
  useFocusEffect(
    React.useCallback(() => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
            console.log("expoPushToken:", expoPushToken);
          console.log("[Notifications] Auth: User signed in - ID:", user.uid);
          setCurrentUserId(user.uid);
          setUserName(user.displayName || "User");
          // Check and reset daily streak if needed
          await checkAndResetDailyStreak(user.uid);

          try {
              // Fetch habits and schedule reminders
            const { habits: fetchedHabits } = await fetchUserHabits(user.uid);
            setHabits(fetchedHabits);
            console.log("[Notifications] Data fetched and set successfully.");
            // Schedule a daily reminder at 8:00 AM for each habit
            for (const habit of fetchedHabits) {
              const time = new Date();
              time.setHours(8);
              time.setMinutes(0);
              await scheduleDailyHabitReminder(habit.name, time);
            }
          } catch (error) {
            console.error("[Notifications] Error loading data: ", error);
            setHabits([]);
          } finally {
            setIsLoading(false); // Stop showing loading indicator
          }
        } else {
          console.log("[Notifications] Auth: No user found. Redirecting to login.");
          router.replace("/auth/LoginScreen");
        }
      });
      // Cleanup function
      return () => {
        console.log("[Notifications] Cleanup: Auth listener.");
        unsubscribe();
      };
    }, [router])
  );
  // Setup header UI with title and drawer menu icon
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
  // Handle press event on a notification item
  const onPressNotification = (item: Notification) => {
    console.log("Tapped notification:", item);
    setSelectedNotification(item);
    setModalVisible(true);
  };
  // Render a single notification item
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
          keyExtract    or={(item) => item.id}
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

import { useState, useEffect, useRef } from "react";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";

// Set the notification handler to define the behavior when a notification is received
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true, // Enables sound for the notification
    shouldShowAlert: true, // Displays the notification alert
    shouldSetBadge: true, // Updates the app badge count
  }),
});
// Hook to handle push notifications
export const usePushNotifications = () => {
  const [expoPushToken, setExpoPushToken] = useState(); // Stores the Expo push notification token
  const [notifications, setNotifications] = useState([]); // Stores the received notifications

  const notificationListener = useRef(); // Reference for notification received listener
  const responseListener = useRef(); // Reference for notification response listener

  useEffect(() => {
    const register = async () => {
      if (!Device.isDevice) {
        console.log("Push notifications require a physical device."); // Checks if running on a physical device
        return;
      }
      // Request permission for notifications
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        alert("Failed to get push token"); // Alerts the user if notification permissions are denied
        return;
      }
      // Fetch Expo push token
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig.extra?.eas?.projectId,
      });

      setExpoPushToken(token); // Store the received token

      // Configure Android-specific notification settings
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX, // Set high importance level for notifications
        });
      }
    };

    register(); // Execute registration logic

    // Listener for received notifications
    notificationListener.current = Notifications.addNotificationReceivedListener((notif) => {
      setNotifications((prev) => [
        {
          id: Date.now().toString(),
          title: notif.request.content.title || "New Notification", // Default title if not provided
          body: notif.request.content.body || "", // Default body if not provided
          time: new Date().toLocaleTimeString(), // Store the notification timestamp
        },
        ...prev,
      ]);
    });

    // Listener for notification responses (when tapped)
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log("Notification tapped:", response); // Logs the user's interaction with the notification
    });

    // Function to schedule a local test notification
    const testLocalNotification = async () => {
      console.log("📣 Triggering test notification...");
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Test Notification",
          body: "This is a simulated notification body with more details.",
          data: { customData: "12345" }, // Custom data payload
          channelId: "default",
        },
        trigger: { seconds: 6 }, // Delay the notification by 6 seconds
      });
    };

    testLocalNotification(); // Trigger the test notification

    return () => {
        // Clean up notification listeners on component unmount
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  return { expoPushToken, notifications }; // Expose token and notification list
};

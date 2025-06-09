import { useState, useEffect, useRef } from "react";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";

// Set the notification handler to define the behavior when a notification is received
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,  // Enables sound for the notification
    shouldShowAlert: true,  // Displays the notification alerts
    shouldSetBadge: true,   // Updates the app badge count
  }),
});

// Hook to handle push notifications
export const usePushNotifications = () => {
  const [expoPushToken, setExpoPushToken] = useState(null); // Stores the Expo push notification token as string
  const [notifications, setNotifications] = useState([]);   // Stores the received notifications

  const notificationListener = useRef();  // Reference for notification received listener
  const responseListener = useRef();      // Reference for notification response listener

  useEffect(() => {
    const register = async () => {
      if (!Device.isDevice) {
        console.log("Push notifications require a physical device.");
        return;
      }

      // Get existing notification permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      console.log("Notification permissions status:", existingStatus);

      // Request permission if not granted
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
        console.log("Requested notification permissions status:", status);
      }

      if (finalStatus !== "granted") {
        alert("Failed to get push token permissions!");
        return;
      }

      // Get Expo push token (extract string token)
      try {
        const tokenObj = await Notifications.getExpoPushTokenAsync();

        const tokenString = tokenObj.data;
        console.log("Expo Push Token:", tokenString);
        setExpoPushToken(tokenString);
      } catch (error) {
        console.error("Error getting Expo push token:", error);
      }

      // Android: create notification channel
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
        });
      }
    };

    register();

    // Listener for incoming notifications
    notificationListener.current = Notifications.addNotificationReceivedListener((notif) => {
      setNotifications((prev) => [
        {
          id: Date.now().toString(),
          title: notif.request.content.title || "New Notification",
          body: notif.request.content.body || "",
          time: new Date().toLocaleTimeString(),
        },
        ...prev,
      ]);
    });

    // Listener for user interacting with notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log("Notification tapped:", response);
    });

    // Schedule a local test notification 6 seconds after mount
    const testLocalNotification = async () => {
      console.log("📣 Triggering test notification...");
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Test Notification",
          body: "This is a simulated notification body with more details.",
          data: { customData: "12345" },
          channelId: "default",
        },
        trigger: { seconds: 6 },
      });
    };

    testLocalNotification();

    // Cleanup listeners on unmount
    return () => {
      if (notificationListener.current)
        Notifications.removeNotificationSubscription(notificationListener.current);
      if (responseListener.current)
        Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  return { expoPushToken, notifications };
};

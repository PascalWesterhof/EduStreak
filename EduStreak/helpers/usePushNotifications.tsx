import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useEffect, useRef, useState } from "react";
import { Alert, Platform } from "react-native";

// Set up how notifications behave when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, // Show an alert
    shouldPlaySound: true, // Play sound
    shouldSetBadge: true,// Set the app icon badge
  }),
});
// Interface to type each notification item
interface Notification {
  id: string;
  title: string;
  body?: string;
  time?: string;
}
// Custom hook to handle push notification logic
export const usePushNotifications = () => {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);  // Stores device token
  const [notifications, setNotifications] = useState<Notification[]>([]); // Stores received notifications
  // Refs to manage listeners so we can remove them cleanly
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  useEffect(() => {
          // Function to register for push notifications
    const registerForPush = async () => {
        // Handle web platform differently
      if (Platform.OS === "web") {
        console.log("[PushNotifications] Web platform: using simulated notification");

        // Simulate a test notification on web
        const simulatedNotification = {
          id: Date.now().toString(),
          title: "Simulated Notification",
          body: "This is a test notification on web.",
          time: new Date().toLocaleTimeString(),
        };
        setNotifications(prev => [simulatedNotification, ...prev]);

        // Show visual alert
        Alert.alert(simulatedNotification.title, simulatedNotification.body);
        return;
      }
      // Must use a physical device for push notifications
      if (!Device.isDevice) {
        console.log("[PushNotifications] Must use physical device for push notifications.");
        return;
      }
      // Check and request notification permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      // Exit if permission was not granted
      if (finalStatus !== "granted") {
        alert("Failed to get push token for push notifications!");
        return;
      }
      // Get and store Expo push token
      const tokenData = await Notifications.getExpoPushTokenAsync();
      setExpoPushToken(tokenData.data);

      // Android-specific configuration for notification channel
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
        });
      }
    }; 

    // Start the registration process
    registerForPush();

    // Listener for receiving notifications while app is running
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotifications(prev => [
        {
          id: Date.now().toString(),
          title: notification.request.content.title ?? "New Notification",
          body: notification.request.content.body ?? "",
          time: new Date().toLocaleTimeString(),
        },
        ...prev,
      ]);
    });
    // Listener for user interaction with a notification (e.g., tapping it)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log("[PushNotifications] Notification tapped:", response);
    });
    // Cleanup: remove listeners when component unmounts
    return () => {
      if (notificationListener.current)
        Notifications.removeNotificationSubscription(notificationListener.current);
      if (responseListener.current)
        Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);
  // Return push token and notification list for use in components
  return { expoPushToken, notifications };
};

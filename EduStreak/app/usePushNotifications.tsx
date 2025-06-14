import { useState, useEffect, useRef } from "react";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// Set how notifications behave when received while the app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, // Show notification as an alert
    shouldPlaySound: true, // Play notification sound
    shouldSetBadge: true,  // Set app icon badge number
  }),
});

export const usePushNotifications = () => {
      // Store Expo push token for sending push notifications from backend
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);

    // Store list of received notifications to display inside the app
  const [notifications, setNotifications] = useState<any[]>([]);

  // Hold references to notification listeners to clean up on unmount
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  useEffect(() => {
          // Function to register device for push notifications
    const registerForPush = async () => {
              // Push notifications only work on physical devices, not simulators/emulators
      if (!Device.isDevice) {
        console.log("Push notifications require a physical device.");
        return;
      }

      // Check existing notification permission status
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permissions if not granted yet
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      // Alert if permission not granted and exit early
      if (finalStatus !== "granted") {
        alert("Push notifications permission not granted.");
        return;
      }

      // Get Expo push token to register device with Expo Push service
      const tokenData = await Notifications.getExpoPushTokenAsync();
      setExpoPushToken(tokenData.data);

      // Get Expo push token to register device with Expo Push service
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX, // Max importance to show heads-up notifications
        });
      }
    };
    // Call the async registration function on mount
    registerForPush();

    // Listen for notifications received while the app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
        // Prepend new notification to the existing list, add unique id and timestamp
      setNotifications(prev => [
        {
          id: Date.now().toString(),  // Generate a unique id using timestamp
          title: notification.request.content.title ?? "New Notification",
          body: notification.request.content.body ?? "",
          time: new Date().toLocaleTimeString(),
        },
        ...prev,
      ]);
    });

    // Listen for user interaction with notifications (tapping on them)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log("Notification tapped:", response);
    });

    // Test notification after 6 seconds

    Notifications.scheduleNotificationAsync({
      content: {
        title: "Test Notification",
        body: "This is just a test notification.",
        channelId: "default",
      },
      trigger: { seconds: 6 },
    });

    // Cleanup notification listeners when component unmounts
    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);
  // Return expoPushToken and list of received notifications for UI use
  return { expoPushToken, notifications };
};

import { useState, useEffect, useRef } from "react";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform, Alert } from "react-native";

// Configure notification behavior for foregrounded notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

interface Notification {
  id: string;
  title: string;
  body?: string;
  time?: string;
}

export const usePushNotifications = () => {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  useEffect(() => {
    const registerForPush = async () => {
      if (Platform.OS === "web") {
        console.log("[PushNotifications] Web platform: using simulated notification");
        // Simulate a notification
        const simulatedNotification = {
          id: Date.now().toString(),
          title: "Simulated Notification",
          body: "This is a test notification on web.",
          time: new Date().toLocaleTimeString(),
        };
        setNotifications(prev => [simulatedNotification, ...prev]);

        // Optional: show a visual alert
        Alert.alert(simulatedNotification.title, simulatedNotification.body);
        return;
      }

      if (!Device.isDevice) {
        console.log("[PushNotifications] Must use physical device for push notifications.");
        return;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        alert("Failed to get push token for push notifications!");
        return;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync();
      setExpoPushToken(tokenData.data);

      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
        });
      }

      // Schedule test notification (native only)
      Notifications.scheduleNotificationAsync({
        content: {
          title: "Test Notification",
          body: "This is just a test notification.",
          channelId: "default",
        },
        trigger: { seconds: 6 },
      });
    };

    registerForPush();

    // Listeners for notifications
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

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log("[PushNotifications] Notification tapped:", response);
    });

    return () => {
      if (notificationListener.current)
        Notifications.removeNotificationSubscription(notificationListener.current);
      if (responseListener.current)
        Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  return { expoPushToken, notifications };
};

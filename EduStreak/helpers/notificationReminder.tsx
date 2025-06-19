import { Platform, Alert } from "react-native";
import * as Notifications from "expo-notifications";

/**
 * Cancels all scheduled notifications
  * This is useful for resetting or managing notification state.
 */
export const cancelAllScheduledNotifications = async () => {
  if (Platform.OS !== "web") {
    console.log("Cancelling all scheduled notifications...");
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log("All notifications cancelled.");
  }
};

/**
 * Schedules a daily push notification reminder for a specific habit at a specified time.
 * On web, it uses an Alert instead since push notifications aren't supported.
 *
 * @param habitName - Name of the habit
 * @param time - Time of day to trigger the notification
 */
export const scheduleDailyHabitReminder = async (habitName: string, time: Date) => {
  if (Platform.OS === "web") {
    // Show a simulated notification using Alert
    Alert.alert("Habit Reminder", `Don't forget to complete "${habitName}" today!`);
    return;
  }
  // Request user permission to send notifications
  const { granted } = await Notifications.requestPermissionsAsync();
  if (!granted) {
    console.warn("Notification permission not granted.");
    return;
  }
  // Schedule the notification
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Habit Reminder",
      body: `Don't forget to complete "${habitName}" today!`,
      sound: true,
    },
    trigger: {
      hour: time.getHours(),
      minute: time.getMinutes(),
      repeats: true,
    },
  });

  console.log(`Scheduled reminder for "${habitName}" at ${time.toLocaleTimeString()}`);
};
/**
 * Schedules a generic daily reminder at 9:00 AM.
 * Useful for a default or general habit notification.
 */
export const scheduleDailyReminder = async () => {
  const time = new Date();
  time.setHours(9, 0, 0, 0);
  await scheduleDailyHabitReminder("Your habit", time);
};
/**
 * Called when a new habit is created.
 * Automatically schedules a reminder for the new habit at 9:00 AM daily.
 *
 * @param habit - Habit object with a `name` property
 */
export const onHabitCreated = async (habit) => {
  try {
    const reminderTime = new Date();
    reminderTime.setHours(9, 0, 0, 0);
    await scheduleDailyHabitReminder(habit.name, reminderTime);
  } catch (err) {
    console.error(`Failed to schedule reminder for "${habit.name}":`, err);
  }
};
/**
 * Checks which habits were not completed today and reminds the user.
 * On native, schedules a reminder for the next morning.
 * On web, uses an Alert to notify immediately.
 *
 * @param habits - Array of habit objects with optional `completionHistory`
 */
export const remindMissedHabits = async (habits) => {
  try {
    const today = new Date().toISOString().split('T')[0];  // Get today's date in YYYY-MM-DD format

    for (const habit of habits) {
      const completedToday = habit.completionHistory?.some(
        (entry) => entry.date === today
      );
      if (!completedToday) {
        if (Platform.OS === "web") {
                      // Web fallback: show immediate alert
          Alert.alert(
            "Missed Habit",
            `You missed "${habit.name}" today! Don't forget to complete it.`
          );
        } else {
            // Native: schedule a reminder for next morning at 9 AM
          const nextMorning = new Date();
          nextMorning.setDate(nextMorning.getDate() + 1);
          nextMorning.setHours(9, 0, 0, 0);
          await scheduleDailyHabitReminder(habit.name, nextMorning);
        }
      }
    }
  } catch (err) {
    console.error('Failed to schedule late reminders:', err);
  }
};
/**
 * Schedules a test notification that triggers after 10 seconds.
 * Useful for debugging notification behavior.
 */
export const scheduleTestNotification = async () => {
  if (Platform.OS === "web") {
    Alert.alert("Test Notification", "This is a test notification fired on web.");
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Test Notification",
      body: "This is a test notification fired after 10 seconds.",
      sound: true,
    },
    trigger: { seconds: 10 },
  });
};

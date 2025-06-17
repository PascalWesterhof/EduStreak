import { Platform, Alert } from "react-native";
import * as Notifications from "expo-notifications";

/**
 * Cancels all scheduled notifications
 */
export const cancelAllScheduledNotifications = async () => {
  if (Platform.OS !== "web") {
    console.log("Cancelling all scheduled notifications...");
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log("All notifications cancelled.");
  }
};

/**
 * Schedules a daily reminder
 */
export const scheduleDailyHabitReminder = async (habitName: string, time: Date) => {
  if (Platform.OS === "web") {
    // Show a simulated notification using Alert
    Alert.alert("Habit Reminder", `Don't forget to complete "${habitName}" today!`);
    return;
  }

  const { granted } = await Notifications.requestPermissionsAsync();
  if (!granted) {
    console.warn("Notification permission not granted.");
    return;
  }

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

export const scheduleDailyReminder = async () => {
  const time = new Date();
  time.setHours(9, 0, 0, 0);
  await scheduleDailyHabitReminder("Your habit", time);
};

export const onHabitCreated = async (habit) => {
  try {
    const reminderTime = new Date();
    reminderTime.setHours(9, 0, 0, 0);
    await scheduleDailyHabitReminder(habit.name, reminderTime);
  } catch (err) {
    console.error(`Failed to schedule reminder for "${habit.name}":`, err);
  }
};

export const remindMissedHabits = async (habits) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    for (const habit of habits) {
      const completedToday = habit.completionHistory?.some(
        (entry) => entry.date === today
      );
      if (!completedToday) {
        if (Platform.OS === "web") {
          Alert.alert(
            "Missed Habit",
            `You missed "${habit.name}" today! Don't forget to complete it.`
          );
        } else {
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

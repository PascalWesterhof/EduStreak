import * as Notifications from "expo-notifications";
/**
 * Cancels all scheduled notifications for the app.
 * Useful when the user disables notifications or changes preferences.
 */



export const cancelAllScheduledNotifications = async () => {
  console.log("Cancelling all scheduled notifications...");
    // Calls Expo's function to cancel every scheduled notification
  await Notifications.cancelAllScheduledNotificationsAsync();
  console.log("All notifications cancelled.");
};
/**
 * Schedules a daily notification reminder for a specific habit at a given time.
 *
 * @param habitName - The name of the habit to remind the user about.
 * @param time - A Date object specifying the time to trigger the notification daily.
 */
export const scheduleDailyHabitReminder = async (habitName: string, time: Date) => {
    // Request permission from the user to send notifications
  const { granted } = await Notifications.requestPermissionsAsync();

  if (!granted) {
      // If permission is denied, log a warning and exit early
    console.warn("Notification permission not granted.");
    return;
  };

  // Schedule a repeating notification at the specified hour and minute daily
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Habit Reminder",  // Notification title shown in the notification tray
      body: `Don't forget to complete "${habitName}" today!`, // Custom message including habit name
      sound: true,  // Play sound when notification fires
    },
    trigger: {
      hour: time.getHours(), // Hour of the day for the notification
      minute: time.getMinutes(), // Minute of the hour
      repeats: true, // Repeat every day at this time
    },
  });
  // Log success message with the habit name and the time scheduled
  console.log(`Scheduled reminder for "${habitName}" at ${time.toLocaleTimeString()}`);
};

/**
 * Schedules a generic daily reminder at 9:00 AM.
 * Can be used as a default reminder or for testing.
 */

export const scheduleDailyReminder = async () => {
  // Example: Schedule a generic daily reminder at 9:00 AM
  const time = new Date();
  time.setHours(9, 0, 0, 0);// Set the time to 9:00:00 AM (hour, minute, seconds, ms)
  // Schedule the notification using the generic habit name "Your habit"
  await scheduleDailyHabitReminder("Your habit", time);
};

/**
 * Called when a new habit is created.
 * Schedules a daily notification at 9:00 AM reminding about this habit.
 *
 * @param habit - An object representing the habit, expected to have a 'name' property.
 */

export const onHabitCreated = async (habit) => {
  try {
    const reminderTime = new Date();
    reminderTime.setHours(9, 0, 0, 0); // Default to 9:00 AM

    // Schedule the daily reminder for the newly created habit
    await scheduleDailyHabitReminder(habit.name, reminderTime);
  } catch (err) {
      // Catch and log any errors that occur while scheduling
    console.error(`Failed to schedule daily reminder for "${habit.name}":`, err);
  }
};

/**
 * Checks an array of habits and schedules reminders for those not completed today.
 * If a habit is not completed today, it schedules a reminder for the next morning at 9:00 AM.
 *
 * @param habits - Array of habit objects, each expected to have a 'name' and 'completionHistory'.
 */

export const remindMissedHabits = async (habits) => {
  try {
      // Get today's date string in ISO format (YYYY-MM-DD) for comparison
    const today = new Date().toISOString().split('T')[0];
    // Loop through each habit
    for (const habit of habits) {
        // Check if the habit has been completed today by looking through completionHistory
      const completedToday = habit.completionHistory?.some(
        (entry) => entry.date === today
      );

      // If the habit was NOT completed today, schedule a reminder
      if (!completedToday) {
        const nextMorning = new Date();
        nextMorning.setDate(nextMorning.getDate() + 1); // Set the date to tomorrow
        nextMorning.setHours(9, 0, 0, 0); // Set time to 9:00 AM tomorrow

        // Schedule the notification reminder for the habit at next morning's time
        await scheduleDailyHabitReminder(habit.name, nextMorning);
      }
    }
  } catch (err) {
      // Log errors if scheduling late reminders fails
    console.error('Failed to schedule late reminders:', err);
  }
};

/**
 * Schedules a test notification to fire 10 seconds from now.
 * Useful for quickly verifying that notifications work on the device.
 */

// For quick testing: schedule a notification 10 seconds from now
export const scheduleTestNotification = async () => {
  console.log("Scheduling test notification for 10 seconds from now.");
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Test Notification",  // Title shown on notification
      body: "This is a test notification fired after 10 seconds.",  // Test message body
      sound: true, // Play sound on notification
    },
    trigger: { seconds: 10 }, // Fire after 10 seconds
  });
};

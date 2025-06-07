import * as Notifications from 'expo-notifications';

/*
  Schedule a repeating daily habit reminder.

  @param {string} habitName - Name of the habit.
  @param {Date} time - Time of day to send the notification (local time).
 */
export const scheduleDailyHabitReminder = async (habitName, time) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Habit reminder', // Notification title
        body: `Don't forget to complete "${habitName}" today!`, // Custom message
        sound: true, // Enable notification sound
      },
      trigger: {
        hour: time.getHours(),        // Hour of the day (0–23)
        minute: time.getMinutes(),    // Minute of the hour (0–59)
        repeats: true,                // Repeat daily at the same time
      },
    });
  } catch (err) {
    console.error('Failed to schedule daily notification:', err);
  }
};

/*
  Schedule a one-time reminder if the user missed a habit (e.g., next morning).

  @param {string} habitName - Name of the habit.f
  @param {Date} time - Exact date and time to send the reminder.
 */
export const scheduleLateHabitReminder = async (habitName, time) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Missed Habit', // Notification title
        body: `You missed "${habitName}" yesterday. Let's restart today!`, // Friendly nudge
        sound: true,
      },
      trigger: {
        hour: time.getHours(),
        minute: time.getMinutes(),
        day: time.getDate(),
        month: time.getMonth() + 1,      // getMonth is zero-based
        year: time.getFullYear(),
        repeats: false,                  // One-time notification
      },
    });
  } catch (err) {
    console.error('Failed to schedule late notification:', err);
  }
};
c
/*
  Cancel all scheduled notifications for the app.
 */
export const cancelAllNotifications = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (err) {
    console.error('Failed to cancel notifications:', err);
  }
};

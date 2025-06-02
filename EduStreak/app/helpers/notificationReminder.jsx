import * as Notifications from 'expo-notifications';

/**
 * Schedule a repeating daily habit reminder.
 * @param {string} habitName - Name of the habit.
 * @param {Date} time - Time to send the notification.
 */
export const scheduleDailyHabitReminder = async (habitName, time) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Habit reminder',
        body: `Don't forget to complete "${habitName}" today!`,
        sound: true,
      },
      trigger: {
        hour: time.getHours(),
        minute: time.getMinutes(),
        repeats: true,
      },
    });
  } catch (err) {
    console.error('Failed to schedule daily notification:', err);
  }
};

/**
 * Schedule a one-time late reminder.
 * @param {string} habitName - Name of the habit.
 * @param {Date} time - When to send the reminder.
 */
export const scheduleLateHabitReminder = async (habitName, time) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Missed Habit',
        body: `You missed "${habitName}" yesterday. Let's restart today!`,
        sound: true,
      },
      trigger: {
        hour: time.getHours(),
        minute: time.getMinutes(),
        day: time.getDate(),
        month: time.getMonth() + 1,
        year: time.getFullYear(),
        repeats: false,
      },
    });
  } catch (err) {
    console.error('Failed to schedule late notification:', err);
  }
};

/**
 * Cancel all scheduled notifications.
 */
export const cancelAllNotifications = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (err) {
    console.error('Failed to cancel notifications:', err);
  }
};
